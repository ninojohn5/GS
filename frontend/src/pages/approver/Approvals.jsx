// src/pages/approver/Approvals.jsx
import { useState, useEffect, useRef } from "react";
import ApproverNavbar from "../../components/approver/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  FileText,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Pen,
  Upload,
  Trash2,
  X,
  Calendar,
  Star,
  Eye,
} from "lucide-react";

const SB = {
  "Under Evaluation": { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Evaluated: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Endorsed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  Forwarded: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  Returned: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const fmt = (n) => Number(n || 0).toLocaleString();

const fmtDate = (value) => {
  if (!value) return "—";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function StatusBadge({ status }) {
  const sb = SB[status] || {
    bg: "#f3f4f6",
    color: "#6b7280",
    border: "#e5e7eb",
  };

  return (
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
      {status || "—"}
    </span>
  );
}

/* ── Completed Action View Modal ─────────────────────────── */
function ViewActionModal({ action, onClose }) {
  if (!action) return null;

  return (
    <div
      style={MO.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ ...MO.modal, maxWidth: 620 }}>
        <div style={MO.header}>
          <div style={{ minWidth: 0 }}>
            <h2 style={MO.title}>Completed Action Details</h2>
            <p style={MO.sub}>
              {action.reference_no || "—"} - {action.title || "Untitled Proposal"}
            </p>
          </div>

          <button type="button" style={MO.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={MO.body}>
          <div style={MO.infoCard}>
            <div style={MO.infoGrid}>
              <div>
                <p style={MO.iL}>Reference No</p>
                <p style={MO.iV}>{action.reference_no || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Project Status</p>
                <StatusBadge status={action.project_status} />
              </div>

              <div>
                <p style={MO.iL}>Researcher</p>
                <p style={MO.iV}>{action.submitted_by || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Department</p>
                <p style={MO.iV}>{action.department || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Budget</p>
                <p style={MO.iV}>₱{fmt(action.budget)}</p>
              </div>

              <div>
                <p style={MO.iL}>Type</p>
                <p style={MO.iV}>{action.type || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Start Date</p>
                <p style={MO.iV}>{fmtDate(action.start_date)}</p>
              </div>

              <div>
                <p style={MO.iL}>End Date</p>
                <p style={MO.iV}>{fmtDate(action.end_date)}</p>
              </div>

              <div>
                <p style={MO.iL}>Evaluation Score</p>
                <p style={MO.iV}>
                  {action.average_score ? `${action.average_score}/100` : "—"}
                </p>
              </div>

              <div>
                <p style={MO.iL}>Date Acted</p>
                <p style={MO.iV}>{action.acted_at || "—"}</p>
              </div>
            </div>
          </div>

          <div style={MO.infoCard}>
            <div style={MO.infoGrid}>
              <div>
                <p style={MO.iL}>Your Role</p>
                <p style={MO.iV}>{action.role_at_approval || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Your Action</p>
                <StatusBadge status={action.action} />
              </div>

              <div>
                <p style={MO.iL}>Reference Action No</p>
                <p style={MO.iV}>{action.reference_action_no || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Signature Type</p>
                <p style={MO.iV}>{action.signature_type || "—"}</p>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <p style={MO.iL}>Remarks</p>
              <div
                style={{
                  marginTop: 6,
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  background: "#fff",
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5,
                  minHeight: 44,
                }}
              >
                {action.remarks || "No remarks provided."}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <p style={MO.iL}>Signature</p>

              <div
                style={{
                  marginTop: 6,
                  minHeight: 90,
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#fafafa",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                {action.signature_image ? (
                  <img
                    src={action.signature_image}
                    alt="Signature"
                    style={{
                      maxHeight: 90,
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    No signature uploaded.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                color: "#374151",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Review Modal ────────────────────────────────────────── */
function ReviewModal({ proposal, onClose, onAct, submitting, error }) {
  const [sigTab, setSigTab] = useState("upload");
  const [sigFile, setSigFile] = useState(null);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [refNo, setRefNo] = useState("");
  const [approvalDate, setApprovalDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  });

  const canvasRef = useRef(null);
  const lastPos = useRef(null);
  const fileRef = useRef(null);

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width;
    const sy = canvas.height / r.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - r.left) * sx,
        y: (e.touches[0].clientY - r.top) * sy,
      };
    }

    return {
      x: (e.clientX - r.left) * sx,
      y: (e.clientY - r.top) * sy,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    e.preventDefault();

    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    const p = getPos(e, c);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPos.current = p;
    setHasDrawn(true);
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    canvasRef.current?.getContext("2d").clearRect(0, 0, 560, 130);
    setHasDrawn(false);
  };

  const buildSig = async () => {
    if (sigTab === "draw" && hasDrawn) {
      return canvasRef.current?.toDataURL("image/png");
    }

    if (sigTab === "upload" && sigFile) {
      return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target.result);
        r.readAsDataURL(sigFile);
      });
    }

    return null;
  };

  const act = async (action) => {
    const sig = await buildSig();

    onAct({
      action,
      remarks,
      reference_no: refNo,
      signature_image: sig,
      signature_type: sigTab,
      approval_date: approvalDate,
    });
  };

  return (
    <div
      style={MO.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={MO.modal}>
        <div style={MO.header}>
          <div style={{ minWidth: 0 }}>
            <h2 style={MO.title}>Review Proposal</h2>
            <p style={MO.sub}>
              {proposal.reference_no} - {proposal.title}
            </p>
          </div>

          <button type="button" style={MO.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={MO.body}>
          <div style={MO.infoCard}>
            <div style={MO.infoGrid}>
              <div>
                <p style={MO.iL}>Researcher</p>
                <p style={MO.iV}>{proposal.submitted_by}</p>
              </div>

              <div>
                <p style={MO.iL}>Department</p>
                <p style={MO.iV}>{proposal.department || "—"}</p>
              </div>

              <div>
                <p style={MO.iL}>Budget</p>
                <p style={MO.iV}>₱{fmt(proposal.budget)}</p>
              </div>

              <div>
                <p style={MO.iL}>Date Submitted</p>
                <p style={MO.iV}>
                  {proposal.date_submitted ||
                    proposal.created_at?.slice(0, 10) ||
                    "—"}
                </p>
              </div>
            </div>

            {proposal.average_score && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Star size={14} color="#7c3aed" fill="#7c3aed" />
                <span
                  style={{
                    fontSize: 13,
                    color: "#7c3aed",
                    fontWeight: 600,
                  }}
                >
                  Score: {proposal.average_score}/100
                </span>
              </div>
            )}
          </div>

          {error && <div style={MO.err}>{error}</div>}

          <div style={MO.field}>
            <label style={MO.label}>
              Reference No{" "}
              <span style={{ color: "#9ca3af", fontWeight: 400 }}>
                (optional)
              </span>
            </label>

            <input
              style={MO.input}
              placeholder="e.g. 1-485"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
            />
          </div>

          <div style={MO.field}>
            <label style={MO.label}>Remarks</label>

            <textarea
              style={MO.textarea}
              placeholder="Add remarks or notes…"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <div style={MO.field}>
            <label
              style={{
                ...MO.label,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Calendar size={14} color="#16a34a" /> Approval Date
            </label>

            <input
              style={MO.input}
              placeholder="DD/MM/YYYY"
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
            />
          </div>

          <div style={MO.field}>
            <label style={MO.label}>Signature</label>

            <div style={MO.sigTabs}>
              {["upload", "draw"].map((t) => (
                <button
                  key={t}
                  type="button"
                  style={{
                    ...MO.sigTab,
                    ...(sigTab === t ? MO.sigOn : {}),
                  }}
                  onClick={() => setSigTab(t)}
                >
                  {t === "upload" ? <Upload size={14} /> : <Pen size={14} />}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {sigTab === "upload" && (
              <div style={MO.zone} onClick={() => fileRef.current.click()}>
                {sigFile ? (
                  <img
                    src={URL.createObjectURL(sigFile)}
                    alt="sig"
                    style={{
                      maxHeight: 80,
                      maxWidth: "100%",
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  <>
                    <Upload size={26} color="#9ca3af" />

                    <p
                      style={{
                        margin: "8px 0 4px",
                        fontSize: 13,
                        color: "#6b7280",
                      }}
                    >
                      Click to upload your signature
                    </p>
                  </>
                )}

                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  style={{ display: "none" }}
                  onChange={(e) => setSigFile(e.target.files[0])}
                />

                {!sigFile && (
                  <button
                    type="button"
                    style={MO.chooseBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current.click();
                    }}
                  >
                    Choose File
                  </button>
                )}
              </div>
            )}

            {sigTab === "draw" && (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={130}
                  style={{
                    display: "block",
                    width: "100%",
                    cursor: "crosshair",
                    background: "#fafafa",
                    touchAction: "none",
                  }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {hasDrawn
                      ? "✓ Signature captured"
                      : "Draw your signature above"}
                  </span>

                  {hasDrawn && (
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "#dc2626",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={clearCanvas}
                    >
                      <Trash2 size={12} /> Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            <button
              type="button"
              style={{ ...MO.actBtn, background: "#16a34a", color: "#fff" }}
              onClick={() => act("approve")}
              disabled={submitting}
            >
              <CheckCircle2 size={15} />
              {submitting ? "Processing…" : "Approve"}
            </button>

            <button
              type="button"
              style={{ ...MO.actBtn, background: "#fef9c3", color: "#a16207" }}
              onClick={() => act("return")}
              disabled={submitting}
            >
              <RotateCcw size={15} /> Return
            </button>

            <button
              type="button"
              style={{ ...MO.actBtn, background: "#fef2f2", color: "#dc2626" }}
              onClick={() => act("reject")}
              disabled={submitting}
            >
              <XCircle size={15} /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    maxWidth: 560,
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
    gap: 10,
  },
  title: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
  },
  sub: {
    margin: "3px 0 0",
    fontSize: 12,
    color: "#6b7280",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
    padding: "18px 22px 22px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  infoCard: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "14px 16px",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px 20px",
  },
  iL: {
    margin: 0,
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  iV: {
    margin: "2px 0 0",
    fontSize: 13,
    fontWeight: 600,
    color: "#111827",
  },
  err: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
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
  },
  textarea: {
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    fontSize: 14,
    outline: "none",
    color: "#111827",
    minHeight: 68,
    resize: "vertical",
    fontFamily: "inherit",
  },
  sigTabs: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },
  sigTab: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "9px 0",
    border: "none",
    background: "#f9fafb",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  sigOn: {
    background: "#fff",
    fontWeight: 600,
    color: "#16a34a",
    boxShadow: "inset 0 -2px 0 #16a34a",
  },
  zone: {
    border: "2px dashed #d1d5db",
    borderRadius: 10,
    padding: "24px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    background: "#fafafa",
    gap: 4,
  },
  chooseBtn: {
    marginTop: 8,
    padding: "7px 18px",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
  },
  actBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 14px",
    borderRadius: 9,
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    minWidth: 90,
  },
};

/* ── ApprovePage ─────────────────────────────────────────── */
export default function ApprovePage() {
  const [proposals, setProposals] = useState([]);
  const [completedActions, setCompletedActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [viewingAction, setViewingAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fetchProposals = async () => {
    setLoading(true);

    try {
      const [pendingRes, actionsRes] = await Promise.allSettled([
        api.get("/approval/pending"),
        api.get("/approval/my-actions"),
      ]);

      setProposals(
        pendingRes.status === "fulfilled" && Array.isArray(pendingRes.value.data)
          ? pendingRes.value.data
          : []
      );

      setCompletedActions(
        actionsRes.status === "fulfilled" && Array.isArray(actionsRes.value.data)
          ? actionsRes.value.data
          : []
      );
    } catch {
      setProposals([]);
      setCompletedActions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleAct = async (payload) => {
    setError("");
    setSubmitting(true);

    try {
      await api.post("/approval/act", {
        research_project_id: reviewing.id,
        ...payload,
      });

      const label =
        payload.action === "approve"
          ? "Approved"
          : payload.action === "reject"
          ? "Rejected"
          : "Returned";

      setSuccess(`Proposal ${label} successfully!`);
      setReviewing(null);

      await fetchProposals();

      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const stats = {
    pending: proposals.length,
    completed: completedActions.length,
    total: proposals.length + completedActions.length,
  };

  const ml = isMobile ? 0 : sidebarWidth;

  return (
    <>
      <style>{`
        .ap-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .ap-table {
          width: 100%;
          border-collapse: collapse;
        }

        .ap-table th {
          padding: 11px 14px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .04em;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          white-space: nowrap;
        }

        .ap-table td {
          padding: 13px 14px;
          font-size: 13px;
          color: #374151;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }

        .ap-table tr:last-child td {
          border-bottom: none;
        }

        .ap-table tr:hover td {
          background: #fafafa;
        }

        @media(max-width:900px) {
          .ap-stat-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media(max-width:600px) {
          .ap-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
        <ApproverNavbar onWidthChange={setSidebarWidth} />

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
          <Topbar title="Approvals" />

          <div style={{ padding: "24px", flex: 1 }}>
            {success && (
              <div
                style={{
                  background: "#dcfce7",
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

            {/* Stats */}
            <div className="ap-stat-grid">
              {[
                {
                  label: "Pending Approval",
                  value: stats.pending,
                  bg: "#fff7ed",
                  border: "#fed7aa",
                },
                {
                  label: "Completed Actions",
                  value: stats.completed,
                  bg: "#f0fdf4",
                  border: "#bbf7d0",
                },
                {
                  label: "Total Records",
                  value: stats.total,
                  bg: "#eff6ff",
                  border: "#bfdbfe",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    borderRadius: 12,
                    padding: "18px 22px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 26,
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    {s.value}
                  </p>

                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Pending Table */}
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                overflow: "hidden",
                marginBottom: 24,
              }}
            >
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #f1f5f9" }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Pending Proposals ({proposals.length})
                </h3>
              </div>

              {loading ? (
                <p style={{ padding: "24px", color: "#9ca3af", fontSize: 14 }}>
                  Loading…
                </p>
              ) : proposals.length === 0 ? (
                <div style={{ padding: "48px 24px", textAlign: "center" }}>
                  <FileText
                    size={40}
                    color="#d1d5db"
                    style={{ margin: "0 auto 10px", display: "block" }}
                  />

                  <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                    No proposals pending your action.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="ap-table">
                    <thead>
                      <tr>
                        {["Ref No", "Title", "Researcher", "Budget", "Status", "Actions"].map(
                          (h) => (
                            <th key={h}>{h}</th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {proposals.map((p) => (
                        <tr key={p.id}>
                          <td style={{ fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                            {p.reference_no || `PRJ-${String(p.id).padStart(3, "0")}`}
                          </td>

                          <td style={{ maxWidth: 220 }}>
                            <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>
                              {p.title}
                            </p>

                            {p.average_score && (
                              <span style={{ fontSize: 11, color: "#7c3aed" }}>
                                ⭐ {p.average_score}/100
                              </span>
                            )}
                          </td>

                          <td>{p.submitted_by}</td>

                          <td style={{ whiteSpace: "nowrap" }}>₱{fmt(p.budget)}</td>

                          <td>
                            <StatusBadge status={p.status} />
                          </td>

                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setError("");
                                setReviewing(p);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 14px",
                                borderRadius: 8,
                                border: "none",
                                background: "#16a34a",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              <FileText size={14} /> Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Completed Actions Table */}
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
                  background: "#f0fdf4",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#15803d",
                  }}
                >
                  Completed Actions ({completedActions.length})
                </h3>

                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                  These are proposals you have already acted on.
                </p>
              </div>

              {loading ? (
                <p style={{ padding: "24px", color: "#9ca3af", fontSize: 14 }}>
                  Loading…
                </p>
              ) : completedActions.length === 0 ? (
                <div style={{ padding: "40px 24px", textAlign: "center" }}>
                  <CheckCircle2
                    size={38}
                    color="#d1d5db"
                    style={{ margin: "0 auto 10px", display: "block" }}
                  />

                  <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                    No completed actions yet.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="ap-table">
                    <thead>
                      <tr>
                        {[
                          "Ref No",
                          "Title",
                          "Researcher",
                          "Your Action",
                          "Remarks",
                          "Date Acted",
                          "Actions",
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {completedActions.map((p) => (
                        <tr key={p.approval_id || p.project_id}>
                          <td style={{ fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>
                            {p.reference_no || `PRJ-${String(p.project_id).padStart(3, "0")}`}
                          </td>

                          <td style={{ maxWidth: 220 }}>
                            <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>
                              {p.title}
                            </p>

                            {p.project_status && (
                              <span style={{ display: "inline-block", marginTop: 4 }}>
                                <StatusBadge status={p.project_status} />
                              </span>
                            )}
                          </td>

                          <td>{p.submitted_by || "—"}</td>

                          <td>
                            <StatusBadge status={p.action} />
                          </td>

                          <td style={{ maxWidth: 220 }}>
                            <span
                              style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={p.remarks || ""}
                            >
                              {p.remarks || "—"}
                            </span>
                          </td>

                          <td style={{ whiteSpace: "nowrap" }}>{p.acted_at || "—"}</td>

                          <td>
                            <button
                              type="button"
                              onClick={() => setViewingAction(p)}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "7px 14px",
                                borderRadius: 8,
                                border: "none",
                                background: "#1d4ed8",
                                color: "#fff",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              <Eye size={14} /> View
                            </button>
                          </td>
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

      {reviewing && (
        <ReviewModal
          proposal={reviewing}
          onClose={() => setReviewing(null)}
          onAct={handleAct}
          submitting={submitting}
          error={error}
        />
      )}

      {viewingAction && (
        <ViewActionModal
          action={viewingAction}
          onClose={() => setViewingAction(null)}
        />
      )}
    </>
  );
}