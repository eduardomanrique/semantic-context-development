import express from "express";
import session from "express-session";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { getSeededUsers } from "./db.js";
import {
  toClaimResponse,
  toReviewHistoryEntry,
  validateClaimInput,
  validatePaymentInput,
  validateReviewInput
} from "./claims.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDirectory = path.resolve(__dirname, "../dist");

export function createApp({ db, sessionSecret = "expense-reimbursement-demo-secret" }) {
  const app = express();

  app.use(express.json());
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax"
      }
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/demo-users", (_req, res) => {
    res.json({ users: getSeededUsers() });
  });

  app.get("/api/session", (req, res) => {
    res.json({ user: getAuthenticatedUser(req, db) });
  });

  app.post("/api/session/login", (req, res) => {
    const userId = typeof req.body?.userId === "string" ? req.body.userId : "";
    const user = db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(userId);

    if (!user) {
      return res.status(404).json({ error: "Unknown demo user." });
    }

    req.session.userId = user.id;
    return res.status(200).json({ user });
  });

  app.post("/api/session/logout", (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });

  app.get("/api/claims", requireRole(db, "employee"), (req, res) => {
    const rows = db
      .prepare(
        `
          SELECT
            claims.*,
            reviewers.name AS reviewer_name,
            payers.name AS payer_name
          FROM claims
          LEFT JOIN users AS reviewers ON reviewers.id = claims.reviewer_id
          LEFT JOIN users AS payers ON payers.id = claims.payer_id
          WHERE employee_id = ?
          ORDER BY created_at DESC, id DESC
        `
      )
      .all(req.user.id);

    res.json({ claims: attachReviewHistoryList(db, rows) });
  });

  app.post("/api/claims", requireRole(db, "employee"), (req, res) => {
    const { errors, value } = validateClaimInput(req.body ?? {});

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const now = new Date().toISOString();
    const result = db
      .prepare(
        `
          INSERT INTO claims (
            employee_id,
            title,
            expense_date,
            amount,
            category,
            description,
            status,
            created_at,
            updated_at,
            submitted_at
          )
          VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, NULL)
        `
      )
      .run(
        req.user.id,
        value.title,
        value.expenseDate,
        value.amount,
        value.category,
        value.description,
        now,
        now
      );

    const row = db.prepare("SELECT * FROM claims WHERE id = ?").get(result.lastInsertRowid);
    return res.status(201).json({ claim: attachReviewHistory(db, row) });
  });

  app.put("/api/claims/:claimId", requireRole(db, "employee"), (req, res) => {
    const claim = loadOwnedClaim(db, req.user.id, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (claim.status !== "draft") {
      return res.status(409).json({ error: "Only draft claims can be edited." });
    }

    const { errors, value } = validateClaimInput(req.body ?? {});

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const now = new Date().toISOString();
    db.prepare(
      `
        UPDATE claims
        SET
          title = ?,
          expense_date = ?,
          amount = ?,
          category = ?,
          description = ?,
          updated_at = ?
        WHERE id = ?
      `
    ).run(value.title, value.expenseDate, value.amount, value.category, value.description, now, claim.id);

    const updated = db.prepare("SELECT * FROM claims WHERE id = ?").get(claim.id);
    return res.json({ claim: attachReviewHistory(db, updated) });
  });

  app.post("/api/claims/:claimId/reopen", requireRole(db, "employee"), (req, res) => {
    const claim = loadOwnedClaim(db, req.user.id, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (claim.status !== "rejected") {
      return res.status(409).json({ error: "Only rejected claims can be reopened." });
    }

    const reopenedAt = new Date().toISOString();
    db.prepare(
      `
        UPDATE claims
        SET
          status = 'draft',
          updated_at = ?,
          submitted_at = NULL,
          reviewer_id = NULL,
          review_note = NULL,
          reviewed_at = NULL
        WHERE id = ?
      `
    ).run(reopenedAt, claim.id);

    const updated = loadClaimWithParties(db, claim.id);
    return res.json({ claim: attachReviewHistory(db, updated) });
  });

  app.post("/api/claims/:claimId/submit", requireRole(db, "employee"), (req, res) => {
    const claim = loadOwnedClaim(db, req.user.id, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (claim.status !== "draft") {
      return res.status(409).json({ error: "Only draft claims can be submitted." });
    }

    const submittedAt = new Date().toISOString();
    db.prepare(
      `
        UPDATE claims
        SET
          status = 'submitted',
          updated_at = ?,
          submitted_at = ?
        WHERE id = ?
      `
    ).run(submittedAt, submittedAt, claim.id);

    const updated = loadClaimWithParties(db, claim.id);
    return res.json({ claim: attachReviewHistory(db, updated) });
  });

  app.get("/api/manager/claims", requireRole(db, "manager"), (_req, res) => {
    const rows = db
      .prepare(
        `
          SELECT claims.*, users.name AS employee_name
          FROM claims
          JOIN users ON users.id = claims.employee_id
          WHERE claims.status = 'submitted'
          ORDER BY claims.submitted_at ASC, claims.id ASC
        `
      )
      .all();

    res.json({ claims: attachReviewHistoryList(db, rows) });
  });

  app.get("/api/manager/claims/:claimId", requireRole(db, "manager"), (req, res) => {
    const claim = loadManagerVisibleClaim(db, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    return res.json({ claim: attachReviewHistory(db, claim) });
  });

  app.post("/api/manager/claims/:claimId/review", requireRole(db, "manager"), (req, res) => {
    const claim = loadClaimWithParties(db, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (claim.status !== "submitted") {
      return res.status(409).json({ error: "Only submitted claims can be reviewed." });
    }

    const { errors, value } = validateReviewInput(req.body ?? {});

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const reviewedAt = new Date().toISOString();
    const nextStatus = value.decision === "approve" ? "approved" : "rejected";

    db.transaction(() => {
      db.prepare(
        `
          INSERT INTO claim_reviews (
            claim_id,
            reviewer_id,
            decision,
            note,
            reviewed_at
          )
          VALUES (?, ?, ?, ?, ?)
        `
      ).run(claim.id, req.user.id, value.decision, value.note || null, reviewedAt);

      db.prepare(
        `
          UPDATE claims
          SET
            status = ?,
            updated_at = ?,
            reviewer_id = ?,
            review_note = ?,
            reviewed_at = ?
          WHERE id = ?
        `
      ).run(nextStatus, reviewedAt, req.user.id, value.note || null, reviewedAt, claim.id);
    })();

    const updated = loadManagerVisibleClaim(db, claim.id);
    return res.json({ claim: attachReviewHistory(db, updated) });
  });

  app.get("/api/finance/claims", requireRole(db, "finance"), (_req, res) => {
    const rows = db
      .prepare(
        `
          SELECT
            claims.*,
            employees.name AS employee_name,
            reviewers.name AS reviewer_name
          FROM claims
          JOIN users AS employees ON employees.id = claims.employee_id
          LEFT JOIN users AS reviewers ON reviewers.id = claims.reviewer_id
          WHERE claims.status = 'approved'
          ORDER BY claims.reviewed_at ASC, claims.id ASC
        `
      )
      .all();

    res.json({ claims: attachReviewHistoryList(db, rows) });
  });

  app.get("/api/finance/claims/:claimId", requireRole(db, "finance"), (req, res) => {
    const claim = loadFinanceVisibleClaim(db, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    return res.json({ claim: attachReviewHistory(db, claim) });
  });

  app.post("/api/finance/claims/:claimId/pay", requireRole(db, "finance"), (req, res) => {
    const claim = loadClaimWithParties(db, req.params.claimId);

    if (!claim) {
      return res.status(404).json({ error: "Claim not found." });
    }

    if (claim.status !== "approved") {
      return res.status(409).json({ error: "Only approved claims can be marked as paid." });
    }

    const { errors, value } = validatePaymentInput(req.body ?? {});

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const paidAt = new Date().toISOString();

    db.prepare(
      `
        UPDATE claims
        SET
          status = 'paid',
          updated_at = ?,
          payer_id = ?,
          payment_note = ?,
          paid_at = ?
        WHERE id = ?
      `
    ).run(paidAt, req.user.id, value.note || null, paidAt, claim.id);

    const updated = loadClaimWithParties(db, claim.id);
    return res.json({ claim: attachReviewHistory(db, updated) });
  });

  if (fs.existsSync(distDirectory)) {
    app.use(express.static(distDirectory));
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) {
        return next();
      }

      res.sendFile(path.join(distDirectory, "index.html"));
    });
  }

  return app;
}

function getAuthenticatedUser(req, db) {
  if (!req.session.userId) {
    return null;
  }

  return db.prepare("SELECT id, name, role FROM users WHERE id = ?").get(req.session.userId) ?? null;
}

function requireRole(db, role) {
  return (req, res, next) => {
    const user = getAuthenticatedUser(req, db);

    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: `${capitalize(role)} role required.` });
    }

    req.user = user;
    return next();
  };
}

function loadOwnedClaim(db, employeeId, claimId) {
  return db.prepare("SELECT * FROM claims WHERE id = ? AND employee_id = ?").get(claimId, employeeId);
}

function loadManagerVisibleClaim(db, claimId) {
  return db
    .prepare(
      `
        SELECT *
        FROM (
          SELECT
            claims.*,
            employees.name AS employee_name,
            reviewers.name AS reviewer_name,
            payers.name AS payer_name
          FROM claims
          JOIN users AS employees ON employees.id = claims.employee_id
          LEFT JOIN users AS reviewers ON reviewers.id = claims.reviewer_id
          LEFT JOIN users AS payers ON payers.id = claims.payer_id
        ) AS visible_claims
        WHERE id = ?
          AND status != 'draft'
      `
    )
    .get(claimId);
}

function loadFinanceVisibleClaim(db, claimId) {
  return db
    .prepare(
      `
        SELECT
          claims.*,
          employees.name AS employee_name,
          reviewers.name AS reviewer_name,
          payers.name AS payer_name
        FROM claims
        JOIN users AS employees ON employees.id = claims.employee_id
        LEFT JOIN users AS reviewers ON reviewers.id = claims.reviewer_id
        LEFT JOIN users AS payers ON payers.id = claims.payer_id
        WHERE claims.id = ?
          AND claims.status = 'approved'
      `
    )
    .get(claimId);
}

function loadClaimWithParties(db, claimId) {
  return db
    .prepare(
      `
        SELECT
          claims.*,
          employees.name AS employee_name,
          reviewers.name AS reviewer_name,
          payers.name AS payer_name
        FROM claims
        JOIN users AS employees ON employees.id = claims.employee_id
        LEFT JOIN users AS reviewers ON reviewers.id = claims.reviewer_id
        LEFT JOIN users AS payers ON payers.id = claims.payer_id
        WHERE claims.id = ?
      `
    )
    .get(claimId);
}

function attachReviewHistory(db, row) {
  if (!row) {
    return null;
  }

  return {
    ...toClaimResponse(row),
    reviewHistory: loadClaimReviewHistory(db, row.id)
  };
}

function attachReviewHistoryList(db, rows) {
  return rows.map((row) => attachReviewHistory(db, row));
}

function loadClaimReviewHistory(db, claimId) {
  return db
    .prepare(
      `
        SELECT
          claim_reviews.*,
          users.name AS reviewer_name
        FROM claim_reviews
        JOIN users ON users.id = claim_reviews.reviewer_id
        WHERE claim_reviews.claim_id = ?
        ORDER BY claim_reviews.reviewed_at DESC, claim_reviews.id DESC
      `
    )
    .all(claimId)
    .map(toReviewHistoryEntry);
}

function capitalize(value) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
