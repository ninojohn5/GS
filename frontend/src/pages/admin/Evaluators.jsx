import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import { Search, UserPlus, Pencil, Trash2, X, GraduationCap } from "lucide-react";

const STATUS = {
  Active: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
};

const resolveStatus = (e) => {
  if (typeof e.is_active === "boolean") return e.is_active ? "Active" : "Inactive";
  if (e.status === "Active" || e.status === "Inactive") return e.status;
  return "Active";
};

const EMPTY_FORM = {
  name: "",
  email: "",
  position: "Evaluator",
  department: "",
  program: "",
  status: "Active",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const M = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 560,
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "18px 22px 14px",
    borderBottom: "1px solid #f1f5f9",
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
  },
  closeBtn: {
    background: "#f3f4f6",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    padding: 6,
    display: "flex",
    color: "#374151",
  },
  body: {
    padding: "20px 22px 22px",
    overflowY: "auto",
    maxHeight: "calc(90vh - 70px)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px 16px",
    marginBottom: 20,
  },
  input: {
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    color: "#111827",
    width: "100%",
    boxSizing: "border-box",
  },
  cancelBtn: {
    padding: "9px 20px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    color: "#374151",
    fontWeight: 500,
  },
  saveBtn: {
    padding: "9px 22px",
    borderRadius: 8,
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
};

function EvaluatorModal({ initial = EMPTY_FORM, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(initial);
  const isEdit = !!initial.id;

  const set = (key, value) => {
    setForm((cur) => ({ ...cur, [key]: value }));
  };

  return (
    <div style={M.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={M.modal}>
        <div style={M.header}>
          <h2 style={M.title}>{isEdit ? "Edit Evaluator" : "Add Evaluator"}</h2>

          <button style={M.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={M.body}>
          <div style={M.grid}>
            <Field label="Full Name">
              <input
                style={M.input}
                placeholder="e.g. Dr. Amanda Rodriguez"
                value={form.name || ""}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>

            <Field label="Email">
              <input
                style={M.input}
                type="email"
                placeholder="e.g. amanda@university.edu"
                value={form.email || ""}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>

            <Field label="Position">
              <input
                style={{
                  ...M.input,
                  background: "#f9fafb",
                  color: "#6b7280",
                  cursor: "not-allowed",
                }}
                value="Evaluator"
                readOnly
              />
            </Field>

            <Field label="Department">
              <input
                style={M.input}
                placeholder="e.g. College of Engineering"
                value={form.department || ""}
                onChange={(e) => set("department", e.target.value)}
              />
            </Field>

            <Field label="Program">
              <input
                style={M.input}
                placeholder="e.g. MS Computer Science"
                value={form.program || ""}
                onChange={(e) => set("program", e.target.value)}
              />
            </Field>

            <Field label="Status">
              <select
                style={M.input}
                value={form.status || "Active"}
                onChange={(e) => set("status", e.target.value)}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={M.cancelBtn} onClick={onClose} disabled={saving}>
              Cancel
            </button>

            <button style={M.saveBtn} onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Evaluator"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ evaluator, onClose, onConfirm, deleting, error }) {
  return (
    <div style={M.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...M.modal, maxWidth: 430 }}>
        <div style={M.header}>
          <h2 style={{ ...M.title, color: "#dc2626" }}>Delete Evaluator</h2>

          <button style={M.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={M.body}>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151", lineHeight: 1.5 }}>
            Are you sure you want to remove <strong>{evaluator?.name}</strong>? This action cannot be undone.
          </p>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 14,
                fontSize: 13,
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={M.cancelBtn} onClick={onClose} disabled={deleting}>
              Cancel
            </button>

            <button
              style={{ ...M.saveBtn, background: "#dc2626" }}
              onClick={onConfirm}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EvaluatorManagement() {
  const [evaluators, setEvaluators] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [saveError, setSaveError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [success, setSuccess] = useState("");

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showSuccess = (message) => {
    setSuccess(message);

    setTimeout(() => {
      setSuccess("");
    }, 4000);
  };

  const fetchEvaluators = async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/evaluators");
      const data = Array.isArray(res.data) ? res.data : [];

      setEvaluators(data);
      setFiltered(data);
    } catch (err) {
      console.error("Fetch evaluators error:", err);
      setEvaluators([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluators();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    setFiltered(
      evaluators.filter((e) => {
        return (
          String(e.name || "").toLowerCase().includes(q) ||
          String(e.email || "").toLowerCase().includes(q) ||
          String(e.department || "").toLowerCase().includes(q) ||
          String(e.program || "").toLowerCase().includes(q) ||
          String(e.position || "").toLowerCase().includes(q)
        );
      })
    );
  }, [search, evaluators]);

  const handleSave = async (form) => {
    if (!form.name || !form.email) {
      setSaveError("Name and email are required.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      if (form.id) {
        await api.put(`/admin/users/${form.id}/update`, {
          name: form.name,
          email: form.email,
          department: form.department || "",
          program: form.program || "",
          position: "Evaluator",
          is_active: form.status === "Active",
        });

        showSuccess("Evaluator updated successfully.");
      } else {
        await api.post("/register", {
          name: form.name,
          email: form.email,
          password: "password123",
          password_confirmation: "password123",
          role: "evaluator",
          department: form.department || "",
          program: form.program || "",
          position: "Evaluator",
        });

        showSuccess("Evaluator added successfully.");
      }

      setShowAdd(false);
      setEditing(null);
      await fetchEvaluators();
    } catch (err) {
      console.error("Save evaluator error:", err);

      const backendMessage =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
        "Failed to save evaluator. Please check the backend.";

      setSaveError(backendMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting?.id) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      await api.delete(`/admin/users/${deleting.id}`);

      setDeleting(null);
      await fetchEvaluators();
      showSuccess("Evaluator deleted successfully.");
    } catch (err) {
      console.error("Delete evaluator error:", err);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete evaluator. The evaluator may already be assigned to a presentation.";

      setDeleteError(backendMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (item) => {
    setSaveError("");

    setEditing({
      ...item,
      status: resolveStatus(item),
      department: item.department || "",
      program: item.program || "",
      position: item.position || "",
    });
  };

  const openDelete = (item) => {
    setDeleteError("");
    setDeleting(item);
  };

  const totalActive = filtered.filter((e) => resolveStatus(e) === "Active").length;
  const ml = isMobile ? 0 : sidebarWidth;

  return (
    <>
      <style>{`
        .em-table {
          width: 100%;
          border-collapse: collapse;
        }

        .em-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .04em;
          border-bottom: 2px solid #e5e7eb;
          white-space: nowrap;
          background: #f9fafb;
        }

        .em-table td {
          padding: 14px 16px;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }

        .em-table tr:last-child td {
          border-bottom: none;
        }

        .em-table tr:hover td {
          background: #fafafa;
        }

        .em-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
        }

        .em-search-row {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 16px;
          margin-bottom: 20px;
          align-items: stretch;
        }

        @media(max-width: 900px) {
          .em-table-wrap {
            display: none;
          }

          .em-cards {
            display: flex;
          }
        }

        @media(max-width: 640px) {
          .em-search-row {
            grid-template-columns: 1fr;
          }

          .em-modal-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
        <AdminNavbar onWidthChange={setSidebarWidth} />

        <div
          style={{
            marginLeft: ml,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            transition: "margin-left 0.22s ease",
            minWidth: 0,
          }}
        >
          <Topbar title="Evaluator Management" />

          <div style={{ padding: "24px", flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Manage proposal evaluators and their assignments
                </h3>
              </div>

              <button
                onClick={() => {
                  setSaveError("");
                  setShowAdd(true);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 9,
                  border: "none",
                  background: "#f59e0b",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(245,158,11,0.35)",
                }}
              >
                <UserPlus size={17} />
                Add Evaluator
              </button>
            </div>

            {success && (
              <div
                style={{
                  background: "#dcfce7",
                  border: "1px solid #bbf7d0",
                  color: "#15803d",
                  padding: "12px 16px",
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {success}
              </div>
            )}

            <div className="em-search-row">
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 14px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Search size={18} color="#9ca3af" />

                <input
                  type="text"
                  placeholder="Search evaluator by name, email, department, program, position..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "12px 0",
                    fontSize: 14,
                    color: "#111827",
                    background: "transparent",
                  }}
                />
              </div>

              <div
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 12,
                  padding: "14px 28px",
                  textAlign: "center",
                  minWidth: 150,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827" }}>
                  {filtered.length}
                </p>

                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Total Evaluators
                </p>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: 12,
                  padding: "14px 28px",
                  textAlign: "center",
                  minWidth: 150,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827" }}>
                  {totalActive}
                </p>

                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Active Evaluators
                </p>
              </div>
            </div>

            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>
                  Evaluator List
                </h3>
              </div>

              {loading ? (
                <p style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>
                  Loading...
                </p>
              ) : filtered.length === 0 ? (
                <p
                  style={{
                    padding: 24,
                    color: "#9ca3af",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  No evaluators found.
                </p>
              ) : (
                <>
                  <div className="em-table-wrap" style={{ overflowX: "auto" }}>
                    <table className="em-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Program</th>
                          <th>Position</th>
                          <th>Assigned</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filtered.map((e) => {
                          const statusLabel = resolveStatus(e);
                          const sb = STATUS[statusLabel] || STATUS.Inactive;
                          const assignedCount = e.assigned ?? 0;

                          const assignedStyle =
                            assignedCount > 0
                              ? { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" }
                              : { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" };

                          return (
                            <tr key={e.id}>
                              <td style={{ fontWeight: 600, color: "#111827" }}>
                                {e.evaluator_id || `E${String(e.id).padStart(3, "0")}`}
                              </td>

                              <td style={{ fontWeight: 500, color: "#111827" }}>
                                {e.name}
                              </td>

                              <td style={{ color: "#6b7280" }}>{e.email}</td>
                              <td>{e.department || "—"}</td>
                              <td>{e.program || "—"}</td>
                              <td>{e.position || "—"}</td>

                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: assignedStyle.bg,
                                    color: assignedStyle.color,
                                    border: `1px solid ${assignedStyle.border}`,
                                  }}
                                >
                                  {assignedCount} assigned
                                </span>
                              </td>

                              <td>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: sb.bg,
                                    color: sb.color,
                                    border: `1px solid ${sb.border}`,
                                  }}
                                >
                                  {statusLabel}
                                </span>
                              </td>

                              <td>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button
                                    onClick={() => openEdit(e)}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 7,
                                      border: "1px solid #e5e7eb",
                                      background: "#fff",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 12,
                                      color: "#374151",
                                    }}
                                  >
                                    <Pencil size={13} />
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => openDelete(e)}
                                    style={{
                                      padding: "6px 10px",
                                      borderRadius: 7,
                                      border: "1px solid #fecaca",
                                      background: "#fef2f2",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 5,
                                      fontSize: 12,
                                      color: "#dc2626",
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="em-cards">
                    {filtered.map((e) => {
                      const statusLabel = resolveStatus(e);
                      const sb = STATUS[statusLabel] || STATUS.Inactive;

                      return (
                        <div
                          key={e.id}
                          style={{
                            padding: 16,
                            borderBottom: "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "flex-start",
                              marginBottom: 12,
                            }}
                          >
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                background: "#fef3c7",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#d97706",
                                flexShrink: 0,
                              }}
                            >
                              <GraduationCap size={20} />
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: "#111827",
                                }}
                              >
                                {e.name}
                              </p>

                              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                                {e.email}
                              </p>
                            </div>

                            <span
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 20,
                                fontSize: 12,
                                fontWeight: 600,
                                background: sb.bg,
                                color: sb.color,
                                border: `1px solid ${sb.border}`,
                              }}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gap: 4,
                              fontSize: 12,
                              color: "#6b7280",
                              marginBottom: 12,
                            }}
                          >
                            <span>
                              <b style={{ color: "#374151" }}>Department:</b>{" "}
                              {e.department || "—"}
                            </span>

                            <span>
                              <b style={{ color: "#374151" }}>Program:</b>{" "}
                              {e.program || "—"}
                            </span>

                            <span>
                              <b style={{ color: "#374151" }}>Position:</b>{" "}
                              {e.position || "—"}
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: 10 }}>
                            <button
                              onClick={() => openEdit(e)}
                              style={{
                                flex: 1,
                                padding: "8px 0",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                                background: "#fff",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                color: "#374151",
                              }}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              onClick={() => openDelete(e)}
                              style={{
                                flex: 1,
                                padding: "8px 0",
                                borderRadius: 8,
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 500,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                                color: "#dc2626",
                              }}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <EvaluatorModal
          onClose={() => {
            setSaveError("");
            setShowAdd(false);
          }}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}

      {editing && (
        <EvaluatorModal
          initial={editing}
          onClose={() => {
            setSaveError("");
            setEditing(null);
          }}
          onSave={handleSave}
          saving={saving}
          error={saveError}
        />
      )}

      {deleting && (
        <DeleteModal
          evaluator={deleting}
          onClose={() => {
            setDeleteError("");
            setDeleting(null);
          }}
          onConfirm={handleDelete}
          deleting={isDeleting}
          error={deleteError}
        />
      )}
    </>
  );
}