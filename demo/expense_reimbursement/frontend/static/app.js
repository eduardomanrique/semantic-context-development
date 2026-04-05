const state = {
  session: null,
  claim: null,
  claims: [],
  showAllClaims: false,
};

const roleCopy = {
  EMPLOYEE: {
    heading: "Employee workspace",
    description: "Create draft claims, track your submissions, and reopen rejected claims when corrections are needed.",
    listTitle: "Your claims",
    listHint: "Employees can view only their own claims.",
    emptyTitle: "Start a claim",
    emptyCopy: "Create a draft claim or pick one of your existing claims to continue.",
  },
  MANAGER: {
    heading: "Manager workspace",
    description: "Focus on claims waiting for review, then open claim details and decide.",
    listTitle: "Submitted claims to review",
    listHint: "Managers primarily see submitted claims that are ready for a decision.",
    emptyTitle: "Review queue",
    emptyCopy: "Refresh the queue to load claims awaiting manager review.",
  },
  FINANCE: {
    heading: "Finance workspace",
    description: "Focus on approved claims that are ready for payment completion.",
    listTitle: "Approved claims ready for payment",
    listHint: "Finance users primarily see approved claims that can be marked as paid.",
    emptyTitle: "Payment queue",
    emptyCopy: "Refresh the queue to load approved claims ready for payment.",
  },
  ADMIN: {
    heading: "Admin workspace",
    description: "Create users and manage access to the reimbursement system.",
  },
};

const elements = {
  loginView: document.querySelector("#loginView"),
  appView: document.querySelector("#appView"),
  loginUsername: document.querySelector("#loginUsername"),
  loginPassword: document.querySelector("#loginPassword"),
  loginButton: document.querySelector("#loginButton"),
  logoutButton: document.querySelector("#logoutButton"),
  roleHeading: document.querySelector("#roleHeading"),
  roleDescription: document.querySelector("#roleDescription"),
  sessionUsername: document.querySelector("#sessionUsername"),
  sessionRoleBadge: document.querySelector("#sessionRoleBadge"),
  listClaimsButton: document.querySelector("#listClaimsButton"),
  listScopeToggle: document.querySelector("#listScopeToggle"),
  adminWorkspace: document.querySelector("#adminWorkspace"),
  createUserButton: document.querySelector("#createUserButton"),
  newUsername: document.querySelector("#newUsername"),
  newPassword: document.querySelector("#newPassword"),
  newUserRole: document.querySelector("#newUserRole"),
  claimWorkspace: document.querySelector("#claimWorkspace"),
  createClaimButton: document.querySelector("#createClaimButton"),
  employeeComposer: document.querySelector("#employeeComposer"),
  claimList: document.querySelector("#claimList"),
  claimListEmpty: document.querySelector("#claimListEmpty"),
  claimListTitle: document.querySelector("#claimListTitle"),
  claimListHint: document.querySelector("#claimListHint"),
  claimListCount: document.querySelector("#claimListCount"),
  detailEmptyState: document.querySelector("#detailEmptyState"),
  detailEmptyTitle: document.querySelector("#detailEmptyTitle"),
  detailEmptyCopy: document.querySelector("#detailEmptyCopy"),
  detailContent: document.querySelector("#detailContent"),
  detailTitle: document.querySelector("#detailTitle"),
  detailLead: document.querySelector("#detailLead"),
  claimStatusBadge: document.querySelector("#claimStatusBadge"),
  claimIdValue: document.querySelector("#claimIdValue"),
  claimOwnerValue: document.querySelector("#claimOwnerValue"),
  claimAmountValue: document.querySelector("#claimAmountValue"),
  claimCategoryValue: document.querySelector("#claimCategoryValue"),
  claimCreatedAtValue: document.querySelector("#claimCreatedAtValue"),
  claimSubmittedAtValue: document.querySelector("#claimSubmittedAtValue"),
  claimReviewedByValue: document.querySelector("#claimReviewedByValue"),
  claimPaidByValue: document.querySelector("#claimPaidByValue"),
  claimPaidAtValue: document.querySelector("#claimPaidAtValue"),
  claimDescriptionValue: document.querySelector("#claimDescriptionValue"),
  description: document.querySelector("#description"),
  amount: document.querySelector("#amount"),
  category: document.querySelector("#category"),
  draftEditorSection: document.querySelector("#draftEditorSection"),
  saveClaimButton: document.querySelector("#saveClaimButton"),
  submitClaimButton: document.querySelector("#submitClaimButton"),
  reopenActionSection: document.querySelector("#reopenActionSection"),
  reopenClaimButton: document.querySelector("#reopenClaimButton"),
  managerActionSection: document.querySelector("#managerActionSection"),
  approveClaimButton: document.querySelector("#approveClaimButton"),
  rejectClaimButton: document.querySelector("#rejectClaimButton"),
  financeActionSection: document.querySelector("#financeActionSection"),
  markPaidButton: document.querySelector("#markPaidButton"),
  feedback: document.querySelector("#feedback"),
};

async function initialize() {
  elements.loginButton.addEventListener("click", () => {
    void login();
  });
  elements.logoutButton.addEventListener("click", () => {
    void logout();
  });
  elements.listClaimsButton.addEventListener("click", () => {
    void listClaims();
  });
  elements.listScopeToggle.addEventListener("click", toggleListScope);
  elements.createUserButton.addEventListener("click", () => {
    void createUser();
  });
  elements.createClaimButton.addEventListener("click", () => {
    void createClaim();
  });
  elements.saveClaimButton.addEventListener("click", () => {
    void saveClaim();
  });
  elements.submitClaimButton.addEventListener("click", () => {
    void submitClaim();
  });
  elements.reopenClaimButton.addEventListener("click", () => {
    void reopenClaim();
  });
  elements.approveClaimButton.addEventListener("click", () => {
    void reviewClaim("APPROVED");
  });
  elements.rejectClaimButton.addEventListener("click", () => {
    void reviewClaim("REJECTED");
  });
  elements.markPaidButton.addEventListener("click", () => {
    void markClaimPaid();
  });

  await loadSession();
}

async function loadSession() {
  const response = await fetch("/auth/me", { credentials: "same-origin" });
  const session = await response.json();
  state.session = session.authenticated ? session.user : null;
  state.claim = null;
  state.claims = [];
  state.showAllClaims = false;

  render();
  if (state.session && state.session.role !== "ADMIN") {
    await listClaims(true);
  }
}

async function login() {
  const response = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: elements.loginUsername.value,
      password: elements.loginPassword.value,
    }),
  });

  if (!response.ok) {
    return;
  }

  const payload = await response.json();
  state.session = payload.user;
  elements.loginPassword.value = "";
  showFeedback(`Signed in as ${state.session.username}.`, "success");
  render();
  if (state.session.role !== "ADMIN") {
    await listClaims(true);
  }
}

async function logout() {
  const response = await request("/auth/logout", { method: "POST", silent: true });
  if (!response.ok && response.status !== 204) {
    return;
  }

  state.session = null;
  state.claim = null;
  state.claims = [];
  state.showAllClaims = false;
  showFeedback("Signed out.", "success");
  render();
}

async function createUser() {
  const response = await request("/users", {
    method: "POST",
    body: JSON.stringify({
      username: elements.newUsername.value,
      password: elements.newPassword.value,
      role: elements.newUserRole.value,
    }),
  });

  if (!response.ok) {
    return;
  }

  const user = await response.json();
  elements.newUsername.value = "";
  elements.newPassword.value = "";
  elements.newUserRole.value = "EMPLOYEE";
  showFeedback(`User ${user.username} created with role ${user.role}.`, "success");
}

async function createClaim() {
  const response = await request("/claims", { method: "POST" });
  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Draft claim created. Add the claim details and submit when ready.", "success");
  await listClaims(true);
  render();
}

async function listClaims(silent = false) {
  const response = await request("/claims", { silent });
  if (!response.ok) {
    return;
  }

  state.claims = await response.json();
  if (state.claim && !state.claims.some((claim) => claim.id === state.claim.id)) {
    state.claim = null;
  }

  if (!silent) {
    showFeedback("Claims refreshed.", "success");
  }
  render();
}

async function loadClaim(claimId) {
  const targetId = claimId || state.claim?.id;
  if (!targetId) {
    showFeedback("Select a claim to open its details.", "error");
    return;
  }

  const response = await request(`/claims/${targetId}`);
  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  render();
}

async function saveClaim() {
  if (!state.claim) {
    showFeedback("Select a draft claim before saving.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}`, {
    method: "PUT",
    body: JSON.stringify({
      description: elements.description.value,
      amount: elements.amount.value,
      category: elements.category.value,
    }),
  });

  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Draft saved.", "success");
  await listClaims(true);
  render();
}

async function submitClaim() {
  if (!state.claim) {
    showFeedback("Select a draft claim before submitting.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}/submit`, { method: "POST" });
  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Claim submitted. It is now waiting for manager review.", "success");
  await listClaims(true);
  render();
}

async function reviewClaim(decision) {
  if (!state.claim) {
    showFeedback("Select a submitted claim before reviewing.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}/review`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });

  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback(`Claim ${state.claim.status.toLowerCase()} by manager review.`, "success");
  await listClaims(true);
  render();
}

async function reopenClaim() {
  if (!state.claim) {
    showFeedback("Select a rejected claim before reopening it.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}/reopen`, { method: "POST" });
  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Claim reopened as a corrected draft. You can edit and save it, but not submit it again.", "success");
  await listClaims(true);
  render();
}

async function markClaimPaid() {
  if (!state.claim) {
    showFeedback("Select an approved claim before marking it as paid.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}/pay`, { method: "POST" });
  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Claim marked as paid. The reimbursement flow is complete.", "success");
  await listClaims(true);
  render();
}

function toggleListScope() {
  state.showAllClaims = !state.showAllClaims;
  render();
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "same-origin",
    ...options,
  });

  if (response.status === 401) {
    state.session = null;
    state.claim = null;
    state.claims = [];
    state.showAllClaims = false;
    render();
    if (!options.silent) {
      showFeedback("Authentication is required.", "error");
    }
    return response;
  }

  if (!response.ok && !options.silent) {
    let detail = "Request failed.";
    try {
      const payload = await response.json();
      detail = payload.detail || detail;
    } catch (_) {
      // Keep the fallback detail message.
    }
    showFeedback(detail, "error");
  }

  return response;
}

function render() {
  const isAuthenticated = Boolean(state.session);
  const role = state.session?.role || "EMPLOYEE";
  const copy = roleCopy[role];

  elements.loginView.hidden = isAuthenticated;
  elements.appView.hidden = !isAuthenticated;

  if (!isAuthenticated) {
    return;
  }

  elements.roleHeading.textContent = copy.heading;
  elements.roleDescription.textContent = copy.description;
  elements.sessionUsername.textContent = state.session.username;
  elements.sessionRoleBadge.textContent = state.session.role;
  elements.sessionRoleBadge.dataset.status = state.session.role;

  const isAdmin = role === "ADMIN";
  elements.adminWorkspace.hidden = !isAdmin;
  elements.claimWorkspace.hidden = isAdmin;

  const canRefreshClaims = !isAdmin;
  elements.listClaimsButton.hidden = !canRefreshClaims;
  elements.listScopeToggle.hidden = !(role === "MANAGER" || role === "FINANCE");
  if (role === "MANAGER" || role === "FINANCE") {
    elements.listScopeToggle.textContent = state.showAllClaims
      ? role === "MANAGER"
        ? "Show review queue"
        : "Show payment queue"
      : "Show all visible claims";
  }

  if (!isAdmin) {
    renderClaimWorkspace(role, copy);
  }
}

function renderClaimWorkspace(role, copy) {
  elements.claimListTitle.textContent = copy.listTitle;
  elements.claimListHint.textContent = copy.listHint;
  elements.detailEmptyTitle.textContent = copy.emptyTitle;
  elements.detailEmptyCopy.textContent = copy.emptyCopy;
  elements.employeeComposer.hidden = role !== "EMPLOYEE";

  renderClaimList(role);
  renderClaimDetails(role);
}

function renderClaimList(role) {
  const claims = getDisplayClaims(role);
  elements.claimList.innerHTML = "";
  elements.claimListCount.textContent = `${claims.length} ${claims.length === 1 ? "claim" : "claims"}`;

  if (claims.length === 0) {
    elements.claimListEmpty.hidden = false;
    elements.claimListEmpty.textContent = getEmptyListMessage(role);
    return;
  }

  elements.claimListEmpty.hidden = true;

  for (const claim of claims) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "claim-list-item";
    if (state.claim?.id === claim.id) {
      item.classList.add("is-selected");
    }

    item.innerHTML = `
      <div class="claim-list-header">
        <div>
          <div class="claim-list-title">${claim.description || "Untitled expense claim"}</div>
          <div class="hint">Claim ID: ${claim.id}</div>
        </div>
        <span class="status-badge" data-status="${claim.status}">${claim.status}</span>
      </div>
      <div class="claim-list-meta">
        <div class="claim-list-row"><span>Owner</span><strong>${claim.owner_employee_id}</strong></div>
        <div class="claim-list-row"><span>Amount</span><strong>${claim.amount || "-"}</strong></div>
        <div class="claim-list-row"><span>Category</span><strong>${claim.category || "-"}</strong></div>
      </div>
    `;

    item.addEventListener("click", () => {
      void loadClaim(claim.id);
    });

    elements.claimList.appendChild(item);
  }
}

function renderClaimDetails(role) {
  const claim = state.claim;
  const hasClaim = Boolean(claim);
  const username = state.session?.username;
  const isEmployeeDraft = hasClaim && role === "EMPLOYEE" && claim.status === "DRAFT" && claim.owner_employee_id === username;
  const canEmployeeSubmit = isEmployeeDraft && claim.can_submit;
  const canEmployeeReopen = hasClaim && role === "EMPLOYEE" && claim.status === "REJECTED" && claim.owner_employee_id === username;
  const canManagerReview = hasClaim && role === "MANAGER" && claim.status === "SUBMITTED";
  const canFinancePay = hasClaim && role === "FINANCE" && claim.status === "APPROVED";

  elements.detailEmptyState.hidden = hasClaim;
  elements.detailContent.hidden = !hasClaim;

  if (!hasClaim) {
    return;
  }

  elements.detailTitle.textContent = claim.description || "Expense claim";
  elements.detailLead.textContent = getDetailLead(claim);
  elements.claimStatusBadge.textContent = claim.status;
  elements.claimStatusBadge.dataset.status = claim.status;
  elements.claimIdValue.textContent = claim.id;
  elements.claimOwnerValue.textContent = claim.owner_employee_id;
  elements.claimAmountValue.textContent = claim.amount || "-";
  elements.claimCategoryValue.textContent = claim.category || "-";
  elements.claimCreatedAtValue.textContent = formatDateTime(claim.created_at);
  elements.claimSubmittedAtValue.textContent = formatDateTime(claim.submitted_at);
  elements.claimReviewedByValue.textContent = claim.reviewed_by_manager_id || "Not reviewed";
  elements.claimPaidByValue.textContent = claim.paid_by_finance_user_id || "Not paid";
  elements.claimPaidAtValue.textContent = formatDateTime(claim.paid_at);
  elements.claimDescriptionValue.textContent = claim.description || "No description entered yet.";

  elements.description.value = claim.description || "";
  elements.amount.value = claim.amount || "";
  elements.category.value = claim.category || "";

  elements.draftEditorSection.hidden = !isEmployeeDraft;
  elements.saveClaimButton.disabled = !isEmployeeDraft;
  elements.submitClaimButton.disabled = !canEmployeeSubmit;
  elements.submitClaimButton.hidden = !canEmployeeSubmit;

  elements.reopenActionSection.hidden = !canEmployeeReopen;
  elements.reopenClaimButton.disabled = !canEmployeeReopen;

  elements.managerActionSection.hidden = !canManagerReview;
  elements.approveClaimButton.disabled = !canManagerReview;
  elements.rejectClaimButton.disabled = !canManagerReview;

  elements.financeActionSection.hidden = !canFinancePay;
  elements.markPaidButton.disabled = !canFinancePay;
}

function getDisplayClaims(role) {
  if (role === "EMPLOYEE" || state.showAllClaims) {
    return state.claims;
  }
  if (role === "MANAGER") {
    return state.claims.filter((claim) => claim.status === "SUBMITTED");
  }
  return state.claims.filter((claim) => claim.status === "APPROVED");
}

function getEmptyListMessage(role) {
  if (role === "EMPLOYEE") {
    return "No claims are visible yet for this employee.";
  }
  if (role === "MANAGER" && !state.showAllClaims) {
    return "No submitted claims are waiting for review right now.";
  }
  if (role === "FINANCE" && !state.showAllClaims) {
    return "No approved claims are waiting for payment right now.";
  }
  return "No claims are visible yet for this workspace.";
}

function getDetailLead(claim) {
  if (claim.status === "DRAFT") {
    if (claim.is_corrected_draft) {
      return "This claim was previously rejected and reopened as a corrected draft. It can be edited and saved, but it cannot be submitted again in the current slice.";
    }
    return "This claim is still a draft and can be completed by its owner before submission.";
  }
  if (claim.status === "SUBMITTED") {
    return "This claim has been submitted and is waiting for manager review.";
  }
  if (claim.status === "APPROVED") {
    return "This claim has been approved and is ready for finance payment completion.";
  }
  if (claim.status === "REJECTED") {
    return "This claim was rejected. Its owner may reopen it into a corrected draft for editing and saving only.";
  }
  if (claim.status === "PAID") {
    return "This claim has been marked as paid and the current reimbursement flow is complete.";
  }
  return "Review the current state of the claim and take the next relevant action.";
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showFeedback(message, tone) {
  elements.feedback.hidden = false;
  elements.feedback.dataset.tone = tone;
  elements.feedback.textContent = message;
}

void initialize();
