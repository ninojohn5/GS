import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  Search,
  FileText,
  Calendar,
  Users,
  X,
  CheckCircle2,
  Clock,
  Eye,
  ClipboardList,
  Trash2,
} from "lucide-react";

const STATUS_MAP = {
  Pending: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Presentation Scheduled": {
    bg: "#dbeafe",
    color: "#1d4ed8",
    border: "#bfdbfe",
  },
  "Under Evaluation": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const normalizeStatus = (s) => {
  if (s === "Submitted") return "Pending";
  if (s === "Presentation Scheduled") return "Scheduled";
  return s || "Pending";
};

const formatDate = (d) => {
  if (!d) return "—";

  try {
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const fmtDefenseDate = (d) => {
  if (!d) return null;

  try {
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const getEvaluatorNames = (p) => {
  const op = p.oral_presentation || p.oralPresentation || null;

  if (Array.isArray(p.evaluators)) {
    return p.evaluators.map((ev) => (typeof ev === "string" ? ev : ev.name));
  }

  if (Array.isArray(op?.evaluators)) {
    return op.evaluators.map((ev) => ev.name);
  }

  return [];
};

const normalizeEvaluatorIds = (value) => {
  if (!value) return [];

  let parsed = value;

  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return Number(item.id || item.personnel_id || item.evaluator_id);
      }

      return Number(item);
    })
    .filter((id) => Number.isFinite(id));
};

const MO = {
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
    maxWidth: 600,
    maxHeight: "90vh",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "18px 22px 14px",
    borderBottom: "1px solid #f1f5f9",
    gap: 12,
  },
  title: {
    margin: "4px 0 0",
    fontSize: 16,
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
    flexShrink: 0,
  },
  body: {
    overflowY: "auto",
    padding: "20px 22px 22px",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#374151",
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

function DeleteConfirmModal({ items, onClose, onConfirm, deleting }) {
  const isBulk = items.length > 1;

  return (
    <div
      style={MO.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ ...MO.modal, maxWidth: 440 }}>
        <div style={MO.header}>
          <div>
            <h2 style={{ ...MO.title, color: "#dc2626" }}>
              Delete {isBulk ? `${items.length} Proposals` : "Proposal"}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
              This action cannot be undone.
            </p>
          </div>

          <button style={MO.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={MO.body}>
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151" }}>
            {isBulk ? (
              <>
                Are you sure you want to delete{" "}
                <strong>{items.length} proposals</strong>?
              </>
            ) : (
              <>
                Are you sure you want to delete{" "}
                <strong>"{items[0]?.title}"</strong>?
              </>
            )}
          </p>

          {isBulk && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
                maxHeight: 140,
                overflowY: "auto",
              }}
            >
              {items.map((p) => (
                <p
                  key={p.id}
                  style={{ margin: "2px 0", fontSize: 13, color: "#dc2626" }}
                >
                  • {p.title || p.proposal_id}
                </p>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={MO.cancelBtn} onClick={onClose}>
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={deleting}
              style={{
                ...MO.saveBtn,
                background: "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Trash2 size={15} /> {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleModal({ proposal, evaluatorList, onClose, onSave, saving }) {
  const [defenseDate, setDefenseDate] = useState(proposal.defense_date || "");
  const [defenseTime, setDefenseTime] = useState(proposal.defense_time || "");
  const [defenseVenue, setDefenseVenue] = useState(proposal.venue || "");
  const [selectedEvalIds, setSelectedEvalIds] = useState(
    normalizeEvaluatorIds(proposal.evaluator_ids || []).slice(0, 3)
  );

  useEffect(() => {
    setDefenseDate(proposal.defense_date || "");
    setDefenseTime(proposal.defense_time || "");
    setDefenseVenue(proposal.venue || "");
    setSelectedEvalIds(
      normalizeEvaluatorIds(proposal.evaluator_ids || []).slice(0, 3)
    );
  }, [proposal]);

  const toggleEval = (id) => {
    const numericId = Number(id);

    setSelectedEvalIds((prev) => {
      if (prev.includes(numericId)) {
        return prev.filter((x) => x !== numericId);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, numericId];
    });
  };

  const selectedEvaluatorObjects = evaluatorList.filter((ev) =>
    selectedEvalIds.includes(Number(ev.id))
  );

  const canSave =
    defenseDate &&
    defenseTime &&
    defenseVenue &&
    selectedEvalIds.length === 3 &&
    !saving;

  return (
    <div
      style={MO.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={MO.modal}>
        <div style={MO.header}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              {proposal.proposal_id}
            </p>
            <h2 style={MO.title}>Schedule Defense & Assign Evaluators</h2>
          </div>

          <button style={MO.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={MO.body}>
          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {proposal.title}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              {proposal.researcher} · {proposal.department}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
              Budget: ₱{Number(proposal.budget || 0).toLocaleString()}
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 13,
                fontWeight: 700,
                color: "#374151",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Calendar size={14} style={{ marginRight: 6 }} />
              Defense Schedule
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px 16px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={MO.label}>
                  Date <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  style={MO.input}
                  type="date"
                  value={defenseDate}
                  onChange={(e) => setDefenseDate(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={MO.label}>
                  Time <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  style={MO.input}
                  type="time"
                  value={defenseTime}
                  onChange={(e) => setDefenseTime(e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  gridColumn: "1 / -1",
                }}
              >
                <label style={MO.label}>
                  Venue <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  style={MO.input}
                  placeholder="e.g. Conference Room A"
                  value={defenseVenue}
                  onChange={(e) => setDefenseVenue(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Users size={14} style={{ marginRight: 6 }} />
                Assigned Evaluators
              </p>

              <span
                style={{
                  fontSize: 12,
                  color: selectedEvalIds.length === 3 ? "#15803d" : "#c2410c",
                  fontWeight: 600,
                }}
              >
                {selectedEvalIds.length}/3 selected
              </span>
            </div>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 12,
                fontSize: 12,
                color: "#1d4ed8",
                lineHeight: 1.5,
              }}
            >
              The researcher’s 3 randomly assigned evaluators are already
              selected here. Admin can remove and replace evaluators, but only 3
              evaluators can be assigned.
            </div>

            {selectedEvaluatorObjects.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {selectedEvaluatorObjects.map((ev) => (
                  <span
                    key={ev.id}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "#f0fdf4",
                      color: "#15803d",
                      border: "1px solid #bbf7d0",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {ev.name}

                    <button
                      type="button"
                      onClick={() => toggleEval(ev.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#15803d",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                      }}
                      title="Remove evaluator"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {evaluatorList.length === 0 ? (
              <div
                style={{
                  padding: "20px",
                  border: "1px dashed #d1d5db",
                  borderRadius: 10,
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                No evaluators available.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {evaluatorList.map((ev) => {
                  const evId = Number(ev.id);
                  const checked = selectedEvalIds.includes(evId);
                  const disabled = !checked && selectedEvalIds.length >= 3;

                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        if (disabled) return;
                        toggleEval(evId);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 10,
                        cursor: disabled ? "not-allowed" : "pointer",
                        border: `1.5px solid ${
                          checked ? "#16a34a" : "#e5e7eb"
                        }`,
                        background: checked ? "#f0fdf4" : "#fff",
                        opacity: disabled ? 0.5 : 1,
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: checked ? "#16a34a" : "#f3f4f6",
                            color: checked ? "#fff" : "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {ev.name?.charAt(0) || "E"}
                        </div>

                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {ev.name}
                          </p>
                          <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>
                            {ev.expertise || "No expertise"} ·{" "}
                            {ev.position || "Evaluator"}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 6,
                          border: `2px solid ${checked ? "#16a34a" : "#d1d5db"}`,
                          background: checked ? "#16a34a" : "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {checked && <CheckCircle2 size={13} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button style={MO.cancelBtn} onClick={onClose}>
              Cancel
            </button>

            <button
              style={{
                ...MO.saveBtn,
                opacity: canSave ? 1 : 0.5,
              }}
              disabled={!canSave}
              onClick={() =>
                onSave({
                  defense_date: defenseDate,
                  defense_time: defenseTime,
                  venue: defenseVenue,
                  evaluator_ids: selectedEvalIds.slice(0, 3),
                })
              }
            >
              {saving ? "Saving…" : "Save Schedule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewModal({ proposal, onClose }) {
  const sb = STATUS_MAP[proposal.status] || STATUS_MAP.Pending;
  const [projectDocs, setProjectDocs] = useState(null);

  useEffect(() => {
    if (!proposal?.id) return;
    api.get(`/projects/${proposal.id}`).then((res) => {
      const p = res.data || {};
      const base = window.location.origin;
      const toUrl = (path) => path ? `${base}/storage/${path}` : null;
      const cvPaths = Array.isArray(p.cv_paths) ? p.cv_paths : (p.cv_paths ? [p.cv_paths] : []);
      const docs = [
        { label: "Proposal Form", url: toUrl(p.proposal_form_path || p.proposal_form) },
        ...cvPaths.map((path, i) => ({ label: `CV (${i + 1})`, url: toUrl(path) })),
        { label: "Work Plan",     url: toUrl(p.work_plan_path || p.work_plan_file) },
        { label: "Framework",     url: toUrl(p.framework_path || p.framework_file) },
        { label: "References",    url: toUrl(p.references_path || p.references_file) },
      ].filter((d) => d.url);
      setProjectDocs(docs);
    }).catch(() => setProjectDocs([]));
  }, [proposal?.id]);

  return (
    <div
      style={MO.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ ...MO.modal, maxWidth: 520 }}>
        <div style={MO.header}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              {proposal.proposal_id}
            </p>
            <h2 style={MO.title}>{proposal.title}</h2>
          </div>

          <button style={MO.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={MO.body}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              background: sb.bg,
              color: sb.color,
              border: `1px solid ${sb.border}`,
              marginBottom: 16,
            }}
          >
            {proposal.status}
          </span>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px 20px",
              marginBottom: 16,
            }}
          >
            {[
              ["Researcher", proposal.researcher],
              ["Department", proposal.department],
              ["Budget", proposal.budget || "—"],
              ["Funding", proposal.funding_type === "external" ? `External (${proposal.funding_agency || "—"})` : "Local"],
              ["Submitted", proposal.submitted_date],
              ["Defense Date", proposal.defense_date || "Not scheduled"],
              ["Defense Time", proposal.defense_time || "Not set"],
              ["Venue", proposal.venue || "Not set"],
            ].map(([label, value]) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {label}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 600, color: "#111827" }}>
                  {value || "N/A"}
                </p>
              </div>
            ))}
          </div>

          {proposal.evaluators?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Assigned Evaluators
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {proposal.evaluators.map((ev, i) => (
                  <span key={i} style={{ padding: "4px 12px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontSize: 13, fontWeight: 500 }}>
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents section */}
          <div>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              📎 Uploaded Documents
            </p>
            {projectDocs === null ? (
              <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading documents...</p>
            ) : projectDocs.length === 0 ? (
              <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>No documents uploaded yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {projectDocs.map((doc) => (
                  <a key={doc.label} href={doc.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#1d4ed8", fontSize: 13, fontWeight: 500, textDecoration: "none" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#f9fafb"}
                  >
                    <FileText size={14} color="#1d4ed8" />
                    {doc.label}
                    <Eye size={13} style={{ marginLeft: "auto", color: "#6b7280" }} />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProposalManagement() {
  const [proposals, setProposals] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [evaluators, setEvaluators] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

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

            const scheduledEvaluatorIds = Array.isArray(op?.evaluators)
              ? op.evaluators.map((ev) => Number(ev.id))
              : [];

            const preferredEvaluatorIds = normalizeEvaluatorIds(
              p.proposal?.preferred_evaluators ||
                p.preferred_evaluators ||
                p.preferred_evaluator_ids ||
                p.evaluator_ids ||
                []
            );

            const evaluatorIds =
              scheduledEvaluatorIds.length > 0
                ? scheduledEvaluatorIds.slice(0, 3)
                : preferredEvaluatorIds.slice(0, 3);

            const evaluatorNames =
              scheduledEvaluatorIds.length > 0
                ? getEvaluatorNames(p).slice(0, 3)
                : evaluatorPool
                    .filter((ev) => evaluatorIds.includes(Number(ev.id)))
                    .map((ev) => ev.name)
                    .slice(0, 3);

            return {
              ...p,
              proposal_id: p.reference_no || p.project_id || `PRJ-${p.id}`,
              researcher: p.creator?.name || p.researcher || "—",
              department:
                p.department_center?.name ||
                p.department ||
                p.creator?.department ||
                "—",
              budget: p.budget || p.total_budget || 0,
              submitted_date: formatDate(p.submitted_at || p.created_at),
              defense_date: p.defense_date || op?.presentation_date || "",
              defense_time: p.defense_time || op?.presentation_time || "",
              venue: p.venue || op?.venue || "",
              evaluators: evaluatorNames,
              evaluator_ids: evaluatorIds,
              status: normalizeStatus(p.status),
            };
          })
        : [];

      setProposals(data);
      setFiltered(data);
      setEvaluators(evaluatorPool);
    } catch {
      setProposals([]);
      setFiltered([]);
      setEvaluators([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    setFiltered(
      proposals.filter(
        (p) =>
          (statusFilter === "All" || p.status === statusFilter) &&
          (p.title?.toLowerCase().includes(q) ||
            p.researcher?.toLowerCase().includes(q) ||
            p.department?.toLowerCase().includes(q) ||
            p.proposal_id?.toLowerCase().includes(q))
      )
    );

    setSelected(new Set());
  }, [search, statusFilter, proposals]);

  const allSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((p) => p.id)));

  const toggleOne = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);

      n.has(id) ? n.delete(id) : n.add(id);

      return n;
    });

  const handleSave = async ({
    defense_date,
    defense_time,
    venue,
    evaluator_ids,
  }) => {
    setSaving(true);
    setSuccess("");

    const finalEvaluatorIds = evaluator_ids.slice(0, 3);

    try {
      await api.post("/admin/schedule", {
        research_project_id: scheduling.id,
        presentation_date: defense_date,
        presentation_time: defense_time,
        venue,
        evaluator_ids: finalEvaluatorIds,
      });

      const names = evaluators
        .filter((ev) => finalEvaluatorIds.includes(Number(ev.id)))
        .map((ev) => ev.name);

      setProposals((prev) =>
        prev.map((p) =>
          p.id === scheduling.id
            ? {
                ...p,
                defense_date,
                defense_time,
                venue,
                evaluator_ids: finalEvaluatorIds,
                evaluators: names,
                status: "Scheduled",
              }
            : p
        )
      );

      setSuccess("Defense scheduled and evaluators assigned successfully!");
      setScheduling(null);
      setTimeout(() => setSuccess(""), 4000);
      fetchProposals();
    } catch (err) {
      setSuccess(err.response?.data?.message || "Unable to save.");
      setTimeout(() => setSuccess(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      await Promise.all(
        deleteTarget.map((p) => api.delete(`/admin/proposals/${p.id}`))
      );

      setProposals((prev) =>
        prev.filter((p) => !deleteTarget.some((d) => d.id === p.id))
      );

      setSelected(new Set());
      setDeleteTarget(null);

      setSuccess(
        `${deleteTarget.length} proposal${
          deleteTarget.length > 1 ? "s" : ""
        } deleted.`
      );
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setSuccess(err.response?.data?.message || "Failed to delete.");
      setTimeout(() => setSuccess(""), 4000);
    } finally {
      setDeleting(false);
    }
  };

  const ml = isMobile ? 0 : sidebarWidth;
  const statuses = ["All", "Pending", "Scheduled", "Under Evaluation"];

  const counts = {
    Pending: proposals.filter((p) => p.status === "Pending").length,
    Scheduled: proposals.filter((p) => p.status === "Scheduled").length,
    "Under Evaluation": proposals.filter((p) => p.status === "Under Evaluation")
      .length,
  };

  return (
    <>
      <style>{`
        .ppm-table { width:100%; border-collapse:collapse; }
        .ppm-table th { padding:10px 12px; text-align:center; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; border-bottom:2px solid #e5e7eb; white-space:nowrap; background:#f9fafb; }
        .ppm-table td { padding:11px 12px; font-size:13px; color:#374151; border-bottom:1px solid #f1f5f9; vertical-align:middle; text-align:center; }
        .ppm-table tr:last-child td { border-bottom:none; }
        .ppm-table tr:hover td { background:#fafafa; }
        .ppm-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
        @media(max-width:600px){ .ppm-stats { grid-template-columns:1fr; } }
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
          <Topbar title="Proposal Management" />

          <div style={{ padding: "24px", flex: 1 }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                Schedule defense dates and assign evaluators to submitted proposals
              </h3>
            </div>

            {success && (
              <div
                style={{
                  background:
                    success.includes("Unable") || success.includes("Failed")
                      ? "#fef2f2"
                      : "#dcfce7",
                  color:
                    success.includes("Unable") || success.includes("Failed")
                      ? "#dc2626"
                      : "#15803d",
                  padding: "12px 16px",
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <div className="ppm-stats">
              {[
                {
                  label: "Pending",
                  count: counts.Pending,
                  bg: "#fff7ed",
                  border: "#fed7aa",
                  color: "#c2410c",
                  icon: Clock,
                },
                {
                  label: "Scheduled",
                  count: counts.Scheduled,
                  bg: "#dbeafe",
                  border: "#bfdbfe",
                  color: "#1d4ed8",
                  icon: Calendar,
                },
                {
                  label: "Under Evaluation",
                  count: counts["Under Evaluation"],
                  bg: "#f5f3ff",
                  border: "#ddd6fe",
                  color: "#6d28d9",
                  icon: ClipboardList,
                },
              ].map(({ label, count, bg, border, color, icon: Icon }) => (
                <div
                  key={label}
                  onClick={() =>
                    setStatusFilter(statusFilter === label ? "All" : label)
                  }
                  style={{
                    background: statusFilter === label ? bg : "#fff",
                    border: `1px solid ${
                      statusFilter === label ? border : "#e5e7eb"
                    }`,
                    borderRadius: 12,
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: bg,
                      border: `1px solid ${border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={20} color={color} strokeWidth={1.8} />
                  </div>

                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {count}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                      {label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 20,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 220,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "0 16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <Search size={18} color="#9ca3af" strokeWidth={1.8} />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title, researcher, or department..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: "#111827",
                    padding: "12px 0",
                    background: "transparent",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                      border: `1px solid ${
                        statusFilter === s ? "#f59e0b" : "#e5e7eb"
                      }`,
                      background: statusFilter === s ? "#f59e0b" : "#fff",
                      color: statusFilter === s ? "#fff" : "#374151",
                      transition: "all 0.15s",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {selected.size > 0 && (
                <button
                  onClick={() =>
                    setDeleteTarget(filtered.filter((p) => selected.has(p.id)))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "9px 18px",
                    borderRadius: 9,
                    border: "none",
                    background: "#dc2626",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(220,38,38,0.3)",
                  }}
                >
                  <Trash2 size={16} /> Delete ({selected.size})
                </button>
              )}
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
              <div
                style={{
                  padding: "16px 22px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <FileText size={18} color="#f59e0b" />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    Proposals ({filtered.length})
                  </h3>
                </div>

                {selected.size > 0 && (
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    {selected.size} selected
                  </span>
                )}
              </div>

              {loading ? (
                <p style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>
                  Loading…
                </p>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <FileText
                    size={40}
                    color="#d1d5db"
                    style={{ margin: "0 auto 10px", display: "block" }}
                  />
                  <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                    No proposals found.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="ppm-table">
                    <thead>
                      <tr>
                        <th style={{ width: 44 }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            style={{
                              width: 16,
                              height: 16,
                              cursor: "pointer",
                              accentColor: "#f59e0b",
                            }}
                          />
                        </th>
                        {[
                          "ID",
                          "Title",
                          "Researcher",
                          "Department",
                          "Defense Date",
                          "Evaluators",
                          "Status",
                          "Actions",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((p) => {
                        const sb = STATUS_MAP[p.status] || STATUS_MAP.Pending;
                        const isSel = selected.has(p.id);

                        return (
                          <tr
                            key={p.id}
                            style={{ background: isSel ? "#fff7ed" : undefined }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => toggleOne(p.id)}
                                style={{
                                  width: 16,
                                  height: 16,
                                  cursor: "pointer",
                                  accentColor: "#f59e0b",
                                }}
                              />
                            </td>

                            <td
                              style={{
                                fontWeight: 600,
                                color: "#111827",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {p.proposal_id}
                            </td>

                            <td style={{ maxWidth: 200 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: 500,
                                  color: "#111827",
                                }}
                              >
                                {p.title}
                              </p>
                            </td>

                            <td style={{ whiteSpace: "nowrap" }}>
                              {p.researcher}
                            </td>

                            <td>{p.department}</td>

                            <td style={{ whiteSpace: "nowrap" }}>
                              {fmtDefenseDate(p.defense_date) ? (
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                    color: "#1d4ed8",
                                    fontWeight: 600,
                                    fontSize: 12,
                                  }}
                                >
                                  <Calendar size={12} />
                                  {fmtDefenseDate(p.defense_date)}
                                </span>
                              ) : (
                                <span style={{ color: "#9ca3af", fontSize: 12 }}>
                                  Not set
                                </span>
                              )}
                            </td>

                            <td>
                              {p.evaluators?.length > 0 ? (
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 4,
                                  }}
                                >
                                  {p.evaluators.map((ev, i) => (
                                    <span
                                      key={i}
                                      style={{
                                        padding: "2px 8px",
                                        borderRadius: 12,
                                        background: "#eff6ff",
                                        color: "#1d4ed8",
                                        border: "1px solid #bfdbfe",
                                        fontSize: 11,
                                        fontWeight: 500,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {ev}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ color: "#9ca3af", fontSize: 12 }}>
                                  None
                                </span>
                              )}
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
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {p.status}
                              </span>
                            </td>

                            <td>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  onClick={() => setViewing(p)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "6px 12px",
                                    borderRadius: 7,
                                    border: "1px solid #e5e7eb",
                                    background: "#fff",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "#374151",
                                  }}
                                >
                                  <Eye size={13} /> View
                                </button>

                                <button
                                  onClick={() => setScheduling(p)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "6px 12px",
                                    borderRadius: 7,
                                    border: "none",
                                    background: "#f59e0b",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#fff",
                                    whiteSpace: "nowrap",
                                  }}
                                >
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
      </div>

      {scheduling && (
        <ScheduleModal
          proposal={scheduling}
          evaluatorList={evaluators}
          onClose={() => setScheduling(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}

      {viewing && <ViewModal proposal={viewing} onClose={() => setViewing(null)} />}

      {deleteTarget && (
        <DeleteConfirmModal
          items={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}