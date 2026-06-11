import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  Search, FileText, Calendar, Users, X,
  CheckCircle2, Clock, Eye, ClipboardList, Trash2,
} from "lucide-react";
import "../../styles/admin.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP = {
  Pending:                { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Scheduled:              { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Presentation Scheduled":{ bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Under Evaluation":     { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Approved:               { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Rejected:               { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "For Revision":         { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const WP_MONTHS       = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
const WP_MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeStatus = (s) => {
  if (s === "Submitted") return "Pending";
  if (s === "Presentation Scheduled") return "Scheduled";
  return s || "Pending";
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  } catch { return d; }
};

const fmtDefenseDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  } catch { return d; }
};

const getEvaluatorNames = (p) => {
  const op = p.oral_presentation || p.oralPresentation || null;
  if (Array.isArray(p.evaluators)) return p.evaluators.map((ev) => typeof ev === "string" ? ev : ev.name);
  if (Array.isArray(op?.evaluators)) return op.evaluators.map((ev) => ev.name);
  return [];
};

const normalizeEvaluatorIds = (value) => {
  if (!value) return [];
  let parsed = value;
  if (typeof value === "string") { try { parsed = JSON.parse(value); } catch { return []; } }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => typeof item === "object" && item !== null
      ? Number(item.id || item.personnel_id || item.evaluator_id)
      : Number(item))
    .filter((id) => Number.isFinite(id));
};

const fmtBudget = (raw) => {
  if (!raw || raw === "0" || raw === "—") return "—";
  const num = parseFloat(String(raw).replace(/[₱,]/g, ""));
  if (!isNaN(num) && String(raw).replace(/[₱,\s]/g, "").match(/^\d+(\.\d+)?$/))
    return `₱${num.toLocaleString()}`;
  return String(raw);
};

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ items, onClose, onConfirm, deleting }) {
  const isBulk = items.length > 1;
  return (
    <div className="ppm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ppm-modal ppm-modal-sm">
        <div className="ppm-modal-header">
          <div>
            <h2 className="ppm-modal-title" style={{ color: "#dc2626" }}>
              Delete {isBulk ? `${items.length} Proposals` : "Proposal"}
            </h2>
            <p className="ppm-modal-ref">This action cannot be undone.</p>
          </div>
          <button className="ppm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="ppm-modal-body">
          <p className="ppm-delete-msg">
            {isBulk
              ? <>Are you sure you want to delete <strong>{items.length} proposals</strong>?</>
              : <>Are you sure you want to delete <strong>"{items[0]?.title}"</strong>?</>}
          </p>
          {isBulk && (
            <div className="ppm-bulk-list">
              {items.map((p) => (
                <p key={p.id} className="ppm-bulk-item">• {p.title || p.proposal_id}</p>
              ))}
            </div>
          )}
          <div className="ppm-modal-footer">
            <button className="fac-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="ppm-delete-btn" onClick={onConfirm} disabled={deleting}>
              <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ScheduleModal ────────────────────────────────────────────────────────────

function ScheduleModal({ proposal, evaluatorList, onClose, onSave, saving }) {
  const [defenseDate,    setDefenseDate]    = useState(proposal.defense_date  || "");
  const [defenseTime,    setDefenseTime]    = useState(proposal.defense_time  || "");
  const [defenseVenue,   setDefenseVenue]   = useState(proposal.venue         || "");
  const [selectedEvalIds, setSelectedEvalIds] = useState(
    normalizeEvaluatorIds(proposal.evaluator_ids || []).slice(0, 3)
  );

  useEffect(() => {
    setDefenseDate(proposal.defense_date  || "");
    setDefenseTime(proposal.defense_time  || "");
    setDefenseVenue(proposal.venue        || "");
    setSelectedEvalIds(normalizeEvaluatorIds(proposal.evaluator_ids || []).slice(0, 3));
  }, [proposal]);

  const toggleEval = (id) => {
    const nid = Number(id);
    setSelectedEvalIds((prev) => {
      if (prev.includes(nid)) return prev.filter((x) => x !== nid);
      if (prev.length >= 3) return prev;
      return [...prev, nid];
    });
  };

  const selectedEvaluatorObjects = evaluatorList.filter((ev) => selectedEvalIds.includes(Number(ev.id)));
  const canSave = defenseDate && defenseTime && defenseVenue && selectedEvalIds.length === 3 && !saving;

  return (
    <div className="ppm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ppm-modal">
        <div className="ppm-modal-header">
          <div style={{ minWidth: 0 }}>
            <p className="ppm-modal-ref">{proposal.proposal_id}</p>
            <h2 className="ppm-modal-title">Schedule Defense & Assign Evaluators</h2>
          </div>
          <button className="ppm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ppm-modal-body">
          {/* Proposal info box */}
          <div className="ppm-proposal-box">
            <p className="ppm-proposal-title">{proposal.title}</p>
            <p className="ppm-proposal-meta">{proposal.researcher} · {proposal.department}</p>
            <p className="ppm-proposal-meta">Budget: {fmtBudget(proposal.budget)}</p>
          </div>

          {/* Schedule */}
          <div style={{ marginBottom: 20 }}>
            <p className="ppm-section-label">
              <Calendar size={14} style={{ marginRight: 6 }} /> Defense Schedule
            </p>
            <div className="ppm-schedule-grid">
              <div className="ppm-field">
                <label className="ppm-field-label">Date <span style={{ color: "#dc2626" }}>*</span></label>
                <input className="ppm-input" type="date" value={defenseDate} onChange={(e) => setDefenseDate(e.target.value)} />
              </div>
              <div className="ppm-field">
                <label className="ppm-field-label">Time <span style={{ color: "#dc2626" }}>*</span></label>
                <input className="ppm-input" type="time" value={defenseTime} onChange={(e) => setDefenseTime(e.target.value)} />
              </div>
              <div className="ppm-field ppm-field-full">
                <label className="ppm-field-label">Venue <span style={{ color: "#dc2626" }}>*</span></label>
                <input className="ppm-input" placeholder="e.g. Conference Room A"
                  value={defenseVenue} onChange={(e) => setDefenseVenue(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Evaluators */}
          <div style={{ marginBottom: 20 }}>
            <div className="ppm-eval-header">
              <p className="ppm-section-label">
                <Users size={14} style={{ marginRight: 6 }} /> Assigned Evaluators
              </p>
              <span className={`ppm-eval-count ${selectedEvalIds.length === 3 ? "ppm-eval-count-ok" : "ppm-eval-count-warn"}`}>
                {selectedEvalIds.length}/3 selected
              </span>
            </div>

            <div className="ppm-eval-notice">
              The researcher's 3 randomly assigned evaluators are already selected here. Admin can
              remove and replace evaluators, but only 3 evaluators can be assigned.
            </div>

            {selectedEvaluatorObjects.length > 0 && (
              <div className="ppm-eval-tags">
                {selectedEvaluatorObjects.map((ev) => (
                  <span key={ev.id} className="ppm-eval-tag">
                    {ev.name}
                    <button type="button" onClick={() => toggleEval(ev.id)} className="ppm-eval-tag-remove">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {evaluatorList.length === 0 ? (
              <div className="ppm-eval-empty">No evaluators available.</div>
            ) : (
              <div className="ppm-eval-list">
                {evaluatorList.map((ev) => {
                  const evId    = Number(ev.id);
                  const checked  = selectedEvalIds.includes(evId);
                  const disabled = !checked && selectedEvalIds.length >= 3;
                  return (
                    <div key={ev.id}
                      className={`ppm-eval-row ${checked ? "ppm-eval-row-checked" : ""} ${disabled ? "ppm-eval-row-disabled" : ""}`}
                      onClick={() => { if (!disabled) toggleEval(evId); }}>
                      <div className="ppm-eval-row-left">
                        <div className="ppm-eval-avatar" style={{
                          background: checked ? "#16a34a" : "#f3f4f6",
                          color: checked ? "#fff" : "#6b7280",
                        }}>
                          {ev.name?.charAt(0) || "E"}
                        </div>
                        <div>
                          <p className="ppm-eval-name">{ev.name}</p>
                          <p className="ppm-eval-meta">{ev.expertise || "No expertise"} · {ev.position || "Evaluator"}</p>
                        </div>
                      </div>
                      <div className="ppm-eval-checkbox" style={{
                        borderColor: checked ? "#16a34a" : "#d1d5db",
                        background:  checked ? "#16a34a" : "#fff",
                      }}>
                        {checked && <CheckCircle2 size={13} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ppm-modal-footer">
            <button className="fac-cancel-btn" onClick={onClose}>Cancel</button>
            <button className="ppm-save-btn" disabled={!canSave}
              onClick={() => onSave({ defense_date: defenseDate, defense_time: defenseTime, venue: defenseVenue, evaluator_ids: selectedEvalIds.slice(0, 3) })}>
              {saving ? "Saving…" : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ViewModal ────────────────────────────────────────────────────────────────

function ViewModal({ proposal, onClose }) {
  const sb = STATUS_MAP[proposal.status] || STATUS_MAP.Pending;
  const [projectDocs,   setProjectDocs]   = useState(null);
  const [previewDoc,    setPreviewDoc]    = useState(null);
  const [workPlanItems, setWorkPlanItems] = useState(null);

  useEffect(() => {
    if (!proposal?.id) return;
    api.get(`/projects/${proposal.id}`).then((res) => {
      const p = res.data || {};
      const STORAGE = import.meta.env.VITE_STORAGE_URL || "http://127.0.0.1:8000/storage";
      const toUrl = (path) => path ? `${STORAGE}/${path}` : null;

      let cvPaths = [];
      try {
        let raw = p.cv_paths;
        while (typeof raw === "string") raw = JSON.parse(raw);
        cvPaths = Array.isArray(raw) ? raw : raw ? [raw] : [];
      } catch { cvPaths = Array.isArray(p.cv_paths) ? p.cv_paths : (p.cv_paths ? [p.cv_paths] : []); }

      const docs = [
        { label: "Proposal Form", url: toUrl(p.proposal_form_path || p.proposal_form) },
        ...cvPaths.map((path, i) => ({ label: `CV (${i + 1})`, url: toUrl(path) })),
        { label: "Work Plan",  url: toUrl(p.work_plan_path  || p.work_plan_file) },
        { label: "Framework",  url: toUrl(p.framework_path  || p.framework_file) },
        { label: "References", url: toUrl(p.references_path || p.references_file) },
      ].filter((d) => d.url);
      setProjectDocs(docs);
    }).catch(() => setProjectDocs([]));

    api.get(`/projects/${proposal.id}/work-plan`)
      .then((res) => setWorkPlanItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setWorkPlanItems([]));
  }, [proposal?.id]);

  const infoRows = [
    ["Researcher",   proposal.researcher],
    ["Department",   proposal.department],
    ["Budget",       proposal.budget || "—"],
    ["Funding",      proposal.funding_type === "external" ? `External (${proposal.funding_agency || "—"})` : "Local"],
    ["Submitted",    proposal.submitted_date],
    ["Defense Date", proposal.defense_date || "Not scheduled"],
    ["Defense Time", proposal.defense_time || "Not set"],
    ["Venue",        proposal.venue        || "Not set"],
  ];

  return (
    <>
      <div className="ppm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="ppm-modal ppm-modal-lg">
          <div className="ppm-modal-header">
            <div style={{ minWidth: 0 }}>
              <p className="ppm-modal-ref">{proposal.proposal_id}</p>
              <h2 className="ppm-modal-title">{proposal.title}</h2>
            </div>
            <button className="ppm-modal-close" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="ppm-modal-body">
            <span className="adm-status-pill" style={{
              background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`, marginBottom: 16, display: "inline-block",
            }}>
              {proposal.status}
            </span>

            <div className="ppm-info-grid">
              {infoRows.map(([label, value]) => (
                <div key={label}>
                  <p className="ppm-info-label">{label}</p>
                  <p className="ppm-info-value">{value || "N/A"}</p>
                </div>
              ))}
            </div>

            {proposal.evaluators?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p className="ppm-info-label">Assigned Evaluators</p>
                <div className="ppm-evaluator-tags">
                  {proposal.evaluators.map((ev, i) => (
                    <span key={i} className="ppm-evaluator-tag">{ev}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            <div style={{ marginBottom: 16 }}>
              <p className="ppm-info-label">📎 Uploaded Documents</p>
              {projectDocs === null ? (
                <p className="ppm-doc-msg">Loading documents...</p>
              ) : projectDocs.length === 0 ? (
                <p className="ppm-doc-msg ppm-doc-msg-italic">No documents uploaded yet.</p>
              ) : (
                <div className="ppm-doc-list">
                  {projectDocs.map((doc) => (
                    <div key={doc.label} className="ppm-doc-row">
                      <FileText size={14} color="#1d4ed8" />
                      <span className="ppm-doc-label">{doc.label}</span>
                      <button type="button" className="ppm-doc-view-btn"
                        onClick={() => setPreviewDoc(doc)}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#dbeafe"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#eff6ff"}>
                        <Eye size={13} /> View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Gantt */}
            <div>
              <p className="ppm-info-label">📋 Work Plan — Gantt Chart</p>
              {workPlanItems === null ? (
                <p className="ppm-doc-msg">Loading work plan...</p>
              ) : workPlanItems.length === 0 ? (
                <p className="ppm-doc-msg ppm-doc-msg-italic">No Gantt activities added yet.</p>
              ) : (
                <div className="ppm-gantt-wrap">
                  <table className="ppm-gantt-table">
                    <thead>
                      <tr className="ppm-gantt-head">
                        <th className="ppm-gantt-th ppm-gantt-th-activity">Activity</th>
                        <th className="ppm-gantt-th ppm-gantt-th-milestone">Milestone</th>
                        {WP_MONTH_LABELS.map((m) => (
                          <th key={m} className="ppm-gantt-th ppm-gantt-th-month">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {workPlanItems.map((item, i) => (
                        <tr key={item.id} className="ppm-gantt-row" style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td className="ppm-gantt-td-activity">
                            {item.title}
                            {item.description && <p className="ppm-gantt-desc">{item.description}</p>}
                          </td>
                          <td className="ppm-gantt-td-milestone">{item.milestone || "—"}</td>
                          {WP_MONTHS.map((m) => (
                            <td key={m} className="ppm-gantt-td-month">
                              {item[m] ? (
                                <div className="ppm-gantt-check">
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff"
                                    strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="ppm-gantt-empty" />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document preview popup */}
      {previewDoc && (
        <div className="ppm-preview-overlay"
          onClick={(e) => e.target === e.currentTarget && setPreviewDoc(null)}>
          <div className="ppm-preview-modal">
            <div className="ppm-preview-header">
              <div className="ppm-preview-title">
                <FileText size={16} color="#1d4ed8" />
                <span>{previewDoc.label}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <a href={previewDoc.url} target="_blank" rel="noopener noreferrer" className="ppm-preview-open">
                  Open in new tab
                </a>
                <button type="button" className="ppm-preview-close" onClick={() => setPreviewDoc(null)}>×</button>
              </div>
            </div>
            <div className="ppm-preview-body">
              {/\.(png|jpg|jpeg|gif|webp)$/i.test(previewDoc.url) ? (
                <div className="ppm-preview-img-wrap">
                  <img src={previewDoc.url} alt={previewDoc.label} className="ppm-preview-img" />
                </div>
              ) : (
                <iframe src={previewDoc.url} title={previewDoc.label} className="ppm-preview-iframe" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ProposalManagement() {
  const [proposals, setProposals]       = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [evaluators, setEvaluators]     = useState([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading]           = useState(true);
  const [scheduling, setScheduling]     = useState(null);
  const [viewing, setViewing]           = useState(null);
  const [saving, setSaving]             = useState(false);
  const [success, setSuccess]           = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);
  const [selected, setSelected]         = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const [pRes, eRes] = await Promise.all([
        api.get("/admin/proposals").catch(() => ({ data: [] })),
        api.get("/admin/evaluators").catch(() => ({ data: [] })),
      ]);
      const evaluatorPool = Array.isArray(eRes.data) ? eRes.data : [];
      const data = Array.isArray(pRes.data)
        ? pRes.data.map((p) => {
            const op = p.oral_presentation || p.oralPresentation || null;
            const scheduledEvalIds = Array.isArray(op?.evaluators)
              ? op.evaluators.map((ev) => Number(ev.id)) : [];
            const preferredEvalIds = normalizeEvaluatorIds(
              p.proposal?.preferred_evaluators || p.preferred_evaluators ||
              p.preferred_evaluator_ids || p.evaluator_ids || []
            );
            const evaluatorIds = scheduledEvalIds.length > 0
              ? scheduledEvalIds.slice(0, 3) : preferredEvalIds.slice(0, 3);
            const evaluatorNames = scheduledEvalIds.length > 0
              ? getEvaluatorNames(p).slice(0, 3)
              : evaluatorPool.filter((ev) => evaluatorIds.includes(Number(ev.id))).map((ev) => ev.name).slice(0, 3);
            return {
              ...p,
              proposal_id:    p.reference_no || p.project_id || `PRJ-${p.id}`,
              researcher:     p.creator?.name || p.researcher || "—",
              department:     p.department_center?.name || p.department || p.creator?.department || "—",
              budget:         p.budget || p.total_budget || "—",
              submitted_date: formatDate(p.submitted_at || p.created_at),
              defense_date:   p.defense_date  || op?.presentation_date || "",
              defense_time:   p.defense_time  || op?.presentation_time || "",
              venue:          p.venue         || op?.venue              || "",
              evaluators:     evaluatorNames,
              evaluator_ids:  evaluatorIds,
              status:         normalizeStatus(p.status),
            };
          })
        : [];
      setProposals(data);
      setFiltered(data);
      setEvaluators(evaluatorPool);
    } catch {
      setProposals([]); setFiltered([]); setEvaluators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProposals(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(proposals.filter((p) =>
      (statusFilter === "All" || p.status === statusFilter) &&
      [p.title, p.researcher, p.department, p.proposal_id]
        .some((v) => String(v || "").toLowerCase().includes(q))
    ));
    setSelected(new Set());
  }, [search, statusFilter, proposals]);

  const allSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const toggleAll   = () => setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));
  const toggleOne   = (id) => setSelected((prev) => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const handleSave = async ({ defense_date, defense_time, venue, evaluator_ids }) => {
    setSaving(true);
    const finalIds = evaluator_ids.slice(0, 3);
    try {
      await api.post("/admin/schedule", {
        research_project_id: scheduling.id,
        presentation_date: defense_date,
        presentation_time: defense_time,
        venue, evaluator_ids: finalIds,
      });
      const names = evaluators.filter((ev) => finalIds.includes(Number(ev.id))).map((ev) => ev.name);
      setProposals((prev) => prev.map((p) => p.id === scheduling.id
        ? { ...p, defense_date, defense_time, venue, evaluator_ids: finalIds, evaluators: names, status: "Scheduled" }
        : p));
      showSuccess("Defense scheduled and evaluators assigned successfully!");
      setScheduling(null);
      fetchProposals();
    } catch (err) {
      showSuccess(err.response?.data?.message || "Unable to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await Promise.all(deleteTarget.map((p) => api.delete(`/admin/proposals/${p.id}`)));
      setProposals((prev) => prev.filter((p) => !deleteTarget.some((d) => d.id === p.id)));
      setSelected(new Set());
      setDeleteTarget(null);
      showSuccess(`${deleteTarget.length} proposal${deleteTarget.length > 1 ? "s" : ""} deleted.`);
    } catch (err) {
      showSuccess(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleting(false);
    }
  };

  const statuses = ["All","Pending","Scheduled","Under Evaluation"];
  const counts = {
    Pending:          proposals.filter((p) => p.status === "Pending").length,
    Scheduled:        proposals.filter((p) => p.status === "Scheduled").length,
    "Under Evaluation": proposals.filter((p) => p.status === "Under Evaluation").length,
  };
  const isError = (msg) => msg.includes("Unable") || msg.includes("Failed");

  return (
    <div className="adm-page">
      <AdminNavbar onWidthChange={setSidebarWidth} />

      <div className="adm-main" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar title="Proposal Management" />

        <div className="adm-content">
          <div style={{ marginBottom: 24 }}>
            <h3 className="ppm-page-sub">
              Schedule defense dates and assign evaluators to submitted proposals
            </h3>
          </div>

          {/* Toast */}
          {success && (
            <div className={`proj-toast ${isError(success) ? "proj-toast-error" : "proj-toast-success"}`}>
              <CheckCircle2 size={16} /> {success}
            </div>
          )}

          {/* Stat cards */}
          <div className="ppm-stats">
            {[
              { label: "Pending",          count: counts.Pending,            bg: "#fff7ed", border: "#fed7aa", color: "#c2410c", icon: Clock },
              { label: "Scheduled",        count: counts.Scheduled,          bg: "#dbeafe", border: "#bfdbfe", color: "#1d4ed8", icon: Calendar },
              { label: "Under Evaluation", count: counts["Under Evaluation"], bg: "#f5f3ff", border: "#ddd6fe", color: "#6d28d9", icon: ClipboardList },
            ].map(({ label, count, bg, border, color, icon: Icon }) => (
              <div key={label}
                className={`ppm-stat-card ${statusFilter === label ? "ppm-stat-card-active" : ""}`}
                style={statusFilter === label ? { background: bg, border: `1px solid ${border}` } : {}}
                onClick={() => setStatusFilter(statusFilter === label ? "All" : label)}>
                <div className="ppm-stat-icon" style={{ background: bg, border: `1px solid ${border}` }}>
                  <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="ppm-stat-value">{count}</p>
                  <p className="ppm-stat-label">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search + filter row */}
          <div className="ppm-filter-row">
            <div className="ppm-search-box">
              <Search size={18} color="#9ca3af" strokeWidth={1.8} />
              <input className="ppm-search-input" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, researcher, or department…" />
            </div>
            <div className="ppm-filter-btns">
              {statuses.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`ppm-filter-btn ${statusFilter === s ? "active" : ""}`}>
                  {s}
                </button>
              ))}
            </div>
            {selected.size > 0 && (
              <button className="ppm-bulk-delete-btn"
                onClick={() => setDeleteTarget(filtered.filter((p) => selected.has(p.id)))}>
                <Trash2 size={16} /> Delete ({selected.size})
              </button>
            )}
          </div>

          {/* Table card */}
          <div className="ppm-table-card">
            <div className="ppm-table-card-header">
              <div className="ppm-table-title">
                <FileText size={18} color="#f59e0b" />
                <h3>Proposals ({filtered.length})</h3>
              </div>
              {selected.size > 0 && (
                <span className="ppm-selected-count">{selected.size} selected</span>
              )}
            </div>

            {loading ? (
              <p className="adm-loading">Loading…</p>
            ) : filtered.length === 0 ? (
              <div className="ppm-empty">
                <FileText size={40} color="#d1d5db" style={{ margin: "0 auto 10px", display: "block" }} />
                <p>No proposals found.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="ppm-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        <input type="checkbox" checked={allSelected} onChange={toggleAll}
                          className="ppm-checkbox" />
                      </th>
                      {["ID","Title","Researcher","Department","Defense Date","Evaluators","Status","Actions"]
                        .map((h) => <th key={h}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const sb    = STATUS_MAP[p.status] || STATUS_MAP.Pending;
                      const isSel = selected.has(p.id);
                      return (
                        <tr key={p.id} style={{ background: isSel ? "#fff7ed" : undefined }}>
                          <td>
                            <input type="checkbox" checked={isSel} onChange={() => toggleOne(p.id)}
                              className="ppm-checkbox" />
                          </td>
                          <td style={{ fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{p.proposal_id}</td>
                          <td style={{ maxWidth: 200 }}>
                            <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>{p.title}</p>
                          </td>
                          <td style={{ whiteSpace: "nowrap" }}>{p.researcher}</td>
                          <td>{p.department}</td>
                          <td style={{ whiteSpace: "nowrap" }}>
                            {fmtDefenseDate(p.defense_date) ? (
                              <span className="ppm-defense-date">
                                <Calendar size={12} />{fmtDefenseDate(p.defense_date)}
                              </span>
                            ) : (
                              <span className="ppm-not-set">Not set</span>
                            )}
                          </td>
                          <td>
                            {p.evaluators?.length > 0 ? (
                              <div className="ppm-eval-badges">
                                {p.evaluators.map((ev, i) => (
                                  <span key={i} className="ppm-eval-badge">{ev}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="ppm-not-set">None</span>
                            )}
                          </td>
                          <td>
                            <span className="adm-status-pill" style={{
                              background: sb.bg, color: sb.color, border: `1px solid ${sb.border}`,
                            }}>
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <div className="ppm-action-btns">
                              <button className="proj-view-btn" onClick={() => setViewing(p)}>
                                <Eye size={13} /> View
                              </button>
                              <button className="ppm-schedule-btn" onClick={() => setScheduling(p)}>
                                <Calendar size={13} /> Schedule
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {scheduling  && <ScheduleModal proposal={scheduling} evaluatorList={evaluators} onClose={() => setScheduling(null)} onSave={handleSave} saving={saving} />}
      {viewing     && <ViewModal proposal={viewing} onClose={() => setViewing(null)} />}
      {deleteTarget && <DeleteConfirmModal items={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} deleting={deleting} />}
    </div>
  );
}