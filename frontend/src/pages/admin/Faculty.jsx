import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import { Search, UserPlus, Pencil, Trash2, X } from "lucide-react";
import "../../styles/admin.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = {
  Active:   { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
};

const EMPTY_FORM = {
  name: "", email: "", password: "password123",
  department: "", program: "", position: "",
  status: "Active", role: "researcher",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getDepartment = (item) => item.department || item.department_center?.name || "—";
const getProgram    = (item) => item.program || item.course || item.program_name || "—";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div className="fac-field">
      <label className="fac-field-label">{label}</label>
      {children}
    </div>
  );
}

function ResearcherModal({ initial = EMPTY_FORM, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((cur) => ({ ...cur, [key]: val }));
  const isEdit = !!initial.id;

  return (
    <div className="fac-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fac-modal">
        <div className="fac-modal-header">
          <h2 className="fac-modal-title">{isEdit ? "Edit Researcher" : "Add Researcher"}</h2>
          <button className="fac-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="fac-modal-body">
          <div className="fac-modal-grid">
            <Field label="Full Name *">
              <input className="fac-input" placeholder="e.g. Dr. Juan Dela Cruz"
                value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>

            <Field label="Email *">
              <input className="fac-input" type="email" placeholder="e.g. juan@csu.edu.ph"
                value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>

            <Field label="Department *">
              <input className="fac-input" placeholder="e.g. College of Computer Studies"
                value={form.department} onChange={(e) => set("department", e.target.value)} />
            </Field>

            <Field label="Program">
              <input className="fac-input" placeholder="e.g. BSIT"
                value={form.program || ""} onChange={(e) => set("program", e.target.value)} />
            </Field>

            <Field label="Position">
              <input className="fac-input" placeholder="e.g. Associate Professor"
                value={form.position || ""} onChange={(e) => set("position", e.target.value)} />
            </Field>

            <Field label="Status">
              <select className="fac-input" value={form.status}
                onChange={(e) => set("status", e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>

            {!isEdit && (
              <Field label="Default Password">
                <input className="fac-input fac-input-readonly" value="password123" readOnly />
              </Field>
            )}
          </div>

          {error && <div className="fac-error-box">{error}</div>}

          <div className="fac-modal-footer">
            <button className="fac-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="fac-save-btn" onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Researcher"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ researcher, onClose, onConfirm, deleting, error }) {
  return (
    <div className="fac-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fac-modal fac-modal-sm">
        <div className="fac-modal-header">
          <h2 className="fac-modal-title" style={{ color: "#dc2626" }}>Delete Researcher</h2>
          <button className="fac-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="fac-modal-body">
          <p className="fac-delete-msg">
            Are you sure you want to remove <strong>{researcher.name}</strong>? This action cannot be undone.
          </p>
          {error && <div className="fac-error-box">{error}</div>}
          <div className="fac-modal-footer">
            <button className="fac-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="fac-delete-btn" onClick={onConfirm} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ResearcherManagement() {
  const [researchers, setResearchers] = useState([]);
  const [filtered, setFiltered]       = useState([]);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);

  const [showAdd, setShowAdd]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [deleting, setDeleting] = useState(null);

  const [saving, setSaving]         = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchResearchers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/faculty");
      const data = Array.isArray(res.data) ? res.data : [];
      setResearchers(data);
      setFiltered(data);
    } catch {
      setResearchers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResearchers(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(researchers.filter((item) =>
      [item.name, item.email, getDepartment(item), getProgram(item)]
        .some((v) => String(v || "").toLowerCase().includes(q))
    ));
  }, [search, researchers]);

  const handleSave = async (form) => {
    if (!form.name || !form.email || !form.department) {
      setSaveError("Name, email, and department are required."); return;
    }
    setSaving(true);
    setSaveError("");
    try {
      if (form.id) {
        await api.put(`/admin/users/${form.id}/update`, {
          name: form.name, email: form.email,
          department: form.department, program: form.program,
          position: form.position, is_active: form.status === "Active",
        });
      } else {
        await api.post("/register", {
          name: form.name, email: form.email,
          password: "password123", password_confirmation: "password123",
          role: "researcher",
          department: form.department, program: form.program,
          position: form.position, is_active: form.status === "Active",
        });
      }
      setShowAdd(false);
      setEditing(null);
      await fetchResearchers();
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save. Please try again.");
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
      await fetchResearchers();
    } catch (err) {
      setDeleteError(
        err.response?.data?.message ||
        "Failed to delete. The researcher may have existing projects."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (item) => {
    setSaveError("");
    setEditing({
      ...item,
      status:     item.is_active === false ? "Inactive" : "Active",
      department: item.department || item.department_center?.name || "",
      program:    item.program || item.course || item.program_name || "",
      position:   item.position || "",
    });
  };

  return (
    <div className="adm-page">
      <AdminNavbar onWidthChange={setSidebarWidth} />

      <div className="adm-main" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar title="Researcher Management" />

        <div className="adm-content">

          {/* Header */}
          <div className="fac-page-header">
            <h3 className="fac-page-sub">Manage researcher profiles and project proponents</h3>
            <button className="fac-add-btn"
              onClick={() => { setSaveError(""); setShowAdd(true); }}>
              <UserPlus size={17} /> Add Researcher
            </button>
          </div>

          {/* Search + stat row */}
          <div className="fac-search-row">
            <div className="fac-search-box">
              <Search size={18} color="#9ca3af" strokeWidth={1.8} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, department, or program…"
                className="fac-search-input"
              />
            </div>
            <div className="fac-stat-box">
              <p className="fac-stat-value">{filtered.length}</p>
              <p className="fac-stat-label">Total Researchers</p>
            </div>
          </div>

          {/* Table card */}
          <div className="fac-table-card">
            <div className="fac-table-card-header">
              <h3 className="adm-card-h">Researcher List</h3>
            </div>

            {loading ? (
              <p className="adm-loading">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="fac-empty">
                <UserPlus size={40} color="#d1d5db" style={{ margin: "0 auto 12px", display: "block" }} />
                <p className="fac-empty-title">No researchers yet</p>
                <p className="fac-empty-sub">Click <strong>Add Researcher</strong> to get started.</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="fac-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        {["#","Name","Email","Department","Program","Position","Status","Actions"]
                          .map((h) => <th key={h}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item, index) => {
                        const statusKey   = item.is_active === false ? "Inactive" : "Active";
                        const statusStyle = STATUS[statusKey];
                        return (
                          <tr key={item.id}>
                            <td style={{ fontWeight: 600, color: "#9ca3af" }}>{index + 1}</td>
                            <td style={{ fontWeight: 600, color: "#111827" }}>{item.name}</td>
                            <td style={{ color: "#6b7280" }}>{item.email}</td>
                            <td>{getDepartment(item)}</td>
                            <td>{getProgram(item)}</td>
                            <td>{item.position || "—"}</td>
                            <td>
                              <span className="adm-status-pill" style={{
                                background: statusStyle.bg,
                                color: statusStyle.color,
                                border: `1px solid ${statusStyle.border}`,
                              }}>
                                {statusKey}
                              </span>
                            </td>
                            <td>
                              <div className="fac-action-btns">
                                <button className="fac-icon-btn" title="Edit" onClick={() => openEdit(item)}>
                                  <Pencil size={16} />
                                </button>
                                <button className="fac-icon-btn fac-icon-btn-red" title="Delete"
                                  onClick={() => { setDeleteError(""); setDeleting(item); }}>
                                  <Trash2 size={16} />
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
                <div className="fac-cards">
                  {filtered.map((item) => {
                    const statusKey   = item.is_active === false ? "Inactive" : "Active";
                    const statusStyle = STATUS[statusKey];
                    return (
                      <div key={item.id} className="fac-mobile-card">
                        <div className="fac-mobile-card-top">
                          <div>
                            <p className="fac-mobile-name">{item.name}</p>
                            <p className="fac-mobile-email">{item.email}</p>
                          </div>
                          <span className="adm-status-pill" style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                          }}>
                            {statusKey}
                          </span>
                        </div>
                        <div className="fac-mobile-meta">
                          <span><b>Dept:</b> {getDepartment(item)}</span>
                          <span><b>Program:</b> {getProgram(item)}</span>
                          <span><b>Position:</b> {item.position || "—"}</span>
                        </div>
                        <div className="fac-mobile-actions">
                          <button className="ev-adm-edit-btn ev-adm-btn-flex" onClick={() => openEdit(item)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="ev-adm-del-btn ev-adm-btn-flex"
                            onClick={() => { setDeleteError(""); setDeleting(item); }}>
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
        <ResearcherModal
          onClose={() => setShowAdd(false)}
          onSave={handleSave} saving={saving} error={saveError}
        />
      )}
      {editing && (
        <ResearcherModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave} saving={saving} error={saveError}
        />
      )}
      {deleting && (
        <DeleteModal
          researcher={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete} deleting={isDeleting} error={deleteError}
        />
      )}
    </div>
  );
}