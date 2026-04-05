import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import request from "supertest";
import { afterEach, describe, expect, test } from "vitest";
import { createApp } from "../server/app.js";
import { createDatabase } from "../server/db.js";

function buildFixture() {
  const db = createDatabase(":memory:");
  const app = createApp({ db, sessionSecret: "test-secret" });
  const agent = request.agent(app);

  return { db, app, agent };
}

async function loginAs(agent, userId) {
  await agent.post("/api/session/login").send({ userId }).expect(200);
}

async function createSubmittedClaim(agent, overrides = {}) {
  const createResponse = await agent.post("/api/claims").send({
    title: "Stationery restock",
    expenseDate: "2026-04-02",
    amount: 12.99,
    category: "Office supplies",
    description: "Notebook and markers for customer discovery session.",
    ...overrides
  });

  await agent.post(`/api/claims/${createResponse.body.claim.id}/submit`).send().expect(200);

  return createResponse.body.claim.id;
}

const databases = [];
const tempDirectories = [];

afterEach(() => {
  while (databases.length > 0) {
    databases.pop().close();
  }

  while (tempDirectories.length > 0) {
    fs.rmSync(tempDirectories.pop(), { recursive: true, force: true });
  }
});

describe("expense claims API", () => {
  test("employee can create a valid draft claim", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    await loginAs(fixture.agent, "emp-1");

    const response = await fixture.agent.post("/api/claims").send({
      title: "Taxi from airport",
      expenseDate: "2026-04-01",
      amount: 38.4,
      category: "Travel",
      description: "Transport to the client workshop venue."
    });

    expect(response.status).toBe(201);
    expect(response.body.claim.status).toBe("draft");
    expect(response.body.claim.employeeId).toBe("emp-1");
    expect(response.body.claim.title).toBe("Taxi from airport");
  });

  test("invalid claim payload is rejected", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    await loginAs(fixture.agent, "emp-1");

    const response = await fixture.agent.post("/api/claims").send({
      title: "",
      expenseDate: "04-01-2026",
      amount: 0,
      category: "",
      description: ""
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContain("Title is required.");
    expect(response.body.errors).toContain("Expense date must use YYYY-MM-DD.");
    expect(response.body.errors).toContain("Amount must be a positive number.");
  });

  test("employee can submit a draft claim", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    await loginAs(fixture.agent, "emp-1");

    const createResponse = await fixture.agent.post("/api/claims").send({
      title: "Stationery restock",
      expenseDate: "2026-04-02",
      amount: 12.99,
      category: "Office supplies",
      description: "Notebook and markers for customer discovery session."
    });

    const submitResponse = await fixture.agent
      .post(`/api/claims/${createResponse.body.claim.id}/submit`)
      .send();

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.claim.status).toBe("submitted");
    expect(submitResponse.body.claim.submittedAt).toBeTruthy();
  });

  test("submitted claim is no longer editable by the employee", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    await loginAs(fixture.agent, "emp-1");

    const createResponse = await fixture.agent.post("/api/claims").send({
      title: "Hotel stay",
      expenseDate: "2026-04-03",
      amount: 180,
      category: "Lodging",
      description: "One-night stay before morning workshop."
    });

    await fixture.agent.post(`/api/claims/${createResponse.body.claim.id}/submit`).send().expect(200);

    const updateResponse = await fixture.agent.put(`/api/claims/${createResponse.body.claim.id}`).send({
      title: "Updated hotel stay",
      expenseDate: "2026-04-03",
      amount: 180,
      category: "Lodging",
      description: "Trying to change a submitted claim."
    });

    expect(updateResponse.status).toBe(409);
    expect(updateResponse.body.error).toBe("Only draft claims can be edited.");
  });

  test("non-employee users cannot create claims", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    await loginAs(fixture.agent, "mgr-1");

    const response = await fixture.agent.post("/api/claims").send({
      employeeId: "emp-1",
      title: "Unauthorized claim",
      expenseDate: "2026-04-04",
      amount: 10,
      category: "Other",
      description: "Attempted creation by a manager."
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Employee role required.");
  });

  test("manager can list submitted claims", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    const employeeAgent = request.agent(fixture.app);
    const managerAgent = request.agent(fixture.app);

    await loginAs(employeeAgent, "emp-1");
    await createSubmittedClaim(employeeAgent, {
      title: "Train to client office",
      expenseDate: "2026-04-05",
      amount: 24.5,
      category: "Travel",
      description: "Round trip regional train ticket."
    });

    await loginAs(managerAgent, "mgr-1");

    const response = await managerAgent.get("/api/manager/claims").send();

    expect(response.status).toBe(200);
    expect(response.body.claims).toHaveLength(1);
    expect(response.body.claims[0].status).toBe("submitted");
    expect(response.body.claims[0].employeeName).toBe("Elena Employee");
  });

  test("manager can open a submitted claim and inspect details", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    const employeeAgent = request.agent(fixture.app);
    const managerAgent = request.agent(fixture.app);

    await loginAs(employeeAgent, "emp-1");
    const claimId = await createSubmittedClaim(employeeAgent, {
      title: "Working lunch",
      expenseDate: "2026-04-06",
      amount: 21.75,
      category: "Meals",
      description: "Lunch during project workshop."
    });

    await loginAs(managerAgent, "mgr-1");

    const response = await managerAgent.get(`/api/manager/claims/${claimId}`).send();

    expect(response.status).toBe(200);
    expect(response.body.claim.id).toBe(claimId);
    expect(response.body.claim.title).toBe("Working lunch");
    expect(response.body.claim.description).toBe("Lunch during project workshop.");
    expect(response.body.claim.employeeName).toBe("Elena Employee");
  });

  test("manager can approve a submitted claim", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    const employeeAgent = request.agent(fixture.app);
    const managerAgent = request.agent(fixture.app);

    await loginAs(employeeAgent, "emp-1");
    const claimId = await createSubmittedClaim(employeeAgent);

    await loginAs(managerAgent, "mgr-1");

    const response = await managerAgent.post(`/api/manager/claims/${claimId}/review`).send({
      decision: "approve",
      note: "Business purpose is clear."
    });

    expect(response.status).toBe(200);
    expect(response.body.claim.status).toBe("approved");
    expect(response.body.claim.reviewerId).toBe("mgr-1");
    expect(response.body.claim.reviewNote).toBe("Business purpose is clear.");
    expect(response.body.claim.reviewedAt).toBeTruthy();
  });

  test("manager can reject a submitted claim", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    const employeeAgent = request.agent(fixture.app);
    const managerAgent = request.agent(fixture.app);

    await loginAs(employeeAgent, "emp-1");
    const claimId = await createSubmittedClaim(employeeAgent, {
      title: "Gift purchase",
      expenseDate: "2026-04-07",
      amount: 50,
      category: "Other",
      description: "Promotional gift for conference booth."
    });

    await loginAs(managerAgent, "mgr-1");

    const response = await managerAgent.post(`/api/manager/claims/${claimId}/review`).send({
      decision: "reject"
    });

    expect(response.status).toBe(200);
    expect(response.body.claim.status).toBe("rejected");
    expect(response.body.claim.reviewNote).toBeNull();
  });

  test("only submitted claims can be reviewed", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    const employeeAgent = request.agent(fixture.app);
    const managerAgent = request.agent(fixture.app);

    await loginAs(employeeAgent, "emp-1");
    const createResponse = await employeeAgent.post("/api/claims").send({
      title: "Parking",
      expenseDate: "2026-04-08",
      amount: 8,
      category: "Travel",
      description: "Parking for customer meeting."
    });

    await loginAs(managerAgent, "mgr-1");

    const response = await managerAgent
      .post(`/api/manager/claims/${createResponse.body.claim.id}/review`)
      .send({ decision: "approve" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Claim not found.");
  });

  test("employee users cannot perform manager review actions", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    await loginAs(fixture.agent, "emp-1");
    const claimId = await createSubmittedClaim(fixture.agent);

    const response = await fixture.agent.post(`/api/manager/claims/${claimId}/review`).send({
      decision: "approve"
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("Manager role required.");
  });

  test("once reviewed, the claim cannot be reviewed again", async () => {
    const fixture = buildFixture();
    databases.push(fixture.db);

    const employeeAgent = request.agent(fixture.app);
    const managerAgent = request.agent(fixture.app);

    await loginAs(employeeAgent, "emp-1");
    const claimId = await createSubmittedClaim(employeeAgent);

    await loginAs(managerAgent, "mgr-1");
    await managerAgent.post(`/api/manager/claims/${claimId}/review`).send({
      decision: "approve"
    });

    const secondResponse = await managerAgent.post(`/api/manager/claims/${claimId}/review`).send({
      decision: "reject"
    });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.error).toBe("Only submitted claims can be reviewed.");
  });

  test("existing draft submitted schema is migrated to support reviewed states", async () => {
    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "expense-demo-"));
    tempDirectories.push(tempDirectory);

    const filename = path.join(tempDirectory, "legacy.db");
    const legacyDb = new Database(filename);
    legacyDb.exec(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('employee', 'manager', 'finance'))
      );

      INSERT INTO users (id, name, role) VALUES
        ('emp-1', 'Elena Employee', 'employee'),
        ('mgr-1', 'Marcus Manager', 'manager'),
        ('fin-1', 'Farah Finance', 'finance');

      CREATE TABLE claims (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id TEXT NOT NULL,
        title TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('draft', 'submitted')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        submitted_at TEXT,
        FOREIGN KEY(employee_id) REFERENCES users(id)
      );

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
      ) VALUES (
        'emp-1',
        'Legacy claim',
        '2026-04-09',
        31.4,
        'Travel',
        'Legacy submitted claim before migration.',
        'submitted',
        '2026-04-09T08:00:00.000Z',
        '2026-04-09T08:05:00.000Z',
        '2026-04-09T08:05:00.000Z'
      );
    `);
    legacyDb.close();

    const migratedDb = createDatabase(filename);
    databases.push(migratedDb);

    const app = createApp({ db: migratedDb, sessionSecret: "migration-secret" });
    const managerAgent = request.agent(app);

    await loginAs(managerAgent, "mgr-1");

    const response = await managerAgent.post("/api/manager/claims/1/review").send({
      decision: "approve"
    });

    expect(response.status).toBe(200);
    expect(response.body.claim.status).toBe("approved");
  });
});
