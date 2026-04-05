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
  const supportsReviewStates = sql.includes("'approved'") && sql.includes("'rejected'");
  const hasReviewColumns =
    columns.has("reviewer_id") && columns.has("review_note") && columns.has("reviewed_at");

  if (!supportsReviewStates || !hasReviewColumns) {
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
      status TEXT NOT NULL CHECK(status IN ('draft', 'submitted', 'approved', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      submitted_at TEXT,
      reviewer_id TEXT,
      review_note TEXT,
      reviewed_at TEXT,
      FOREIGN KEY(employee_id) REFERENCES users(id),
      FOREIGN KEY(reviewer_id) REFERENCES users(id)
    );
  `);
}

function migrateClaimsTable(db, columns) {
  const selectSubmittedAt = columns.has("submitted_at") ? "submitted_at" : "NULL";
  const selectReviewerId = columns.has("reviewer_id") ? "reviewer_id" : "NULL";
  const selectReviewNote = columns.has("review_note") ? "review_note" : "NULL";
  const selectReviewedAt = columns.has("reviewed_at") ? "reviewed_at" : "NULL";

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
        reviewed_at
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
        ${selectReviewedAt}
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
