import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import api from "../../utils/api";
import { ArrowLeft, Plus, Pencil, Trash2, X, Package, Printer } from "lucide-react";

const STATUS_CFG = {
  "Pending":     { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  "In Progress": { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  "Completed":   { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
};

const OUTPUT_TYPES = [
  "Publication",
  "Journal Article",
  "Conference Paper",
  "Presentation",
  "Patent",
  "Policy Brief",
  "Training Module",
  "Technology Transfer",
  "Book / Book Chapter",
  "Others",
];

const EMPTY_FORM = {
  output_type: "",
  description: "",
  status: "Pending",
  target_date: "",
};

const M = {
  overlay:   { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal:     { background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px", borderBottom: "1px solid #f1f5f9" },
  title:     { margin: 0, fontSize: 17, fontWeight: 700, color: "#111827" },
  closeBtn:  { background: "#f3f4f6", border: "none", borderRadius: 8, cursor: "pointer", padding: 6, display: "flex", color: "#374151" },
  body:      { padding: "20px 22px 22px" },
  label:     { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5, display: "block" },
  input:     { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", color: "#111827", width: "100%", boxSizing: "border-box" },
  cancelBtn: { padding: "9px 20px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 14, color: "#374151", fontWeight: 500 },
  saveBtn:   { padding: "9px 22px", borderRadius: 8, border: "none", background: "#1f7a1f", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 },
};

function OutputModal({ initial = EMPTY_FORM, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!initial.id;

  return (
    <div style={M.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={M.modal}>
        <div style={M.header}>
          <h2 style={M.title}>{isEdit ? "Edit Output" : "Add Output"}</h2>
          <button style={M.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={M.body}>
          <div style={{ marginBottom: 14 }}>
            <label style={M.label}>Output Type *</label>
            <select style={M.input} value={form.output_type}
              onChange={e => set("output_type", e.target.value)}>
              <option value="">— Select Output Type —</option>
              {OUTPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={M.label}>Description *</label>
            <textarea style={{ ...M.input, minHeight: 90, resize: "vertical" }}
              placeholder="Describe the expected output..."
              value={form.description}
              onChange={e => set("description", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={M.label}>Status</label>
              <select style={M.input} value={form.status}
                onChange={e => set("status", e.target.value)}>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div>
              <label style={M.label}>Target Date</label>
              <input style={M.input} type="date" value={form.target_date || ""}
                onChange={e => set("target_date", e.target.value)} />
            </div>
          </div>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={M.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={M.saveBtn} onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Output"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ output, onClose, onConfirm, deleting, error }) {
  return (
    <div style={M.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...M.modal, maxWidth: 420 }}>
        <div style={M.header}>
          <h2 style={{ ...M.title, color: "#dc2626" }}>Delete Output</h2>
          <button style={M.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <div style={M.body}>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151" }}>
            Are you sure you want to delete <strong>{output.output_type}</strong>? This cannot be undone.
          </p>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={M.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={{ ...M.saveBtn, background: "#dc2626" }}
              onClick={onConfirm} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Print Report ── */
function handlePrint(project, outputs) {
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "—";
  const today   = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  const completed  = outputs.filter(o => o.status === "Completed").length;
  const inProgress = outputs.filter(o => o.status === "In Progress").length;
  const pending    = outputs.filter(o => o.status === "Pending").length;

  const statusBadge = (status) => {
    const colors = {
      "Completed":   "background:#dcfce7;color:#15803d;border:1px solid #bbf7d0;",
      "In Progress": "background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;",
      "Pending":     "background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;",
    };
    return `<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;${colors[status] || colors["Pending"]}">${status}</span>`;
  };

  const rows = outputs.map((o, i) => `
    <tr style="border-bottom:1px solid #f1f5f9;">
      <td style="padding:12px 14px;font-size:13px;color:#6b7280;font-weight:600;">${i + 1}</td>
      <td style="padding:12px 14px;font-size:13px;font-weight:600;color:#111827;">${o.output_type}</td>
      <td style="padding:12px 14px;font-size:13px;color:#374151;">${o.description}</td>
      <td style="padding:12px 14px;font-size:13px;text-align:center;">${statusBadge(o.status)}</td>
      <td style="padding:12px 14px;font-size:13px;color:#6b7280;text-align:center;">${fmtDate(o.target_date)}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Research Outputs — ${project?.title || ""}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #111827; background: #fff; padding: 40px; }
        @media print {
          body { padding: 24px; }
          @page { margin: 20mm; }
        }
      </style>
    </head>
    <body>

      <!-- University Header -->
      <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:3px solid #1f3864;">
        <p style="font-size:13px;font-weight:600;color:#1f3864;letter-spacing:0.05em;text-transform:uppercase;">Caraga State University</p>
        <p style="font-size:11px;color:#6b7280;margin-top:2px;">Office of the Vice President for Research, Innovation & Extension</p>
        <h1 style="font-size:20px;font-weight:800;color:#1f3864;margin-top:10px;">Research Outputs Report</h1>
        <p style="font-size:12px;color:#9ca3af;margin-top:4px;">Date Generated: ${today}</p>
      </div>

      <!-- Project Info -->
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
        <p style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Project Information</p>
        <p style="font-size:16px;font-weight:700;color:#111827;margin-bottom:4px;">${project?.title || "—"}</p>
        <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:6px;">
          <span style="font-size:12px;color:#6b7280;"><b style="color:#374151;">Reference No:</b> ${project?.reference_no || "—"}</span>
          <span style="font-size:12px;color:#6b7280;"><b style="color:#374151;">Type:</b> ${project?.type || "—"}</span>
          <span style="font-size:12px;color:#6b7280;"><b style="color:#374151;">Status:</b> ${project?.status || "—"}</span>
        </div>
      </div>

      <!-- Summary Stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;">
        ${[
          { label: "Total Outputs",  value: outputs.length, bg: "#eff6ff", color: "#1d4ed8" },
          { label: "Completed",      value: completed,      bg: "#dcfce7", color: "#15803d" },
          { label: "In Progress",    value: inProgress,     bg: "#d1fae5", color: "#065f46" },
          { label: "Pending",        value: pending,        bg: "#f3f4f6", color: "#6b7280" },
        ].map(s => `
          <div style="background:${s.bg};border-radius:8px;padding:14px;text-align:center;">
            <p style="font-size:26px;font-weight:800;color:${s.color};margin:0;">${s.value}</p>
            <p style="font-size:11px;color:#6b7280;margin:4px 0 0;">${s.label}</p>
          </div>
        `).join("")}
      </div>

      <!-- Outputs Table -->
      <div style="border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:32px;">
        <div style="background:#1f3864;padding:14px 20px;">
          <h2 style="color:#fff;font-size:14px;font-weight:700;margin:0;">Research Outputs (${outputs.length})</h2>
        </div>
        <table style="width:100%;border-collapse:collapse;background:#fff;">
          <thead>
            <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
              <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;width:40px;">#</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;width:160px;">Type</th>
              <th style="padding:12px 14px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;">Description</th>
              <th style="padding:12px 14px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;width:120px;">Status</th>
              <th style="padding:12px 14px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;width:130px;">Target Date</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows : `
              <tr>
                <td colspan="5" style="padding:32px;text-align:center;color:#9ca3af;font-size:14px;">No outputs recorded.</td>
              </tr>
            `}
          </tbody>
        </table>
      </div>

      <!-- Signature -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;">
        <div>
          <div style="border-top:2px solid #374151;padding-top:8px;">
            <p style="font-size:13px;font-weight:700;color:#111827;">Prepared by</p>
            <p style="font-size:12px;color:#6b7280;margin-top:2px;">Researcher / Lead Proponent</p>
          </div>
        </div>
        <div>
          <div style="border-top:2px solid #374151;padding-top:8px;">
            <p style="font-size:13px;font-weight:700;color:#111827;">Noted by</p>
            <p style="font-size:12px;color:#6b7280;margin-top:2px;">RDE Division Chief</p>
          </div>
        </div>
      </div>

      <p style="text-align:center;font-size:11px;color:#9ca3af;margin-top:40px;padding-top:16px;border-top:1px solid #f1f5f9;">
        This document was generated from the Research Project Management System — Caraga State University
      </p>

    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

export default function OutputsDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [project,  setProject]  = useState(null);
  const [outputs,  setOutputs]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [isDeleting,  setIsDeleting]  = useState(false);
  const [saveError,   setSaveError]   = useState("");
  const [deleteError, setDeleteError] = useState("");

  const fetchOutputs = async () => {
    try {
      const [projRes, outRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/outputs`),
      ]);
      setProject(projRes.data);
      setOutputs(outRes.data || []);
    } catch {
      setOutputs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOutputs(); }, [id]);

  const handleSave = async (form) => {
    if (!form.output_type || !form.description) {
      setSaveError("Output type and description are required."); return;
    }
    setSaving(true); setSaveError("");
    try {
      if (form.id) await api.put(`/projects/${id}/outputs/${form.id}`, form);
      else         await api.post(`/projects/${id}/outputs`, form);
      setShowAdd(false); setEditing(null);
      await fetchOutputs();
    } catch (err) {
      setSaveError(err.response?.data?.message || "Failed to save output.");
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setIsDeleting(true); setDeleteError("");
    try {
      await api.delete(`/projects/${id}/outputs/${deleting.id}`);
      setDeleting(null);
      await fetchOutputs();
    } catch (err) {
      setDeleteError(err.response?.data?.message || "Failed to delete output.");
    } finally { setIsDeleting(false); }
  };

  const completed  = outputs.filter(o => o.status === "Completed").length;
  const inProgress = outputs.filter(o => o.status === "In Progress").length;
  const pending    = outputs.filter(o => o.status === "Pending").length;

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="main-content">
        <Topbar title="Outputs" />
        <div className="dashboard-content">

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <button onClick={() => navigate("/researcher/outputs")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13, color: "#374151", fontWeight: 500 }}>
              <ArrowLeft size={15} /> Back
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handlePrint(project, outputs)}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Printer size={15} /> Print / Save PDF
              </button>
              <button onClick={() => { setSaveError(""); setShowAdd(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "#1f7a1f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={15} /> Add Output
              </button>
            </div>
          </div>

          {/* Project info */}
          {project && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Project</p>
              <p style={{ margin: "4px 0 2px", fontSize: 15, fontWeight: 700, color: "#111827" }}>{project.title}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{project.reference_no}</p>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Completed",   value: completed,  bg: "#dcfce7", color: "#15803d" },
              { label: "In Progress", value: inProgress, bg: "#d1fae5", color: "#065f46" },
              { label: "Pending",     value: pending,    bg: "#f3f4f6", color: "#6b7280" },
            ].map(s => (
              <div key={s.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827" }}>{s.value}</p>
                <span style={{ display: "inline-block", marginTop: 6, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.color }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Outputs list */}
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9" }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>
                Research Outputs ({outputs.length})
              </h3>
            </div>

            {loading ? (
              <p style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>Loading…</p>
            ) : outputs.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center" }}>
                <Package size={40} color="#d1d5db" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#374151" }}>No outputs yet</p>
                <p style={{ margin: "6px 0 16px", fontSize: 13, color: "#9ca3af" }}>Click <strong>Add Output</strong> to track research deliverables.</p>
                <button onClick={() => { setSaveError(""); setShowAdd(true); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "#1f7a1f", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={15} /> Add Output
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {outputs.map((o, i) => {
                  const sc = STATUS_CFG[o.status] || STATUS_CFG["Pending"];
                  return (
                    <div key={o.id} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "16px 22px",
                      borderBottom: i < outputs.length - 1 ? "1px solid #f1f5f9" : "none",
                      transition: "background 0.12s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fafafa"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Package size={20} color="#1f7a1f" strokeWidth={1.8} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>{o.output_type}</p>
                          <span style={{ padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {o.status}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>{o.description}</p>
                        {o.target_date && (
                          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
                            Target: {new Date(o.target_date).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button onClick={() => { setSaveError(""); setEditing(o); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#6b7280", display: "flex", borderRadius: 6 }}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { setDeleteError(""); setDeleting(o); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#dc2626", display: "flex", borderRadius: 6 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {showAdd  && <OutputModal onClose={() => setShowAdd(false)}  onSave={handleSave} saving={saving}     error={saveError} />}
      {editing  && <OutputModal initial={editing} onClose={() => setEditing(null)}  onSave={handleSave} saving={saving} error={saveError} />}
      {deleting && <DeleteModal output={deleting} onClose={() => setDeleting(null)} onConfirm={handleDelete} deleting={isDeleting} error={deleteError} />}
    </div>
  );
}