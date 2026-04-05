const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createServer } = require("../src/app");

test("serves the UI shell and blocks unauthenticated claim access", async (t) => {
  const app = await startApp(t);

  const home = await app.request("GET", "/");
  assert.equal(home.status, 200);
  assert.match(home.text, /Expense reimbursement/i);

  const claims = await app.request("GET", "/api/claims");
  assert.equal(claims.status, 401);
  assert.equal(claims.body.error, "Authentication is required.");
});

test("only admins may create users and admins stay outside the claim workflow", async (t) => {
  const app = await startApp(t);
  const admin = app.client();

  const login = await admin.request("POST", "/api/login", {
    username: "admin",
    password: "admin"
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.role, "ADMIN");

  const createdUser = await admin.request("POST", "/api/users", {
    username: "alice",
    password: "pw1",
    role: "EMPLOYEE"
  });
  assert.equal(createdUser.status, 201);
  assert.equal(createdUser.body.user.username, "alice");

  const adminClaims = await admin.request("GET", "/api/claims");
  assert.equal(adminClaims.status, 403);

  const adminCreateClaim = await admin.request("POST", "/api/claims");
  assert.equal(adminCreateClaim.status, 403);

  const employee = app.client();
  await employee.request("POST", "/api/login", {
    username: "alice",
    password: "pw1"
  });

  const employeeUserCreate = await employee.request("POST", "/api/users", {
    username: "bob",
    password: "pw2",
    role: "EMPLOYEE"
  });
  assert.equal(employeeUserCreate.status, 403);
  assert.equal(employeeUserCreate.body.error, "Only admins may create users.");
});

test("rejected claims reopen as corrected drafts and cannot be resubmitted", async (t) => {
  const app = await startApp(t);
  const admin = app.client();
  await admin.request("POST", "/api/login", { username: "admin", password: "admin" });
  await admin.request("POST", "/api/users", { username: "alice", password: "pw1", role: "EMPLOYEE" });
  await admin.request("POST", "/api/users", { username: "mary", password: "pw2", role: "MANAGER" });

  const employee = app.client();
  await employee.request("POST", "/api/login", { username: "alice", password: "pw1" });
  const created = await employee.request("POST", "/api/claims");
  const claimId = created.body.claim.id;

  await employee.request("PATCH", `/api/claims/${claimId}`, {
    description: "Hotel near client office",
    amount: 219.45,
    category: "Travel"
  });

  const submitted = await employee.request("POST", `/api/claims/${claimId}/submit`);
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.claim.status, "SUBMITTED");

  const afterSubmitEdit = await employee.request("PATCH", `/api/claims/${claimId}`, {
    description: "Should fail"
  });
  assert.equal(afterSubmitEdit.status, 409);

  const manager = app.client();
  await manager.request("POST", "/api/login", { username: "mary", password: "pw2" });
  const rejected = await manager.request("POST", `/api/claims/${claimId}/review`, { outcome: "REJECTED" });
  assert.equal(rejected.status, 200);
  assert.equal(rejected.body.claim.status, "REJECTED");

  const reopened = await employee.request("POST", `/api/claims/${claimId}/reopen`);
  assert.equal(reopened.status, 200);
  assert.equal(reopened.body.claim.status, "DRAFT");
  assert.equal(reopened.body.claim.isCorrectedDraft, true);
  assert.equal(reopened.body.claim.submissionEligible, false);

  const updatedCorrectedDraft = await employee.request("PATCH", `/api/claims/${claimId}`, {
    description: "Hotel after policy correction",
    amount: 180,
    category: "Travel"
  });
  assert.equal(updatedCorrectedDraft.status, 200);
  assert.equal(updatedCorrectedDraft.body.claim.description, "Hotel after policy correction");

  const resubmission = await employee.request("POST", `/api/claims/${claimId}/submit`);
  assert.equal(resubmission.status, 409);
  assert.match(resubmission.body.error, /cannot be submitted again/i);

  const detail = await employee.request("GET", `/api/claims/${claimId}`);
  assert.equal(detail.status, 200);
  assert.deepEqual(
    detail.body.claim.auditHistory.map((event) => event.eventType),
    ["CREATED", "SUBMITTED", "REVIEWED", "REOPENED"]
  );
});

test("enforces visibility, newest-first ordering, manager review, and finance payment", async (t) => {
  const app = await startApp(t);
  const admin = app.client();
  await admin.request("POST", "/api/login", { username: "admin", password: "admin" });
  await admin.request("POST", "/api/users", { username: "alice", password: "pw1", role: "EMPLOYEE" });
  await admin.request("POST", "/api/users", { username: "bob", password: "pw2", role: "EMPLOYEE" });
  await admin.request("POST", "/api/users", { username: "mary", password: "pw3", role: "MANAGER" });
  await admin.request("POST", "/api/users", { username: "fran", password: "pw4", role: "FINANCE" });

  const alice = app.client();
  await alice.request("POST", "/api/login", { username: "alice", password: "pw1" });
  const aliceClaim = await createAndSubmitClaim(alice, "Client dinner", 88.5, "Meals");

  const bob = app.client();
  await bob.request("POST", "/api/login", { username: "bob", password: "pw2" });
  const bobDraft = await bob.request("POST", "/api/claims");
  const bobClaimId = bobDraft.body.claim.id;
  await bob.request("PATCH", `/api/claims/${bobClaimId}`, {
    description: "Train to conference",
    amount: 54.2,
    category: "Travel"
  });

  const aliceList = await alice.request("GET", "/api/claims");
  assert.equal(aliceList.status, 200);
  assert.deepEqual(aliceList.body.claims.map((claim) => claim.owner), ["alice"]);

  const aliceViewingBob = await alice.request("GET", `/api/claims/${bobClaimId}`);
  assert.equal(aliceViewingBob.status, 403);

  const manager = app.client();
  await manager.request("POST", "/api/login", { username: "mary", password: "pw3" });
  const managerList = await manager.request("GET", "/api/claims");
  assert.equal(managerList.status, 200);
  assert.deepEqual(managerList.body.claims.map((claim) => claim.id), [bobClaimId, aliceClaim.id]);

  const approved = await manager.request("POST", `/api/claims/${aliceClaim.id}/review`, { outcome: "APPROVED" });
  assert.equal(approved.status, 200);
  assert.equal(approved.body.claim.status, "APPROVED");

  const finance = app.client();
  await finance.request("POST", "/api/login", { username: "fran", password: "pw4" });
  const financeList = await finance.request("GET", "/api/claims");
  assert.equal(financeList.status, 200);
  assert.deepEqual(financeList.body.claims.map((claim) => claim.id), [bobClaimId, aliceClaim.id]);

  const paid = await finance.request("POST", `/api/claims/${aliceClaim.id}/pay`);
  assert.equal(paid.status, 200);
  assert.equal(paid.body.claim.status, "PAID");
  assert.equal(paid.body.claim.paidBy, "fran");
  assert.ok(paid.body.claim.paidAt);

  const payDraft = await finance.request("POST", `/api/claims/${bobClaimId}/pay`);
  assert.equal(payDraft.status, 409);
});

async function createAndSubmitClaim(client, description, amount, category) {
  const created = await client.request("POST", "/api/claims");
  const claimId = created.body.claim.id;
  await client.request("PATCH", `/api/claims/${claimId}`, {
    description,
    amount,
    category
  });
  const submitted = await client.request("POST", `/api/claims/${claimId}/submit`);
  return submitted.body.claim;
}

async function startApp(t) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "scd-node-"));
  const dbPath = path.join(tempDir, "test.sqlite");
  const server = createServer({
    dbPath,
    publicDir: path.join(process.cwd(), "public")
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    client() {
      return createClient(`http://127.0.0.1:${address.port}`);
    },
    request(method, pathname, body) {
      return createClient(`http://127.0.0.1:${address.port}`).request(method, pathname, body);
    }
  };
}

function createClient(baseUrl) {
  let cookie = "";

  return {
    async request(method, pathname, body) {
      const headers = {};
      if (cookie) {
        headers.cookie = cookie;
      }
      if (body !== undefined) {
        headers["content-type"] = "application/json";
      }

      const response = await fetch(`${baseUrl}${pathname}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        cookie = setCookie.split(";", 1)[0];
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return {
          status: response.status,
          body: await response.json()
        };
      }
      return {
        status: response.status,
        text: await response.text()
      };
    }
  };
}
