const { execFileSync } = require("node:child_process");

function execute(dbPath, sql, options = {}) {
  const args = [dbPath];
  if (options.json) {
    args.push("-json");
  }
  args.push(`PRAGMA foreign_keys = ON; ${sql}`);
  const output = execFileSync("sqlite3", args, { encoding: "utf8" });
  if (!options.json) {
    return output;
  }
  const trimmed = output.trim();
  return trimmed ? JSON.parse(trimmed) : [];
}

function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Cannot persist non-finite number");
    }
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  const text = String(value).replaceAll("'", "''");
  return `'${text}'`;
}

module.exports = {
  execute,
  escapeSqlValue
};
