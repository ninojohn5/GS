import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FileText,
  Download,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  ChevronDown,
  BarChart2,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const EMPTY_REPORTS = {
  summary: {
    totalProposals: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    totalBudget: 0,
    avgScore: 0,
    totalFaculty: 0,
    totalEvaluators: 0,
  },
  monthly: [],
  byDepartment: [],
  statusDist: [],
  topProposals: [],
  evaluatorPerf: [],
};

const fmt = (n) => Number(n || 0).toLocaleString();
const fmtM = (n) => `₱${(Number(n || 0) / 1000000).toFixed(2)}M`;

const normalizeStatus = (status) => {
  if (!status) return "Pending";
  if (status === "Submitted") return "Pending";
  if (status === "Presentation Scheduled") return "Scheduled";
  return status;
};

const getProjectBudget = (p) =>
  Number(p.budget || p.total_budget || p.proposal?.total_budget || 0);

const getDepartmentName = (p) =>
  p.department_center?.name ||
  p.department ||
  p.creator?.department ||
  p.proposal?.department ||
  "Unassigned";

const getResearcherName = (p) =>
  p.creator?.name || p.researcher || p.proponent_name || "Unknown";

const getProposalId = (p) =>
  p.reference_no || p.project_id || p.proposal_id || `PRJ-${p.id}`;

const getScore = (p) => {
  if (p.avg_score !== undefined && p.avg_score !== null) {
    return Number(p.avg_score);
  }

  if (p.average_score !== undefined && p.average_score !== null) {
    return Number(p.average_score);
  }

  if (p.score !== undefined && p.score !== null) {
    return Number(p.score);
  }

  if (Array.isArray(p.evaluations) && p.evaluations.length > 0) {
    const scores = p.evaluations
      .map((e) => Number(e.score || e.total_score || e.rating || 0))
      .filter((n) => Number.isFinite(n) && n > 0);

    if (scores.length > 0) {
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  return 0;
};

const getProjectDate = (p) => p.submitted_at || p.created_at || p.updated_at;

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const buildReportsFromProjects = ({
  proposals = [],
  faculty = [],
  evaluators = [],
  year = "2026",
}) => {
  const selectedYear = Number(year);

  const yearProjects = proposals.filter((p) => {
    const dateValue = getProjectDate(p);

    if (!dateValue) return true;

    const d = new Date(dateValue);

    if (Number.isNaN(d.getTime())) return true;

    return d.getFullYear() === selectedYear;
  });

  const scoredProjects = yearProjects
    .map((p) => getScore(p))
    .filter((score) => score > 0);

  const summary = {
    totalProposals: yearProjects.length,
    approved: yearProjects.filter((p) => normalizeStatus(p.status) === "Approved")
      .length,
    rejected: yearProjects.filter((p) => normalizeStatus(p.status) === "Rejected")
      .length,
    pending: yearProjects.filter((p) =>
      ["Pending", "Scheduled", "Under Evaluation", "For Revision"].includes(
        normalizeStatus(p.status)
      )
    ).length,
    totalBudget: yearProjects.reduce((sum, p) => sum + getProjectBudget(p), 0),
    avgScore:
      scoredProjects.length > 0
        ? Math.round(
            scoredProjects.reduce((a, b) => a + b, 0) / scoredProjects.length
          )
        : 0,
    totalFaculty: faculty.length,
    totalEvaluators: evaluators.length,
  };

  const monthly = monthLabels
    .map((month, index) => {
      const monthProjects = yearProjects.filter((p) => {
        const dateValue = getProjectDate(p);

        if (!dateValue) return false;

        const d = new Date(dateValue);

        if (Number.isNaN(d.getTime())) return false;

        return d.getMonth() === index;
      });

      return {
        month,
        submitted: monthProjects.length,
        approved: monthProjects.filter(
          (p) => normalizeStatus(p.status) === "Approved"
        ).length,
        rejected: monthProjects.filter(
          (p) => normalizeStatus(p.status) === "Rejected"
        ).length,
      };
    })
    .filter((m) => m.submitted > 0 || m.approved > 0 || m.rejected > 0);

  const statusColors = {
    Approved: "#15803d",
    Pending: "#f59e0b",
    Rejected: "#dc2626",
    Scheduled: "#1d4ed8",
    "Under Evaluation": "#7c3aed",
    "For Revision": "#d97706",
  };

  const statusCounts = yearProjects.reduce((acc, p) => {
    const status = normalizeStatus(p.status);
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusDist = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
    color: statusColors[name] || "#6b7280",
  }));

  const deptMap = yearProjects.reduce((acc, p) => {
    const department = getDepartmentName(p);

    if (!acc[department]) {
      acc[department] = {
        department,
        proposals: 0,
        approved: 0,
        budget: 0,
      };
    }

    acc[department].proposals += 1;
    acc[department].budget += getProjectBudget(p);

    if (normalizeStatus(p.status) === "Approved") {
      acc[department].approved += 1;
    }

    return acc;
  }, {});

  const byDepartment = Object.values(deptMap);

  const topProposals = [...yearProjects]
    .map((p) => ({
      id: getProposalId(p),
      title: p.title || p.proposal?.title || "Untitled Proposal",
      researcher: getResearcherName(p),
      dept: getDepartmentName(p),
      budget: getProjectBudget(p),
      score: getScore(p),
      status: normalizeStatus(p.status),
    }))
    .sort((a, b) => {
      const scoreDiff = Number(b.score || 0) - Number(a.score || 0);
      if (scoreDiff !== 0) return scoreDiff;
      return Number(b.budget || 0) - Number(a.budget || 0);
    })
    .slice(0, 10);

  const evaluatorMap = {};

  yearProjects.forEach((p) => {
    const op = p.oral_presentation || p.oralPresentation || null;

    const assignedEvaluators = Array.isArray(op?.evaluators)
      ? op.evaluators
      : Array.isArray(p.evaluators)
      ? p.evaluators
      : [];

    assignedEvaluators.forEach((ev) => {
      const name = typeof ev === "string" ? ev : ev.name;

      if (!name) return;

      if (!evaluatorMap[name]) {
        evaluatorMap[name] = {
          name,
          assigned: 0,
          completed: 0,
          scores: [],
        };
      }

      evaluatorMap[name].assigned += 1;

      if (
        ["Approved", "Rejected", "For Revision"].includes(
          normalizeStatus(p.status)
        )
      ) {
        evaluatorMap[name].completed += 1;
      }

      const score = getScore(p);

      if (score > 0) {
        evaluatorMap[name].scores.push(score);
      }
    });
  });

  const evaluatorPerf = Object.values(evaluatorMap).map((ev) => ({
    name: ev.name,
    assigned: ev.assigned,
    completed: ev.completed,
    avgScore:
      ev.scores.length > 0
        ? Math.round(ev.scores.reduce((a, b) => a + b, 0) / ev.scores.length)
        : 0,
  }));

  return {
    summary,
    monthly,
    byDepartment,
    statusDist,
    topProposals,
    evaluatorPerf,
  };
};

const isReportEmpty = (reportData) => {
  const s = reportData?.summary || {};

  return (
    Number(s.totalProposals || 0) === 0 &&
    Number(s.approved || 0) === 0 &&
    Number(s.rejected || 0) === 0 &&
    Number(s.pending || 0) === 0 &&
    Number(s.totalBudget || 0) === 0 &&
    (!Array.isArray(reportData?.monthly) || reportData.monthly.length === 0) &&
    (!Array.isArray(reportData?.byDepartment) ||
      reportData.byDepartment.length === 0) &&
    (!Array.isArray(reportData?.statusDist) ||
      reportData.statusDist.length === 0) &&
    (!Array.isArray(reportData?.topProposals) ||
      reportData.topProposals.length === 0) &&
    (!Array.isArray(reportData?.evaluatorPerf) ||
      reportData.evaluatorPerf.length === 0)
  );
};

const STATUS_STYLE = {
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Pending: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Under Evaluation": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

function ScoreBar({ score = 0 }) {
  const safeScore = Number(score || 0);
  const color =
    safeScore >= 90 ? "#15803d" : safeScore >= 80 ? "#f59e0b" : "#dc2626";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "#f1f5f9",
          borderRadius: 99,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(safeScore, 100)}%`,
            background: color,
            borderRadius: 99,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28 }}>
        {safeScore}
      </span>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "8px 18px",
        borderRadius: 9,
        border: `1.5px solid ${active ? "#f59e0b" : "#e5e7eb"}`,
        background: active ? "#f59e0b" : "#fff",
        color: active ? "#fff" : "#374151",
        fontWeight: active ? 600 : 400,
        fontSize: 13,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

function EmptyState({ message = "No report data available yet." }) {
  return (
    <div
      style={{
        padding: "44px 20px",
        textAlign: "center",
        border: "1px dashed #d1d5db",
        borderRadius: 12,
        background: "#fafafa",
      }}
    >
      <FileText
        size={38}
        color="#d1d5db"
        style={{ margin: "0 auto 10px", display: "block" }}
      />

      <p style={{ margin: 0, fontSize: 14, color: "#9ca3af" }}>{message}</p>
    </div>
  );
}

const PieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  const R = Math.PI / 180;
  const r = outerRadius + 34;
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
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Reports() {
  const [data, setData] = useState(EMPTY_REPORTS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [yearFilter, setYearFilter] = useState("2026");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);

      try {
        const [reportsRes, proposalsRes, facultyRes, evaluatorsRes] =
          await Promise.all([
            api.get("/admin/reports").catch(() => ({ data: null })),
            api.get("/admin/proposals").catch(() => ({ data: [] })),
            api.get("/admin/faculty").catch(() => ({ data: [] })),
            api.get("/admin/evaluators").catch(() => ({ data: [] })),
          ]);

        const reportData = reportsRes.data || {};

        const proposalsData = Array.isArray(proposalsRes.data)
          ? proposalsRes.data
          : [];

        const facultyData = Array.isArray(facultyRes.data)
          ? facultyRes.data
          : [];

        const evaluatorData = Array.isArray(evaluatorsRes.data)
          ? evaluatorsRes.data
          : [];

        if (!isReportEmpty(reportData)) {
          setData({
            summary: {
              ...EMPTY_REPORTS.summary,
              ...(reportData.summary || {}),
              totalFaculty:
                reportData.summary?.totalFaculty ?? facultyData.length,
              totalEvaluators:
                reportData.summary?.totalEvaluators ?? evaluatorData.length,
            },
            monthly: Array.isArray(reportData.monthly)
              ? reportData.monthly
              : [],
            byDepartment: Array.isArray(reportData.byDepartment)
              ? reportData.byDepartment
              : [],
            statusDist: Array.isArray(reportData.statusDist)
              ? reportData.statusDist
              : [],
            topProposals: Array.isArray(reportData.topProposals)
              ? reportData.topProposals
              : [],
            evaluatorPerf: Array.isArray(reportData.evaluatorPerf)
              ? reportData.evaluatorPerf
              : [],
          });

          return;
        }

        const generatedReports = buildReportsFromProjects({
          proposals: proposalsData,
          faculty: facultyData,
          evaluators: evaluatorData,
          year: yearFilter,
        });

        setData(generatedReports);
      } catch {
        setData(EMPTY_REPORTS);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [yearFilter]);

  const exportCSV = (rows, filename) => {
    if (!rows || rows.length === 0) return;

    const keys = Object.keys(rows[0]);

    const csv = [
      keys.join(","),
      ...rows.map((row) =>
        keys.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename;
    a.click();
  };

  const ml = isMobile ? 0 : sidebarWidth;
  const s = data.summary || EMPTY_REPORTS.summary;

  const totalProposals = Number(s.totalProposals || 0);
  const approved = Number(s.approved || 0);
  const approvalRate =
    totalProposals > 0 ? Math.round((approved / totalProposals) * 100) : 0;

  const hasOverviewChartData =
    data.monthly.length > 0 ||
    data.statusDist.length > 0 ||
    data.byDepartment.length > 0;

  const summaryCards = [
    {
      label: "Total Proposals",
      value: s.totalProposals,
      sub: "All submitted proposals",
      icon: FileText,
      color: "#f59e0b",
      bg: "#fefce8",
      border: "#fde68a",
      trend: totalProposals > 0 ? "up" : null,
    },
    {
      label: "Approved",
      value: s.approved,
      sub: `${approvalRate}% approval rate`,
      icon: CheckCircle2,
      color: "#15803d",
      bg: "#dcfce7",
      border: "#bbf7d0",
      trend: approved > 0 ? "up" : null,
    },
    {
      label: "Pending Review",
      value: s.pending,
      sub: "Awaiting action",
      icon: Clock,
      color: "#c2410c",
      bg: "#fff7ed",
      border: "#fed7aa",
      trend: null,
    },
    {
      label: "Rejected",
      value: s.rejected,
      sub: "Not approved",
      icon: XCircle,
      color: "#dc2626",
      bg: "#fef2f2",
      border: "#fecaca",
      trend: null,
    },
    {
      label: "Total Budget",
      value: fmtM(s.totalBudget),
      sub: "Across all projects",
      icon: TrendingUp,
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      trend: Number(s.totalBudget || 0) > 0 ? "up" : null,
    },
    {
      label: "Avg. Score",
      value: `${s.avgScore || 0}`,
      sub: "Evaluation average",
      icon: Activity,
      color: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      trend: Number(s.avgScore || 0) > 0 ? "up" : null,
    },
    {
      label: "Faculty",
      value: s.totalFaculty,
      sub: "Active researchers",
      icon: Users,
      color: "#0e7490",
      bg: "#e0f2fe",
      border: "#bae6fd",
      trend: null,
    },
    {
      label: "Evaluators",
      value: s.totalEvaluators,
      sub: "Active evaluators",
      icon: Users,
      color: "#6d28d9",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      trend: null,
    },
  ];

  return (
    <>
      <style>{`
        .rpt-grid-8 {
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:14px;
          margin-bottom:24px;
        }

        .rpt-grid-2 {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:20px;
          margin-bottom:24px;
        }

        .rpt-table {
          width:100%;
          border-collapse:collapse;
        }

        .rpt-table th {
          padding:11px 14px;
          text-align:left;
          font-size:11px;
          font-weight:700;
          color:#6b7280;
          text-transform:uppercase;
          letter-spacing:.06em;
          border-bottom:2px solid #e5e7eb;
          background:#f9fafb;
          white-space:nowrap;
        }

        .rpt-table td {
          padding:13px 14px;
          font-size:13px;
          color:#374151;
          border-bottom:1px solid #f1f5f9;
          vertical-align:middle;
        }

        .rpt-table tr:last-child td {
          border-bottom:none;
        }

        .rpt-table tr:hover td {
          background:#fafafa;
        }

        @media(max-width:1200px) {
          .rpt-grid-8 {
            grid-template-columns:repeat(4,1fr);
          }
        }

        @media(max-width:900px) {
          .rpt-grid-8 {
            grid-template-columns:repeat(2,1fr);
          }

          .rpt-grid-2 {
            grid-template-columns:1fr;
          }
        }

        @media(max-width:500px) {
          .rpt-grid-8 {
            grid-template-columns:1fr 1fr;
          }
        }
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
          <Topbar title="Reports" />

          <div style={{ padding: "24px", flex: 1 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 24,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
                  Research project and proposal performance overview
                </h3>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ position: "relative" }}>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    style={{
                      appearance: "none",
                      padding: "8px 36px 8px 14px",
                      borderRadius: 9,
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      fontSize: 13,
                      color: "#374151",
                      fontWeight: 500,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {["2026", "2025", "2024"].map((y) => (
                      <option key={y}>{y}</option>
                    ))}
                  </select>

                  <ChevronDown
                    size={14}
                    color="#6b7280"
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                <button
                  onClick={() =>
                    exportCSV(data.topProposals, "proposals-report.csv")
                  }
                  disabled={data.topProposals.length === 0}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 18px",
                    borderRadius: 9,
                    border: "none",
                    background:
                      data.topProposals.length === 0 ? "#d1d5db" : "#f59e0b",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor:
                      data.topProposals.length === 0
                        ? "not-allowed"
                        : "pointer",
                    boxShadow:
                      data.topProposals.length === 0
                        ? "none"
                        : "0 2px 6px rgba(245,158,11,0.3)",
                  }}
                >
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 24,
                flexWrap: "wrap",
              }}
            >
              <TabBtn
                active={activeTab === "overview"}
                onClick={() => setActiveTab("overview")}
                icon={BarChart2}
                label="Overview"
              />

              <TabBtn
                active={activeTab === "proposals"}
                onClick={() => setActiveTab("proposals")}
                icon={FileText}
                label="Proposals"
              />

              <TabBtn
                active={activeTab === "evaluators"}
                onClick={() => setActiveTab("evaluators")}
                icon={Users}
                label="Evaluators"
              />

              <TabBtn
                active={activeTab === "departments"}
                onClick={() => setActiveTab("departments")}
                icon={PieIcon}
                label="Departments"
              />
            </div>

            {loading ? (
              <p style={{ padding: 24, color: "#9ca3af", fontSize: 14 }}>
                Loading reports…
              </p>
            ) : (
              <>
                {activeTab === "overview" && (
                  <>
                    <div className="rpt-grid-8">
                      {summaryCards.map(
                        ({
                          label,
                          value,
                          sub,
                          icon: Icon,
                          color,
                          bg,
                          border,
                          trend,
                        }) => (
                          <div
                            key={label}
                            style={{
                              background: "#fff",
                              border: "1px solid #e5e7eb",
                              borderTop: `3px solid ${color}`,
                              borderRadius: 12,
                              padding: "16px 18px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: bg,
                                  border: `1px solid ${border}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Icon
                                  size={16}
                                  color={color}
                                  strokeWidth={1.8}
                                />
                              </div>

                              {trend === "up" && (
                                <ArrowUpRight size={16} color="#15803d" />
                              )}
                              {trend === "down" && (
                                <ArrowDownRight size={16} color="#dc2626" />
                              )}
                            </div>

                            <p
                              style={{
                                margin: 0,
                                fontSize: 22,
                                fontWeight: 800,
                                color: "#111827",
                                lineHeight: 1,
                              }}
                            >
                              {value}
                            </p>

                            <p
                              style={{
                                margin: "4px 0 2px",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "#374151",
                              }}
                            >
                              {label}
                            </p>

                            <p
                              style={{
                                margin: 0,
                                fontSize: 11,
                                color: "#9ca3af",
                              }}
                            >
                              {sub}
                            </p>
                          </div>
                        )
                      )}
                    </div>

                    {!hasOverviewChartData ? (
                      <EmptyState message="No report data available yet. Reports will appear once studies are submitted, evaluated, or approved." />
                    ) : (
                      <>
                        <div className="rpt-grid-2">
                          <div style={CARD}>
                            <div style={CARD_TOP}>
                              <h3 style={CARD_H}>Monthly Submission Trends</h3>
                              <span style={BADGE_YELLOW}>{yearFilter}</span>
                            </div>

                            {data.monthly.length === 0 ? (
                              <EmptyState message="No monthly submission data yet." />
                            ) : (
                              <ResponsiveContainer width="100%" height={240}>
                                <LineChart
                                  data={data.monthly}
                                  margin={{
                                    top: 5,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                  }}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f1f5f9"
                                  />
                                  <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 11, fill: "#6b7280" }}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 11, fill: "#6b7280" }}
                                  />
                                  <Tooltip />
                                  <Legend wrapperStyle={{ fontSize: 12 }} />
                                  <Line
                                    type="monotone"
                                    dataKey="submitted"
                                    stroke="#f59e0b"
                                    strokeWidth={2.5}
                                    dot={{ r: 4 }}
                                    name="Submitted"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="approved"
                                    stroke="#15803d"
                                    strokeWidth={2.5}
                                    dot={{ r: 4 }}
                                    name="Approved"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="rejected"
                                    stroke="#dc2626"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    name="Rejected"
                                    strokeDasharray="5 3"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            )}
                          </div>

                          <div style={CARD}>
                            <div style={CARD_TOP}>
                              <h3 style={CARD_H}>
                                Proposal Status Distribution
                              </h3>
                              <span style={BADGE_YELLOW}>
                                {s.totalProposals || 0} total
                              </span>
                            </div>

                            {data.statusDist.length === 0 ? (
                              <EmptyState message="No proposal status data yet." />
                            ) : (
                              <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                  <Pie
                                    data={data.statusDist}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={85}
                                    label={PieLabel}
                                    labelLine
                                    dataKey="value"
                                  >
                                    {data.statusDist.map((entry, index) => (
                                      <Cell
                                        key={index}
                                        fill={entry.color || "#f59e0b"}
                                      />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </div>
                        </div>

                        <div style={{ ...CARD, marginBottom: 0 }}>
                          <div style={CARD_TOP}>
                            <h3 style={CARD_H}>
                              Budget Allocation by Department
                            </h3>

                            <button
                              onClick={() =>
                                exportCSV(data.byDepartment, "dept-budget.csv")
                              }
                              disabled={data.byDepartment.length === 0}
                              style={{
                                ...EXPORT_MINI,
                                opacity:
                                  data.byDepartment.length === 0 ? 0.5 : 1,
                                cursor:
                                  data.byDepartment.length === 0
                                    ? "not-allowed"
                                    : "pointer",
                              }}
                            >
                              <Download size={13} /> CSV
                            </button>
                          </div>

                          {data.byDepartment.length === 0 ? (
                            <EmptyState message="No department budget data yet." />
                          ) : (
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart
                                data={data.byDepartment}
                                margin={{
                                  top: 5,
                                  right: 10,
                                  left: 0,
                                  bottom: 50,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f1f5f9"
                                />
                                <XAxis
                                  dataKey="department"
                                  tick={{ fontSize: 10, fill: "#6b7280" }}
                                  interval={0}
                                  angle={-18}
                                  textAnchor="end"
                                />
                                <YAxis
                                  tick={{ fontSize: 11, fill: "#6b7280" }}
                                  tickFormatter={(v) => `₱${v / 1000}K`}
                                />
                                <Tooltip
                                  formatter={(v) => [
                                    `₱${Number(v).toLocaleString()}`,
                                    "Budget",
                                  ]}
                                />
                                <Bar
                                  dataKey="budget"
                                  fill="#f59e0b"
                                  radius={[5, 5, 0, 0]}
                                  maxBarSize={52}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {activeTab === "proposals" && (
                  <div style={CARD}>
                    <div style={{ ...CARD_TOP, marginBottom: 16 }}>
                      <h3 style={CARD_H}>Top Performing Proposals</h3>

                      <button
                        onClick={() =>
                          exportCSV(data.topProposals, "top-proposals.csv")
                        }
                        disabled={data.topProposals.length === 0}
                        style={{
                          ...EXPORT_MINI,
                          opacity: data.topProposals.length === 0 ? 0.5 : 1,
                          cursor:
                            data.topProposals.length === 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <Download size={13} /> Export
                      </button>
                    </div>

                    {data.topProposals.length === 0 ? (
                      <EmptyState message="No top performing proposals yet." />
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table className="rpt-table">
                          <thead>
                            <tr>
                              {[
                                "Rank",
                                "ID",
                                "Title",
                                "Researcher",
                                "Department",
                                "Budget",
                                "Score",
                                "Status",
                              ].map((h) => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {data.topProposals.map((p, i) => {
                              const ss =
                                STATUS_STYLE[p.status] || STATUS_STYLE.Pending;

                              return (
                                <tr key={p.id || i}>
                                  <td>
                                    <div
                                      style={{
                                        width: 26,
                                        height: 26,
                                        borderRadius: "50%",
                                        background:
                                          i === 0
                                            ? "#fef9c3"
                                            : i === 1
                                            ? "#f3f4f6"
                                            : "#fff7ed",
                                        border: `1px solid ${
                                          i === 0 ? "#fde68a" : "#e5e7eb"
                                        }`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color:
                                          i === 0 ? "#a16207" : "#6b7280",
                                      }}
                                    >
                                      {i + 1}
                                    </div>
                                  </td>

                                  <td
                                    style={{
                                      fontWeight: 600,
                                      color: "#111827",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {p.id}
                                  </td>

                                  <td style={{ maxWidth: 220 }}>
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

                                  <td style={{ whiteSpace: "nowrap" }}>
                                    {p.dept}
                                  </td>

                                  <td style={{ whiteSpace: "nowrap" }}>
                                    ₱{fmt(p.budget)}
                                  </td>

                                  <td style={{ minWidth: 120 }}>
                                    <ScoreBar score={p.score} />
                                  </td>

                                  <td>
                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        fontSize: 11,
                                        fontWeight: 600,
                                        background: ss.bg,
                                        color: ss.color,
                                        border: `1px solid ${ss.border}`,
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div
                      style={{
                        marginTop: 28,
                        paddingTop: 24,
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <h3 style={{ ...CARD_H, marginBottom: 16 }}>
                        Monthly Submissions vs Approvals
                      </h3>

                      {data.monthly.length === 0 ? (
                        <EmptyState message="No monthly proposal data yet." />
                      ) : (
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={data.monthly}
                            margin={{
                              top: 5,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f1f5f9"
                            />
                            <XAxis
                              dataKey="month"
                              tick={{ fontSize: 11, fill: "#6b7280" }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar
                              dataKey="submitted"
                              name="Submitted"
                              fill="#f59e0b"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                            <Bar
                              dataKey="approved"
                              name="Approved"
                              fill="#15803d"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                            <Bar
                              dataKey="rejected"
                              name="Rejected"
                              fill="#dc2626"
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "evaluators" && (
                  <div style={CARD}>
                    <div style={{ ...CARD_TOP, marginBottom: 20 }}>
                      <h3 style={CARD_H}>Evaluator Performance</h3>

                      <button
                        onClick={() =>
                          exportCSV(data.evaluatorPerf, "evaluator-perf.csv")
                        }
                        disabled={data.evaluatorPerf.length === 0}
                        style={{
                          ...EXPORT_MINI,
                          opacity: data.evaluatorPerf.length === 0 ? 0.5 : 1,
                          cursor:
                            data.evaluatorPerf.length === 0
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        <Download size={13} /> Export
                      </button>
                    </div>

                    {data.evaluatorPerf.length === 0 ? (
                      <EmptyState message="No evaluator performance data yet." />
                    ) : (
                      <div style={{ overflowX: "auto" }}>
                        <table className="rpt-table">
                          <thead>
                            <tr>
                              {[
                                "Evaluator",
                                "Assigned",
                                "Completed",
                                "Completion Rate",
                                "Avg. Score",
                              ].map((h) => (
                                <th key={h}>{h}</th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {data.evaluatorPerf.map((ev) => {
                              const assigned = Number(ev.assigned || 0);
                              const completed = Number(ev.completed || 0);
                              const rate =
                                assigned > 0
                                  ? Math.round((completed / assigned) * 100)
                                  : 0;

                              return (
                                <tr key={ev.name}>
                                  <td>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: 32,
                                          height: 32,
                                          borderRadius: "50%",
                                          background: "#f59e0b",
                                          color: "#fff",
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

                                      <span
                                        style={{
                                          fontWeight: 600,
                                          color: "#111827",
                                        }}
                                      >
                                        {ev.name}
                                      </span>
                                    </div>
                                  </td>

                                  <td style={{ fontWeight: 600 }}>
                                    {assigned}
                                  </td>

                                  <td style={{ fontWeight: 600 }}>
                                    {completed}
                                  </td>

                                  <td style={{ minWidth: 160 }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: 1,
                                          height: 6,
                                          background: "#f1f5f9",
                                          borderRadius: 99,
                                        }}
                                      >
                                        <div
                                          style={{
                                            height: "100%",
                                            width: `${rate}%`,
                                            background:
                                              rate >= 90
                                                ? "#15803d"
                                                : rate >= 70
                                                ? "#f59e0b"
                                                : "#dc2626",
                                            borderRadius: 99,
                                          }}
                                        />
                                      </div>

                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          minWidth: 32,
                                          color: "#374151",
                                        }}
                                      >
                                        {rate}%
                                      </span>
                                    </div>
                                  </td>

                                  <td style={{ minWidth: 120 }}>
                                    <ScoreBar score={ev.avgScore} />
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

                {activeTab === "departments" && (
                  <>
                    {data.byDepartment.length === 0 ? (
                      <EmptyState message="No department report data yet." />
                    ) : (
                      <>
                        <div className="rpt-grid-2">
                          <div style={CARD}>
                            <h3 style={CARD_H}>Proposals per Department</h3>

                            <ResponsiveContainer width="100%" height={240}>
                              <BarChart
                                data={data.byDepartment}
                                layout="vertical"
                                margin={{
                                  top: 0,
                                  right: 20,
                                  left: 80,
                                  bottom: 0,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke="#f1f5f9"
                                  horizontal={false}
                                />
                                <XAxis
                                  type="number"
                                  tick={{ fontSize: 11, fill: "#6b7280" }}
                                />
                                <YAxis
                                  type="category"
                                  dataKey="department"
                                  tick={{ fontSize: 11, fill: "#374151" }}
                                  width={80}
                                />
                                <Tooltip />
                                <Bar
                                  dataKey="proposals"
                                  name="Proposals"
                                  fill="#f59e0b"
                                  radius={[0, 5, 5, 0]}
                                  maxBarSize={24}
                                />
                                <Bar
                                  dataKey="approved"
                                  name="Approved"
                                  fill="#15803d"
                                  radius={[0, 5, 5, 0]}
                                  maxBarSize={24}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <div style={CARD}>
                            <h3 style={CARD_H}>Budget Share by Department</h3>

                            <ResponsiveContainer width="100%" height={240}>
                              <PieChart>
                                <Pie
                                  data={data.byDepartment.map((d) => ({
                                    name: d.department,
                                    value: d.budget || 0,
                                  }))}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={85}
                                  dataKey="value"
                                  label={({ percent }) =>
                                    `${(percent * 100).toFixed(0)}%`
                                  }
                                  labelLine
                                >
                                  {data.byDepartment.map((_, i) => (
                                    <Cell
                                      key={i}
                                      fill={
                                        [
                                          "#f59e0b",
                                          "#15803d",
                                          "#1d4ed8",
                                          "#7c3aed",
                                          "#0e7490",
                                          "#dc2626",
                                        ][i % 6]
                                      }
                                    />
                                  ))}
                                </Pie>

                                <Tooltip
                                  formatter={(v) => [
                                    `₱${Number(v).toLocaleString()}`,
                                    "Budget",
                                  ]}
                                />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div style={CARD}>
                          <div style={{ ...CARD_TOP, marginBottom: 16 }}>
                            <h3 style={CARD_H}>Department Summary Table</h3>

                            <button
                              onClick={() =>
                                exportCSV(data.byDepartment, "departments.csv")
                              }
                              style={EXPORT_MINI}
                            >
                              <Download size={13} /> Export
                            </button>
                          </div>

                          <div style={{ overflowX: "auto" }}>
                            <table className="rpt-table">
                              <thead>
                                <tr>
                                  {[
                                    "Department",
                                    "Total Proposals",
                                    "Approved",
                                    "Approval Rate",
                                    "Total Budget",
                                  ].map((h) => (
                                    <th key={h}>{h}</th>
                                  ))}
                                </tr>
                              </thead>

                              <tbody>
                                {data.byDepartment.map((d) => {
                                  const proposals = Number(d.proposals || 0);
                                  const approvedCount = Number(d.approved || 0);
                                  const rate =
                                    proposals > 0
                                      ? Math.round(
                                          (approvedCount / proposals) * 100
                                        )
                                      : 0;

                                  return (
                                    <tr key={d.department}>
                                      <td
                                        style={{
                                          fontWeight: 600,
                                          color: "#111827",
                                        }}
                                      >
                                        {d.department}
                                      </td>

                                      <td>{proposals}</td>

                                      <td>
                                        <span
                                          style={{
                                            display: "inline-block",
                                            padding: "2px 10px",
                                            borderRadius: 20,
                                            fontSize: 12,
                                            fontWeight: 600,
                                            background: "#dcfce7",
                                            color: "#15803d",
                                            border: "1px solid #bbf7d0",
                                          }}
                                        >
                                          {approvedCount}
                                        </span>
                                      </td>

                                      <td style={{ minWidth: 140 }}>
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                          }}
                                        >
                                          <div
                                            style={{
                                              flex: 1,
                                              height: 6,
                                              background: "#f1f5f9",
                                              borderRadius: 99,
                                            }}
                                          >
                                            <div
                                              style={{
                                                height: "100%",
                                                width: `${rate}%`,
                                                background: "#f59e0b",
                                                borderRadius: 99,
                                              }}
                                            />
                                          </div>

                                          <span
                                            style={{
                                              fontSize: 12,
                                              fontWeight: 700,
                                              color: "#374151",
                                              minWidth: 30,
                                            }}
                                          >
                                            {rate}%
                                          </span>
                                        </div>
                                      </td>

                                      <td
                                        style={{
                                          fontWeight: 600,
                                          color: "#111827",
                                        }}
                                      >
                                        ₱{fmt(d.budget)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const CARD = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 22px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  marginBottom: 20,
};

const CARD_TOP = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
};

const CARD_H = {
  margin: 0,
  fontSize: 15,
  fontWeight: 700,
  color: "#111827",
};

const BADGE_YELLOW = {
  padding: "3px 10px",
  borderRadius: 20,
  fontSize: 11,
  fontWeight: 600,
  background: "#fefce8",
  color: "#a16207",
  border: "1px solid #fde68a",
};

const EXPORT_MINI = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  padding: "5px 12px",
  borderRadius: 7,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  cursor: "pointer",
  fontSize: 12,
  color: "#374151",
  fontWeight: 500,
};