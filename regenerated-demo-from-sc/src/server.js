const path = require("node:path");

const { createServer } = require("./app");

const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "app.sqlite");
const server = createServer({ dbPath });

server.listen(port, () => {
  console.log(`Expense reimbursement app listening on http://localhost:${port}`);
});
