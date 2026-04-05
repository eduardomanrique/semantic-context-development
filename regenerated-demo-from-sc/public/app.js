const state = {
  user: null,
  employeeClaims: [],
  managerClaims: [],
  financeClaims: []
};

const sessionState = document.getElementById("sessionState");
const flash = document.getElementById("flash");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const userForm = document.getElementById("userForm");
const claimForm = document.getElementById("claimForm");
const submitClaimButton = document.getElementById("submitClaimButton");
const newDraftButton = document.getElementById("newDraftButton");
const claimFormHint = document.getElementById("claimFormHint");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  await api("/api/login", {
    method: "POST",
    body: {
      username: form.get("username"),
      password: form.get("password")
    }
  });
  loginForm.reset();
  await refreshSession();
  await refreshClaims();
  showFlash("Signed in.");
});

logoutButton.addEventListener("click", async () => {
  await api("/api/logout", { method: "POST" });
  state.user = null;
  state.employeeClaims = [];
  state.managerClaims = [];
  state.financeClaims = [];
  resetClaimEditor();
  render();
  showFlash("Signed out.");
});

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(userForm);
  const response = await api("/api/users", {
    method: "POST",
    body: {
      username: form.get("username"),
      password: form.get("password"),
      role: form.get("role")
    }
  });
  userForm.reset();
  showFlash(`Created ${response.user.username} (${response.user.role}).`);
});

claimForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await saveCurrentClaim();
});

submitClaimButton.addEventListener("click", async () => {
  const claimId = claimForm.elements.claimId.value;
  if (!claimId) {
    showFlash("Create or load a draft before submitting.");
    return;
  }
  await saveCurrentClaim();
  await api(`/api/claims/${claimId}/submit`, { method: "POST" });
  resetClaimEditor();
  await refreshClaims();
  showFlash("Claim submitted.");
});

newDraftButton.addEventListener("click", async () => {
  const response = await api("/api/claims", { method: "POST" });
  loadClaimIntoEditor(response.claim);
  await refreshClaims();
  showFlash("Draft created.");
});

document.getElementById("employeeClaims").addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const claimId = event.target.dataset.claimId;
  if (!action || !claimId) {
    return;
  }
  if (action === "edit") {
    const response = await api(`/api/claims/${claimId}`);
    loadClaimIntoEditor(response.claim);
    return;
  }
  if (action === "reopen") {
    const response = await api(`/api/claims/${claimId}/reopen`, { method: "POST" });
    loadClaimIntoEditor(response.claim);
    await refreshClaims();
    showFlash("Rejected claim reopened as a corrected draft.");
  }
});

document.getElementById("managerClaims").addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const claimId = event.target.dataset.claimId;
  if (!action || !claimId) {
    return;
  }
  const outcome = action === "approve" ? "APPROVED" : "REJECTED";
  await api(`/api/claims/${claimId}/review`, {
    method: "POST",
    body: { outcome }
  });
  await refreshClaims();
  showFlash(`Claim ${outcome.toLowerCase()}.`);
});

document.getElementById("financeClaims").addEventListener("click", async (event) => {
  const action = event.target.dataset.action;
  const claimId = event.target.dataset.claimId;
  if (action !== "pay" || !claimId) {
    return;
  }
  await api(`/api/claims/${claimId}/pay`, { method: "POST" });
  await refreshClaims();
  showFlash("Claim marked as paid.");
});

async function refreshSession() {
  const session = await api("/api/session");
  state.user = session.user;
  render();
}

async function refreshClaims() {
  if (!state.user || state.user.role === "ADMIN") {
    render();
    return;
  }

  const response = await api("/api/claims");
  const claims = response.claims;

  if (state.user.role === "EMPLOYEE") {
    state.employeeClaims = claims;
  }
  if (state.user.role === "MANAGER") {
    state.managerClaims = claims.filter((claim) => claim.status === "SUBMITTED");
  }
  if (state.user.role === "FINANCE") {
    state.financeClaims = claims.filter((claim) => claim.status === "APPROVED");
  }

  render();
}

async function saveCurrentClaim() {
  let claimId = claimForm.elements.claimId.value;
  if (!claimId) {
    const response = await api("/api/claims", { method: "POST" });
    claimId = response.claim.id;
  }
  const response = await api(`/api/claims/${claimId}`, {
    method: "PATCH",
    body: {
      description: claimForm.elements.description.value,
      amount: claimForm.elements.amount.value,
      category: claimForm.elements.category.value
    }
  });
  loadClaimIntoEditor(response.claim);
  await refreshClaims();
  showFlash("Draft saved.");
}

function render() {
  renderSession();
  document.getElementById("adminPanel").classList.toggle("hidden", state.user?.role !== "ADMIN");
  document.getElementById("employeePanel").classList.toggle("hidden", state.user?.role !== "EMPLOYEE");
  document.getElementById("managerPanel").classList.toggle("hidden", state.user?.role !== "MANAGER");
  document.getElementById("financePanel").classList.toggle("hidden", state.user?.role !== "FINANCE");

  if (state.user?.role === "EMPLOYEE") {
    renderClaims(
      document.getElementById("employeeClaims"),
      state.employeeClaims,
      (claim) => {
        const actions = [];
        if (claim.status === "DRAFT") {
          actions.push(button("Load draft", "edit", claim.id));
        }
        if (claim.status === "REJECTED") {
          actions.push(button("Reopen", "reopen", claim.id));
        }
        return actions.join("");
      }
    );
  }

  if (state.user?.role === "MANAGER") {
    renderClaims(
      document.getElementById("managerClaims"),
      state.managerClaims,
      (claim) => [button("Approve", "approve", claim.id), button("Reject", "reject", claim.id)].join("")
    );
  }

  if (state.user?.role === "FINANCE") {
    renderClaims(
      document.getElementById("financeClaims"),
      state.financeClaims,
      (claim) => button("Mark paid", "pay", claim.id)
    );
  }
}

function renderSession() {
  if (!state.user) {
    sessionState.textContent = "Use the seeded admin/admin account to start provisioning users.";
    loginForm.classList.remove("hidden");
    logoutButton.classList.add("hidden");
    return;
  }

  sessionState.innerHTML = `
    Signed in as <strong>${escapeHtml(state.user.username)}</strong>
    with role <strong>${escapeHtml(state.user.role)}</strong>.
  `;
  loginForm.classList.add("hidden");
  logoutButton.classList.remove("hidden");
}

function renderClaims(container, claims, actionsForClaim) {
  if (!claims.length) {
    container.innerHTML = `<div class="empty-state">No claims in this role-specific queue yet.</div>`;
    return;
  }

  container.innerHTML = claims
    .map((claim) => {
      const corrected = claim.isCorrectedDraft ? "Corrected draft" : "Initial draft";
      const summary = `
        <article class="claim-card">
          <h3>${escapeHtml(claim.description || "(empty description)")}</h3>
          <div class="claim-meta">
            <span>#${claim.id}</span>
            <span>${escapeHtml(claim.owner)}</span>
            <span>${escapeHtml(claim.category || "uncategorized")}</span>
            <span>${claim.amount.toFixed(2)}</span>
            <span>${escapeHtml(claim.status)}</span>
          </div>
          <p>${claim.status === "DRAFT" ? corrected : "Read-only lifecycle state."}</p>
          <div class="claim-actions">${actionsForClaim(claim)}</div>
        </article>
      `;
      return summary;
    })
    .join("");
}

function loadClaimIntoEditor(claim) {
  claimForm.elements.claimId.value = claim.id;
  claimForm.elements.description.value = claim.description || "";
  claimForm.elements.amount.value = claim.amount ? String(claim.amount) : "";
  claimForm.elements.category.value = claim.category || "";
  claimFormHint.textContent = claim.isCorrectedDraft
    ? "This corrected draft can be edited and saved, but it cannot be submitted again."
    : "This draft is still submission-eligible once all required fields are valid.";
  submitClaimButton.classList.toggle("hidden", Boolean(claim.isCorrectedDraft));
}

function resetClaimEditor() {
  claimForm.reset();
  claimForm.elements.claimId.value = "";
  submitClaimButton.classList.remove("hidden");
  claimFormHint.textContent = "New drafts start editable and remain editable until submitted.";
}

async function api(pathname, options = {}) {
  const response = await fetch(pathname, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    throwAndFlash(body.error || "Request failed.");
  }
  return body;
}

function throwAndFlash(message) {
  showFlash(message);
  throw new Error(message);
}

function showFlash(message) {
  flash.textContent = message;
  flash.classList.remove("hidden");
  window.clearTimeout(showFlash.timer);
  showFlash.timer = window.setTimeout(() => flash.classList.add("hidden"), 2800);
}

function button(label, action, claimId) {
  return `<button type="button" class="secondary" data-action="${action}" data-claim-id="${claimId}">${label}</button>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

resetClaimEditor();
refreshSession().then(refreshClaims).catch((error) => {
  console.error(error);
  showFlash("Failed to load the initial session state.");
});
