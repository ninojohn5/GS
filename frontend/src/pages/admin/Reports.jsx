import { useState, useEffect } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  FileText, Download, TrendingUp, CheckCircle2, Clock, XCircle, Users,
  ChevronDown, BarChart2, PieChart as PieIcon, Activity, ArrowUpRight, ArrowDownRight,
  Building2, Globe,
} from "lucide-react";
import "../../styles/admin.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_REPORTS = {
  summary: {
    totalProposals: 0, approved: 0, rejected: 0, pending: 0,
    totalBudget: 0, avgScore: 0, totalFaculty: 0, totalEvaluators: 0,
  },
  monthly: [], byDepartment: [], statusDist: [], topProposals: [], evaluatorPerf: [],
  funding: {
    localCount: 0, externalCount: 0,
    localBudget: 0, externalBudget: 0,
    byAgency: [], byFundingDept: [],
  },
};

const STATUS_STYLE = {
  Approved:           { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Pending:            { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Rejected:           { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  Scheduled:          { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Under Evaluation": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  "For Revision":     { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  Endorsed:           { bg: "#dcfce7", color: "#047857", border: "#a7f3d0" },
  Recommended:        { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
};

const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DEPT_COLORS = ["#f59e0b","#15803d","#1d4ed8","#7c3aed","#0e7490","#dc2626"];

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmtBudget = (raw) => {
  if (!raw && raw !== 0) return "₱0";
  const str = String(raw).trim();
  if (!str || str === "0") return "₱0";
  const cleaned = str.replace(/[₱,\s]/g, "");
  const num = parseFloat(cleaned);
  if (!isNaN(num) && cleaned.replace(/[\d.]/g, "") === "") {
    if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000)     return `₱${(num / 1_000).toFixed(1)}K`;
    return `₱${num.toLocaleString()}`;
  }
  return `₱${str}`;
};

const fmtTotalBudget = (n) => {
  const num = Number(n || 0);
  if (num === 0) return "₱0";
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000)     return `₱${(num / 1_000).toFixed(1)}K`;
  return `₱${num.toLocaleString()}`;
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

const normalizeStatus = (s) => {
  if (!s) return "Pending";
  if (s === "Submitted") return "Pending";
  if (s === "Presentation Scheduled") return "Scheduled";
  return s;
};

const parseNumericBudget = (raw) => {
  if (!raw) return 0;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const getProjectBudget  = (p) => parseNumericBudget(p.budget || p.total_budget || p.proposal?.total_budget || 0);
const getRawBudget      = (p) => p.budget || p.total_budget || p.proposal?.total_budget || null;
const getDepartmentName = (p) => p.department_center?.name || p.department || p.creator?.department || p.proposal?.department || "Unassigned";
const getResearcherName = (p) => p.creator?.name || p.researcher || p.proponent_name || "Unknown";
const getProposalId     = (p) => p.reference_no || p.project_id || p.proposal_id || `PRJ-${p.id}`;
const getProjectDate    = (p) => p.submitted_at || p.created_at || p.updated_at;

const getScore = (p) => {
  if (p.avg_score     != null) return Number(p.avg_score);
  if (p.average_score != null) return Number(p.average_score);
  if (p.score         != null) return Number(p.score);
  const evals = Array.isArray(p.evaluations) ? p.evaluations : [];
  if (evals.length > 0) {
    const scores = evals
      .map((e) => Number(e.total_score || e.score || e.rating || 0))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (scores.length > 0)
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  return 0;
};

const isReportEmpty = (r) => {
  const s = r?.summary || {};
  return (
    Number(s.totalProposals || 0) === 0 && Number(s.approved || 0) === 0 &&
    Number(s.rejected || 0) === 0       && Number(s.pending  || 0) === 0 &&
    Number(s.totalBudget || 0) === 0    &&
    (!Array.isArray(r?.monthly)       || r.monthly.length === 0) &&
    (!Array.isArray(r?.byDepartment)  || r.byDepartment.length === 0) &&
    (!Array.isArray(r?.statusDist)    || r.statusDist.length === 0) &&
    (!Array.isArray(r?.topProposals)  || r.topProposals.length === 0) &&
    (!Array.isArray(r?.evaluatorPerf) || r.evaluatorPerf.length === 0)
  );
};

// ─── Report builder ───────────────────────────────────────────────────────────

const buildReportsFromProjects = ({ proposals = [], faculty = [], evaluators = [], year = "2026" }) => {
  const selectedYear = Number(year);

  const yearProjects = proposals.filter((p) => {
    const dv = getProjectDate(p);
    if (!dv) return true;
    const d = new Date(dv);
    return isNaN(d.getTime()) ? true : d.getFullYear() === selectedYear;
  });

  const scoredProjects = yearProjects.map((p) => getScore(p)).filter((s) => s > 0);

  const summary = {
    totalProposals: yearProjects.length,
    approved:  yearProjects.filter((p) => normalizeStatus(p.status) === "Approved").length,
    rejected:  yearProjects.filter((p) => normalizeStatus(p.status) === "Rejected").length,
    pending:   yearProjects.filter((p) =>
      ["Pending","Scheduled","Under Evaluation","For Revision","Endorsed","Recommended"]
        .includes(normalizeStatus(p.status))).length,
    totalBudget: yearProjects.reduce((sum, p) => sum + getProjectBudget(p), 0),
    avgScore: scoredProjects.length > 0
      ? Math.round(scoredProjects.reduce((a, b) => a + b, 0) / scoredProjects.length) : 0,
    totalFaculty: faculty.length, totalEvaluators: evaluators.length,
  };

  const monthly = monthLabels.map((month, i) => {
    const mp = yearProjects.filter((p) => {
      const dv = getProjectDate(p);
      if (!dv) return false;
      const d = new Date(dv);
      return !isNaN(d.getTime()) && d.getMonth() === i;
    });
    return {
      month,
      submitted: mp.length,
      approved:  mp.filter((p) => normalizeStatus(p.status) === "Approved").length,
      rejected:  mp.filter((p) => normalizeStatus(p.status) === "Rejected").length,
    };
  }).filter((m) => m.submitted > 0 || m.approved > 0 || m.rejected > 0);

  const statusColors = {
    Approved: "#15803d", Pending: "#f59e0b", Rejected: "#dc2626",
    Scheduled: "#1d4ed8", "Under Evaluation": "#7c3aed",
    "For Revision": "#d97706", Endorsed: "#047857", Recommended: "#1d4ed8",
  };

  const statusCounts = yearProjects.reduce((acc, p) => {
    const st = normalizeStatus(p.status);
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const statusDist = Object.entries(statusCounts).map(([name, value]) => ({
    name, value, color: statusColors[name] || "#6b7280",
  }));

  // byDepartment — dynamic: auto-groups whatever departments exist in the data
  const deptMap = yearProjects.reduce((acc, p) => {
    const dept = getDepartmentName(p);
    if (!acc[dept]) acc[dept] = { department: dept, proposals: 0, approved: 0, budget: 0 };
    acc[dept].proposals += 1;
    acc[dept].budget    += getProjectBudget(p);
    if (normalizeStatus(p.status) === "Approved") acc[dept].approved += 1;
    return acc;
  }, {});
  const byDepartment = Object.values(deptMap);

  const topProposals = [...yearProjects]
    .map((p) => ({
      id: getProposalId(p), title: p.title || p.proposal?.title || "Untitled Proposal",
      researcher: getResearcherName(p), dept: getDepartmentName(p),
      budget: getProjectBudget(p), budgetRaw: getRawBudget(p),
      score: getScore(p), status: normalizeStatus(p.status),
    }))
    .sort((a, b) => {
      const diff = Number(b.score || 0) - Number(a.score || 0);
      return diff !== 0 ? diff : Number(b.budget || 0) - Number(a.budget || 0);
    })
    .slice(0, 10);

  const evaluatorMap = {};
  yearProjects.forEach((p) => {
    const op = p.oral_presentation || p.oralPresentation || null;
    const evs = Array.isArray(op?.evaluators) ? op.evaluators
      : Array.isArray(p.evaluators) ? p.evaluators : [];
    evs.forEach((ev) => {
      const name = typeof ev === "string" ? ev : ev.name;
      if (!name) return;
      if (!evaluatorMap[name]) evaluatorMap[name] = { name, assigned: 0, completed: 0, scores: [] };
      evaluatorMap[name].assigned += 1;
      if (["Approved","Rejected","For Revision"].includes(normalizeStatus(p.status)))
        evaluatorMap[name].completed += 1;
      const sc = getScore(p);
      if (sc > 0) evaluatorMap[name].scores.push(sc);
    });
  });

  const evaluatorPerf = Object.values(evaluatorMap).map((ev) => ({
    name: ev.name, assigned: ev.assigned, completed: ev.completed,
    avgScore: ev.scores.length > 0
      ? Math.round(ev.scores.reduce((a, b) => a + b, 0) / ev.scores.length) : 0,
  }));

  // Funding breakdown — dynamic per department
  const localProjects    = yearProjects.filter((p) => !p.funding_type || p.funding_type === "local");
  const externalProjects = yearProjects.filter((p) => p.funding_type === "external");
  const localBudget      = localProjects.reduce((s, p) => s + getProjectBudget(p), 0);
  const externalBudget   = externalProjects.reduce((s, p) => s + parseNumericBudget(p.external_amount || p.budget || p.total_budget), 0);

  const agencyMap = {};
  externalProjects.forEach((p) => {
    const agency = p.funding_agency || "Unknown Agency";
    if (!agencyMap[agency]) agencyMap[agency] = { agency, count: 0, budget: 0 };
    agencyMap[agency].count++;
    agencyMap[agency].budget += parseNumericBudget(p.external_amount || p.budget || p.total_budget);
  });
  const byAgency = Object.values(agencyMap).sort((a, b) => b.count - a.count);

  const deptFundMap = {};
  yearProjects.forEach((p) => {
    const dept = getDepartmentName(p);
    if (!deptFundMap[dept])
      deptFundMap[dept] = { department: dept, local: 0, external: 0, localBudget: 0, externalBudget: 0 };
    if (!p.funding_type || p.funding_type === "local") {
      deptFundMap[dept].local++;
      deptFundMap[dept].localBudget += getProjectBudget(p);
    } else {
      deptFundMap[dept].external++;
      deptFundMap[dept].externalBudget += parseNumericBudget(p.external_amount || p.budget || p.total_budget);
    }
  });
  const byFundingDept = Object.values(deptFundMap)
    .sort((a, b) => (b.local + b.external) - (a.local + a.external));

  return {
    summary, monthly, byDepartment, statusDist, topProposals, evaluatorPerf,
    funding: { localCount: localProjects.length, externalCount: externalProjects.length,
      localBudget, externalBudget, byAgency, byFundingDept },
  };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ score = 0 }) {
  const s = Number(score || 0);
  const color = s >= 90 ? "#15803d" : s >= 80 ? "#f59e0b" : "#dc2626";
  return (
    <div className="adm-bar-wrap">
      <div className="adm-bar-track">
        <div className="adm-bar-fill" style={{ width: `${Math.min(s, 100)}%`, background: color }} />
      </div>
      <span className="adm-bar-value" style={{ color }}>{s}</span>
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} className={`rpt-tab-btn${active ? " active" : ""}`}>
      <Icon size={15} /> {label}
    </button>
  );
}

function EmptyState({ message = "No report data available yet." }) {
  return (
    <div className="adm-empty">
      <FileText size={38} color="#d1d5db" style={{ display: "block", margin: "0 auto" }} />
      <p>{message}</p>
    </div>
  );
}

const PieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  const R = Math.PI / 180;
  const r = outerRadius + 34;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central" fontSize={11} fontWeight={500}>
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Reports() {
  const [data, setData]             = useState(EMPTY_REPORTS);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("overview");
  const [yearFilter, setYearFilter] = useState("2026");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const [reportsRes, proposalsRes, facultyRes, evaluatorsRes] = await Promise.all([
          api.get("/admin/reports").catch(() => ({ data: null })),
          api.get("/admin/proposals").catch(() => ({ data: [] })),
          api.get("/admin/faculty").catch(() => ({ data: [] })),
          api.get("/admin/evaluators").catch(() => ({ data: [] })),
        ]);

        const reportData    = reportsRes.data || {};
        const proposalsData = Array.isArray(proposalsRes.data) ? proposalsRes.data : [];
        const facultyData   = Array.isArray(facultyRes.data)   ? facultyRes.data   : [];
        const evaluatorData = Array.isArray(evaluatorsRes.data) ? evaluatorsRes.data : [];

        if (!isReportEmpty(reportData)) {
          setData({
            summary: {
              ...EMPTY_REPORTS.summary, ...(reportData.summary || {}),
              totalFaculty:    reportData.summary?.totalFaculty    ?? facultyData.length,
              totalEvaluators: reportData.summary?.totalEvaluators ?? evaluatorData.length,
            },
            monthly:       Array.isArray(reportData.monthly)       ? reportData.monthly       : [],
            byDepartment:  Array.isArray(reportData.byDepartment)  ? reportData.byDepartment  : [],
            statusDist:    Array.isArray(reportData.statusDist)    ? reportData.statusDist    : [],
            topProposals:  Array.isArray(reportData.topProposals)  ? reportData.topProposals  : [],
            evaluatorPerf: Array.isArray(reportData.evaluatorPerf) ? reportData.evaluatorPerf : [],
          });
          return;
        }

        setData(buildReportsFromProjects({
          proposals: proposalsData, faculty: facultyData,
          evaluators: evaluatorData, year: yearFilter,
        }));
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
        keys.map((k) => `"${String(row[k] ?? "").replaceAll('"', '""')}"`).join(",")
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = filename;
    a.click();
  };

  const s              = data.summary || EMPTY_REPORTS.summary;
  const totalProposals = Number(s.totalProposals || 0);
  const approved       = Number(s.approved || 0);
  const approvalRate   = totalProposals > 0 ? Math.round((approved / totalProposals) * 100) : 0;
  const hasChartData   = data.monthly.length > 0 || data.statusDist.length > 0 || data.byDepartment.length > 0;

  const summaryCards = [
    { label: "Total Proposals", value: s.totalProposals,         sub: "All submitted proposals",            icon: FileText,     color: "#f59e0b", bg: "#fefce8", border: "#fde68a", trend: totalProposals > 0 ? "up" : null },
    { label: "Approved",        value: s.approved,               sub: `${approvalRate}% approval rate`,     icon: CheckCircle2, color: "#15803d", bg: "#dcfce7", border: "#bbf7d0", trend: approved > 0 ? "up" : null },
    { label: "Pending Review",  value: s.pending,                sub: "Awaiting action",                    icon: Clock,        color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", trend: null },
    { label: "Rejected",        value: s.rejected,               sub: "Not approved",                       icon: XCircle,      color: "#dc2626", bg: "#fef2f2", border: "#fecaca", trend: null },
    { label: "Total Budget",    value: fmtTotalBudget(s.totalBudget), sub: "Numeric budgets only",          icon: TrendingUp,   color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", trend: Number(s.totalBudget || 0) > 0 ? "up" : null },
    { label: "Avg. Score",      value: `${s.avgScore || 0}/100`, sub: "Average across all evaluated",       icon: Activity,     color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", trend: Number(s.avgScore || 0) > 0 ? "up" : null },
    { label: "Faculty",         value: s.totalFaculty,           sub: "Active researchers",                 icon: Users,        color: "#0e7490", bg: "#e0f2fe", border: "#bae6fd", trend: null },
    { label: "Evaluators",      value: s.totalEvaluators,        sub: "Active evaluators",                  icon: Users,        color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", trend: null },
  ];

  return (
    <div className="adm-page">
      <AdminNavbar onWidthChange={setSidebarWidth} />

      <div className="adm-main" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar title="Reports" />

        <div className="adm-content">

          {/* ── Header ── */}
          <div className="rpt-header-row">
            <h3 className="rpt-header-sub">
              Research project and proposal performance overview
            </h3>
            <div className="rpt-header-actions">
              <div className="rpt-select-wrap">
                <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}
                  className="rpt-year-select">
                  {["2026","2025","2024"].map((y) => <option key={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} color="#6b7280" className="rpt-select-chevron" />
              </div>
              <button
                onClick={() => exportCSV(data.topProposals, "proposals-report.csv")}
                disabled={data.topProposals.length === 0}
                className="rpt-export-btn">
                <Download size={15} /> Export CSV
              </button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="rpt-tab-row">
            <TabBtn active={activeTab === "overview"}    onClick={() => setActiveTab("overview")}    icon={BarChart2} label="Overview" />
            <TabBtn active={activeTab === "proposals"}   onClick={() => setActiveTab("proposals")}   icon={FileText}  label="Proposals" />
            <TabBtn active={activeTab === "evaluators"}  onClick={() => setActiveTab("evaluators")}  icon={Users}     label="Evaluators" />
            <TabBtn active={activeTab === "departments"} onClick={() => setActiveTab("departments")} icon={PieIcon}   label="Departments" />
            <TabBtn active={activeTab === "funding"}     onClick={() => setActiveTab("funding")}     icon={Globe}     label="Funding" />
          </div>

          {loading ? (
            <p className="adm-loading">Loading reports…</p>
          ) : (
            <>

              {/* ══ Overview ══ */}
              {activeTab === "overview" && (
                <>
                  <div className="rpt-grid-cards">
                    {summaryCards.map(({ label, value, sub, icon: Icon, color, bg, border, trend }) => (
                      <div key={label} className="rpt-summary-card" style={{ borderTop: `3px solid ${color}` }}>
                        <div className="rpt-summary-card-top">
                          <div className="rpt-summary-icon" style={{ background: bg, border: `1px solid ${border}` }}>
                            <Icon size={16} color={color} strokeWidth={1.8} />
                          </div>
                          {trend === "up"   && <ArrowUpRight   size={16} color="#15803d" />}
                          {trend === "down" && <ArrowDownRight size={16} color="#dc2626" />}
                        </div>
                        <p className="rpt-summary-value">{value}</p>
                        <p className="rpt-summary-label">{label}</p>
                        <p className="rpt-summary-sub">{sub}</p>
                      </div>
                    ))}
                  </div>

                  {!hasChartData ? (
                    <EmptyState message="No report data yet. Reports appear once proposals are submitted, evaluated, or approved." />
                  ) : (
                    <>
                      <div className="rpt-grid-2">
                        {/* Monthly Trends */}
                        <div className="adm-card">
                          <div className="adm-card-top">
                            <h3 className="adm-card-h">Monthly Submission Trends</h3>
                            <span className="adm-badge-yellow">{yearFilter}</span>
                          </div>
                          {data.monthly.length === 0 ? <EmptyState message="No monthly data yet." /> : (
                            <ResponsiveContainer width="100%" height={240}>
                              <LineChart data={data.monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Line type="monotone" dataKey="approved"  name="Approved"  stroke="#15803d" strokeWidth={2.5} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="rejected"  name="Rejected"  stroke="#dc2626" strokeWidth={2}   dot={{ r: 4 }} strokeDasharray="5 3" />
                                <Line type="monotone" dataKey="submitted" name="Submitted" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        {/* Status Distribution */}
                        <div className="adm-card">
                          <div className="adm-card-top">
                            <h3 className="adm-card-h">Proposal Status Distribution</h3>
                            <span className="adm-badge-yellow">{s.totalProposals || 0} total</span>
                          </div>
                          {data.statusDist.length === 0 ? <EmptyState message="No status data yet." /> : (
                            <ResponsiveContainer width="100%" height={240}>
                              <PieChart>
                                <Pie data={data.statusDist} cx="50%" cy="50%" outerRadius={85}
                                  label={PieLabel} labelLine dataKey="value">
                                  {data.statusDist.map((entry, i) => (
                                    <Cell key={i} fill={entry.color || "#f59e0b"} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Budget by Department — fully dynamic */}
                      <div className="adm-card" style={{ marginBottom: 0 }}>
                        <div className="adm-card-top">
                          <h3 className="adm-card-h">Budget Allocation by Department</h3>
                          <button onClick={() => exportCSV(data.byDepartment, "dept-budget.csv")}
                            disabled={data.byDepartment.length === 0}
                            className="adm-export-mini">
                            <Download size={13} /> CSV
                          </button>
                        </div>
                        {data.byDepartment.length === 0 ? (
                          <EmptyState message="No department budget data yet." />
                        ) : (
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={data.byDepartment} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                              <XAxis dataKey="department" tick={{ fontSize: 10, fill: "#6b7280" }}
                                interval={0} angle={-18} textAnchor="end" />
                              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }}
                                tickFormatter={(v) => v >= 1000 ? `₱${v / 1000}K` : `₱${v}`} />
                              <Tooltip formatter={(v) => [fmtBudget(v), "Budget"]} />
                              <Bar dataKey="budget" fill="#f59e0b" radius={[5,5,0,0]} maxBarSize={52} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ══ Proposals ══ */}
              {activeTab === "proposals" && (
                <div className="adm-card">
                  <div className="adm-card-top-mb16">
                    <h3 className="adm-card-h">Top Performing Proposals</h3>
                    <button onClick={() => exportCSV(data.topProposals, "top-proposals.csv")}
                      disabled={data.topProposals.length === 0}
                      className="adm-export-mini">
                      <Download size={13} /> Export
                    </button>
                  </div>

                  {data.topProposals.length === 0 ? (
                    <EmptyState message="No top performing proposals yet." />
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            {["Rank","ID","Title","Researcher","Department","Budget","Score","Status"]
                              .map((h) => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {data.topProposals.map((p, i) => {
                            const ss = STATUS_STYLE[p.status] || STATUS_STYLE.Pending;
                            return (
                              <tr key={p.id || i}>
                                <td>
                                  <div className="adm-rank-badge" style={{
                                    background: i === 0 ? "#fef9c3" : i === 1 ? "#f3f4f6" : "#fff7ed",
                                    border: `1px solid ${i === 0 ? "#fde68a" : "#e5e7eb"}`,
                                    color: i === 0 ? "#a16207" : "#6b7280",
                                  }}>{i + 1}</div>
                                </td>
                                <td style={{ fontWeight: 600, color: "#111827", whiteSpace: "nowrap" }}>{p.id}</td>
                                <td style={{ maxWidth: 220 }}>
                                  <p style={{ margin: 0, fontWeight: 500, color: "#111827" }}>{p.title}</p>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>{p.researcher}</td>
                                <td style={{ whiteSpace: "nowrap" }}>{p.dept}</td>
                                <td style={{ whiteSpace: "nowrap" }}>{fmtBudget(p.budgetRaw)}</td>
                                <td style={{ minWidth: 120 }}><ScoreBar score={p.score} /></td>
                                <td>
                                  <span className="adm-status-pill" style={{
                                    background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                                  }}>{p.status}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="rpt-monthly-divider">
                    <h3 className="adm-card-h" style={{ marginBottom: 16 }}>Monthly Submissions vs Approvals</h3>
                    {data.monthly.length === 0 ? <EmptyState message="No monthly data yet." /> : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.monthly} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="submitted" name="Submitted" fill="#f59e0b" radius={[4,4,0,0]} maxBarSize={40} />
                          <Bar dataKey="approved"  name="Approved"  fill="#15803d" radius={[4,4,0,0]} maxBarSize={40} />
                          <Bar dataKey="rejected"  name="Rejected"  fill="#dc2626" radius={[4,4,0,0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {/* ══ Evaluators ══ */}
              {activeTab === "evaluators" && (
                <div className="adm-card">
                  <div className="adm-card-top-mb20">
                    <h3 className="adm-card-h">Evaluator Performance</h3>
                    <button onClick={() => exportCSV(data.evaluatorPerf, "evaluator-perf.csv")}
                      disabled={data.evaluatorPerf.length === 0}
                      className="adm-export-mini">
                      <Download size={13} /> Export
                    </button>
                  </div>
                  {data.evaluatorPerf.length === 0 ? (
                    <EmptyState message="No evaluator performance data yet." />
                  ) : (
                    <div className="adm-table-wrap">
                      <table className="adm-table">
                        <thead>
                          <tr>
                            {["Evaluator","Assigned","Completed","Completion Rate","Avg. Score"]
                              .map((h) => <th key={h}>{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {data.evaluatorPerf.map((ev) => {
                            const assigned  = Number(ev.assigned  || 0);
                            const completed = Number(ev.completed || 0);
                            const rate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
                            const rateColor = rate >= 90 ? "#15803d" : rate >= 70 ? "#f59e0b" : "#dc2626";
                            return (
                              <tr key={ev.name}>
                                <td>
                                  <div className="rpt-eval-avatar">
                                    <div className="rpt-eval-avatar-circle">{ev.name?.charAt(0) || "E"}</div>
                                    <span style={{ fontWeight: 600, color: "#111827" }}>{ev.name}</span>
                                  </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{assigned}</td>
                                <td style={{ fontWeight: 600 }}>{completed}</td>
                                <td style={{ minWidth: 160 }}>
                                  <div className="adm-bar-wrap">
                                    <div className="adm-bar-track">
                                      <div className="adm-bar-fill" style={{ width: `${rate}%`, background: rateColor }} />
                                    </div>
                                    <span className="adm-bar-value">{rate}%</span>
                                  </div>
                                </td>
                                <td style={{ minWidth: 120 }}><ScoreBar score={ev.avgScore} /></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ══ Departments ══ */}
              {activeTab === "departments" && (
                <>
                  {data.byDepartment.length === 0 ? (
                    <EmptyState message="No department report data yet." />
                  ) : (
                    <>
                      <div className="rpt-grid-2">
                        <div className="adm-card">
                          <h3 className="adm-card-h" style={{ marginBottom: 12 }}>Proposals per Department</h3>
                          <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={data.byDepartment} layout="vertical"
                              margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                              <XAxis type="number" tick={{ fontSize: 11, fill: "#6b7280" }} />
                              <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: "#374151" }} width={80} />
                              <Tooltip />
                              <Bar dataKey="proposals" name="Proposals" fill="#f59e0b" radius={[0,5,5,0]} maxBarSize={24} />
                              <Bar dataKey="approved"  name="Approved"  fill="#15803d" radius={[0,5,5,0]} maxBarSize={24} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="adm-card">
                          <h3 className="adm-card-h" style={{ marginBottom: 12 }}>Budget Share by Department</h3>
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie
                                data={data.byDepartment.map((d) => ({ name: d.department, value: d.budget || 0 }))}
                                cx="50%" cy="50%" outerRadius={85} dataKey="value"
                                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine>
                                {data.byDepartment.map((_, i) => (
                                  <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(v) => [fmtBudget(v), "Budget"]} />
                              <Legend wrapperStyle={{ fontSize: 11 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="adm-card">
                        <div className="adm-card-top-mb16">
                          <h3 className="adm-card-h">Department Summary Table</h3>
                          <button onClick={() => exportCSV(data.byDepartment, "departments.csv")}
                            className="adm-export-mini">
                            <Download size={13} /> Export
                          </button>
                        </div>
                        <div className="adm-table-wrap">
                          <table className="adm-table">
                            <thead>
                              <tr>
                                {["Department","Total Proposals","Approved","Approval Rate","Total Budget"]
                                  .map((h) => <th key={h}>{h}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {data.byDepartment.map((d) => {
                                const props = Number(d.proposals || 0);
                                const appr  = Number(d.approved  || 0);
                                const rate  = props > 0 ? Math.round((appr / props) * 100) : 0;
                                return (
                                  <tr key={d.department}>
                                    <td style={{ fontWeight: 600, color: "#111827" }}>{d.department}</td>
                                    <td>{props}</td>
                                    <td><span className="adm-badge-green">{appr}</span></td>
                                    <td style={{ minWidth: 140 }}>
                                      <div className="adm-bar-wrap">
                                        <div className="adm-bar-track">
                                          <div className="adm-bar-fill" style={{ width: `${rate}%`, background: "#f59e0b" }} />
                                        </div>
                                        <span className="adm-bar-value">{rate}%</span>
                                      </div>
                                    </td>
                                    <td style={{ fontWeight: 600, color: "#111827" }}>{fmtBudget(d.budget)}</td>
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

              {/* ══ Funding ══ */}
              {activeTab === "funding" && (
                <FundingTab funding={data.funding || EMPTY_REPORTS.funding} exportCSV={exportCSV} />
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Funding tab ──────────────────────────────────────────────────────────────

function FundingTab({ funding: f, exportCSV }) {
  const totalFunded = f.localCount + f.externalCount;
  const localPct    = totalFunded > 0 ? Math.round((f.localCount    / totalFunded) * 100) : 0;
  const externalPct = totalFunded > 0 ? Math.round((f.externalCount / totalFunded) * 100) : 0;

  const donutData = [
    { name: "Local",    value: f.localCount,    color: "#15803d" },
    { name: "External", value: f.externalCount, color: "#1d4ed8" },
  ].filter((d) => d.value > 0);

  return (
    <>
      {/* Hero cards */}
      <div className="rpt-funding-hero">
        {/* Local */}
        <div className="rpt-funding-card" style={{ borderTop: "3px solid #15803d" }}>
          <div className="rpt-funding-card-top">
            <div className="rpt-funding-card-left">
              <div className="rpt-funding-icon" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                <Building2 size={16} color="#15803d" strokeWidth={1.8} />
              </div>
              <span className="rpt-funding-label">Locally Funded</span>
            </div>
            <span className="rpt-funding-badge" style={{ color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0" }}>
              {localPct}%
            </span>
          </div>
          <p className="rpt-funding-count">{f.localCount}</p>
          <p className="rpt-funding-budget-sub">{fmtTotalBudget(f.localBudget)} total budget</p>
          <div className="rpt-funding-bar">
            <div className="rpt-funding-bar-fill" style={{ width: `${localPct}%`, background: "#15803d" }} />
          </div>
        </div>

        {/* External */}
        <div className="rpt-funding-card" style={{ borderTop: "3px solid #1d4ed8" }}>
          <div className="rpt-funding-card-top">
            <div className="rpt-funding-card-left">
              <div className="rpt-funding-icon" style={{ background: "#dbeafe", border: "1px solid #bfdbfe" }}>
                <Globe size={16} color="#1d4ed8" strokeWidth={1.8} />
              </div>
              <span className="rpt-funding-label">Externally Funded</span>
            </div>
            <span className="rpt-funding-badge" style={{ color: "#1d4ed8", background: "#dbeafe", border: "1px solid #bfdbfe" }}>
              {externalPct}%
            </span>
          </div>
          <p className="rpt-funding-count">{f.externalCount}</p>
          <p className="rpt-funding-budget-sub">{fmtTotalBudget(f.externalBudget)} external budget</p>
          <div className="rpt-funding-bar">
            <div className="rpt-funding-bar-fill" style={{ width: `${externalPct}%`, background: "#1d4ed8" }} />
          </div>
        </div>
      </div>

      {totalFunded === 0 ? (
        <EmptyState message="No funding data yet. Submit proposals with funding type set to see the breakdown." />
      ) : (
        <>
          <div className="rpt-grid-2">
            {/* Donut */}
            <div className="adm-card">
              <div className="adm-card-top">
                <h3 className="adm-card-h">Funding Distribution</h3>
                <span className="adm-badge-yellow">{totalFunded} total</span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, name) => [v, name]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* By Dept stacked */}
            <div className="adm-card">
              <div className="adm-card-top">
                <h3 className="adm-card-h">By Department</h3>
                <span className="adm-badge-blue">Local vs External</span>
              </div>
              {f.byFundingDept.length === 0 ? <EmptyState message="No department data yet." /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={f.byFundingDept} layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 10, fill: "#374151" }} width={80} />
                    <Tooltip formatter={(v, n) => [v, n === "local" ? "Local" : "External"]} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }}
                      formatter={(v) => v === "local" ? "Local" : "External"} />
                    <Bar dataKey="local"    name="local"    fill="#15803d" radius={[0,4,4,0]} maxBarSize={14} stackId="a" />
                    <Bar dataKey="external" name="external" fill="#1d4ed8" radius={[0,4,4,0]} maxBarSize={14} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Agencies table */}
          {f.byAgency.length > 0 && (
            <div className="adm-card" style={{ marginBottom: 20 }}>
              <div className="adm-card-top-mb16">
                <div>
                  <h3 className="adm-card-h">External Funding Agencies</h3>
                  <p className="adm-card-note">All agencies funding external research projects</p>
                </div>
                <button onClick={() => exportCSV(f.byAgency, "funding-agencies.csv")} className="adm-export-mini">
                  <Download size={13} /> Export
                </button>
              </div>
              <div className="adm-table-wrap">
                <table className="adm-table">
                  <thead>
                    <tr>{["#","Agency","Projects","Share","Total Budget"].map((h) => <th key={h}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {f.byAgency.map((ag, i) => {
                      const sharePct = f.externalCount > 0 ? Math.round((ag.count / f.externalCount) * 100) : 0;
                      return (
                        <tr key={ag.agency}>
                          <td>
                            <div className="adm-rank-badge" style={{
                              background: i === 0 ? "#dbeafe" : "#f3f4f6",
                              border: `1px solid ${i === 0 ? "#bfdbfe" : "#e5e7eb"}`,
                              color: i === 0 ? "#1d4ed8" : "#6b7280",
                            }}>{i + 1}</div>
                          </td>
                          <td>
                            <div className="rpt-agency-cell">
                              <Globe size={13} color="#1d4ed8" />{ag.agency}
                            </div>
                          </td>
                          <td><span className="adm-badge-blue-lg">{ag.count}</span></td>
                          <td style={{ minWidth: 160 }}>
                            <div className="adm-bar-wrap">
                              <div className="rpt-agency-bar-track">
                                <div className="rpt-agency-bar-fill" style={{ width: `${sharePct}%` }} />
                              </div>
                              <span className="rpt-agency-share-value">{sharePct}%</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 600, color: "#111827" }}>{fmtBudget(ag.budget)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Dept breakdown table */}
          <div className="adm-card">
            <div className="adm-card-top-mb16">
              <div>
                <h3 className="adm-card-h">Department Funding Breakdown</h3>
                <p className="adm-card-note">Local and external projects per department</p>
              </div>
              <button onClick={() => exportCSV(f.byFundingDept, "dept-funding.csv")} className="adm-export-mini">
                <Download size={13} /> Export
              </button>
            </div>
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    {["Department","Local","External","Total","Local Budget","External Budget"]
                      .map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {f.byFundingDept.map((d) => (
                    <tr key={d.department}>
                      <td style={{ fontWeight: 600, color: "#111827" }}>{d.department}</td>
                      <td><span className="adm-badge-green-lg">{d.local}</span></td>
                      <td><span className="adm-badge-blue-lg">{d.external}</span></td>
                      <td className="rpt-dept-total">{d.local + d.external}</td>
                      <td style={{ color: "#15803d", fontWeight: 600 }}>
                        {d.localBudget > 0 ? fmtBudget(d.localBudget) : "—"}
                      </td>
                      <td style={{ color: "#1d4ed8", fontWeight: 600 }}>
                        {d.externalBudget > 0 ? fmtBudget(d.externalBudget) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}