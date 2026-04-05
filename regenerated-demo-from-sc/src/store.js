const fs = require("node:fs");
const path = require("node:path");

const { appError } = require("./errors");
const { createPasswordRecord, verifyPassword } = require("./passwords");
const { execute, escapeSqlValue } = require("./sqlite");

const ROLES = ["ADMIN", "EMPLOYEE", "MANAGER", "FINANCE"];
const CLAIM_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PAID"];

function nowIso() {
  return new Date().toISOString();
}

function createStore(dbPath) {
  function initialize() {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    execute(
      dbPath,
      `
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE', 'MANAGER', 'FINANCE')),
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_username TEXT NOT NULL REFERENCES users(username),
        description TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        category TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID')),
        is_corrected_draft INTEGER NOT NULL DEFAULT 0 CHECK (is_corrected_draft IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        submitted_at TEXT,
        reviewed_by TEXT,
        reviewed_at TEXT,
        paid_by TEXT,
        paid_at TEXT
      );

      CREATE TABLE IF NOT EXISTS claim_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claim_id INTEGER NOT NULL REFERENCES claims(id),
        event_type TEXT NOT NULL,
        actor_username TEXT NOT NULL,
        event_at TEXT NOT NULL,
        details_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_claims_owner_created
        ON claims(owner_username, created_at DESC, id DESC);

      CREATE INDEX IF NOT EXISTS idx_claims_status_created
        ON claims(status, created_at DESC, id DESC);
      `
    );

    if (!getUser("admin")) {
      const createdAt = nowIso();
      const password = createPasswordRecord("admin");
      execute(
        dbPath,
        `
        INSERT INTO users(username, password_hash, password_salt, role, created_at)
        VALUES (
          'admin',
          ${escapeSqlValue(password.hash)},
          ${escapeSqlValue(password.salt)},
          'ADMIN',
          ${escapeSqlValue(createdAt)}
        );
        `
      );
    }
  }

  function getUser(username) {
    const rows = execute(
      dbPath,
      `SELECT username, password_hash, password_salt, role, created_at
       FROM users
       WHERE username = ${escapeSqlValue(username)}
       LIMIT 1;`,
      { json: true }
    );
    return rows[0] || null;
  }

  function authenticate(username, password) {
    const user = getUser(username);
    if (!user) {
      return null;
    }
    return verifyPassword(password, user.password_salt, user.password_hash) ? sanitizeUser(user) : null;
  }

  function createUser({ username, password, role }) {
    const normalizedUsername = String(username || "").trim();
    const normalizedPassword = String(password || "");
    const normalizedRole = String(role || "").trim().toUpperCase();

    if (!normalizedUsername) {
      throw appError(400, "Username is required.");
    }
    if (!normalizedPassword) {
      throw appError(400, "Password is required.");
    }
    if (!ROLES.includes(normalizedRole)) {
      throw appError(400, "Role must be one of ADMIN, EMPLOYEE, MANAGER, or FINANCE.");
    }
    if (getUser(normalizedUsername)) {
      throw appError(409, "Username already exists.");
    }

    const createdAt = nowIso();
    const passwordRecord = createPasswordRecord(normalizedPassword);
    execute(
      dbPath,
      `
      INSERT INTO users(username, password_hash, password_salt, role, created_at)
      VALUES (
        ${escapeSqlValue(normalizedUsername)},
        ${escapeSqlValue(passwordRecord.hash)},
        ${escapeSqlValue(passwordRecord.salt)},
        ${escapeSqlValue(normalizedRole)},
        ${escapeSqlValue(createdAt)}
      );
      `
    );
    return sanitizeUser(getUser(normalizedUsername));
  }

  function createClaim(actor) {
    assertRole(actor, ["EMPLOYEE"]);
    const timestamp = nowIso();
    const rows = execute(
      dbPath,
      `
      INSERT INTO claims (
        owner_username,
        description,
        amount,
        category,
        status,
        is_corrected_draft,
        created_at,
        updated_at
      )
      VALUES (
        ${escapeSqlValue(actor.username)},
        '',
        0,
        '',
        'DRAFT',
        0,
        ${escapeSqlValue(timestamp)},
        ${escapeSqlValue(timestamp)}
      );
      SELECT last_insert_rowid() AS id;
      `,
      { json: true }
    );
    const claimId = rows[0].id;
    recordClaimEvent(claimId, "CREATED", actor.username, {});
    return getClaim(claimId);
  }

  function updateClaim(claimId, actor, patch) {
    const claim = requireClaim(claimId);
    assertEmployeeOwner(actor, claim);
    if (claim.status !== "DRAFT") {
      throw appError(409, "Only draft claims may be edited.");
    }

    const nextDescription = patch.description !== undefined ? String(patch.description) : claim.description;
    const nextCategory = patch.category !== undefined ? String(patch.category) : claim.category;
    const nextAmount = patch.amount !== undefined ? Number(patch.amount) : Number(claim.amount);

    if (!Number.isFinite(nextAmount)) {
      throw appError(400, "Amount must be a valid number.");
    }

    execute(
      dbPath,
      `
      UPDATE claims
      SET description = ${escapeSqlValue(nextDescription)},
          amount = ${escapeSqlValue(nextAmount)},
          category = ${escapeSqlValue(nextCategory)},
          updated_at = ${escapeSqlValue(nowIso())}
      WHERE id = ${escapeSqlValue(claimId)};
      `
    );

    return getClaim(claimId);
  }

  function submitClaim(claimId, actor) {
    const claim = requireClaim(claimId);
    assertEmployeeOwner(actor, claim);
    if (claim.status !== "DRAFT") {
      throw appError(409, "Only draft claims may be submitted.");
    }
    if (claim.isCorrectedDraft) {
      throw appError(409, "Corrected drafts created from rejected claims cannot be submitted again in the current slice.");
    }
    if (!String(claim.description || "").trim()) {
      throw appError(400, "Description is required before submission.");
    }
    if (Number(claim.amount) <= 0) {
      throw appError(400, "Amount must be greater than zero before submission.");
    }
    if (!String(claim.category || "").trim()) {
      throw appError(400, "Category is required before submission.");
    }

    const timestamp = nowIso();
    execute(
      dbPath,
      `
      UPDATE claims
      SET status = 'SUBMITTED',
          submitted_at = ${escapeSqlValue(timestamp)},
          updated_at = ${escapeSqlValue(timestamp)}
      WHERE id = ${escapeSqlValue(claimId)};
      `
    );
    recordClaimEvent(claimId, "SUBMITTED", actor.username, {
      description: claim.description,
      amount: Number(claim.amount),
      category: claim.category
    });
    return getClaim(claimId);
  }

  function reviewClaim(claimId, actor, outcome) {
    assertRole(actor, ["MANAGER"]);
    const normalizedOutcome = String(outcome || "").trim().toUpperCase();
    if (!["APPROVED", "REJECTED"].includes(normalizedOutcome)) {
      throw appError(400, "Manager review outcome must be APPROVED or REJECTED.");
    }
    const claim = requireClaim(claimId);
    if (claim.status !== "SUBMITTED") {
      throw appError(409, "Managers may review only submitted claims.");
    }

    const timestamp = nowIso();
    execute(
      dbPath,
      `
      UPDATE claims
      SET status = ${escapeSqlValue(normalizedOutcome)},
          reviewed_by = ${escapeSqlValue(actor.username)},
          reviewed_at = ${escapeSqlValue(timestamp)},
          updated_at = ${escapeSqlValue(timestamp)}
      WHERE id = ${escapeSqlValue(claimId)};
      `
    );
    recordClaimEvent(claimId, "REVIEWED", actor.username, { outcome: normalizedOutcome });
    return getClaim(claimId);
  }

  function reopenClaim(claimId, actor) {
    assertRole(actor, ["EMPLOYEE"]);
    const claim = requireClaim(claimId);
    if (claim.owner !== actor.username) {
      throw appError(403, "Only the owner of a rejected claim may reopen it.");
    }
    if (claim.status !== "REJECTED") {
      throw appError(409, "Only rejected claims may be reopened.");
    }

    const timestamp = nowIso();
    execute(
      dbPath,
      `
      UPDATE claims
      SET status = 'DRAFT',
          is_corrected_draft = 1,
          reviewed_by = NULL,
          reviewed_at = NULL,
          updated_at = ${escapeSqlValue(timestamp)}
      WHERE id = ${escapeSqlValue(claimId)};
      `
    );
    recordClaimEvent(claimId, "REOPENED", actor.username, {});
    return getClaim(claimId);
  }

  function payClaim(claimId, actor) {
    assertRole(actor, ["FINANCE"]);
    const claim = requireClaim(claimId);
    if (claim.status !== "APPROVED") {
      throw appError(409, "Finance users may mark only approved claims as paid.");
    }

    const timestamp = nowIso();
    execute(
      dbPath,
      `
      UPDATE claims
      SET status = 'PAID',
          paid_by = ${escapeSqlValue(actor.username)},
          paid_at = ${escapeSqlValue(timestamp)},
          updated_at = ${escapeSqlValue(timestamp)}
      WHERE id = ${escapeSqlValue(claimId)};
      `
    );
    recordClaimEvent(claimId, "PAID", actor.username, {});
    return getClaim(claimId);
  }

  function listClaims(actor) {
    assertRole(actor, ["EMPLOYEE", "MANAGER", "FINANCE"]);
    const whereClause =
      actor.role === "EMPLOYEE"
        ? `WHERE owner_username = ${escapeSqlValue(actor.username)}`
        : "";
    const rows = execute(
      dbPath,
      `
      SELECT *
      FROM claims
      ${whereClause}
      ORDER BY datetime(created_at) DESC, id DESC;
      `,
      { json: true }
    );
    return rows.map(serializeClaim);
  }

  function getVisibleClaim(claimId, actor) {
    assertRole(actor, ["EMPLOYEE", "MANAGER", "FINANCE"]);
    const claim = requireClaim(claimId);
    if (actor.role === "EMPLOYEE" && claim.owner !== actor.username) {
      throw appError(403, "Employees may view only their own claims.");
    }
    return getClaim(claimId);
  }

  function getClaim(claimId) {
    const claim = requireClaim(claimId);
    const eventRows = execute(
      dbPath,
      `
      SELECT id, event_type, actor_username, event_at, details_json
      FROM claim_events
      WHERE claim_id = ${escapeSqlValue(claimId)}
      ORDER BY id ASC;
      `,
      { json: true }
    );
    return {
      ...claim,
      auditHistory: eventRows.map((row) => ({
        id: row.id,
        eventType: row.event_type,
        actor: row.actor_username,
        eventAt: row.event_at,
        details: JSON.parse(row.details_json)
      }))
    };
  }

  function requireClaim(claimId) {
    const rows = execute(
      dbPath,
      `SELECT *
       FROM claims
       WHERE id = ${escapeSqlValue(claimId)}
       LIMIT 1;`,
      { json: true }
    );
    const row = rows[0];
    if (!row) {
      throw appError(404, "Claim not found.");
    }
    return serializeClaim(row);
  }

  function recordClaimEvent(claimId, eventType, actorUsername, details) {
    execute(
      dbPath,
      `
      INSERT INTO claim_events(claim_id, event_type, actor_username, event_at, details_json)
      VALUES (
        ${escapeSqlValue(claimId)},
        ${escapeSqlValue(eventType)},
        ${escapeSqlValue(actorUsername)},
        ${escapeSqlValue(nowIso())},
        ${escapeSqlValue(JSON.stringify(details))}
      );
      `
    );
  }

  return {
    CLAIM_STATUSES,
    ROLES,
    authenticate,
    createClaim,
    createUser,
    getUser,
    getVisibleClaim,
    initialize,
    listClaims,
    payClaim,
    reopenClaim,
    reviewClaim,
    submitClaim,
    updateClaim
  };
}

function sanitizeUser(user) {
  return {
    username: user.username,
    role: user.role,
    createdAt: user.created_at
  };
}

function serializeClaim(row) {
  return {
    id: row.id,
    owner: row.owner_username,
    description: row.description,
    amount: Number(row.amount),
    category: row.category,
    status: row.status,
    isCorrectedDraft: Boolean(row.is_corrected_draft),
    submissionEligible: row.status === "DRAFT" && !Boolean(row.is_corrected_draft),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at || null,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    paidBy: row.paid_by || null,
    paidAt: row.paid_at || null
  };
}

function assertRole(actor, allowedRoles) {
  if (!actor) {
    throw appError(401, "Authentication is required.");
  }
  if (!allowedRoles.includes(actor.role)) {
    throw appError(403, `This action requires one of: ${allowedRoles.join(", ")}.`);
  }
}

function assertEmployeeOwner(actor, claim) {
  assertRole(actor, ["EMPLOYEE"]);
  if (claim.owner !== actor.username) {
    throw appError(403, "Only the owner may modify this claim.");
  }
}

module.exports = {
  CLAIM_STATUSES,
  ROLES,
  createStore
};
