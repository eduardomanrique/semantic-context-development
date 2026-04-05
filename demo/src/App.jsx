import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  expenseDate: "",
  amount: "",
  category: "",
  description: ""
};

export default function App() {
  const [demoUsers, setDemoUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [claims, setClaims] = useState([]);
  const [managerClaims, setManagerClaims] = useState([]);
  const [financeClaims, setFinanceClaims] = useState([]);
  const [selectedClaimId, setSelectedClaimId] = useState(null);
  const [selectedManagerClaim, setSelectedManagerClaim] = useState(null);
  const [selectedFinanceClaim, setSelectedFinanceClaim] = useState(null);
  const [managerNote, setManagerNote] = useState("");
  const [financeNote, setFinanceNote] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, []);

  async function bootstrap() {
    setLoading(true);

    try {
      const [usersResult, sessionResult] = await Promise.all([
        request("/api/demo-users"),
        request("/api/session")
      ]);

      setDemoUsers(usersResult.users);
      setCurrentUser(sessionResult.user);
      await refreshRoleData(sessionResult.user);
    } catch (error) {
      setErrors([error.message]);
    } finally {
      setLoading(false);
    }
  }

  async function refreshRoleData(user) {
    if (user?.role === "employee") {
      const result = await request("/api/claims");
      setClaims(result.claims);
      setManagerClaims([]);
      setFinanceClaims([]);
      setSelectedManagerClaim(null);
      setSelectedFinanceClaim(null);
      setManagerNote("");
      setFinanceNote("");
      return;
    }

    if (user?.role === "manager") {
      const result = await request("/api/manager/claims");
      setManagerClaims(result.claims);
      setClaims([]);
      setFinanceClaims([]);
      setSelectedClaimId(null);
      setForm(emptyForm);
      setSelectedFinanceClaim(null);
      setFinanceNote("");

      if (selectedManagerClaim) {
        const nextSelected = result.claims.find((claim) => claim.id === selectedManagerClaim.id);

        if (nextSelected) {
          await loadManagerClaim(nextSelected.id);
        } else {
          setSelectedManagerClaim(null);
          setManagerNote("");
        }
      }

      return;
    }

    if (user?.role === "finance") {
      const result = await request("/api/finance/claims");
      setFinanceClaims(result.claims);
      setClaims([]);
      setManagerClaims([]);
      setSelectedClaimId(null);
      setSelectedManagerClaim(null);
      setManagerNote("");
      setForm(emptyForm);

      if (selectedFinanceClaim) {
        const nextSelected = result.claims.find((claim) => claim.id === selectedFinanceClaim.id);

        if (nextSelected) {
          await loadFinanceClaim(nextSelected.id);
        } else {
          setSelectedFinanceClaim(null);
          setFinanceNote("");
        }
      }

      return;
    }

    setClaims([]);
    setManagerClaims([]);
    setFinanceClaims([]);
    setSelectedClaimId(null);
    setSelectedManagerClaim(null);
    setSelectedFinanceClaim(null);
    setManagerNote("");
    setFinanceNote("");
  }

  async function loadManagerClaim(claimId) {
    const result = await request(`/api/manager/claims/${claimId}`);
    setSelectedManagerClaim(result.claim);
    setManagerNote(result.claim.reviewNote ?? "");
  }

  async function loadFinanceClaim(claimId) {
    const result = await request(`/api/finance/claims/${claimId}`);
    setSelectedFinanceClaim(result.claim);
    setFinanceNote(result.claim.paymentNote ?? "");
  }

  async function handleLogin(userId) {
    setErrors([]);
    setNotice("");

    try {
      const result = await request("/api/session/login", {
        method: "POST",
        body: JSON.stringify({ userId })
      });

      setCurrentUser(result.user);
      setSelectedClaimId(null);
      setSelectedManagerClaim(null);
      setSelectedFinanceClaim(null);
      setManagerNote("");
      setFinanceNote("");
      setForm(emptyForm);
      await refreshRoleData(result.user);
    } catch (error) {
      setErrors([error.message]);
    }
  }

  async function handleLogout() {
    await request("/api/session/logout", { method: "POST" });
    setCurrentUser(null);
    setClaims([]);
    setManagerClaims([]);
    setFinanceClaims([]);
    setSelectedClaimId(null);
    setSelectedManagerClaim(null);
    setSelectedFinanceClaim(null);
    setManagerNote("");
    setFinanceNote("");
    setForm(emptyForm);
    setErrors([]);
    setNotice("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setErrors([]);
    setNotice("");

    const method = selectedClaimId ? "PUT" : "POST";
    const url = selectedClaimId ? `/api/claims/${selectedClaimId}` : "/api/claims";

    try {
      const result = await request(url, {
        method,
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount)
        })
      });

      await refreshRoleData(currentUser);
      setSelectedClaimId(result.claim.id);
      setForm(toForm(result.claim));
      setNotice(selectedClaimId ? "Draft updated." : "Draft created.");
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmitClaim(claimId) {
    setErrors([]);
    setNotice("");

    try {
      await request(`/api/claims/${claimId}/submit`, { method: "POST" });
      await refreshRoleData(currentUser);

      if (selectedClaimId === claimId) {
        setSelectedClaimId(null);
        setForm(emptyForm);
      }

      setNotice("Claim submitted for review.");
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    }
  }

  async function handleReopenClaim(claim) {
    setErrors([]);
    setNotice("");

    try {
      const result = await request(`/api/claims/${claim.id}/reopen`, { method: "POST" });
      await refreshRoleData(currentUser);
      setSelectedClaimId(result.claim.id);
      setForm(toForm(result.claim));
      setNotice("Rejected claim reopened as a draft.");
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    }
  }

  async function handleOpenManagerClaim(claimId) {
    setErrors([]);
    setNotice("");

    try {
      await loadManagerClaim(claimId);
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    }
  }

  async function handleOpenFinanceClaim(claimId) {
    setErrors([]);
    setNotice("");

    try {
      await loadFinanceClaim(claimId);
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    }
  }

  async function handleReview(decision) {
    if (!selectedManagerClaim) {
      return;
    }

    setReviewing(true);
    setErrors([]);
    setNotice("");

    try {
      const result = await request(`/api/manager/claims/${selectedManagerClaim.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          decision,
          note: managerNote
        })
      });

      await refreshRoleData(currentUser);
      setSelectedManagerClaim(null);
      setManagerNote("");
      setNotice(`Claim ${result.claim.status}.`);
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    } finally {
      setReviewing(false);
    }
  }

  async function handlePayClaim() {
    if (!selectedFinanceClaim) {
      return;
    }

    setPaying(true);
    setErrors([]);
    setNotice("");

    try {
      const result = await request(`/api/finance/claims/${selectedFinanceClaim.id}/pay`, {
        method: "POST",
        body: JSON.stringify({
          note: financeNote
        })
      });

      await refreshRoleData(currentUser);
      setSelectedFinanceClaim(null);
      setFinanceNote("");
      setNotice(`Claim ${result.claim.status}.`);
    } catch (error) {
      setErrors(error.details ?? [error.message]);
    } finally {
      setPaying(false);
    }
  }

  function handleSelectClaim(claim) {
    if (claim.status !== "draft") {
      return;
    }

    setSelectedClaimId(claim.id);
    setForm(toForm(claim));
    setErrors([]);
    setNotice("");
  }

  function handleNewDraft() {
    setSelectedClaimId(null);
    setForm(emptyForm);
    setErrors([]);
    setNotice("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  if (loading) {
    return (
      <div className="shell">
        <p className="loading">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <header className="hero panel stagger-1">
        <div>
          <p className="eyebrow">Expense Reimbursement</p>
          <h1>Single-entry claims, routed cleanly.</h1>
          <p className="lede">
            Employees create and submit claims, managers approve or reject them, and finance marks
            approved claims as paid to complete the workflow.
          </p>
        </div>

        {currentUser ? (
          <div className="session-card">
            <p className="session-label">Signed in as</p>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
            <button className="ghost-button" onClick={handleLogout} type="button">
              Switch demo user
            </button>
          </div>
        ) : null}
      </header>

      {!currentUser ? (
        <section className="panel stagger-2">
          <div className="section-heading">
            <h2>Demo Login</h2>
            <p>Choose a seeded role to exercise the application.</p>
          </div>

          <div className="user-grid">
            {demoUsers.map((user) => (
              <button
                className="user-tile"
                key={user.id}
                onClick={() => handleLogin(user.id)}
                type="button"
              >
                <span className="user-role">{user.role}</span>
                <strong>{user.name}</strong>
                <span className="user-id">{user.id}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {errors.length > 0 ? (
        <section className="panel alert-panel stagger-2">
          <h2>Validation</h2>
          <ul className="messages">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {notice ? (
        <section className="panel notice-panel stagger-2">
          <p>{notice}</p>
        </section>
      ) : null}

      {currentUser?.role === "employee" ? (
        <main className="workspace">
          <section className="panel stagger-2">
            <div className="section-heading">
              <h2>{selectedClaimId ? "Edit draft" : "New expense claim"}</h2>
              <p>Employees can edit drafts and reopen rejected claims before resubmitting them for review.</p>
            </div>

            <form className="claim-form" onSubmit={handleSave}>
              <label>
                <span>Title</span>
                <input
                  name="title"
                  onChange={handleChange}
                  placeholder="Client dinner in Porto"
                  required
                  value={form.title}
                />
              </label>

              <div className="form-row">
                <label>
                  <span>Expense date</span>
                  <input
                    name="expenseDate"
                    onChange={handleChange}
                    required
                    type="date"
                    value={form.expenseDate}
                  />
                </label>

                <label>
                  <span>Amount</span>
                  <input
                    min="0.01"
                    name="amount"
                    onChange={handleChange}
                    placeholder="42.50"
                    required
                    step="0.01"
                    type="number"
                    value={form.amount}
                  />
                </label>
              </div>

              <label>
                <span>Category</span>
                <input
                  name="category"
                  onChange={handleChange}
                  placeholder="Meals"
                  required
                  value={form.category}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  name="description"
                  onChange={handleChange}
                  placeholder="Explain the business purpose of the expense."
                  required
                  rows="5"
                  value={form.description}
                />
              </label>

              <div className="form-actions">
                <button className="primary-button" disabled={saving} type="submit">
                  {saving ? "Saving..." : selectedClaimId ? "Save changes" : "Save draft"}
                </button>

                {selectedClaimId ? (
                  <button
                    className="accent-button"
                    onClick={() => handleSubmitClaim(selectedClaimId)}
                    type="button"
                  >
                    Submit for review
                  </button>
                ) : null}

                <button className="ghost-button" onClick={handleNewDraft} type="button">
                  Clear form
                </button>
              </div>
            </form>
          </section>

          <section className="panel stagger-3">
            <div className="section-heading">
              <h2>Your claims</h2>
              <p>Drafts are editable, rejected claims can be reopened, and paid claims stay immutable.</p>
            </div>

            <div className="claim-list">
              {claims.length === 0 ? (
                <div className="empty-state">No claims yet. Start with a draft.</div>
              ) : (
                claims.map((claim) => (
                  <article className="claim-card" key={claim.id}>
                    <div className="claim-card-header">
                      <div>
                        <span className={`status-pill status-${claim.status}`}>{claim.status}</span>
                        <h3>{claim.title}</h3>
                      </div>
                      <div className="amount-block">{formatCurrencylessAmount(claim.amount)}</div>
                    </div>

                    <dl className="claim-meta">
                      <div>
                        <dt>Date</dt>
                        <dd>{claim.expenseDate}</dd>
                      </div>
                      <div>
                        <dt>Category</dt>
                        <dd>{claim.category}</dd>
                      </div>
                    </dl>

                    <p className="claim-description">{claim.description}</p>

                    {claim.reviewHistory?.length > 0 ? (
                      <ReviewHistory reviewHistory={claim.reviewHistory} />
                    ) : null}

                    {claim.paymentNote ? (
                      <div className="inline-note">
                        <strong>Finance note</strong>
                        <p>{claim.paymentNote}</p>
                      </div>
                    ) : null}

                    {claim.paidAt ? (
                      <div className="inline-note">
                        <strong>Paid at</strong>
                        <p>{formatTimestamp(claim.paidAt, "Not paid yet")}</p>
                      </div>
                    ) : null}

                    <div className="claim-actions">
                      {claim.status === "draft" ? (
                        <>
                          <button className="ghost-button" onClick={() => handleSelectClaim(claim)} type="button">
                            Edit draft
                          </button>
                          <button
                            className="accent-button"
                            onClick={() => handleSubmitClaim(claim.id)}
                            type="button"
                          >
                            Submit
                          </button>
                        </>
                      ) : claim.status === "rejected" ? (
                        <button className="reject-button" onClick={() => handleReopenClaim(claim)} type="button">
                          Revise claim
                        </button>
                      ) : (
                        <p className="locked-note">Only draft claims can be edited.</p>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </main>
      ) : null}

      {currentUser?.role === "manager" ? (
        <main className="workspace manager-workspace">
          <section className="panel stagger-2">
            <div className="section-heading">
              <h2>Submitted claims</h2>
              <p>Any seeded manager can open a submitted claim and record a locked decision.</p>
            </div>

            <div className="claim-list">
              {managerClaims.length === 0 ? (
                <div className="empty-state">No submitted claims are waiting for review.</div>
              ) : (
                managerClaims.map((claim) => (
                  <article className="claim-card compact-card" key={claim.id}>
                    <div className="claim-card-header">
                      <div>
                        <span className={`status-pill status-${claim.status}`}>{claim.status}</span>
                        <h3>{claim.title}</h3>
                      </div>
                      <div className="amount-block">{formatCurrencylessAmount(claim.amount)}</div>
                    </div>

                    <p className="compact-meta">
                      {claim.employeeName} · {claim.category} · {claim.expenseDate}
                    </p>

                    <div className="claim-actions">
                      <button className="ghost-button" onClick={() => handleOpenManagerClaim(claim.id)} type="button">
                        Open claim
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel stagger-3">
            <div className="section-heading">
              <h2>Review detail</h2>
              <p>Inspect the submitted claim, add an optional note, and lock in the decision.</p>
            </div>

            {selectedManagerClaim ? (
              <div className="manager-detail">
                <div className="detail-head">
                  <div>
                    <span className={`status-pill status-${selectedManagerClaim.status}`}>
                      {selectedManagerClaim.status}
                    </span>
                    <h3>{selectedManagerClaim.title}</h3>
                  </div>
                  <div className="amount-block">{formatCurrencylessAmount(selectedManagerClaim.amount)}</div>
                </div>

                <dl className="detail-grid">
                  <div>
                    <dt>Employee</dt>
                    <dd>{selectedManagerClaim.employeeName}</dd>
                  </div>
                  <div>
                    <dt>Expense date</dt>
                    <dd>{selectedManagerClaim.expenseDate}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{selectedManagerClaim.category}</dd>
                  </div>
                  <div>
                    <dt>Submitted at</dt>
                    <dd>{formatTimestamp(selectedManagerClaim.submittedAt, "Not submitted")}</dd>
                  </div>
                </dl>

                <div className="inline-note">
                  <strong>Description</strong>
                  <p>{selectedManagerClaim.description}</p>
                </div>

                {selectedManagerClaim.reviewHistory?.length > 0 ? (
                  <ReviewHistory reviewHistory={selectedManagerClaim.reviewHistory} />
                ) : null}

                <label>
                  <span>Optional review note</span>
                  <textarea
                    onChange={(event) => setManagerNote(event.target.value)}
                    placeholder="Explain the approval or rejection if useful."
                    rows="5"
                    value={managerNote}
                  />
                </label>

                <div className="form-actions">
                  <button
                    className="approve-button"
                    disabled={reviewing}
                    onClick={() => handleReview("approve")}
                    type="button"
                  >
                    {reviewing ? "Saving..." : "Approve claim"}
                  </button>
                  <button
                    className="reject-button"
                    disabled={reviewing}
                    onClick={() => handleReview("reject")}
                    type="button"
                  >
                    {reviewing ? "Saving..." : "Reject claim"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state detail-empty">Open a submitted claim to inspect and review it.</div>
            )}
          </section>
        </main>
      ) : null}

      {currentUser?.role === "finance" ? (
        <main className="workspace finance-workspace">
          <section className="panel stagger-2">
            <div className="section-heading">
              <h2>Approved claims</h2>
              <p>Any seeded finance user can open an approved claim and mark it as paid.</p>
            </div>

            <div className="claim-list">
              {financeClaims.length === 0 ? (
                <div className="empty-state">No approved claims are waiting for payment.</div>
              ) : (
                financeClaims.map((claim) => (
                  <article className="claim-card compact-card" key={claim.id}>
                    <div className="claim-card-header">
                      <div>
                        <span className={`status-pill status-${claim.status}`}>{claim.status}</span>
                        <h3>{claim.title}</h3>
                      </div>
                      <div className="amount-block">{formatCurrencylessAmount(claim.amount)}</div>
                    </div>

                    <p className="compact-meta">
                      {claim.employeeName} · {claim.category} · reviewed by {claim.reviewerName}
                    </p>

                    <div className="claim-actions">
                      <button className="ghost-button" onClick={() => handleOpenFinanceClaim(claim.id)} type="button">
                        Open claim
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="panel stagger-3">
            <div className="section-heading">
              <h2>Payment detail</h2>
              <p>Inspect the approved claim, add an optional payment note, and complete reimbursement.</p>
            </div>

            {selectedFinanceClaim ? (
              <div className="manager-detail">
                <div className="detail-head">
                  <div>
                    <span className={`status-pill status-${selectedFinanceClaim.status}`}>
                      {selectedFinanceClaim.status}
                    </span>
                    <h3>{selectedFinanceClaim.title}</h3>
                  </div>
                  <div className="amount-block">{formatCurrencylessAmount(selectedFinanceClaim.amount)}</div>
                </div>

                <dl className="detail-grid">
                  <div>
                    <dt>Employee</dt>
                    <dd>{selectedFinanceClaim.employeeName}</dd>
                  </div>
                  <div>
                    <dt>Expense date</dt>
                    <dd>{selectedFinanceClaim.expenseDate}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{selectedFinanceClaim.category}</dd>
                  </div>
                  <div>
                    <dt>Approved at</dt>
                    <dd>{formatTimestamp(selectedFinanceClaim.reviewedAt, "Not approved")}</dd>
                  </div>
                </dl>

                <div className="inline-note">
                  <strong>Description</strong>
                  <p>{selectedFinanceClaim.description}</p>
                </div>

                {selectedFinanceClaim.reviewNote ? (
                  <div className="inline-note">
                    <strong>Manager note</strong>
                    <p>{selectedFinanceClaim.reviewNote}</p>
                  </div>
                ) : null}

                {selectedFinanceClaim.reviewHistory?.length > 0 ? (
                  <ReviewHistory reviewHistory={selectedFinanceClaim.reviewHistory} />
                ) : null}

                <label>
                  <span>Optional payment note</span>
                  <textarea
                    onChange={(event) => setFinanceNote(event.target.value)}
                    placeholder="Record any internal payment reference or context."
                    rows="5"
                    value={financeNote}
                  />
                </label>

                <div className="form-actions">
                  <button className="pay-button" disabled={paying} onClick={handlePayClaim} type="button">
                    {paying ? "Saving..." : "Mark as paid"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-state detail-empty">Open an approved claim to complete payment.</div>
            )}
          </section>
        </main>
      ) : null}
    </div>
  );
}

function toForm(claim) {
  return {
    title: claim.title,
    expenseDate: claim.expenseDate,
    amount: String(claim.amount),
    category: claim.category,
    description: claim.description
  };
}

function ReviewHistory({ reviewHistory }) {
  return (
    <div className="history-block">
      <strong>Review history</strong>
      <div className="history-list">
        {reviewHistory.map((entry) => (
          <article className="history-entry" key={entry.id}>
            <div className="history-header">
              <span className={`status-pill status-history-${entry.decision}`}>
                {entry.decision === "approve" ? "approved" : "rejected"}
              </span>
              <span className="history-meta">
                {entry.reviewerName} · {formatTimestamp(entry.reviewedAt, "No review timestamp")}
              </span>
            </div>
            <p>{entry.note || "No review note recorded."}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function formatCurrencylessAmount(amount) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatTimestamp(value, emptyLabel) {
  if (!value) {
    return emptyLabel;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.error ?? "Request failed.");
    error.status = response.status;
    error.details = payload.errors;
    throw error;
  }

  return payload;
}
