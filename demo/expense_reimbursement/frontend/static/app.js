const state = {
  claim: null,
};

const elements = {
  ownerEmployeeId: document.querySelector("#ownerEmployeeId"),
  claimIdLookup: document.querySelector("#claimIdLookup"),
  createClaimButton: document.querySelector("#createClaimButton"),
  loadClaimButton: document.querySelector("#loadClaimButton"),
  workspaceTitle: document.querySelector("#workspaceTitle"),
  claimStatusBadge: document.querySelector("#claimStatusBadge"),
  claimIdValue: document.querySelector("#claimIdValue"),
  claimOwnerValue: document.querySelector("#claimOwnerValue"),
  actorEmployeeId: document.querySelector("#actorEmployeeId"),
  description: document.querySelector("#description"),
  amount: document.querySelector("#amount"),
  category: document.querySelector("#category"),
  saveClaimButton: document.querySelector("#saveClaimButton"),
  submitClaimButton: document.querySelector("#submitClaimButton"),
  feedback: document.querySelector("#feedback"),
};

function initialize() {
  elements.createClaimButton.addEventListener("click", createClaim);
  elements.loadClaimButton.addEventListener("click", loadClaim);
  elements.saveClaimButton.addEventListener("click", saveClaim);
  elements.submitClaimButton.addEventListener("click", submitClaim);
  render();
}

async function createClaim() {
  const ownerEmployeeId = elements.ownerEmployeeId.value.trim();
  if (!ownerEmployeeId) {
    showFeedback("Enter an employee ID before creating a draft.", "error");
    return;
  }

  const response = await request("/claims", {
    method: "POST",
    body: JSON.stringify({ owner_employee_id: ownerEmployeeId }),
  });

  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  elements.actorEmployeeId.value = state.claim.owner_employee_id;
  elements.claimIdLookup.value = state.claim.id;
  showFeedback("Draft claim created. Complete the required fields and save or submit.", "success");
  render();
}

async function loadClaim() {
  const claimId = elements.claimIdLookup.value.trim();
  if (!claimId) {
    showFeedback("Enter a claim ID to load an existing claim.", "error");
    return;
  }

  const response = await request(`/claims/${claimId}`);
  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  elements.actorEmployeeId.value = state.claim.owner_employee_id;
  showFeedback(`Claim ${state.claim.id} loaded.`, "success");
  render();
}

async function saveClaim() {
  if (!state.claim) {
    showFeedback("Create or load a claim before saving.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}`, {
    method: "PUT",
    body: JSON.stringify(buildClaimPayload()),
  });

  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Draft saved.", "success");
  render();
}

async function submitClaim() {
  if (!state.claim) {
    showFeedback("Create or load a claim before submitting.", "error");
    return;
  }

  const actorEmployeeId = elements.actorEmployeeId.value.trim();
  if (!actorEmployeeId) {
    showFeedback("Enter the actor employee ID before submitting.", "error");
    return;
  }

  const response = await request(`/claims/${state.claim.id}/submit`, {
    method: "POST",
    body: JSON.stringify({ actor_employee_id: actorEmployeeId }),
  });

  if (!response.ok) {
    return;
  }

  state.claim = await response.json();
  showFeedback("Claim submitted. The employee can no longer edit this claim.", "success");
  render();
}

function buildClaimPayload() {
  return {
    actor_employee_id: elements.actorEmployeeId.value.trim(),
    description: elements.description.value,
    amount: elements.amount.value,
    category: elements.category.value,
  };
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let detail = "Request failed.";
    try {
      const payload = await response.json();
      detail = payload.detail || detail;
    } catch (_) {
      // Ignore malformed error payloads and keep the fallback message.
    }
    showFeedback(detail, "error");
  }

  return response;
}

function render() {
  const claim = state.claim;
  const hasClaim = Boolean(claim);
  const isDraft = claim?.status === "DRAFT";

  elements.workspaceTitle.textContent = hasClaim ? "Active expense claim" : "No claim loaded";
  elements.claimIdValue.textContent = claim?.id || "Not created yet";
  elements.claimOwnerValue.textContent = claim?.owner_employee_id || "Not set";
  elements.claimStatusBadge.textContent = claim?.status || "Idle";
  elements.claimStatusBadge.dataset.status = claim?.status || "IDLE";

  elements.description.value = claim?.description || "";
  elements.amount.value = claim?.amount || "";
  elements.category.value = claim?.category || "";

  elements.description.disabled = !isDraft;
  elements.amount.disabled = !isDraft;
  elements.category.disabled = !isDraft;
  elements.saveClaimButton.disabled = !isDraft;
  elements.submitClaimButton.disabled = !hasClaim;

  if (!hasClaim) {
    elements.actorEmployeeId.value = "";
  }
}

function showFeedback(message, tone) {
  elements.feedback.hidden = false;
  elements.feedback.dataset.tone = tone;
  elements.feedback.textContent = message;
}

initialize();
