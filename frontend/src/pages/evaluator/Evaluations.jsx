import { useState, useRef, useEffect } from "react";
import { FileText, Star, Upload, Trash2, Pen, X, ExternalLink } from "lucide-react";
import EvaluatorNavbar from "../../components/evaluator/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/evaluator.css";
import api from "../../utils/api";

const CRITERIA = [
  { key: "presentation_score",         label: "Proposal Presentation",        max: 40 },
  { key: "relevance_discipline_score", label: "Relevance to Discipline",       max: 20 },
  { key: "relevance_rde_score",        label: "Relevance to RDE Agenda",       max: 30 },
  { key: "potential_benefits_score",   label: "Potential Benefits to Clients", max: 10 },
];

function DocViewerModal({ docs, initialIndex = 0, onClose }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const doc = docs[activeIndex];
  if (!doc) return null;

  const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.url);
  // Default to iframe for everything that isn't an image (handles PDFs, Word docs, etc.)
  const showIframe = !isImage;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 960, height: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.35)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <FileText size={17} color="#1d4ed8" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{doc.label}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a href={doc.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
              <ExternalLink size={13} /> Open in tab
            </a>
            <button onClick={onClose}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 8, border: "none", background: "#374151", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <X size={14} /> Close
            </button>
          </div>
        </div>

        {/* Tabs - only show if multiple docs */}
        {docs.length > 1 && (
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f9fafb", flexShrink: 0, overflowX: "auto" }}>
            {docs.map((d, i) => (
              <button key={i} onClick={() => setActiveIndex(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", border: "none",
                  borderBottom: `2px solid ${activeIndex === i ? "#1d4ed8" : "transparent"}`,
                  background: "transparent",
                  color: activeIndex === i ? "#1d4ed8" : "#6b7280",
                  fontSize: 13, fontWeight: activeIndex === i ? 700 : 400,
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                <FileText size={13} /> {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden", background: "#f3f4f6" }}>
          {showIframe && <iframe src={doc.url} style={{ width: "100%", height: "100%", border: "none" }} title={doc.label} />}
          {isImage && (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: 16 }}>
              <img src={doc.url} alt={doc.label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 8, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewDetailsModal({ item, onClose }) {
  const score = Number(item.score || 0);
  const result = item.remarks || (score >= 70 ? "Passed" : score >= 60 ? "Pro-visionary" : "Disapproved");
  const resultStyle = score >= 70 ? { bg: "#dcfce7", color: "#15803d" } : score >= 60 ? { bg: "#fef3c7", color: "#d97706" } : { bg: "#fef2f2", color: "#dc2626" };

  return (
    <div className="tm-modal-overlay" onClick={onClose}>
      <div className="tm-modal" style={{ maxWidth: 540, width: "100%", padding: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="tm-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "18px 20px 14px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="tm-modal-title" style={{ margin: 0 }}>Evaluation Details</h3>
            <p className="tm-modal-subtitle" style={{ margin: "5px 0 0", whiteSpace: "normal", lineHeight: 1.4 }}>
              {item.reference_no || `Project #${item.project_id}`} — {item.title}
            </p>
          </div>
          <button type="button" className="tm-modal-close" onClick={onClose} style={{ marginLeft: "auto", flexShrink: 0, position: "static" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "16px 20px 20px" }}>
          <div style={{ background: "#f5f3ff", borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Final Score</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: "#7c3aed", margin: 0, lineHeight: 1 }}>
                {score.toFixed(2)}<span style={{ fontSize: 14, color: "#9ca3af" }}>/100</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 4px" }}>Result</p>
              <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 20, background: resultStyle.bg, color: resultStyle.color, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{result}</span>
              <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>{item.evaluator || "—"}</p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: 0 }}>{item.date || "—"}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 11px", background: "#fafafa" }}>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 3px" }}>Project ID</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{item.project_id || "—"}</p>
            </div>
            <div style={{ border: "1px solid #e5e7eb", borderRadius: 9, padding: "9px 11px", background: "#fafafa" }}>
              <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 3px" }}>Reference No</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0 }}>{item.reference_no || "—"}</p>
            </div>
          </div>

          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 8px" }}>Score Breakdown</p>
          {CRITERIA.map((c) => {
            const val = Number(item[c.key] ?? 0);
            const pct = Math.max(0, Math.min(100, (val / c.max) * 100));
            return (
              <div key={c.key} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#374151" }}>{c.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", whiteSpace: "nowrap" }}>{val.toFixed(2)}/{c.max}</span>
                </div>
                <div className="ev-progress-bg"><div className="ev-progress-bar" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}

          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", margin: "0 0 6px" }}>Comments</p>
            <div style={{ background: "#fafafa", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#6b7280", lineHeight: 1.5, minHeight: 46 }}>
              {item.comments?.trim() ? item.comments : "No comments provided."}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button className="cp-btn" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Evaluations() {
  const [pending,         setPending]         = useState([]);
  const [completed,       setCompleted]       = useState([]);
  const [selected,        setSelected]        = useState(null);
  const [viewItem,        setViewItem]        = useState(null);
  const [viewingDocIndex, setViewingDocIndex] = useState(null);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState("");
  const [projectDocs,     setProjectDocs]     = useState([]);

  const [scores, setScores] = useState({ presentation_score: 0, relevance_discipline_score: 0, relevance_rde_score: 0, potential_benefits_score: 0 });
  const [comments,  setComments]  = useState("");
  const [sigTab,    setSigTab]    = useState("draw");
  const [sigFile,   setSigFile]   = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn,  setHasDrawn]  = useState(false);
  const canvasRef = useRef(null);
  const lastPos   = useRef(null);
  const sigRef    = useRef(null);

  useEffect(() => {
    api.get("/evaluations/pending").then((res) => setPending(res.data));
    api.get("/evaluations/completed").then((res) => setCompleted(res.data));
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => { e.preventDefault(); const canvas = canvasRef.current; if (!canvas) return; setIsDrawing(true); lastPos.current = getPos(e, canvas); };
  const draw = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = "#111827"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    lastPos.current = pos; setHasDrawn(true);
  };
  const stopDraw = () => setIsDrawing(false);
  const clearCanvas = () => { const canvas = canvasRef.current; if (!canvas) return; canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); setHasDrawn(false); };

  const totalScore = Object.values(scores).reduce((s, v) => s + v, 0);
  const scoreColor = totalScore >= 70 ? "#15803d" : totalScore >= 60 ? "#d97706" : "#dc2626";

  const handleSelect = (proj) => {
    setSelected(proj);
    setScores({ presentation_score: 0, relevance_discipline_score: 0, relevance_rde_score: 0, potential_benefits_score: 0 });
    setComments(""); setError(""); clearCanvas(); setSigFile(null); setSigTab("draw");
    setProjectDocs([]);
    api.get(`/projects/${proj.id}`).then((res) => {
      const p = res.data || {};
      const toUrl = (path) => path ? `${import.meta.env.VITE_STORAGE_URL || "http://127.0.0.1:8000/storage"}/${path}` : null;
      const safeParse = (val) => {
        if (!val) return [];
        try {
          let parsed = val;
          while (typeof parsed === "string") parsed = JSON.parse(parsed);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch { return typeof val === "string" ? [val] : []; }
      };
      const cvPaths = safeParse(p.cv_paths);
      setProjectDocs([
        { label: "Proposal Form", url: toUrl(p.proposal_form_path || p.proposal_form) },
        ...cvPaths.map((path, i) => ({ label: `CV (${i + 1})`, url: toUrl(path) })),
        { label: "Work Plan",  url: toUrl(p.work_plan_path  || p.work_plan_file)  },
        { label: "Framework",  url: toUrl(p.framework_path  || p.framework_file)  },
        { label: "References", url: toUrl(p.references_path || p.references_file) },
      ].filter((d) => d.url));
    }).catch(() => setProjectDocs([]));
  };

  const getSignatureImage = () => {
    if (sigTab === "draw" && hasDrawn) return canvasRef.current?.toDataURL("image/png");
    if (sigTab === "upload" && sigFile) return new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsDataURL(sigFile); });
    return null;
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setError(""); setSubmitting(true);
    try {
      let signatureImage = null;
      if (sigTab === "draw" && hasDrawn) signatureImage = canvasRef.current?.toDataURL("image/png");
      if (sigTab === "upload" && sigFile) signatureImage = await getSignatureImage();
      await api.post("/evaluations", { research_project_id: selected.id, ...scores, comments, signature_image: signatureImage, signature_type: sigTab });
      const [pendingRes, completedRes] = await Promise.all([api.get("/evaluations/pending"), api.get("/evaluations/completed")]);
      setPending(pendingRes.data); setCompleted(completedRes.data); setSelected(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit evaluation.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="dashboard-layout">
      <EvaluatorNavbar />
      <div className="main-content">
        <Topbar title="Evaluations" />
        <div className="dashboard-content">

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>Review and score submitted research proposals</h3>
          </div>

          <div className="ev-split">
            {/* Pending List */}
            <div className="ev-pending-panel">
              <h4 className="ev-panel-title">Pending Evaluations</h4>
              {pending.length === 0 && <p style={{ color: "#9ca3af", fontSize: 13 }}>No pending evaluations.</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pending.map((p) => {
                  const isSel = selected?.id === p.id;
                  return (
                    <div key={p.id} className={`ev-pending-card ${isSel ? "selected" : ""}`} onClick={() => handleSelect(p)}>
                      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                        <FileText size={18} color={isSel ? "#7c3aed" : "#9ca3af"} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div>
                          <p className="ev-pending-title">{p.title}</p>
                          <p className="ev-pending-id">{p.id}</p>
                          <span className="badge" style={{ background: "#fef3c7", color: "#d97706", marginTop: 6, display: "inline-block" }}>{p.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluation Form */}
            <div className="ev-form-panel">
              <h4 className="ev-panel-title">Evaluation Form</h4>
              {!selected ? (
                <div className="ev-empty-state">
                  <FileText size={40} color="#d1d5db" />
                  <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>Select a project to begin evaluation</p>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>{selected.title}</h3>
                    <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>{selected.dept}</p>
                  </div>

                  {/* Documents */}
                  {projectDocs.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>📎 Submitted Documents</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {projectDocs.map((doc, i) => (
                          <button key={doc.label} onClick={() => setViewingDocIndex(i)}
                            style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#1d4ed8", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%", textAlign: "left", transition: "background 0.13s" }}
                            onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"}
                            onMouseLeave={(e) => e.currentTarget.style.background = "#f9fafb"}>
                            <FileText size={14} color="#1d4ed8" /> {doc.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

                  {CRITERIA.map((c) => {
                    const val = scores[c.key];
                    const pct = (val / c.max) * 100;
                    return (
                      <div key={c.key} style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <label style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>
                            {c.label} <span style={{ color: "#9ca3af", fontWeight: 400 }}>(Max: {c.max})</span>
                          </label>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "#7c3aed" }}>{val}/{c.max}</span>
                        </div>
                        <input type="range" min={0} max={c.max} value={val}
                          onChange={(e) => setScores((p) => ({ ...p, [c.key]: parseInt(e.target.value) }))}
                          className="ev-slider" />
                        <div className="ev-progress-bg" style={{ marginTop: 6 }}>
                          <div className="ev-progress-bar" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}

                  <div className="ev-total-score">
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Total Score:</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: scoreColor, display: "flex", alignItems: "center", gap: 6 }}>
                      <Star size={18} fill={scoreColor} color={scoreColor} /> {totalScore}/100
                    </span>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 14, fontWeight: 500, color: "#374151", display: "block", marginBottom: 6 }}>Evaluation Comments</label>
                    <textarea className="cp-textarea" style={{ minHeight: 90 }} placeholder="Provide detailed feedback..." value={comments} onChange={(e) => setComments(e.target.value)} />
                  </div>

                  {/* Signature */}
                  <div className="ev-credentials">
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", margin: "0 0 14px" }}>E-Signature</h4>
                    <div className="cp-field">
                      <div className="ev-sig-tabs">
                        <button className={`ev-sig-tab ${sigTab === "draw" ? "active" : ""}`} onClick={() => setSigTab("draw")}><Pen size={14} /> Draw</button>
                        <button className={`ev-sig-tab ${sigTab === "upload" ? "active" : ""}`} onClick={() => setSigTab("upload")}><Upload size={14} /> Upload</button>
                      </div>
                      {sigTab === "draw" && (
                        <div className="ev-canvas-wrapper">
                          <canvas ref={canvasRef} width={560} height={130} className="ev-sig-canvas"
                            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                          <div className="ev-canvas-footer">
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>{hasDrawn ? "✓ Signature captured" : "Draw your signature above"}</span>
                            {hasDrawn && <button className="ev-clear-btn" onClick={clearCanvas}><Trash2 size={13} /> Clear</button>}
                          </div>
                        </div>
                      )}
                      {sigTab === "upload" && (
                        <div className="ev-sig-upload">
                          <div className="cp-file-row">
                            <button className="cp-file-btn" onClick={() => sigRef.current.click()}>Choose File</button>
                            <span className="cp-file-name">{sigFile ? sigFile.name : "No file chosen"}</span>
                            <input ref={sigRef} type="file" accept=".png,.jpg,.jpeg" style={{ display: "none" }} onChange={(e) => setSigFile(e.target.files[0])} />
                          </div>
                          {sigFile && <img src={URL.createObjectURL(sigFile)} alt="signature preview" style={{ maxHeight: 80, border: "1px solid #e5e7eb", borderRadius: 6, padding: 4, marginTop: 10 }} />}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                    <button className="cp-btn" onClick={() => setSelected(null)}>Cancel</button>
                    <button className="ev-submit-btn" onClick={handleSubmit} disabled={submitting}>{submitting ? "Submitting..." : "Submit Evaluation"}</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Completed Table */}
          <div className="table-wrapper" style={{ marginTop: 20 }}>
            <h4 className="table-title">Completed Evaluations</h4>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Project Title</th><th>Evaluator</th><th>Date</th><th>Total Score</th><th>Remarks</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((item, i) => {
                    const sc = item.score >= 70 ? { bg: "#dcfce7", color: "#15803d" } : item.score >= 60 ? { bg: "#fef3c7", color: "#d97706" } : { bg: "#fef2f2", color: "#dc2626" };
                    return (
                      <tr key={i}>
                        <td><strong>{item.title}</strong></td>
                        <td>{item.evaluator}</td>
                        <td>{item.date}</td>
                        <td><span className="badge" style={{ background: sc.bg, color: sc.color }}>{item.score}/100</span></td>
                        <td>{item.remarks}</td>
                        <td><span className="action" onClick={() => setViewItem(item)}>View Details</span></td>
                      </tr>
                    );
                  })}
                  {completed.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: 24 }}>No completed evaluations yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {viewItem && <ViewDetailsModal item={viewItem} onClose={() => setViewItem(null)} />}
      {viewingDocIndex !== null && (
        <DocViewerModal docs={projectDocs} initialIndex={viewingDocIndex} onClose={() => setViewingDocIndex(null)} />
      )}
    </div>
  );
}