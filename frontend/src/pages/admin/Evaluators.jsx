import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import { Search, UserPlus, Pencil, Trash2, X, GraduationCap } from "lucide-react";
import "../../styles/admin.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
  Active:   { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
};

const EMPTY_FORM = {
  name: "", email: "", password: "", position: "Evaluator",
  department: "", program: "", rank: "", expertise: "", status: "Active",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const resolveStatus = (e) => {
  if (typeof e.is_active === "boolean") return e.is_active ? "Active" : "Inactive";
  if (e.status === "Active" || e.status === "Inactive") return e.status;
  return "Active";
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="ev-adm-field">
      <label className="ev-adm-field-label">{label}</label>
      {children}
    </div>
  );
}

function EvaluatorModal({ initial = EMPTY_FORM, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(initial);
  const [showPw, setShowPw] = useState(false);
  const isEdit = !!initial.id;
  const set = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));

  return (
    <div className="ev-adm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ev-adm-modal">

        <div className="ev-adm-modal-header">
          <h2 className="ev-adm-modal-title">{isEdit ? "Edit Evaluator" : "Add Evaluator"}</h2>
          <button className="ev-adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ev-adm-modal-body">

          {/* Basic Info */}
          <p className="ev-adm-section-label">Basic Information</p>
          <div className="ev-adm-modal-grid">
            <Field label="Full Name *">
              <input className="ev-adm-input" placeholder="e.g. Dr. Amanda Rodriguez"
                value={form.name || ""} onChange={(e) => set("name", e.target.value)} />
            </Field>

            <Field label="Email *">
              <input className="ev-adm-input" type="email" placeholder="e.g. amanda@university.edu"
                value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
            </Field>

            {!isEdit && (
              <Field label="Password *">
                <div className="ev-adm-pw-wrap">
                  <input
                    className="ev-adm-input"
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    value={form.password || ""}
                    onChange={(e) => set("password", e.target.value)}
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" className="ev-adm-pw-toggle"
                    onClick={() => setShowPw((v) => !v)}>
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
            )}

            <Field label="Position">
              <input className="ev-adm-input ev-adm-input-readonly"
                value="Evaluator" readOnly />
            </Field>
          </div>

          {/* Academic Info */}
          <p className="ev-adm-section-label">Academic Information</p>
          <div className="ev-adm-modal-grid">
            <Field label="Department">
              <input className="ev-adm-input" placeholder="e.g. College of Engineering"
                value={form.department || ""} onChange={(e) => set("department", e.target.value)} />
            </Field>

            <Field label="Program">
              <input className="ev-adm-input" placeholder="e.g. MS Computer Science"
                value={form.program || ""} onChange={(e) => set("program", e.target.value)} />
            </Field>

            <Field label="Rank">
              <input className="ev-adm-input" placeholder="e.g. Associate Professor"
                value={form.rank || ""} onChange={(e) => set("rank", e.target.value)} />
            </Field>

            <Field label="Expertise">
              <input className="ev-adm-input" placeholder="e.g. Machine Learning, Data Science"
                value={form.expertise || ""} onChange={(e) => set("expertise", e.target.value)} />
            </Field>

            <Field label="Status">
              <select className="ev-adm-input" value={form.status || "Active"}
                onChange={(e) => set("status", e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>
          </div>

          {!isEdit && (
            <div className="ev-adm-pw-notice">
              ⚠️ Please share the password with the evaluator securely after creation.
            </div>
          )}

          {error && <div className="ev-adm-error-box">{error}</div>}

          <div className="ev-adm-modal-footer">
            <button className="ev-adm-cancel-btn" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="ev-adm-save-btn" onClick={() => onSave(form)} disabled={saving}>
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
    <div className="ev-adm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ev-adm-modal ev-adm-modal-sm">
        <div className="ev-adm-modal-header">
          <h2 className="ev-adm-modal-title" style={{ color: "#dc2626" }}>Delete Evaluator</h2>
          <button className="ev-adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ev-adm-modal-body">
          <p className="ev-adm-delete-msg">
            Are you sure you want to remove <strong>{evaluator?.name}</strong>? This action cannot be undone.
          </p>
          {error && <div className="ev-adm-error-box">{error}</div>}
          <div className="ev-adm-modal-footer">
            <button className="ev-adm-cancel-btn" onClick={onClose} disabled={deleting}>Cancel</button>
            <button className="ev-adm-delete-btn" onClick={onConfirm} disabled={deleting}>
              {deleting ? "Deleting..." : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function EvaluatorManagement() {
  const [evaluators, setEvaluators] = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(true);

  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [saving, setSaving]       = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [success, setSuccess]       = useState("");

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
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

  useEffect(() => { fetchEvaluators(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(evaluators.filter((e) =>
      [e.name, e.email, e.department, e.program, e.position]
        .some((v) => String(v || "").toLowerCase().includes(q))
    ));
  }, [search, evaluators]);

  const handleSave = async (form) => {
    if (!form.name?.trim() || !form.email?.trim()) {
      setSaveError("Name and email are required."); return;
    }
    if (!form.id && (!form.password?.trim() || form.password.trim().length < 8)) {
      setSaveError("Password is required and must be at least 8 characters."); return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (form.id) {
        await api.put(`/admin/users/${form.id}/update`, {
          name: form.name, email: form.email,
          department: form.department || "", program: form.program || "",
          rank: form.rank || "", expertise: form.expertise || "",
          position: "Evaluator", is_active: form.status === "Active",
        });
        showSuccess("Evaluator updated successfully.");
      } else {
        await api.post("/register", {
          name: form.name, email: form.email,
          password: form.password, password_confirmation: form.password,
          role: "evaluator",
          department: form.department || "", program: form.program || "",
          rank: form.rank || "", expertise: form.expertise || "",
          position: "Evaluator",
        });
        showSuccess(`Evaluator "${form.name}" added successfully. Share their password securely.`);
      }
      setShowAdd(false);
      setEditing(null);
      await fetchEvaluators();
    } catch (err) {
      const msg = err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors || {})?.flat()?.[0] ||
        "Failed to save evaluator. Please check the form and try again.";
      setSaveError(msg);
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
      setDeleteError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to delete evaluator. The evaluator may already be assigned to a presentation."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (item) => {
    setSaveError("");
    setEditing({
      ...item,
      status:     resolveStatus(item),
      department: item.department || "",
      program:    item.program    || "",
      rank:       item.rank       || "",
      expertise:  item.expertise  || "",
      position:   item.position   || "Evaluator",
    });
  };

  const openDelete = (item) => { setDeleteError(""); setDeleting(item); };

  const totalActive = filtered.filter((e) => resolveStatus(e) === "Active").length;

  return (
    <div className="adm-page">
      <AdminNavbar onWidthChange={setSidebarWidth} />

      <div className="adm-main" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar title="Evaluator Management" />

        <div className="adm-content">

          {/* Header */}
          <div className="ev-adm-page-header">
            <h3 className="ev-adm-page-sub">Manage proposal evaluators and their assignments</h3>
            <button className="ev-adm-add-btn"
              onClick={() => { setSaveError(""); setShowAdd(true); }}>
              <UserPlus size={17} /> Add Evaluator
            </button>
          </div>

          {/* Success toast */}
          {success && <div className="ev-adm-success">{success}</div>}

          {/* Search + Stats row */}
          <div className="ev-adm-search-row">
            <div className="ev-adm-search-box">
              <Search size={18} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search by name, email, department, program, position…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ev-adm-search-input"
              />
            </div>

            <div className="ev-adm-stat-box ev-adm-stat-box-orange">
              <p className="ev-adm-stat-value">{filtered.length}</p>
              <p className="ev-adm-stat-label">Total Evaluators</p>
            </div>

            <div className="ev-adm-stat-box ev-adm-stat-box-green">
              <p className="ev-adm-stat-value">{totalActive}</p>
              <p className="ev-adm-stat-label">Active Evaluators</p>
            </div>
          </div>

          {/* Table card */}
          <div className="ev-adm-table-card">
            <div className="ev-adm-table-card-header">
              <h3 className="adm-card-h">Evaluator List</h3>
            </div>

            {loading ? (
              <p className="adm-loading">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="ev-adm-empty">No evaluators found.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="ev-adm-table-wrap">
                  <table className="adm-table ev-adm-table">
                    <thead>
                      <tr>
                        {["ID","Name","Email","Department","Program","Rank","Expertise","Status","Actions"]
                          .map((h) => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((e) => {
                        const statusLabel = resolveStatus(e);
                        const sb = STATUS[statusLabel] || STATUS.Inactive;
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 600, color: "#111827" }}>
                              {e.evaluator_id || `E${String(e.id).padStart(3, "0")}`}
                            </td>
                            <td style={{ fontWeight: 500, color: "#111827" }}>{e.name}</td>
                            <td style={{ color: "#6b7280" }}>{e.email}</td>
                            <td>{e.department || "—"}</td>
                            <td>{e.program    || "—"}</td>
                            <td>{e.rank       || "—"}</td>
                            <td className="ev-adm-expertise-cell">{e.expertise || "—"}</td>
                            <td>
                              <span className="adm-status-pill"
                                style={{ background: sb.bg, color: sb.color, border: `1px solid ${sb.border}` }}>
                                {statusLabel}
                              </span>
                            </td>
                            <td>
                              <div className="ev-adm-action-btns">
                                <button className="ev-adm-edit-btn" onClick={() => openEdit(e)}>
                                  <Pencil size={13} /> Edit
                                </button>
                                <button className="ev-adm-del-btn" onClick={() => openDelete(e)}>
                                  <Trash2 size={13} /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="ev-adm-cards">
                  {filtered.map((e) => {
                    const statusLabel = resolveStatus(e);
                    const sb = STATUS[statusLabel] || STATUS.Inactive;
                    return (
                      <div key={e.id} className="ev-adm-mobile-card">
                        <div className="ev-adm-mobile-card-top">
                          <div className="ev-adm-mobile-avatar">
                            <GraduationCap size={20} />
                          </div>
                          <div className="ev-adm-mobile-info">
                            <p className="ev-adm-mobile-name">{e.name}</p>
                            <p className="ev-adm-mobile-email">{e.email}</p>
                          </div>
                          <span className="adm-status-pill"
                            style={{ background: sb.bg, color: sb.color, border: `1px solid ${sb.border}` }}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="ev-adm-mobile-meta">
                          <span><b>Department:</b> {e.department || "—"}</span>
                          <span><b>Program:</b>    {e.program    || "—"}</span>
                          <span><b>Rank:</b>       {e.rank       || "—"}</span>
                          <span><b>Expertise:</b>  {e.expertise  || "—"}</span>
                        </div>
                        <div className="ev-adm-mobile-actions">
                          <button className="ev-adm-edit-btn ev-adm-btn-flex" onClick={() => openEdit(e)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="ev-adm-del-btn ev-adm-btn-flex" onClick={() => openDelete(e)}>
                            <Trash2 size={14} /> Delete
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

      {/* Modals */}
      {showAdd && (
        <EvaluatorModal
          onClose={() => { setSaveError(""); setShowAdd(false); }}
          onSave={handleSave} saving={saving} error={saveError}
        />
      )}
      {editing && (
        <EvaluatorModal
          initial={editing}
          onClose={() => { setSaveError(""); setEditing(null); }}
          onSave={handleSave} saving={saving} error={saveError}
        />
      )}
      {deleting && (
        <DeleteModal
          evaluator={deleting}
          onClose={() => { setDeleteError(""); setDeleting(null); }}
          onConfirm={handleDelete} deleting={isDeleting} error={deleteError}
        />
      )}
    </div>
  );
}