import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  Users, FileText, ClipboardList, ShieldCheck, ArrowRight,
  CalendarCheck, BarChart3, CheckCircle2, Clock, RotateCcw,
  XCircle, Activity, Wallet, Layers, Building2, Globe, TrendingUp,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import "../../styles/admin.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ["#15803d","#0e7490","#7c3aed","#d97706","#dc2626","#6b7280"];

const STATUS_STYLES = {
  Approved:           { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Submitted:          { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  "Under Evaluation": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Evaluated:          { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Endorsed:           { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended:        { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  Forwarded:          { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  "For Revision":     { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  Rejected:           { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString();

const fmtCurrency = (raw) => {
  if (!raw && raw !== 0) return "₱0";
  const str = String(raw).trim();
  if (!str || str === "0") return "₱0";
  const cleaned = str.replace(/[₱,\s]/g, "");
  const num = parseFloat(cleaned);
  if (!isNaN(num) && cleaned.replace(/[\d.]/g, "") === "") {
    if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `₱${(num / 1_000).toFixed(1)}K`;
    return `₱${num.toLocaleString()}`;
  }
  return `₱${str}`;
};

const parseBudget = (raw) => {
  if (!raw) return 0;
  const n = parseFloat(String(raw).replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
};

const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

const getDept = (p) =>
  p.department_center?.name || p.department || p.creator?.department || "Unassigned";

// ─── Chart label ──────────────────────────────────────────────────────────────

const PieLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
  const R = Math.PI / 180;
  const r = outerRadius + 36;
  const x = cx + r * Math.cos(-midAngle * R);
  const y = cy + r * Math.sin(-midAngle * R);
  return (
    <text x={x} y={y} fill="#374151" textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, action, onClick, icon: Icon, color, bg, border, accent }) {
  return (
    <div className={`dash-stat-card${onClick ? " clickable" : ""}`}
      style={{ borderTop: `3px solid ${accent}` }}
      onClick={onClick}>
      <div className="dash-stat-card-top">
        <p className="dash-stat-label">{label}</p>
        <div className="dash-stat-icon" style={{ background: bg, border: `1px solid ${border}` }}>
          <Icon size={20} color={color} strokeWidth={1.9} />
        </div>
      </div>
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-sub">{sub}</p>
      {action && (
        <button type="button" className="dash-stat-action" style={{ color: accent }}
          onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function ShortcutCard({ icon: Icon, title, subtitle, color, bg, onClick }) {
  return (
    <button type="button" onClick={onClick} className="dash-shortcut-btn">
      <div className="dash-shortcut-icon" style={{ background: bg }}>
        <Icon size={19} color={color} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <p className="dash-shortcut-title">{title}</p>
        <p className="dash-shortcut-sub">{subtitle}</p>
      </div>
      <ArrowRight size={15} color="#9ca3af" />
    </button>
  );
}

function EmptyBox({ icon: Icon = FileText, title, subtitle }) {
  return (
    <div className="dash-empty-box">
      <Icon size={38} color="#d1d5db" className="dash-empty-icon" />
      <p className="dash-empty-title">{title}</p>
      <p className="dash-empty-sub">{subtitle}</p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [proposals, setProposals] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/dashboard/stats").catch(() => ({ data: null })),
      api.get("/admin/proposals").catch(() => ({ data: [] })),
    ]).then(([statsRes, proposalsRes]) => {
      setStats(statsRes.data || null);
      setProposals(Array.isArray(proposalsRes.data) ? proposalsRes.data : []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalFaculty    = stats?.total_faculty    ?? 0;
  const totalEvaluators = stats?.total_evaluators ?? 0;
  const totalProposals  = stats?.total_proposals  ?? stats?.total_projects ?? 0;
  const systemUsers     = stats?.system_users     ?? 0;
  const totalBudget     = stats?.total_budget     ?? 0;

  const byStatus           = stats?.byStatus || {};
  const approved           = byStatus.approved            ?? 0;
  const submitted          = byStatus.submitted           ?? 0;
  const presentationSched  = byStatus.presentation_scheduled ?? 0;
  const underEvaluation    = (byStatus.under_evaluation   ?? 0) + (byStatus.evaluated ?? 0);
  const endorsed           = byStatus.endorsed            ?? 0;
  const recommended        = byStatus.recommended         ?? 0;
  const forRevision        = byStatus.for_revision        ?? 0;
  const rejected           = byStatus.rejected            ?? 0;
  const approvalRate       = pct(approved, totalProposals);

  // Bar chart — project count per department (dynamic)
  const barData = (stats?.byDepartment || [])
    .map((d) => ({ dept: d.department, budget: Math.round((d.total_budget || 0) / 1000), count: d.count || 0 }))
    .filter((d) => d.count > 0);

  // ── Funding overview — built from raw proposals (always dynamic) ─────────
  const localProjects    = proposals.filter((p) => !p.funding_type || p.funding_type === "local");
  const externalProjects = proposals.filter((p) => p.funding_type === "external");

  const localCount       = localProjects.length;
  const externalCount    = externalProjects.length;
  const totalFundedCount = localCount + externalCount;

  const localBudget    = localProjects.reduce((s, p)    => s + parseBudget(p.budget || p.total_budget), 0);
  const externalBudget = externalProjects.reduce((s, p) => s + parseBudget(p.external_amount || p.budget || p.total_budget), 0);

  const localPct    = totalFundedCount > 0 ? Math.round((localCount    / totalFundedCount) * 100) : 0;
  const externalPct = totalFundedCount > 0 ? Math.round((externalCount / totalFundedCount) * 100) : 0;

  // Agency breakdown — dynamic, all agencies
  const agencyMap = {};
  externalProjects.forEach((p) => {
    const agency = p.funding_agency || "Unknown Agency";
    if (!agencyMap[agency]) agencyMap[agency] = { name: agency, count: 0, budget: 0 };
    agencyMap[agency].count++;
    agencyMap[agency].budget += parseBudget(p.external_amount || p.budget || p.total_budget);
  });
  const agencyData = Object.values(agencyMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // Department funding breakdown — dynamic, all departments
  const deptFundingMap = {};
  proposals.forEach((p) => {
    const dept = getDept(p);
    if (!deptFundingMap[dept]) deptFundingMap[dept] = { dept, local: 0, external: 0 };
    if (!p.funding_type || p.funding_type === "local") deptFundingMap[dept].local++;
    else deptFundingMap[dept].external++;
  });
  const deptFundingData = Object.values(deptFundingMap)
    .filter((d) => d.local + d.external > 0)
    .sort((a, b) => (b.local + b.external) - (a.local + a.external))
    .slice(0, 8);

  // ── Pie / chart data ─────────────────────────────────────────────────────
  const pieData = [
    { name: "Approved",         value: approved },
    { name: "Submitted",        value: submitted },
    { name: "Pres. Scheduled",  value: presentationSched },
    { name: "Under Evaluation", value: underEvaluation },
    { name: "Endorsed",         value: endorsed },
    { name: "Recommended",      value: recommended },
    { name: "For Revision",     value: forRevision },
    { name: "Rejected",         value: rejected },
  ].filter((d) => d.value > 0);

  const hasChartData = pieData.length > 0 || barData.length > 0;

  const workflowItems = [
    { label: "Submitted",              value: submitted,        icon: Clock,         bg: "#e0f2fe", color: "#0369a1" },
    { label: "Presentation Scheduled", value: presentationSched,icon: CalendarCheck, bg: "#dbeafe", color: "#1d4ed8" },
    { label: "Under Evaluation",       value: underEvaluation,  icon: Activity,      bg: "#f5f3ff", color: "#6d28d9" },
    { label: "Endorsed",               value: endorsed,          icon: CheckCircle2,  bg: "#dcfce7", color: "#15803d" },
    { label: "Recommended",            value: recommended,       icon: CheckCircle2,  bg: "#d1fae5", color: "#047857" },
    { label: "Approved",               value: approved,          icon: CheckCircle2,  bg: "#dcfce7", color: "#15803d" },
    { label: "For Revision",           value: forRevision,       icon: RotateCcw,     bg: "#fef3c7", color: "#d97706" },
    { label: "Rejected",               value: rejected,          icon: XCircle,       bg: "#fef2f2", color: "#dc2626" },
  ];

  const cards = [
    { label: "Total Faculty",    value: loading ? "—" : fmt(totalFaculty),    sub: "Active researchers",          action: "Manage faculty",    onClick: () => navigate("/admin/faculty"),    icon: Users,        color: "#f59e0b", bg: "#fefce8", border: "#fde68a", accent: "#f59e0b" },
    { label: "Total Evaluators", value: loading ? "—" : fmt(totalEvaluators), sub: "Assigned proposal evaluators",action: "Manage evaluators", onClick: () => navigate("/admin/evaluators"), icon: ClipboardList,color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", accent: "#7c3aed" },
    { label: "Total Proposals",  value: loading ? "—" : fmt(totalProposals),  sub: "Submitted and active records",action: "View proposals",    onClick: () => navigate("/admin/proposals"),  icon: FileText,     color: "#0e7490", bg: "#e0f2fe", border: "#bae6fd", accent: "#0e7490" },
    { label: "System Users",     value: loading ? "—" : fmt(systemUsers),     sub: "All active system accounts",  action: null,                onClick: null,                                icon: ShieldCheck,  color: "#16a34a", bg: "#dcfce7", border: "#bbf7d0", accent: "#16a34a" },
  ];

  return (
    <div className="adm-page">
      <AdminNavbar onWidthChange={setSidebarWidth} />

      <div className="adm-main" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar title="Dashboard" />

        <div className="adm-content">

          {/* Welcome Banner */}
          <div className="dash-banner">
            <div>
              <p className="dash-banner-eyebrow">Admin Control Center</p>
              <h2 className="dash-banner-title">Research Project Management Dashboard</h2>
              <p className="dash-banner-sub">
                Monitor proposal flow, manage faculty and evaluators, and track system activity.
              </p>
            </div>
            <button type="button" onClick={() => navigate("/admin/proposals")} className="dash-banner-btn">
              <CalendarCheck size={15} /> Schedule Presentation
            </button>
          </div>

          {/* Stat Cards */}
          <div className="dash-grid">
            {cards.map((card) => <StatCard key={card.label} {...card} />)}
          </div>

          {/* Row 1: Workflow + Right Column */}
          <div className="dash-main-grid">

            {/* Proposal Workflow */}
            <div className="dash-card">
              <div className="dash-card-top">
                <div>
                  <h3 className="dash-card-h">Proposal Workflow</h3>
                  <p className="dash-card-sub">Current status of all submitted proposal records.</p>
                </div>
                <button type="button" onClick={() => navigate("/admin/proposals")} className="dash-link-btn">
                  View all <ArrowRight size={13} />
                </button>
              </div>
              <div className="dash-workflow-grid">
                {workflowItems.map((item) => {
                  const Icon = item.icon;
                  const percentage = pct(item.value, totalProposals);
                  return (
                    <div key={item.label} className="dash-workflow-item">
                      <div className="dash-workflow-item-top">
                        <div className="dash-workflow-icon" style={{ background: item.bg }}>
                          <Icon size={15} color={item.color} />
                        </div>
                        <span className="dash-workflow-label">{item.label}</span>
                      </div>
                      <div className="dash-workflow-row">
                        <span className="dash-workflow-value">{loading ? "—" : item.value}</span>
                        <span className="dash-workflow-pct">{loading ? "" : `${percentage}%`}</span>
                      </div>
                      <div className="dash-workflow-bar-track">
                        <div className="dash-workflow-bar-fill"
                          style={{ width: `${percentage}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right column */}
            <div className="dash-right-col">

              {/* System Health */}
              <div className="dash-card">
                <div className="dash-card-top">
                  <div>
                    <h3 className="dash-card-h">System Health</h3>
                    <p className="dash-card-sub">Key metrics at a glance.</p>
                  </div>
                </div>
                <div className="dash-health-grid">
                  <div className="dash-mini-card">
                    <CheckCircle2 size={22} color="#15803d" />
                    <p className="dash-mini-value">{loading ? "—" : `${approvalRate}%`}</p>
                    <p className="dash-mini-label">Approval Rate</p>
                  </div>
                  <div className="dash-mini-card">
                    <Wallet size={22} color="#0e7490" />
                    <p className="dash-mini-value">{loading ? "—" : fmtCurrency(totalBudget)}</p>
                    <p className="dash-mini-label">Total Budget</p>
                  </div>
                  <div className="dash-mini-card">
                    <Layers size={22} color="#7c3aed" />
                    <p className="dash-mini-value">{loading ? "—" : fmt(totalProposals)}</p>
                    <p className="dash-mini-label">Total Records</p>
                  </div>
                </div>

                <div className="dash-attention-divider">
                  <p className="dash-attention-heading">Needs Attention</p>
                  {[
                    { icon: RotateCcw, label: "For Revision",    value: forRevision,    color: "#d97706", bg: "#fef3c7" },
                    { icon: XCircle,   label: "Rejected",         value: rejected,        color: "#dc2626", bg: "#fef2f2" },
                    { icon: Activity,  label: "Under Evaluation", value: underEvaluation, color: "#6d28d9", bg: "#f5f3ff" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="dash-attention-row">
                        <div className="dash-attention-left">
                          <div className="dash-attention-icon" style={{ background: item.bg }}>
                            <Icon size={14} color={item.color} />
                          </div>
                          <span className="dash-attention-label">{item.label}</span>
                        </div>
                        <span style={{ fontSize: 16, fontWeight: 850, color: item.color }}>
                          {loading ? "—" : item.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dash-card">
                <div className="dash-card-top">
                  <div>
                    <h3 className="dash-card-h">Quick Actions</h3>
                    <p className="dash-card-sub">Jump to common admin tasks.</p>
                  </div>
                </div>
                <div className="dash-shortcuts">
                  <ShortcutCard icon={Users}        title="Faculty"    subtitle="Manage researchers"   color="#f59e0b" bg="#fefce8" onClick={() => navigate("/admin/faculty")} />
                  <ShortcutCard icon={ClipboardList} title="Evaluators" subtitle="Manage evaluators"   color="#7c3aed" bg="#f5f3ff" onClick={() => navigate("/admin/evaluators")} />
                  <ShortcutCard icon={FileText}      title="Proposals"  subtitle="Schedule & review"   color="#0e7490" bg="#e0f2fe" onClick={() => navigate("/admin/proposals")} />
                  <ShortcutCard icon={BarChart3}     title="Reports"    subtitle="View system reports" color="#1d4ed8" bg="#dbeafe" onClick={() => navigate("/admin/reports")} />
                </div>
              </div>

            </div>
          </div>

          {/* Row 2: Charts */}
          {!loading && !hasChartData ? (
            <div className="dash-card" style={{ marginBottom: 20, padding: "60px 24px", textAlign: "center" }}>
              <FileText size={40} color="#d1d5db" style={{ margin: "0 auto 12px", display: "block" }} />
              <p className="dash-empty-title">No chart data yet</p>
              <p className="dash-empty-sub">Charts will appear once proposals are submitted and processed.</p>
            </div>
          ) : (
            <div className="dash-chart-grid">
              {pieData.length > 0 && (
                <div className="dash-card">
                  <div className="dash-card-top">
                    <div>
                      <h3 className="dash-card-h">Status Distribution</h3>
                      <p className="dash-card-sub">Breakdown of proposal statuses.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={90}
                        label={PieLabel} labelLine dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {barData.length > 0 ? (
                <div className="dash-card">
                  <div className="dash-card-top">
                    <div>
                      <h3 className="dash-card-h">Projects by Department</h3>
                      <p className="dash-card-sub">Number of projects per department.</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#6b7280" }} interval={0} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false}
                        label={{ value: "Projects", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip formatter={(v, name) => name === "count" ? [v, "Projects"] : [`₱${v}K`, "Budget"]} />
                      <Bar dataKey="count" fill="#15803d" radius={[4,4,0,0]} maxBarSize={52} name="count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="dash-card">
                  <EmptyBox icon={Wallet} title="No department data"
                    subtitle="Chart will appear once proposals include department information." />
                </div>
              )}
            </div>
          )}

          {/* ── Funding Overview ── */}
          <div className="dash-funding-section">
            <div className="dash-funding-header">
              <div className="dash-funding-accent" />
              <h3 className="dash-funding-title">Funding Overview</h3>
              <span className="dash-funding-subtitle">Local vs External breakdown</span>
            </div>

            {/* Hero cards */}
            <div className="dash-funding-hero">
              {/* Local */}
              <div className="dash-funding-card" style={{ borderTop: "3px solid #15803d" }}>
                <div className="dash-funding-card-top">
                  <div className="dash-funding-card-left">
                    <div className="dash-funding-icon" style={{ background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                      <Building2 size={16} color="#15803d" strokeWidth={1.8} />
                    </div>
                    <span className="dash-funding-label">Locally Funded</span>
                  </div>
                  <span className="dash-funding-pct-badge"
                    style={{ color: "#15803d", background: "#dcfce7", border: "1px solid #bbf7d0" }}>
                    {loading ? "—" : `${localPct}%`}
                  </span>
                </div>
                <p className="dash-funding-count">{loading ? "—" : localCount}</p>
                <p className="dash-funding-budget-sub">
                  {loading ? "" : `${fmtCurrency(localBudget)} total budget`}
                </p>
                <div className="dash-funding-bar">
                  <div className="dash-funding-bar-fill" style={{ width: `${localPct}%`, background: "#15803d" }} />
                </div>
              </div>

              {/* External */}
              <div className="dash-funding-card" style={{ borderTop: "3px solid #1d4ed8" }}>
                <div className="dash-funding-card-top">
                  <div className="dash-funding-card-left">
                    <div className="dash-funding-icon" style={{ background: "#dbeafe", border: "1px solid #bfdbfe" }}>
                      <Globe size={16} color="#1d4ed8" strokeWidth={1.8} />
                    </div>
                    <span className="dash-funding-label">Externally Funded</span>
                  </div>
                  <span className="dash-funding-pct-badge"
                    style={{ color: "#1d4ed8", background: "#dbeafe", border: "1px solid #bfdbfe" }}>
                    {loading ? "—" : `${externalPct}%`}
                  </span>
                </div>
                <p className="dash-funding-count">{loading ? "—" : externalCount}</p>
                <p className="dash-funding-budget-sub">
                  {loading ? "" : `${fmtCurrency(externalBudget)} external budget`}
                </p>
                <div className="dash-funding-bar">
                  <div className="dash-funding-bar-fill" style={{ width: `${externalPct}%`, background: "#1d4ed8" }} />
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div className="dash-funding-bottom">

              {/* By Department bar chart */}
              <div className="dash-card" style={{ marginBottom: 0 }}>
                <div className="dash-card-top">
                  <div>
                    <h3 className="dash-card-h">By Department</h3>
                    <p className="dash-card-sub">Local vs External per dept.</p>
                  </div>
                </div>
                {deptFundingData.length === 0 ? (
                  <div className="dash-no-data">
                    <Globe size={32} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                    <p>No data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={deptFundingData} layout="vertical"
                      margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                      <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: "#374151" }} width={72} />
                      <Tooltip formatter={(v, name) => [v, name === "local" ? "🏛️ Local" : "🌐 External"]} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }}
                        formatter={(v) => v === "local" ? "🏛️ Local" : "🌐 External"} />
                      <Bar dataKey="local"    name="local"    fill="#15803d" radius={[0,4,4,0]} maxBarSize={14} stackId="a" />
                      <Bar dataKey="external" name="external" fill="#1d4ed8" radius={[0,4,4,0]} maxBarSize={14} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Funding Agencies */}
              <div className="dash-card" style={{ marginBottom: 0 }}>
                <div className="dash-card-top">
                  <div>
                    <h3 className="dash-card-h">Funding Agencies</h3>
                    <p className="dash-card-sub">External project sources.</p>
                  </div>
                  <span className="adm-badge-blue">
                    {externalCount} project{externalCount !== 1 ? "s" : ""}
                  </span>
                </div>
                {agencyData.length === 0 ? (
                  <div className="dash-no-data">
                    <Globe size={32} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                    <p>No external projects yet</p>
                  </div>
                ) : (
                  <div className="dash-agency-list">
                    {agencyData.map((ag, i) => {
                      const pctAg = externalCount > 0 ? Math.round((ag.count / externalCount) * 100) : 0;
                      return (
                        <div key={ag.name}>
                          <div className="dash-agency-row-top">
                            <div className="dash-agency-left">
                              <div className="dash-agency-num">{i + 1}</div>
                              <span className="dash-agency-name">{ag.name}</span>
                            </div>
                            <div>
                              <span className="dash-agency-count">{ag.count}</span>
                              <span className="dash-agency-count-label">proj</span>
                            </div>
                          </div>
                          <div className="dash-agency-bar-track">
                            <div className="dash-agency-bar-fill" style={{ width: `${pctAg}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Budget Comparison Table */}
              <div className="dash-card" style={{ marginBottom: 0 }}>
                <div className="dash-card-top">
                  <div>
                    <h3 className="dash-card-h">Budget Comparison</h3>
                    <p className="dash-card-sub">Local vs External budget per dept.</p>
                  </div>
                </div>
                {deptFundingData.length === 0 ? (
                  <div className="dash-no-data">
                    <TrendingUp size={32} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                    <p>No data yet</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="dash-budget-table">
                      <thead>
                        <tr>
                          {["Department","🏛️ Local","🌐 External","Total"].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deptFundingData.map((d) => (
                          <tr key={d.dept}>
                            <td className="dash-budget-dept">{d.dept}</td>
                            <td style={{ textAlign: "center" }}>
                              <span className="adm-badge-green-lg">{d.local}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <span className="adm-badge-blue-lg">{d.external}</span>
                            </td>
                            <td className="dash-budget-total">{d.local + d.external}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
          {/* ── End Funding Overview ── */}

        </div>
      </div>
    </div>
  );
}