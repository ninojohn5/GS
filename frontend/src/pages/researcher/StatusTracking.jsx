import { useState, useEffect } from "react";
import {
  ChevronDown,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Printer,
} from "lucide-react";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import api from "../../utils/api";

const STATUS_BADGE_STYLES = {
  Approved: { bg: "#dcfce7", color: "#15803d" },
  "Under Evaluation": { bg: "#ede9fe", color: "#6d28d9" },
  "In Progress": { bg: "#d1fae5", color: "#065f46" },
  Submitted: { bg: "#e0f2fe", color: "#0369a1" },
  Draft: { bg: "#f3f4f6", color: "#6b7280" },
  Endorsed: { bg: "#dcfce7", color: "#15803d" },
  Recommended: { bg: "#dcfce7", color: "#15803d" },
  Forwarded: { bg: "#e0f2fe", color: "#0369a1" },
  Rejected: { bg: "#fef2f2", color: "#dc2626" },
  "For Revision": { bg: "#fef3c7", color: "#d97706" },
};

const fmtDate = (d) => {
  if (!d) return "—";

  const date = new Date(d);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fmtScore = (n) => {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return num % 1 === 0 ? String(num) : num.toFixed(2);
};

function TimelineIcon({ status, color }) {
  const style = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: `2px solid ${color}`,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (status === "Draft") {
    return (
      <div style={style}>
        <FileText size={16} color={color} />
      </div>
    );
  }

  if (status === "Submitted") {
    return (
      <div style={style}>
        <Clock size={16} color={color} />
      </div>
    );
  }

  if (status === "Approved") {
    return (
      <div style={style}>
        <CheckCircle2 size={16} color={color} />
      </div>
    );
  }

  if (status === "Evaluated") {
    return (
      <div style={style}>
        <TrendingUp size={16} color={color} />
      </div>
    );
  }

  return (
    <div style={style}>
      <Activity size={16} color={color} />
    </div>
  );
}

function handlePrintApproved(project, history, approvals, proposal) {
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const getSig = (action) => {
    const found = approvals.find((a) => a.action === action);
    return found?.signature_image || null;
  };

  const evalScore = (() => {
    if (project?.evaluation_score !== null && project?.evaluation_score !== undefined) {
      return project.evaluation_score;
    }

    if (project?.average_score !== null && project?.average_score !== undefined) {
      return project.average_score;
    }

    const evaluations = project?.evaluations || [];

    if (Array.isArray(evaluations) && evaluations.length > 0) {
      const scores = evaluations
        .map((e) => Number(e.total_score || 0))
        .filter((n) => !Number.isNaN(n));

      if (scores.length > 0) {
        const avg = scores.reduce((sum, n) => sum + n, 0) / scores.length;
        return Math.round(avg * 100) / 100;
      }
    }

    return null;
  })();

  const proponents = project?.proponents || [];
  const evaluations = Array.isArray(project?.evaluations) ? project.evaluations : [];

  const proponentSignatures = (() => {
    const raw = proposal?.signatures || project?.signatures;

    if (!raw) return {};

    try {
      return typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return {};
    }
  })();

  const proponentRows =
    proponents.length > 0
      ? proponents
          .map((p) => {
            const name = p.personnel?.name || p.name || "—";
            const dept =
              p.personnel?.department ||
              p.personnel?.department_center?.name ||
              p.department ||
              p.department_center?.name ||
              "—";
            const role = p.role || "Proponent";
            const pid = String(p.personnel?.id || p.id || p.personnel_id || "");
            const sig = proponentSignatures[pid];

            return `
              <tr>
                <td class="strong">${name}</td>
                <td>${dept}</td>
                <td>${role}</td>
                <td class="center">
                  ${
                    sig
                      ? `<img src="${sig}" class="proponent-sig" />`
                      : `<span class="muted italic">No signature</span>`
                  }
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="4" class="muted italic">No proponents recorded.</td></tr>`;

  const evaluationRows =
    evaluations.length > 0
      ? evaluations
          .map((e) => {
            const evaluatorName = e.evaluator?.name || e.evaluator_name || "—";
            const evaluatorDept =
              e.evaluator?.department_center?.name ||
              e.evaluator?.department ||
              e.evaluator?.expertise ||
              "—";

            return `
              <tr>
                <td>
                  <div class="strong">${evaluatorName}</div>
                  <div class="small-muted">${evaluatorDept}</div>
                </td>
                <td class="center">${fmtScore(e.presentation_score)} / 40</td>
                <td class="center">${fmtScore(e.relevance_discipline_score)} / 20</td>
                <td class="center">${fmtScore(e.relevance_rde_score)} / 30</td>
                <td class="center">${fmtScore(e.potential_benefits_score)} / 10</td>
                <td class="center strong">${fmtScore(e.total_score)} / 100</td>
                <td class="center">
                  <span class="eval-pill">${e.overall_remarks || "—"}</span>
                </td>
                <td>${e.comments || "—"}</td>
                <td class="center">
                  ${
                    e.signature_image
                      ? `<img src="${e.signature_image}" class="evaluator-sig" />`
                      : `<span class="muted italic">No signature</span>`
                  }
                  <div class="small-muted">${e.evaluated_at ? fmtDate(e.evaluated_at) : "—"}</div>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="9" class="muted italic">No evaluator records found.</td></tr>`;

  const approvalSteps = [
    { status: "Endorsed", role: "RDE Division Chief", action: "Endorsed" },
    { status: "Recommended", role: "Campus Director", action: "Recommended" },
    { status: "Forwarded", role: "VPRIE", action: "Forwarded" },
    { status: "Approved", role: "University President", action: "Approved" },
  ];

  const approvalRows = approvalSteps
    .map((step) => {
      const match = [...history].reverse().find((h) => h.status === step.status);
      const sig = getSig(step.action);

      return `
        <tr>
          <td class="strong">${step.role}</td>
          <td class="center">
            <span class="status-pill">${step.action}</span>
          </td>
          <td>${match ? `${match.date} ${match.time}` : "—"}</td>
          <td>
            ${sig ? `<img src="${sig}" class="approval-sig" />` : ""}
            <div class="approved-name">${match ? match.action_by : "—"}</div>
            ${
              match?.remarks
                ? `<div class="approval-remarks">"${match.remarks}"</div>`
                : ""
            }
          </td>
        </tr>
      `;
    })
    .join("");

  const researcherSig = (() => {
    if (proposal?.proponent_signature) return proposal.proponent_signature;

    const sigs = proponentSignatures;
    const keys = Object.keys(sigs);

    if (keys.length > 0) return sigs[keys[0]];

    return null;
  })();

  const presidentSig = getSig("Approved");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <title>Approved Proposal - ${project.reference_no || ""}</title>

      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: Georgia, serif;
          font-size: 9.2pt;
          color: #111827;
          background: #fff;
          padding: 18px 24px;
        }

        .header {
          text-align: center;
          margin-bottom: 13px;
          padding-bottom: 11px;
          border-bottom: 2px solid #1f7a1f;
        }

        .header .label {
          font-size: 7.5pt;
          color: #64748b;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-family: Arial, sans-serif;
          margin-bottom: 4px;
        }

        .header h1 {
          font-size: 14.5pt;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
          margin-bottom: 6px;
        }

        .badge {
          display: inline-block;
          padding: 2px 10px;
          border-radius: 999px;
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
          font-size: 8pt;
          font-weight: 700;
          font-family: Arial, sans-serif;
          white-space: nowrap;
        }

        .section {
          margin-bottom: 11px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .section-title {
          border-bottom: 2px solid #1f7a1f;
          padding-bottom: 4px;
          margin-bottom: 7px;
          font-family: Arial, sans-serif;
          font-size: 8.3pt;
          font-weight: 700;
          color: #1f7a1f;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 4px 10px;
          font-size: 9.2pt;
        }

        .info-grid .label {
          color: #64748b;
          font-weight: 500;
        }

        .info-grid .value {
          color: #111827;
          font-weight: 700;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 7.8pt;
          font-family: Arial, sans-serif;
        }

        thead {
          display: table-header-group;
        }

        tr {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        th {
          background: #f8fafc;
          text-align: left;
          padding: 5px 6px;
          color: #334155;
          font-weight: 700;
          font-size: 7.6pt;
          border-bottom: 1.5px solid #d1d5db;
        }

        td {
          padding: 5px 6px;
          border-bottom: 1px solid #edf2f7;
          vertical-align: middle;
        }

        .approval-table td {
          padding-top: 5px;
          padding-bottom: 5px;
        }

        .status-pill {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 999px;
          background: #dcfce7;
          color: #15803d;
          font-size: 8pt;
          font-weight: 700;
          white-space: nowrap;
        }

        .eval-pill {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 7.4pt;
          font-weight: 700;
          white-space: nowrap;
        }

        .approval-sig {
          max-height: 28px;
          max-width: 105px;
          object-fit: contain;
          display: block;
          margin-bottom: 1px;
        }

        .proponent-sig {
          max-height: 30px;
          max-width: 100px;
          object-fit: contain;
          display: block;
          margin: 0 auto;
        }

        .evaluator-sig {
          max-height: 30px;
          max-width: 95px;
          object-fit: contain;
          display: block;
          margin: 0 auto 2px;
        }

        .approved-name {
          font-size: 8pt;
          font-weight: 600;
          color: #111827;
          line-height: 1.2;
        }

        .approval-remarks {
          font-size: 7.4pt;
          color: #64748b;
          font-style: italic;
          margin-top: 1px;
          line-height: 1.2;
        }

        .center {
          text-align: center;
        }

        .strong {
          font-weight: 700;
        }

        .muted {
          color: #94a3b8;
        }

        .small-muted {
          color: #94a3b8;
          font-size: 7.2pt;
          margin-top: 1px;
        }

        .italic {
          font-style: italic;
        }

        .sig-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 24px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .sig-block {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .sig-img {
          max-height: 42px;
          max-width: 165px;
          object-fit: contain;
          margin-bottom: 4px;
        }

        .sig-line {
          border-bottom: 1.4px solid #374151;
          width: 75%;
          margin-bottom: 6px;
          min-height: 38px;
        }

        .sig-name {
          font-weight: 700;
          font-size: 8pt;
          font-family: Arial, sans-serif;
          text-align: center;
        }

        .footer {
          margin-top: 22px;
          padding-top: 9px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 7.5pt;
          color: #94a3b8;
          font-family: Arial, sans-serif;
        }

        @media print {
          body {
            padding: 12px 18px;
          }

          @page {
            size: A4;
            margin: 0.38in;
          }
        }
      </style>
    </head>

    <body>
      <div class="header">
        <p class="label">Caraga State University Research Project Proposal Management System</p>
        <h1>${project.title || "Untitled Proposal"}</h1>
        <span class="badge">Approved</span>
      </div>

      <div class="section">
        <div class="section-title">I. Project Information</div>

        <div class="info-grid">
          <span class="label">Reference No.</span>
          <span class="value">${project.reference_no || "—"}</span>

          <span class="label">Type of Scholarly Work</span>
          <span class="value">${project.type || project.scholarly_work_type || "Research"}</span>

          <span class="label">Total Proposed Budget</span>
          <span class="value">₱${Number(project.budget || project.total_budget || 0).toLocaleString()}</span>

          <span class="label">Proposed Start Date</span>
          <span class="value">${fmtDate(project.start_date)}</span>

          <span class="label">Proposed Completion Date</span>
          <span class="value">${fmtDate(project.end_date)}</span>

          <span class="label">Evaluation Score</span>
          <span class="value">${evalScore !== null && evalScore !== undefined ? `${fmtScore(evalScore)} / 100` : "—"}</span>

          <span class="label">Date Submitted</span>
          <span class="value">${proposal?.submitted_at ? fmtDate(proposal.submitted_at) : "—"}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">II. Proponents</div>

        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Role</th>
              <th class="center">Signature</th>
            </tr>
          </thead>

          <tbody>${proponentRows}</tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">III. Evaluation Summary</div>

        <table>
          <thead>
            <tr>
              <th>Evaluator</th>
              <th class="center">Presentation</th>
              <th class="center">Discipline</th>
              <th class="center">RDE</th>
              <th class="center">Benefits</th>
              <th class="center">Total</th>
              <th class="center">Remarks</th>
              <th>Comments</th>
              <th class="center">Signature</th>
            </tr>
          </thead>

          <tbody>${evaluationRows}</tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">IV. Approval Chain</div>

        <table class="approval-table">
          <thead>
            <tr>
              <th>Approver Role</th>
              <th class="center">Action</th>
              <th>Date &amp; Time</th>
              <th>Approved By / Signature</th>
            </tr>
          </thead>

          <tbody>${approvalRows}</tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">V. Status History</div>

        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Date &amp; Time</th>
              <th>Action By</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            ${history
              .map(
                (item) => `
                  <tr>
                    <td>${item.status}</td>
                    <td>${item.date} ${item.time}</td>
                    <td>${item.action_by}</td>
                    <td>${item.remarks || "—"}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="sig-grid">
        <div class="sig-block">
          ${
            researcherSig
              ? `<img src="${researcherSig}" class="sig-img" alt="Researcher Signature" />`
              : `<div class="sig-line"></div>`
          }
          <p class="sig-name">Prepared by: Lead Researcher / Proponent</p>
        </div>

        <div class="sig-block">
          ${
            presidentSig
              ? `<img src="${presidentSig}" class="sig-img" alt="President Signature" />`
              : `<div class="sig-line"></div>`
          }
          <p class="sig-name">Approved by: University President</p>
        </div>
      </div>

      <div class="footer">
        This document was generated by the Research Project Management System<br/>
        Caraga State University - ${today}
      </div>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");

  if (!win) {
    alert("Popup was blocked. Please allow popups and try again.");
    return;
  }

  win.document.write(html);
  win.document.close();
  win.focus();

  setTimeout(() => win.print(), 600);
}

export default function StatusTracking() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.get("/projects").then((res) => {
      const data = Array.isArray(res.data) ? res.data : [];
      setProjects(data);

      if (data.length > 0) {
        setSelectedId(String(data[0].id));
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    setLoading(true);

    api
      .get(`/projects/${selectedId}/status-history`)
      .then((res) => setTrackingData(res.data))
      .catch((err) => {
        console.error("Failed to load status history", err);
        setTrackingData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const project = trackingData?.project;
  const history = trackingData?.history || [];
  const statusStyle =
    STATUS_BADGE_STYLES[project?.current_status] || STATUS_BADGE_STYLES.Draft;
  const isApproved = project?.current_status === "Approved";

  const handleGeneratePDF = async () => {
    if (!selectedId) return;

    setGenerating(true);

    try {
      const projectRes = await api.get(`/projects/${selectedId}`);
      const fullData = projectRes.data?.project || projectRes.data || {};
      const approvals = fullData?.approvals || projectRes.data?.approvals || [];

      const proposalRes = await api.get(`/proposals/${selectedId}`);
      const proposal = proposalRes.data?.proposal || proposalRes.data || {};

      const printableProject = {
        ...fullData,
        evaluation_score:
          project?.evaluation_score ??
          fullData?.evaluation_score ??
          fullData?.average_score ??
          null,
      };

      handlePrintApproved(printableProject, history, approvals, proposal);
    } catch (e) {
      console.error("Failed to fetch printable data", e);
      handlePrintApproved(project, history, [], {});
    } finally {
      setTimeout(() => setGenerating(false), 1000);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="main-content">
        <Topbar title="Status Tracking" />

        <div className="dashboard-content">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              View detailed status history and timeline
            </h3>
          </div>

          <div className="cp-section" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#374151",
                  whiteSpace: "nowrap",
                }}
              >
                Select Project:
              </label>

              <div className="cp-select-wrap" style={{ flex: 1 }}>
                <select
                  className="cp-select"
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={{ fontSize: 14, padding: "10px 36px 10px 14px" }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference_no} - {p.title}
                    </option>
                  ))}
                </select>

                <span className="cp-select-chevron">
                  <ChevronDown size={14} />
                </span>
              </div>
            </div>
          </div>

          {project && (
            <div className="cp-section" style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div className="cp-section-title">Current Status</div>

                {isApproved && (
                  <button
                    type="button"
                    onClick={handleGeneratePDF}
                    disabled={generating}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "8px 18px",
                      borderRadius: 9,
                      border: "none",
                      background: "#1f7a1f",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: generating ? "not-allowed" : "pointer",
                      opacity: generating ? 0.7 : 1,
                    }}
                  >
                    <Printer size={14} />
                    {generating ? "Loading..." : "Print / Save PDF"}
                  </button>
                )}
              </div>

              <div className="st-current-grid">
                <div>
                  <p className="st-info-label">Reference No</p>
                  <p className="st-info-value">{project.reference_no}</p>
                </div>

                <div>
                  <p className="st-info-label">Current Status</p>
                  <span
                    className="badge"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.color,
                      marginTop: 4,
                      display: "inline-block",
                    }}
                  >
                    {project.current_status}
                  </span>
                </div>

                <div>
                  <p className="st-info-label">Submitted Date</p>
                  <p className="st-info-value">
                    {project.submitted_at ? fmtDate(project.submitted_at) : "—"}
                  </p>
                </div>

                <div>
                  <p className="st-info-label">Evaluation Score</p>
                  <p className="st-info-value">
                    {project.evaluation_score !== null &&
                    project.evaluation_score !== undefined
                      ? `${project.evaluation_score}/100`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="cp-section" style={{ marginBottom: 16 }}>
            <div className="cp-section-title">Status History Timeline</div>

            {loading && (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading...</p>
            )}

            {!loading && history.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>
                No status history yet.
              </p>
            )}

            <div className="st-timeline">
              {history.map((item, i) => {
                const hb =
                  STATUS_BADGE_STYLES[item.status] || {
                    bg: "#f3f4f6",
                    color: "#6b7280",
                  };

                return (
                  <div
                    key={`${item.status}-${item.date}-${item.time}-${i}`}
                    className="st-timeline-row"
                  >
                    <div className="st-timeline-left">
                      <TimelineIcon status={item.status} color={hb.color} />

                      {i < history.length - 1 && (
                        <div className="st-timeline-line" />
                      )}
                    </div>

                    <div className="st-timeline-card">
                      <div className="st-card-top">
                        <span
                          className="badge"
                          style={{ background: hb.bg, color: hb.color }}
                        >
                          {item.status}
                        </span>

                        <span className="st-card-date">
                          {item.date}
                          <br />
                          {item.time}
                        </span>
                      </div>

                      {item.remarks && (
                        <p className="st-card-title">{item.remarks}</p>
                      )}

                      <p className="st-card-action">
                        Action by: <strong>{item.action_by}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}