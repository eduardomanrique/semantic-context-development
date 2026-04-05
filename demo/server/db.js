import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const seededUsers = [
  { id: "emp-1", name: "Elena Employee", role: "employee" },
  { id: "mgr-1", name: "Marcus Manager", role: "manager" },
  { id: "fin-1", name: "Farah Finance", role: "finance" }
];

export function createDatabase(filename) {
  ensureParentDirectory(filename);

  const db = new Database(filename);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('employee', 'manager', 'finance'))
    );
  `);

  ensureClaimsTable(db);
  ensureClaimReviewsTable(db);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, role)
    VALUES (@id, @name, @role)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      role = excluded.role
  `);

  const seedTransaction = db.transaction(() => {
    for (const user of seededUsers) {
      insertUser.run(user);
    }
  });

  seedTransaction();

  return db;
}

export function getSeededUsers() {
  return [...seededUsers];
}

function ensureClaimsTable(db) {
  const existingTable = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'claims'")
    .get();

  if (!existingTable) {
    createClaimsTable(db);
    return;
  }

  const columns = new Set(db.prepare("PRAGMA table_info(claims)").all().map((column) => column.name));
  const sql = existingTable.sql ?? "";
  const supportsWorkflowStates =
    sql.includes("'approved'") && sql.includes("'rejected'") && sql.includes("'paid'");
  const hasReviewColumns =
    columns.has("reviewer_id") && columns.has("review_note") && columns.has("reviewed_at");
  const hasPaymentColumns = columns.has("payer_id") && columns.has("payment_note") && columns.has("paid_at");

  if (!supportsWorkflowStates || !hasReviewColumns || !hasPaymentColumns) {
    migrateClaimsTable(db, columns);
  }
}

function createClaimsTable(db) {
  db.exec(`
    CREATE TABLE claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      title TEXT NOT NULL,
      expense_date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('draft', 'submitted', 'approved', 'rejected', 'paid')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      submitted_at TEXT,
      reviewer_id TEXT,
      review_note TEXT,
      reviewed_at TEXT,
      payer_id TEXT,
      payment_note TEXT,
      paid_at TEXT,
      FOREIGN KEY(employee_id) REFERENCES users(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id),
      FOREIGN KEY(payer_id) REFERENCES users(id)
    );
  `);
}

function migrateClaimsTable(db, columns) {
  const selectSubmittedAt = columns.has("submitted_at") ? "submitted_at" : "NULL";
  const selectReviewerId = columns.has("reviewer_id") ? "reviewer_id" : "NULL";
  const selectReviewNote = columns.has("review_note") ? "review_note" : "NULL";
  const selectReviewedAt = columns.has("reviewed_at") ? "reviewed_at" : "NULL";
  const selectPayerId = columns.has("payer_id") ? "payer_id" : "NULL";
  const selectPaymentNote = columns.has("payment_note") ? "payment_note" : "NULL";
  const selectPaidAt = columns.has("paid_at") ? "paid_at" : "NULL";

  const migrate = db.transaction(() => {
    db.exec("ALTER TABLE claims RENAME TO claims_legacy");
    createClaimsTable(db);

    db.exec(`
      INSERT INTO claims (
        id,
        employee_id,
        title,
        expense_date,
        amount,
        category,
        description,
        status,
        created_at,
        updated_at,
        submitted_at,
        reviewer_id,
        review_note,
        reviewed_at,
        payer_id,
        payment_note,
        paid_at
      )
      SELECT
        id,
        employee_id,
        title,
        expense_date,
        amount,
        category,
        description,
        status,
        created_at,
        updated_at,
        ${selectSubmittedAt},
        ${selectReviewerId},
        ${selectReviewNote},
        ${selectReviewedAt},
        ${selectPayerId},
        ${selectPaymentNote},
        ${selectPaidAt}
      FROM claims_legacy
    `);

    db.exec("DROP TABLE claims_legacy");
  });

  migrate();
}

function ensureParentDirectory(filename) {
  if (filename === ":memory:") {
    return;
  }

  const directory = path.dirname(filename);
  fs.mkdirSync(directory, { recursive: true });
}

function ensureClaimReviewsTable(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS claim_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id INTEGER NOT NULL,
      reviewer_id TEXT NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('approve', 'reject')),
      note TEXT,
      reviewed_at TEXT NOT NULL,
      FOREIGN KEY(claim_id) REFERENCES claims(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS claim_reviews_unique_review
    ON claim_reviews (claim_id, reviewer_id, decision, reviewed_at);
  `);

  backfillClaimReviews(db);
}

function backfillClaimReviews(db) {
  const rows = db
    .prepare(
      `
        SELECT id, reviewer_id, review_note, reviewed_at, status
        FROM claims
        WHERE reviewer_id IS NOT NULL
          AND reviewed_at IS NOT NULL
          AND status IN ('approved', 'rejected', 'paid')
      `
    )
    .all();

  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO claim_reviews (
      claim_id,
      reviewer_id,
      decision,
      note,
      reviewed_at
    )
    VALUES (?, ?, ?, ?, ?)
  `);

  const backfill = db.transaction(() => {
    for (const row of rows) {
      insertReview.run(
        row.id,
        row.reviewer_id,
        row.status === "rejected" ? "reject" : "approve",
        row.review_note,
        row.reviewed_at
      );
    }
  });

  backfill();
}
