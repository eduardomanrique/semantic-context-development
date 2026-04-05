function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function validateClaimInput(input) {
  const title = normalizeText(input.title);
  const expenseDate = normalizeText(input.expenseDate);
  const category = normalizeText(input.category);
  const description = normalizeText(input.description);
  const amount = Number(input.amount);
  const errors = [];

  if (!title) {
    errors.push("Title is required.");
  }

  if (!expenseDate || !isIsoDate(expenseDate)) {
    errors.push("Expense date must use YYYY-MM-DD.");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be a positive number.");
  }

  if (!category) {
    errors.push("Category is required.");
  }

  if (!description) {
    errors.push("Description is required.");
  }

  return {
    errors,
    value: {
      title,
      expenseDate,
      amount,
      category,
      description
    }
  };
}

export function toClaimResponse(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    title: row.title,
    expenseDate: row.expense_date,
    amount: row.amount,
    category: row.category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    reviewerId: row.reviewer_id,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    payerId: row.payer_id,
    paymentNote: row.payment_note,
    paidAt: row.paid_at,
    employeeName: row.employee_name,
    reviewerName: row.reviewer_name,
    payerName: row.payer_name
  };
}

export function validateReviewInput(input) {
  const decision = typeof input.decision === "string" ? input.decision.trim().toLowerCase() : "";
  const note = typeof input.note === "string" ? input.note.trim() : "";
  const errors = [];

  if (!["approve", "reject"].includes(decision)) {
    errors.push("Decision must be approve or reject.");
  }

  return {
    errors,
    value: {
      decision,
      note
    }
  };
}

export function validatePaymentInput(input) {
  const note = typeof input.note === "string" ? input.note.trim() : "";

  return {
    errors: [],
    value: {
      note
    }
  };
}

export function toReviewHistoryEntry(row) {
  return {
    id: row.id,
    claimId: row.claim_id,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    decision: row.decision,
    note: row.note,
    reviewedAt: row.reviewed_at
  };
}
