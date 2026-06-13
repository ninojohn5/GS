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
import csuLogoUrl from "../../assets/logo.png";

// Convert logo to base64 so it works inside window.open()
const getLogoBase64 = () => new Promise((resolve) => {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    resolve(canvas.toDataURL("image/png"));
  };
  img.onerror = () => resolve("");
  img.src = csuLogoUrl;
});
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
  Pending: { bg: "#f3f4f6", color: "#6b7280" },
  Completed: { bg: "#dcfce7", color: "#15803d" },
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

function handlePrintApproved(project, history, approvals, proposal, outputs = [], logoBase64 = "") {
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
                      ? `<img src="${sig}" class="sig-img-md" />`
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
                  <span class="pill pill-purple">${e.overall_remarks || "—"}</span>
                </td>
                <td>${e.comments || "—"}</td>
                <td class="center">
                  ${
                    e.signature_image
                      ? `<img src="${e.signature_image}" class="sig-img-md" />`
                      : `<span class="muted italic">No signature</span>`
                  }
                  <div class="small-muted">${e.evaluated_at ? fmtDate(e.evaluated_at) : "—"}</div>
                </td>
              </tr>
            `;
          })
          .join("")
      : `<tr><td colspan="9" class="muted italic">No evaluator records found.</td></tr>`;

  const outputRows =
    outputs.length > 0
      ? outputs
          .map(
            (o, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td class="strong">${o.output_type || "—"}</td>
                <td>${o.description || "—"}</td>
                <td class="center">
                  <span class="pill pill-green">${o.status || "Pending"}</span>
                </td>
                <td class="center">${o.target_date ? fmtDate(o.target_date) : "—"}</td>
                <td>${o.file_name || "No uploaded file"}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="6" class="muted italic">No research outputs uploaded yet.</td></tr>`;

  const approvalSteps = [
    { status: "Endorsed",    role: "RDISO Director / ESO Director",                    action: "Endorsed"    },
    { status: "Recommended", role: "Vice President for Research, Innovation & Extension", action: "Recommended" },
    { status: "Approved",    role: "University President",                              action: "Approved"    },
  ];

  const approvalRows = approvalSteps
    .map((step) => {
      const match = [...history].reverse().find((h) => h.status === step.status);
      const sig = getSig(step.action);

      return `
        <tr>
          <td class="strong">${step.role}</td>
          <td class="center">
            <span class="pill pill-green">${step.action}</span>
          </td>
          <td>${match ? `${match.date} ${match.time}` : "—"}</td>
          <td>
            ${sig ? `<img src="${sig}" class="sig-img-sm" />` : ""}
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
      <title>Research Proposal - ${project.reference_no || ""}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: Arial, sans-serif;
          font-size: 9pt;
          color: #1a1a1a;
          background: #fff;
          padding: 20px 28px;
        }

        /* ── Header ── */
        .doc-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-bottom: 12px;
          border-bottom: 2.5px solid #1a472a;
          margin-bottom: 14px;
        }

        .doc-header img {
          width: 58px;
          height: 58px;
          object-fit: contain;
          flex-shrink: 0;
        }

        .doc-header-text { flex: 1; }

        .doc-header-university {
          font-size: 8pt;
          font-weight: 700;
          color: #1a472a;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 2px;
        }

        .doc-header-system {
          font-size: 7.5pt;
          color: #555;
          margin-bottom: 4px;
        }

        .doc-header-title {
          font-size: 13pt;
          font-weight: 700;
          color: #111;
          line-height: 1.25;
        }

        .doc-header-right {
          text-align: right;
          flex-shrink: 0;
        }

        .doc-header-ref {
          font-size: 7.5pt;
          color: #555;
          margin-bottom: 3px;
        }

        .doc-header-badge {
          display: inline-block;
          padding: 3px 12px;
          border-radius: 3px;
          background: #1a472a;
          color: #fff;
          font-size: 8pt;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        /* ── Section ── */
        .section {
          margin-bottom: 14px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .section-title {
          font-size: 8pt;
          font-weight: 700;
          color: #fff;
          background: #1a472a;
          padding: 4px 10px;
          margin-bottom: 8px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* ── Info grid ── */
        .info-grid {
          display: grid;
          grid-template-columns: 170px 1fr;
          gap: 3px 12px;
          font-size: 9pt;
          padding: 0 4px;
        }

        .info-label { color: #555; }
        .info-value { font-weight: 700; color: #111; }

        /* ── Tables ── */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }

        thead { display: table-header-group; }
        tr { break-inside: avoid; page-break-inside: avoid; }

        th {
          background: #f0f4f0;
          text-align: left;
          padding: 5px 7px;
          color: #1a472a;
          font-weight: 700;
          font-size: 7.8pt;
          border: 1px solid #c8d8c8;
        }

        td {
          padding: 5px 7px;
          border: 1px solid #e0e8e0;
          vertical-align: middle;
          color: #1a1a1a;
        }

        td.center, th.center { text-align: center; }
        td.strong { font-weight: 700; }
        td.muted { color: #888; }
        td.italic { font-style: italic; }

        .small-muted {
          font-size: 7.2pt;
          color: #888;
          margin-top: 2px;
        }

        /* ── Pills ── */
        .pill {
          display: inline-block;
          padding: 2px 9px;
          border-radius: 2px;
          font-size: 7.5pt;
          font-weight: 700;
          white-space: nowrap;
        }

        .pill-green  { background: #dcfce7; color: #14532d; border: 1px solid #86efac; }
        .pill-purple { background: #ede9fe; color: #4c1d95; border: 1px solid #c4b5fd; }
        .pill-blue   { background: #dbeafe; color: #1e3a8a; border: 1px solid #93c5fd; }
        .pill-yellow { background: #fef9c3; color: #713f12; border: 1px solid #fde047; }
        .pill-gray   { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }

        /* ── Signatures ── */
        .sig-img-sm {
          max-height: 28px;
          max-width: 100px;
          object-fit: contain;
          display: block;
          margin-bottom: 2px;
        }

        .sig-img-md {
          max-height: 34px;
          max-width: 120px;
          object-fit: contain;
          display: block;
          margin: 0 auto 2px;
        }

        .sig-line {
          border-bottom: 1px solid #374151;
          min-height: 32px;
          width: 80%;
          margin: 0 auto;
        }

        .approved-name {
          font-size: 8pt;
          font-weight: 700;
          color: #111;
          line-height: 1.3;
        }

        .approval-remarks {
          font-size: 7.2pt;
          color: #666;
          font-style: italic;
          margin-top: 2px;
        }

        /* ── Official signatures block ── */
        .sig-block-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          font-size: 8.5pt;
        }

        .sig-block-table td {
          border: 1px solid #c8d8c8;
          padding: 10px 12px;
          vertical-align: top;
        }

        .sig-role-title {
          font-weight: 700;
          color: #1a472a;
          margin-bottom: 2px;
        }

        .sig-role-sub {
          font-size: 7.5pt;
          color: #555;
          margin-bottom: 6px;
        }

        /* ── Footer ── */
        .doc-footer {
          margin-top: 18px;
          padding-top: 8px;
          border-top: 1.5px solid #1a472a;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 7pt;
          color: #888;
        }

        @media print {
          body { padding: 10px 16px; }
          @page { size: A4; margin: 0.35in; }
        }
      </style>
    </head>
    <body>

      <!-- Header -->
      <div class="doc-header">
        <img src="${logoBase64}" alt="CSU Logo" />
        <div class="doc-header-text">
          <div class="doc-header-university">Caraga State University</div>
          <div class="doc-header-system">Research Project Proposal Management System</div>
          <div class="doc-header-title">${project.title || "Untitled Proposal"}</div>
        </div>
        <div class="doc-header-right">
          <div class="doc-header-ref">${project.reference_no || "—"}</div>
          <span class="doc-header-badge">APPROVED</span>
        </div>
      </div>

      <!-- I. Project Information -->
      <div class="section">
        <div class="section-title">I. Project Information</div>
        <div class="info-grid">
          <span class="info-label">Reference No.</span>
          <span class="info-value">${project.reference_no || "—"}</span>
          <span class="info-label">Type of Scholarly Work</span>
          <span class="info-value">${project.type || project.scholarly_work_type || "Research"}</span>
          <span class="info-label">Total Proposed Budget</span>
          <span class="info-value">${project.budget || project.total_budget || "—"}</span>
          <span class="info-label">Funding Type</span>
          <span class="info-value">${project.funding_type === "external" ? `Externally Funded (${project.funding_agency || "—"})` : "Locally Funded"}</span>
          <span class="info-label">Proposed Start Date</span>
          <span class="info-value">${fmtDate(project.start_date)}</span>
          <span class="info-label">Proposed Completion Date</span>
          <span class="info-value">${fmtDate(project.end_date)}</span>
          <span class="info-label">Evaluation Score</span>
          <span class="info-value">${evalScore !== null && evalScore !== undefined ? `${fmtScore(evalScore)} / 100` : "—"}</span>
          <span class="info-label">Date Submitted</span>
          <span class="info-value">${proposal?.submitted_at ? fmtDate(proposal.submitted_at) : "—"}</span>
        </div>
      </div>

      <!-- II. Proponents -->
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

      <!-- III. Evaluation Summary -->
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

      <!-- IV. Approval Chain -->
      <div class="section">
        <div class="section-title">IV. Approval Chain</div>
        <table>
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

      <!-- V. Status History -->
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
            ${history.map((item) => `
              <tr>
                <td>${item.status}</td>
                <td>${item.date} ${item.time}</td>
                <td>${item.action_by}</td>
                <td>${item.remarks || "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <!-- VI. Research Outputs -->
      <div class="section">
        <div class="section-title">VI. Research Outputs</div>
        <table>
          <thead>
            <tr>
              <th class="center">#</th>
              <th>Output Type</th>
              <th>Description</th>
              <th class="center">Status</th>
              <th class="center">Target Date</th>
              <th>Uploaded File</th>
            </tr>
          </thead>
          <tbody>${outputRows}</tbody>
        </table>
      </div>

      <!-- VII. Official Signatures -->
      <div class="section">
        <div class="section-title">VII. Official Signatures &mdash; F-RPP-001</div>
        <table class="sig-block-table">
          <tbody>
            <tr>
              <td style="width:35%">
                <div class="sig-role-title">Recommending Approval</div>
                <div class="sig-role-sub">Vice President for Research, Innovation &amp; Extension</div>
                ${getSig("Recommended")
                  ? `<img src="${getSig("Recommended")}" class="sig-img-md" />`
                  : `<div class="sig-line"></div>`}
                <div style="margin-top:5px; font-weight:700; font-size:8.5pt;">
                  ${[...history].reverse().find(h => h.status === "Recommended")?.action_by || ""}
                </div>
                <div style="font-size:7.5pt; color:#555;">
                  Date: ${[...history].reverse().find(h => h.status === "Recommended")?.date || "___________"}
                </div>
              </td>
              <td style="width:35%">
                <div class="sig-role-title">Approved By</div>
                <div class="sig-role-sub">SUC President</div>
                ${getSig("Approved")
                  ? `<img src="${getSig("Approved")}" class="sig-img-md" />`
                  : `<div class="sig-line"></div>`}
                <div style="margin-top:5px; font-weight:700; font-size:8.5pt;">
                  ${[...history].reverse().find(h => h.status === "Approved")?.action_by || ""}
                </div>
                <div style="font-size:7.5pt; color:#555;">
                  Date: ${[...history].reverse().find(h => h.status === "Approved")?.date || "___________"}
                </div>
              </td>
              <td style="width:30%; vertical-align:middle; text-align:center;">
                <img src="${logoBase64}" style="width:52px; height:52px; object-fit:contain; opacity:0.15;" />
              </td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:7pt; color:#888; margin-top:5px;">F-RPP-001 Rev. 03 10/06/2023</p>
      </div>

      <!-- Footer -->
      <div class="doc-footer">
        <span>Caraga State University - Research Project Management System</span>
        <span>Generated: ${today}</span>
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
  const [outputs, setOutputs] = useState([]);
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
    setOutputs([]);

    Promise.all([
      api.get(`/projects/${selectedId}/status-history`),
      api.get(`/projects/${selectedId}/outputs`),
    ])
      .then(([statusRes, outputsRes]) => {
        setTrackingData(statusRes.data);
        setOutputs(Array.isArray(outputsRes.data) ? outputsRes.data : []);
      })
      .catch((err) => {
        console.error("Failed to load status tracking data", err);
        setTrackingData(null);
        setOutputs([]);
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
      const [projectRes, proposalRes, logoBase64] = await Promise.all([
        api.get(`/projects/${selectedId}`),
        api.get(`/proposals/${selectedId}`).catch(() => ({ data: {} })),
        getLogoBase64(),
      ]);

      const fullData = projectRes.data?.project || projectRes.data || {};
      const approvals = fullData?.approvals || projectRes.data?.approvals || [];
      const proposal = proposalRes.data?.proposal || proposalRes.data || {};

      const printableProject = {
        ...fullData,
        evaluation_score:
          project?.evaluation_score ??
          fullData?.evaluation_score ??
          fullData?.average_score ??
          null,
      };

      handlePrintApproved(printableProject, history, approvals, proposal, outputs, logoBase64);
    } catch (e) {
      console.error("Failed to fetch printable data", e);
      handlePrintApproved(project, history, [], {}, outputs, "");
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

          {/* For Revision banner */}
          {project?.current_status === "For Revision" && (() => {
            const returnEntry = history.find((h) => h.status === "For Revision");
            return returnEntry ? (
              <div style={{
                display: "flex", gap: 12, alignItems: "flex-start",
                background: "#fffbeb", border: "1.5px solid #fcd34d",
                borderRadius: 12, padding: "16px 18px", marginBottom: 16,
              }}>
                <span style={{ fontSize: 22 }}>⚠️</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#92400e" }}>
                    Your proposal was returned for revision
                  </p>
                  <p style={{ margin: "6px 0 0", fontSize: 13, color: "#78350f", lineHeight: 1.6 }}>
                    <strong>Reason:</strong> {returnEntry.remarks || "No reason provided."}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#92400e" }}>
                    Returned by <strong>{returnEntry.action_by}</strong> on {returnEntry.date}
                  </p>
                </div>
              </div>
            ) : null;
          })()}

          {project && (
            <div className="cp-section" style={{ marginBottom: 16 }}>
              <div className="cp-section-title">Research Outputs</div>

              {loading && (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading outputs...</p>
              )}

              {!loading && outputs.length === 0 && (
                <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                  No research outputs uploaded yet.
                </p>
              )}

              {!loading && outputs.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "10px 8px",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          Output Type
                        </th>

                        <th
                          style={{
                            textAlign: "left",
                            padding: "10px 8px",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          Description
                        </th>

                        <th
                          style={{
                            textAlign: "center",
                            padding: "10px 8px",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          Status
                        </th>

                        <th
                          style={{
                            textAlign: "center",
                            padding: "10px 8px",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          Target Date
                        </th>

                        <th
                          style={{
                            textAlign: "left",
                            padding: "10px 8px",
                            color: "#6b7280",
                            fontWeight: 700,
                          }}
                        >
                          Uploaded File
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {outputs.map((o) => {
                        const outputStatusStyle =
                          STATUS_BADGE_STYLES[o.status] ||
                          STATUS_BADGE_STYLES.Pending;

                        return (
                          <tr
                            key={o.id}
                            style={{ borderBottom: "1px solid #f3f4f6" }}
                          >
                            <td
                              style={{
                                padding: "10px 8px",
                                fontWeight: 700,
                                color: "#111827",
                                verticalAlign: "top",
                              }}
                            >
                              {o.output_type || "—"}
                            </td>

                            <td
                              style={{
                                padding: "10px 8px",
                                color: "#374151",
                                verticalAlign: "top",
                                lineHeight: 1.5,
                              }}
                            >
                              {o.description || "—"}
                            </td>

                            <td
                              style={{
                                padding: "10px 8px",
                                textAlign: "center",
                                verticalAlign: "top",
                              }}
                            >
                              <span
                                className="badge"
                                style={{
                                  background: outputStatusStyle.bg,
                                  color: outputStatusStyle.color,
                                }}
                              >
                                {o.status || "Pending"}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "10px 8px",
                                textAlign: "center",
                                color: "#374151",
                                verticalAlign: "top",
                              }}
                            >
                              {o.target_date ? fmtDate(o.target_date) : "—"}
                            </td>

                            <td
                              style={{
                                padding: "10px 8px",
                                verticalAlign: "top",
                              }}
                            >
                              {o.file_url ? (
                                <a
                                  href={o.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    color: "#1d4ed8",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                  }}
                                >
                                  {o.file_name || "View file"}
                                </a>
                              ) : (
                                <span style={{ color: "#9ca3af" }}>No file</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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