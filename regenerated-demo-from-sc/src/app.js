const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");

const { AppError, appError } = require("./errors");
const { createStore } = require("./store");

function createServer(options = {}) {
  const dbPath = options.dbPath || path.join(process.cwd(), "data", "app.sqlite");
  const publicDir = options.publicDir || path.join(process.cwd(), "public");
  const store = createStore(dbPath);
  store.initialize();

  const sessions = new Map();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const actor = await getAuthenticatedUser(req, sessions);

      if (req.method === "GET" && url.pathname === "/") {
        return sendFile(res, path.join(publicDir, "index.html"), "text/html; charset=utf-8");
      }
      if (req.method === "GET" && url.pathname === "/app.js") {
        return sendFile(res, path.join(publicDir, "app.js"), "text/javascript; charset=utf-8");
      }
      if (req.method === "GET" && url.pathname === "/styles.css") {
        return sendFile(res, path.join(publicDir, "styles.css"), "text/css; charset=utf-8");
      }

      if (!url.pathname.startsWith("/api/")) {
        throw appError(404, "Route not found.");
      }

      if (req.method === "GET" && url.pathname === "/api/session") {
        return sendJson(res, 200, {
          authenticated: Boolean(actor),
          user: actor || null
        });
      }

      if (req.method === "POST" && url.pathname === "/api/login") {
        const body = await readJsonBody(req);
        const user = store.authenticate(body.username, body.password);
        if (!user) {
          throw appError(401, "Invalid username or password.");
        }
        const sessionId = crypto.randomUUID();
        sessions.set(sessionId, user);
        res.setHeader("Set-Cookie", `scd_session=${sessionId}; HttpOnly; Path=/; SameSite=Lax`);
        return sendJson(res, 200, { user });
      }

      if (req.method === "POST" && url.pathname === "/api/logout") {
        const sessionId = getSessionId(req);
        if (sessionId) {
          sessions.delete(sessionId);
        }
        res.setHeader("Set-Cookie", "scd_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0");
        return sendJson(res, 200, { ok: true });
      }

      if (req.method === "POST" && url.pathname === "/api/users") {
        requireAuthenticated(actor);
        if (actor.role !== "ADMIN") {
          throw appError(403, "Only admins may create users.");
        }
        const body = await readJsonBody(req);
        const user = store.createUser(body);
        return sendJson(res, 201, { user });
      }

      if (req.method === "GET" && url.pathname === "/api/claims") {
        requireAuthenticated(actor);
        return sendJson(res, 200, { claims: store.listClaims(actor) });
      }

      if (req.method === "POST" && url.pathname === "/api/claims") {
        requireAuthenticated(actor);
        const claim = store.createClaim(actor);
        return sendJson(res, 201, { claim });
      }

      const claimMatch = url.pathname.match(/^\/api\/claims\/(\d+)$/);
      if (claimMatch && req.method === "GET") {
        requireAuthenticated(actor);
        const claim = store.getVisibleClaim(Number(claimMatch[1]), actor);
        return sendJson(res, 200, { claim });
      }
      if (claimMatch && req.method === "PATCH") {
        requireAuthenticated(actor);
        const body = await readJsonBody(req);
        const claim = store.updateClaim(Number(claimMatch[1]), actor, body);
        return sendJson(res, 200, { claim });
      }

      const submitMatch = url.pathname.match(/^\/api\/claims\/(\d+)\/submit$/);
      if (submitMatch && req.method === "POST") {
        requireAuthenticated(actor);
        const claim = store.submitClaim(Number(submitMatch[1]), actor);
        return sendJson(res, 200, { claim });
      }

      const reviewMatch = url.pathname.match(/^\/api\/claims\/(\d+)\/review$/);
      if (reviewMatch && req.method === "POST") {
        requireAuthenticated(actor);
        const body = await readJsonBody(req);
        const claim = store.reviewClaim(Number(reviewMatch[1]), actor, body.outcome);
        return sendJson(res, 200, { claim });
      }

      const reopenMatch = url.pathname.match(/^\/api\/claims\/(\d+)\/reopen$/);
      if (reopenMatch && req.method === "POST") {
        requireAuthenticated(actor);
        const claim = store.reopenClaim(Number(reopenMatch[1]), actor);
        return sendJson(res, 200, { claim });
      }

      const payMatch = url.pathname.match(/^\/api\/claims\/(\d+)\/pay$/);
      if (payMatch && req.method === "POST") {
        requireAuthenticated(actor);
        const claim = store.payClaim(Number(payMatch[1]), actor);
        return sendJson(res, 200, { claim });
      }

      throw appError(404, "Route not found.");
    } catch (error) {
      handleError(res, error);
    }
  });

  return server;
}

function requireAuthenticated(actor) {
  if (!actor) {
    throw appError(401, "Authentication is required.");
  }
}

async function getAuthenticatedUser(req, sessions) {
  const sessionId = getSessionId(req);
  return sessionId ? sessions.get(sessionId) || null : null;
}

function getSessionId(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = cookieHeader.split(";").map((part) => part.trim()).filter(Boolean);
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === "scd_session") {
      return rest.join("=") || null;
    }
  }
  return null;
}

function sendJson(res, statusCode, body) {
  const content = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(content)
  });
  res.end(content);
}

function sendFile(res, filePath, contentType) {
  const content = fs.readFileSync(filePath);
  res.writeHead(200, {
    "Content-Type": contentType,
    "Content-Length": content.length
  });
  res.end(content);
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw appError(400, "Request body must be valid JSON.");
  }
}

function handleError(res, error) {
  if (error instanceof AppError) {
    return sendJson(res, error.status, { error: error.message });
  }
  console.error(error);
  return sendJson(res, 500, { error: "Internal server error." });
}

module.exports = {
  createServer
};
