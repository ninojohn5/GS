// src/pages/researcher/Dashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  User,
  FileText,
  CheckCircle2,
  ClipboardList,
  Receipt,
  ArrowRight,
  Clock,
  XCircle,
  RotateCcw,
  Wallet,
  Activity,
  TrendingUp,
  PlusCircle,
  Eye,
  Calendar,
  Layers,
} from "lucide-react";
import api from "../../utils/api";

const PIE_COLORS = [
  "#16a34a",
  "#1d4ed8",
  "#7c3aed",
  "#f59e0b",
  "#dc2626",
  "#6b7280",
];

const STATUS_STYLES = {
  Draft: { bg: "#f3f4f6", color: "#4b5563", border: "#e5e7eb" },
  Submitted: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Pending: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Under Evaluation": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Evaluated: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  Endorsed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  Forwarded: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  Returned: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  if (status === "Presentation Scheduled") return "Scheduled";
  return status;
};

// CHANGED: handles pure numbers AND raw strings
// "2222" → ₱2,222 | "250,000" → ₱250,000 | "to be determined" → to be determined | null → —
const fmtCurrency = (raw) => {
  if (!raw && raw !== 0) return "—";
  const str = String(raw).trim();
  if (!str || str === "0") return "—";
  const cleaned = str.replace(/[₱,\s]/g, "");
  const num = parseFloat(cleaned);
  if (!isNaN(num) && cleaned.replace(/[\d.]/g, "") === "") {
    return `₱${num.toLocaleString()}`;
  }
  return str;
};

// For stat card total — smart K/M suffix
const fmtTotalBudget = (n) => {
  if (!n || n === 0) return "₱0";
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(1)}K`;
  return `₱${n.toLocaleString()}`;
};

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

const getProjectId = (p) =>
  p.reference_no || p.project_id || p.proposal_id || `PRJ-${p.id}`;

// CHANGED: returns raw budget string (not parsed to number)
const getRawBudget = (p) =>
  p.budget || p.total_budget || p.proposal?.total_budget || null;

// Numeric budget for totals/charts only
const getNumericBudget = (p) => {
  const raw = getRawBudget(p);
  if (!raw) return 0;
  const num = parseFloat(String(raw).replace(/[^\d.]/g, ""));
  return isNaN(num) ? 0 : num;
};

const getDepartment = (p) =>
  p.department_center?.name ||
  p.department ||
  p.creator?.department ||
  p.proposal?.department ||
  "Unassigned";

const PieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  const R = Math.PI / 180;
  const r = outerRadius + 36;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);

  return (
    <text
      x={x}
      y={y}
      fill="#374151"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={500}
    >
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const style = STATUS_STYLES[normalized] || {
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
        fontWeight: 700,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {normalized}
    </span>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  action,
  onAction,
  accentColor,
}) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderTop: `3px solid ${accentColor}`,
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: "#6b7280",
            fontWeight: 600,
          }}
        >
          {label}
        </p>

        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={iconColor} strokeWidth={1.8} />
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 31,
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>

      <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{sub}</p>

      {action && (
        <button type="button" onClick={onAction} style={LINK_BTN}>
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function EmptyBox({ icon: Icon = FileText, title, subtitle }) {
  return (
    <div
      style={{
        padding: "34px 20px",
        textAlign: "center",
        color: "#9ca3af",
      }}
    >
      <Icon
        size={34}
        color="#d1d5db"
        style={{ margin: "0 auto 10px", display: "block" }}
      />

      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#374151" }}>
        {title}
      </p>

      <p style={{ margin: "5px 0 0", fontSize: 12, color: "#9ca3af" }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    Promise.allSettled([
      api.get("/dashboard/stats"),
      api.get("/projects"),
    ])
      .then(([statsRes, projectsRes]) => {
        const statsData =
          statsRes.status === "fulfilled" ? statsRes.value.data || null : null;

        setStats(statsData);

        if (
          projectsRes.status === "fulfilled" &&
          Array.isArray(projectsRes.value.data)
        ) {
          setProjects(projectsRes.value.data);
        } else if (Array.isArray(statsData?.recent_projects)) {
          setProjects(statsData.recent_projects);
        } else if (Array.isArray(statsData?.projects)) {
          setProjects(statsData.projects);
        } else {
          setProjects([]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = stats?.status_counts || {};

  const derivedStatusCounts =
    Object.keys(statusCounts).length > 0
      ? statusCounts
      : projects.reduce((acc, p) => {
          const status = normalizeStatus(p.status);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

  const pieData = Object.entries(derivedStatusCounts)
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((d) => d.value > 0);

  // CHANGED: build barData from actual projects grouped by dept — always has data
  const deptMap = projects.reduce((acc, p) => {
    const dept = getDepartment(p);
    if (!acc[dept]) acc[dept] = { dept, count: 0, budget: 0 };
    acc[dept].count  += 1;
    acc[dept].budget += getNumericBudget(p);
    return acc;
  }, {});
  const barData = Object.values(deptMap).filter((d) => d.count > 0);

  const myProjects = Number(stats?.my_projects ?? projects.length ?? 0);

  const submitted = Number(
    stats?.submitted ??
      projects.filter((p) =>
        [
          "Submitted",
          "Pending",
          "Scheduled",
          "Under Evaluation",
          "Evaluated",
          "Endorsed",
          "Recommended",
          "Forwarded",
        ].includes(normalizeStatus(p.status))
      ).length
  );

  const approved = Number(
    stats?.approved ??
      projects.filter((p) => normalizeStatus(p.status) === "Approved").length
  );

  const rejected = Number(
    stats?.rejected ??
      projects.filter((p) => normalizeStatus(p.status) === "Rejected").length
  );

  const forRevision = Number(
    stats?.for_revision ??
      stats?.returned ??
      projects.filter((p) =>
        ["Returned", "For Revision"].includes(normalizeStatus(p.status))
      ).length
  );

  // CHANGED: sum only numeric budgets from current projects list
  // automatically reduces when a project is archived/deleted since projects list updates
  const totalBudget = projects.reduce((sum, p) => sum + getNumericBudget(p), 0);

  const approvalRate = pct(approved, myProjects);

  const localCount = Number(
    stats?.local_count ??
      projects.filter((p) => (p.funding_type || "local") === "local").length
  );

  const externalCount = Number(
    stats?.external_count ??
      projects.filter((p) => p.funding_type === "external").length
  );

  const latestProjects = [...projects]
    .sort((a, b) => {
      const da = new Date(a.updated_at || a.created_at || a.submitted_at || 0);
      const db = new Date(b.updated_at || b.created_at || b.submitted_at || 0);
      return db - da;
    })
    .slice(0, 5);

  const activePipeline = [
    {
      label: "Submitted",
      value: submitted,
      icon: FileText,
      bg: "#fff7ed",
      color: "#c2410c",
    },
    {
      label: "Approved",
      value: approved,
      icon: CheckCircle2,
      bg: "#dcfce7",
      color: "#15803d",
    },
    {
      label: "For Revision",
      value: forRevision,
      icon: RotateCcw,
      bg: "#fef3c7",
      color: "#d97706",
    },
    {
      label: "Rejected",
      value: rejected,
      icon: XCircle,
      bg: "#fef2f2",
      color: "#dc2626",
    },
  ];

  return (
    <>
      <style>{`
        .rs-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .rs-main-grid {
          display: grid;
          grid-template-columns: 1.45fr .9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .rs-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .rs-table {
          width: 100%;
          border-collapse: collapse;
        }

        .rs-table th {
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: .04em;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          white-space: nowrap;
        }

        .rs-table td {
          padding: 12px;
          font-size: 13px;
          color: #374151;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }

        .rs-table tr:last-child td {
          border-bottom: none;
        }

        .rs-table tr:hover td {
          background: #fafafa;
        }

        @media(max-width:1150px) {
          .rs-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .rs-main-grid {
            grid-template-columns: 1fr;
          }

          .rs-chart-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width:700px) {
          .rs-stat-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width:900px) {
          .rs-activity-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="dashboard-layout">
        <Navbar />

        <div className="main-content">
          <Topbar title="Dashboard" />

          <div className="dashboard-content">
            {/* Header */}
            <div
              style={{
                background:
                  "linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)",
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 18,
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                boxShadow: "0 6px 18px rgba(22, 163, 74, 0.18)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "left",
                  paddingLeft: 0,
                  marginLeft: 0,
                }}
              >
                <p
                  style={{
                    margin: "0 0 4px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    opacity: 0.82,
                    textAlign: "left",
                  }}
                >
                  Researcher Workspace
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 21,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: "#fff",
                    textAlign: "left",
                  }}
                >
                  Research Project Dashboard
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    opacity: 0.9,
                    textAlign: "left",
                  }}
                >
                  Track your proposals, approval progress, project status, and
                  budget activity in one place.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/researcher/proposals")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  border: "none",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#15803d",
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
                  flexShrink: 0,
                }}
              >
                Create proposal<PlusCircle size={15} />
              </button>
            </div>

            {/* Stat Cards */}
            <div className="rs-stat-grid">
              <StatCard
                icon={User}
                iconColor="#1d4ed8"
                iconBg="#dbeafe"
                accentColor="#1d4ed8"
                label="My Projects"
                value={loading ? "—" : myProjects}
                sub="Total research projects"
                action="View projects"
                onAction={() => navigate("/researcher/projects")}
              />

              <StatCard
                icon={FileText}
                iconColor="#c2410c"
                iconBg="#fff7ed"
                accentColor="#f59e0b"
                label="Submitted"
                value={loading ? "—" : submitted}
                sub="Active in review pipeline"
                action={submitted > 0 ? "Track status" : null}
                onAction={() => navigate("/researcher/projects")}
              />

              <StatCard
                icon={CheckCircle2}
                iconColor="#15803d"
                iconBg="#dcfce7"
                accentColor="#16a34a"
                label="Approved"
                value={loading ? "—" : approved}
                sub={`${approvalRate}% approval rate`}
              />

              {/* CHANGED: uses fmtTotalBudget with numeric-only sum */}
              <StatCard
                icon={Receipt}
                iconColor="#7c3aed"
                iconBg="#f5f3ff"
                accentColor="#7c3aed"
                label="Total Budget"
                value={loading ? "—" : fmtTotalBudget(totalBudget)}
                sub="Sum of numeric budgets"
              />
            </div>

            {/* Funding Type Breakdown */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#15803d" }}>{loading ? "—" : localCount}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#166534" }}>Locally Funded</p>
                </div>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1d4ed8" }}>{loading ? "—" : externalCount}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#1e40af" }}>Externally Funded</p>
                </div>
              </div>
            </div>

            {/* Recent projects and summary */}
            <div className="rs-main-grid">
              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>My Recent Projects</h3>
                    <p style={CARD_SUB}>
                      Latest proposals and research projects you submitted.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/researcher/projects")}
                    style={LINK_BTN}
                  >
                    View all <ArrowRight size={13} />
                  </button>
                </div>

                {loading ? (
                  <EmptyBox
                    icon={Clock}
                    title="Loading projects..."
                    subtitle="Fetching your latest research projects."
                  />
                ) : latestProjects.length === 0 ? (
                  <EmptyBox
                    icon={FileText}
                    title="No projects yet"
                    subtitle="Create and submit a proposal to start tracking your research."
                  />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="rs-table">
                      <thead>
                        <tr>
                          <th>Ref No</th>
                          <th>Title</th>
                          <th>Department</th>
                          <th>Budget</th>
                          <th>Status</th>
                          <th>Updated</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {latestProjects.map((p) => (
                          <tr key={p.id}>
                            <td
                              style={{
                                fontWeight: 700,
                                color: "#111827",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {getProjectId(p)}
                            </td>

                            <td style={{ maxWidth: 260 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {p.title ||
                                  p.proposal?.title ||
                                  "Untitled Proposal"}
                              </p>
                            </td>

                            <td>{getDepartment(p)}</td>

                            {/* CHANGED: show raw budget string */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              {fmtCurrency(getRawBudget(p))}
                            </td>

                            <td>
                              <StatusBadge status={p.status} />
                            </td>

                            <td style={{ whiteSpace: "nowrap" }}>
                              {fmtDate(p.updated_at || p.created_at)}
                            </td>

                            <td>
                              <button
                                type="button"
                                onClick={() => navigate("/researcher/projects")}
                                style={SMALL_GREEN_BTN}
                              >
                                <Eye size={13} /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Project Pipeline</h3>
                    <p style={CARD_SUB}>Quick status summary of your projects.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {activePipeline.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: "12px 14px",
                          border: "1px solid #f1f5f9",
                          borderRadius: 12,
                          background: "#fff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 9,
                              background: item.bg,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon size={17} color={item.color} />
                          </div>

                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#374151",
                            }}
                          >
                            {item.label}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          {loading ? "—" : item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 14px",
                    borderRadius: 12,
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <TrendingUp
                    size={17}
                    color="#15803d"
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />

                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        fontWeight: 800,
                        color: "#14532d",
                      }}
                    >
                      Approval Progress
                    </p>

                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#166534",
                        lineHeight: 1.45,
                      }}
                    >
                      Track proposal movement from evaluation to final approval
                      through your projects page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {!loading && pieData.length === 0 && barData.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: "60px 24px",
                  textAlign: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  marginBottom: 20,
                }}
              >
                <FileText
                  size={40}
                  color="#d1d5db"
                  style={{ margin: "0 auto 12px", display: "block" }}
                />

                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#374151" }}>
                  No chart data yet
                </p>

                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>
                  Charts will appear once you submit proposals and budget data is available.
                </p>
              </div>
            ) : (
              <div className="rs-chart-grid">
                {pieData.length > 0 && (
                  <div style={CARD}>
                    <div style={CARD_TOP}>
                      <div>
                        <h3 style={CARD_H}>Project Status Distribution</h3>
                        <p style={CARD_SUB}>
                          Breakdown of your proposals by current status.
                        </p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={270}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={88}
                          label={PieLabel}
                          labelLine
                          dataKey="value"
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>

                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* CHANGED: uses project count per dept — always shows data */}
                {barData.length > 0 ? (
                  <div style={CARD}>
                    <div style={CARD_TOP}>
                      <div>
                        <h3 style={CARD_H}>Projects by Department</h3>
                        <p style={CARD_SUB}>
                          Number of projects grouped by department.
                        </p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={270}>
                      <BarChart
                        data={barData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                        <XAxis
                          dataKey="dept"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                        />

                        <YAxis
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          allowDecimals={false}
                          label={{
                            value: "Projects",
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 11,
                            fill: "#9ca3af",
                          }}
                        />

                        <Tooltip
                          formatter={(v, name) =>
                            name === "count" ? [v, "Projects"] : [v, name]
                          }
                        />

                        <Bar
                          dataKey="count"
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                          name="count"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={CARD}>
                    <EmptyBox
                      icon={Wallet}
                      title="No department data"
                      subtitle="Chart will appear once proposals include department information."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Activity summary */}
            <div style={CARD}>
              <div style={CARD_TOP}>
                <div>
                  <h3 style={CARD_H}>Research Activity Summary</h3>
                  <p style={CARD_SUB}>
                    Quick overview of your proposal activity and next steps.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/researcher/projects")}
                  style={LINK_BTN}
                >
                  Open projects <ArrowRight size={13} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 12,
                }}
                className="rs-activity-grid"
              >
                {[
                  {
                    icon: Layers,
                    title: "Project Records",
                    value: myProjects,
                    desc: "Total research records under your account.",
                    color: "#1d4ed8",
                    bg: "#dbeafe",
                  },
                  {
                    icon: Calendar,
                    title: "In Review",
                    value: submitted,
                    desc: "Submitted proposals still moving in the workflow.",
                    color: "#c2410c",
                    bg: "#fff7ed",
                  },
                  {
                    icon: Activity,
                    title: "Approval Rate",
                    value: `${approvalRate}%`,
                    desc: "Approved projects compared to total records.",
                    color: "#15803d",
                    bg: "#dcfce7",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      style={{
                        padding: "16px",
                        borderRadius: 12,
                        border: "1px solid #f1f5f9",
                        background: "#fff",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: item.bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Icon size={18} color={item.color} />
                      </div>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#6b7280",
                        }}
                      >
                        {item.title}
                      </p>

                      <p
                        style={{
                          margin: "3px 0",
                          fontSize: 24,
                          fontWeight: 800,
                          color: "#111827",
                        }}
                      >
                        {loading ? "—" : item.value}
                      </p>

                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#9ca3af",
                          lineHeight: 1.45,
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const CARD = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  padding: "20px 22px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};

const CARD_TOP = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 14,
};

const CARD_H = {
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  color: "#111827",
};

const CARD_SUB = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#9ca3af",
};

const LINK_BTN = {
  marginTop: 4,
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 800,
  color: "#16a34a",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: 0,
  whiteSpace: "nowrap",
};

const SMALL_GREEN_BTN = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "7px 13px",
  borderRadius: 8,
  border: "none",
  background: "#16a34a",
  color: "#fff",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
};