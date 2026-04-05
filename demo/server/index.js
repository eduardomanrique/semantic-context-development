import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createDatabase } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const databasePath = path.resolve(__dirname, "../data/app.db");

const db = createDatabase(databasePath);
const app = createApp({ db });
const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`Expense reimbursement server listening on http://localhost:${port}`);
});
