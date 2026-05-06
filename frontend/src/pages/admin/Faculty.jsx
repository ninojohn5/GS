import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import { Search, UserPlus, Pencil, Trash2, X } from "lucide-react";

const STATUS = {
  Active:   { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Inactive: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
};

const DEPARTMENTS = [
  "College of Education",
  "College of Engineering",
  "College of Computer Studies",
  "College of Mathematics",
  "College of Forestry",
  "College of Agriculture",
  "College of Arts and Sciences",
  "Others",
];

const EMPTY_FORM = {
  name:       "",
  email:      "",
  password:   "password123",
  department: "",
  program:    "",
  position:   "",
  status:     "Active",
  role:       "researcher",
};

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

const M = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    zIndex: 999, display: "flex", alignItems: "center",
    justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 16, width: "100%",
    maxWidth: 560, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9",
  },
  title:    { margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" },
  closeBtn: { background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", padding: 6, display: "flex", color: "#374151" },
  body:     { padding: "20px 22px 22px", overflowY: "auto", maxHeight: "calc(90vh - 60px)" },
  grid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px", marginBottom: 20 },
  input: {
    padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8,
    fontSize: 14, outline: "none", color: "#111827",
    width: "100%", boxSizing: "border-box",
  },
  cancelBtn: {
    padding: "9px 20px", borderRadius: 8, border: "1px solid #e5e7eb",
    background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 500,
  },
  saveBtn: {
    padding: "9px 22px", borderRadius: 8, border: "none",
    background: "#f59e0b", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600,
  },
};

/* ── Faculty Modal ──────────────────────────────────────── */
function FacultyModal({ initial = EMPTY_FORM, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(initial);
  const set    = (key, value) => setForm((cur) => ({ ...cur, [key]: value }));
  const isEdit = !!initial.id;

  return (
    <div style={M.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={M.modal}>
        <div style={M.header}>
          <h2 style={M.title}>{isEdit ? "Edit Faculty" : "Add Faculty"}</h2>
          <button style={M.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={M.body}>
          <div style={M.grid}>

            <Field label="Full Name *">
              <input style={M.input} placeholder="e.g. Dr. Juan Dela Cruz"
                value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>

            <Field label="Email *">
              <input style={M.input} type="email" placeholder="e.g. juan@csu.edu.ph"
                value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>

            <Field label="Department *">
              <input style={M.input} placeholder="e.g. College of Computer Studies"
                value={form.department} onChange={(e) => set("department", e.target.value)} />
            </Field>

            <Field label="Program">
              <input style={M.input} placeholder="e.g. MS Computer Science"
                value={form.program || ""} onChange={(e) => set("program", e.target.value)} />
            </Field>

            <Field label="Position">
              <input style={M.input} placeholder="e.g. Associate Professor"
                value={form.position} onChange={(e) => set("position", e.target.value)} />
            </Field>

            <Field label="Status">
              <select style={M.input} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </Field>

            {!isEdit && (
              <Field label="Default Password">
                <input style={{ ...M.input, background: "#f9fafb", color: "#6b7280" }}
                  value="password123" readOnly />
              </Field>
            )}
          </div>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button style={M.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={M.saveBtn} onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Faculty"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Delete Modal ───────────────────────────────────────── */
function DeleteModal({ faculty, onClose, onConfirm, deleting, error }) {
  return (
    <div style={M.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...M.modal, maxWidth: 420 }}>
        <div style={M.header}>
          <h2 style={{ ...M.title, color: "#dc2626" }}>Delete Faculty</h2>
          <button style={M.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={M.body}>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151" }}>
            Are you sure you want to remove <strong>{faculty.name}</strong>? This action cannot be undone.
          </p>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={M.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...M.saveBtn, background: "#dc2626" }} onClick={onConfirm} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function FacultyManagement() {
  const [faculty,     setFaculty]     = useState([]);
  const [filtered,    setFiltered]    = useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [showAdd,     setShowAdd]     = useState(false);
  const [editing,     setEditing]     = useState(null);
  const [deleting,    setDeleting]    = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchFaculty = async () => {
    try {
      const res  = await api.get("/admin/faculty");
      const data = Array.isArray(res.data) ? res.data : [];
      console.log("FACULTY SAMPLE:", JSON.stringify(data[2], null, 2)); // 👈 add this
      setFaculty(data);
      setFiltered(data);
    } catch {
      setFaculty([]); setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFaculty(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      faculty.filter((item) =>
        item.name?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.department?.toLowerCase().includes(q) ||
        item.program?.toLowerCase().includes(q) ||
        item.department_center?.name?.toLowerCase().includes(q)
      )
      
    );
  }, [search, faculty]);

  const handleSave = async (form) => {
    if (!form.name || !form.email || !form.department) {
      setSaveError("Name, email, and department are required.");
      return;
    }
    setSaving(true); setSaveError("");
    try {
      if (form.id) {
        await api.put(`/admin/users/${form.id}/update`, {
          name:       form.name,
          email:      form.email,
          department: form.department,
          program:    form.program,
          position:   form.position,
          is_active:  form.status === "Active",
        });
      } else {
        await api.post("/register", {
          name:                  form.name,
          email:                 form.email,
          password:              "password123",
          password_confirmation: "password123",
          role:                  "researcher",
          department:            form.department,
          program:               form.program,
          position:              form.position,
          is_active:             form.status === "Active",
        });
      }
      setShowAdd(false); setEditing(null);
      await fetchFaculty();
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true); setDeleteError("");
    try {
      await api.delete(`/admin/users/${deleting.id}`);
      setDeleting(null);
      await fetchFaculty();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete. The faculty may have existing projects.");
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
    position:   item.position   || "",
  });
};

  const ml = isMobile ? 0 : sidebarWidth;

  return (
    <>
      <style>{`
        .fm-table { width:100%; border-collapse:collapse; }
        .fm-table th { padding:12px 16px; text-align:left; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; border-bottom:2px solid #e5e7eb; white-space:nowrap; }
        .fm-table td { padding:14px 16px; font-size:13px; color:#374151; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
        .fm-table tr:last-child td { border-bottom:none; }
        .fm-table tr:hover td { background:#fafafa; }
        .fm-cards { display:none; flex-direction:column; gap:12px; }
        @media(max-width:800px) { .fm-table-wrap { display:none; } .fm-cards { display:flex; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
        <AdminNavbar onWidthChange={setSidebarWidth} />

        <div style={{ marginLeft: ml, flex: 1, display: "flex", flexDirection: "column", transition: "margin-left 0.22s ease", minWidth: 0 }}>
          <Topbar title="Faculty Management" />

          <div style={{ padding: "24px", flex: 1 }}>
            {/* ── Header row ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
              <h3 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Manage faculty members and researchers</h3>
              <button
                onClick={() => { setSaveError(""); setShowAdd(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 9, border: "none", background: "#f59e0b", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: "0 2px 6px rgba(245,158,11,0.35)" }}
              >
                <UserPlus size={17} /> Add Faculty
              </button>
            </div>

            {/* ── Search + count ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, marginBottom: 20, alignItems: "stretch" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <Search size={18} color="#9ca3af" strokeWidth={1.8} />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, department, or program..."
                  style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#111827", padding: "14px 0", background: "transparent" }}
                />
              </div>
              <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 12, padding: "14px 28px", textAlign: "center", minWidth: 140, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827" }}>{filtered.length}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6b7280" }}>Total Faculty</p>
              </div>
            </div>

            {/* ── Table card ── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9" }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>Faculty List</h3>
              </div>

              {loading ? (
                <p style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>Loading…</p>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <UserPlus size={40} color="#d1d5db" style={{ margin: "0 auto 12px", display: "block" }} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#374151" }}>No faculty yet</p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>Click <strong>Add Faculty</strong> to get started.</p>
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="fm-table-wrap" style={{ overflowX: "auto" }}>
                    <table className="fm-table">
                      <thead>
                        <tr>
                          {["#", "Name", "Email", "Department", "Program", "Position", "Status", "Actions"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
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
                              <td>{item.department || item.department_center?.name || "—"}</td>
                              <td>{item.program || item.course || item.program_name || "—"}</td>
                              <td>{item.position || "—"}</td>
                              <td>
                                <span style={{ display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                                  {statusKey}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#6b7280", display: "flex" }} title="Edit">
                                    <Pencil size={16} />
                                  </button>
                                  <button onClick={() => { setDeleteError(""); setDeleting(item); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#dc2626", display: "flex" }} title="Delete">
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
                  <div className="fm-cards" style={{ padding: "14px 16px" }}>
                    {filtered.map((item) => {
                      const statusKey   = item.is_active === false ? "Inactive" : "Active";
                      const statusStyle = STATUS[statusKey];
                      return (
                        <div key={item.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 16px", background: "#fafafa" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div>
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.name}</p>
                              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{item.email}</p>
                            </div>
                            <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
                              {statusKey}
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", fontSize: 12, color: "#6b7280", marginBottom: 12 }}>
                            <span><b style={{ color: "#374151" }}>Dept:</b> {item.department || item.department_center?.name || "—"}</span>
                            <span><b style={{ color: "#374151" }}>Program:</b> {item.program || "—"}</span>
                            <span><b style={{ color: "#374151" }}>Position:</b> {item.position || "—"}</span>
                          </div>

                          <div style={{ display: "flex", gap: 10 }}>
                            <button onClick={() => openEdit(item)}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#374151" }}>
                              <Pencil size={14} /> Edit
                            </button>
                            <button onClick={() => { setDeleteError(""); setDeleting(item); }}
                              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#dc2626" }}>
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
      </div>

      {showAdd  && <FacultyModal onClose={() => setShowAdd(false)} onSave={handleSave} saving={saving} error={saveError} />}
      {editing  && <FacultyModal initial={editing} onClose={() => setEditing(null)} onSave={handleSave} saving={saving} error={saveError} />}
      {deleting && <DeleteModal faculty={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} deleting={isDeleting} error={deleteError} />}
    </>
  );
}