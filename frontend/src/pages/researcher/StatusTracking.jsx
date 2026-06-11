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

function handlePrintApproved(project, history, approvals, proposal, outputs = []) {
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
                  <span class="status-pill">${o.status || "Pending"}</span>
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
          <span class="value">${project.budget || project.total_budget || "—"}</span>

          <span class="label">Funding Type</span>
          <span class="value">${project.funding_type === "external" ? `Externally Funded (${project.funding_agency || "—"})` : "Locally Funded"}</span>

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

        <p class="small-muted" style="margin-top:8px;">
          Note: Uploaded files are stored separately in the system. This report only lists the attached output file names.
        </p>
      </div>

      <div class="section">
        <div class="section-title">VII. Uploaded Documents</div>
        ${(() => {
          const BASE = (import.meta.env.VITE_STORAGE_URL || "http://127.0.0.1:8000/storage") + "/";

          const safeParseCvs = (raw) => {
            if (!raw) return [];
            try {
              let p = raw;
              while (typeof p === "string") p = JSON.parse(p);
              return Array.isArray(p) ? p : p ? [p] : [];
            } catch { return raw ? [raw] : []; }
          };

          const docs = [
            { label: "Proposal Form", path: project.proposal_form_path || project.proposal_form },
            { label: "Work Plan",     path: project.work_plan_path || project.work_plan_file },
            { label: "Framework",     path: project.framework_path || project.framework_file },
            { label: "References",    path: project.references_path || project.references_file },
            ...safeParseCvs(project.cv_paths || project.cv_files).map((p, i) => ({ label: "CV (" + (i+1) + ")", path: p })),
          ];

          return docs.map((doc) => {
            if (!doc.path) {
              return '<div style="margin-bottom:14px;"><p style="font-weight:700;font-size:8.5pt;color:#374151;margin:0 0 4px;">' + doc.label + '</p><p style="font-size:8pt;color:#94a3b8;font-style:italic;margin:0;">Not uploaded</p></div>';
            }
            const url = BASE + doc.path;
            const fileName = String(doc.path).split("/").pop();
            const isImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(doc.path);
            // Default to iframe for non-images (handles PDFs without extensions)
            let preview = '';
            if (isImage) {
              preview = '<img src="' + url + '" style="max-width:100%;max-height:300px;object-fit:contain;border:1px solid #e5e7eb;border-radius:4px;display:block;" />';
            } else {
              preview = '<iframe src="' + url + '" style="width:100%;height:420px;border:1px solid #e5e7eb;border-radius:4px;" title="' + doc.label + '"></iframe>';
            }
            return '<div style="margin-bottom:18px;break-inside:avoid;page-break-inside:avoid;"><p style="font-weight:700;font-size:8.5pt;color:#1f7a1f;margin:0 0 5px;border-bottom:1px solid #e5e7eb;padding-bottom:3px;">' + doc.label + ' — ' + fileName + '</p>' + preview + '</div>';
          }).join("");
        })()}
      </div>

      <div style="margin-top:28px; border-top:2px solid #1f7a1f; padding-top:16px;">
        <p style="font-family:Arial,sans-serif; font-size:8pt; font-weight:700; color:#1f7a1f; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:16px;">
          Official Signatures — F-RPP-001
        </p>
        <table style="width:100%; border-collapse:collapse; font-family:Arial,sans-serif; font-size:8pt;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:6px 8px; border-bottom:1.5px solid #d1d5db; text-align:left; color:#334155;">Role</th>
              <th style="padding:6px 8px; border-bottom:1.5px solid #d1d5db; text-align:center; color:#334155;">Signature</th>
              <th style="padding:6px 8px; border-bottom:1.5px solid #d1d5db; text-align:left; color:#334155;">Name &amp; Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 8px; font-weight:700; border-bottom:1px solid #edf2f7;">Recommending Approval:<br/><span style="font-weight:400; color:#64748b;">Vice President for Research, Innovation &amp; Extension</span></td>
              <td style="padding:10px 8px; text-align:center; border-bottom:1px solid #edf2f7; min-width:120px;">
                ${getSig("Recommended") ? `<img src="${getSig("Recommended")}" style="max-height:32px; max-width:110px; object-fit:contain; display:block; margin:0 auto;" />` : `<div style="border-bottom:1px solid #374151; min-height:36px; width:80%; margin:0 auto;"></div>`}
              </td>
              <td style="padding:10px 8px; border-bottom:1px solid #edf2f7;">
                <div style="font-weight:600;">${[...history].reverse().find(h => h.status === "Recommended")?.action_by || "___________________________"}</div>
                <div style="font-size:7pt; color:#64748b; margin-top:2px;">Date: ${[...history].reverse().find(h => h.status === "Recommended")?.date || "___________"}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 8px; font-weight:700;">Approved by:<br/><span style="font-weight:400; color:#64748b;">SUC President</span></td>
              <td style="padding:10px 8px; text-align:center; min-width:120px;">
                ${getSig("Approved") ? `<img src="${getSig("Approved")}" style="max-height:32px; max-width:110px; object-fit:contain; display:block; margin:0 auto;" />` : `<div style="border-bottom:1px solid #374151; min-height:36px; width:80%; margin:0 auto;"></div>`}
              </td>
              <td style="padding:10px 8px;">
                <div style="font-weight:600;">${[...history].reverse().find(h => h.status === "Approved")?.action_by || "___________________________"}</div>
                <div style="font-size:7pt; color:#64748b; margin-top:2px;">Date: ${[...history].reverse().find(h => h.status === "Approved")?.date || "___________"}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <p style="font-size:7pt; color:#94a3b8; margin-top:6px;">F-RPP-001 Rev. 03 10/06/2023</p>
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

      handlePrintApproved(printableProject, history, approvals, proposal, outputs);
    } catch (e) {
      console.error("Failed to fetch printable data", e);
      handlePrintApproved(project, history, [], {}, outputs);
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