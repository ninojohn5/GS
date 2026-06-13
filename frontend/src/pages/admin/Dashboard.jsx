import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  Users,
  FileText,
  ClipboardList,
  ShieldCheck,
  ArrowRight,
  CalendarCheck,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  XCircle,
  Activity,
  Wallet,
  Layers,
  Building2,
  Globe,
  TrendingUp,
} from "lucide-react";
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
  Legend,
} from "recharts";

const PIE_COLORS = ["#15803d", "#0e7490", "#7c3aed", "#d97706", "#dc2626", "#6b7280"];

const STATUS_STYLES = {
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Submitted: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  "Under Evaluation": { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Evaluated: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Endorsed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  Forwarded: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

const fmt = (n) => Number(n || 0).toLocaleString();

// Fixed: handles string budgets like "10000/to be determined"
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

const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

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
      fontWeight={600}
    >
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || {
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
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  action,
  onClick,
  icon: Icon,
  color,
  bg,
  border,
  accent,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderTop: `3px solid ${accent}`,
        borderRadius: 14,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 7,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s, transform 0.15s",
        minWidth: 0,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.09)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
          e.currentTarget.style.transform = "translateY(0)";
        }
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
            fontWeight: 600,
            color: "#6b7280",
          }}
        >
          {label}
        </p>

        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: bg,
            border: `1px solid ${border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={color} strokeWidth={1.9} />
        </div>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 31,
          fontWeight: 850,
          color: "#111827",
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>

      <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>{sub}</p>

      {action && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          style={{
            marginTop: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 800,
            color: accent,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: 0,
          }}
        >
          {action} <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
}

function ShortcutCard({ icon: Icon, title, subtitle, color, bg, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        border: "1px solid #e5e7eb",
        background: "#fff",
        borderRadius: 13,
        padding: "14px 15px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={19} color={color} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#111827" }}>
          {title}
        </p>
        <p style={{ margin: "3px 0 0", fontSize: 12, color: "#9ca3af" }}>
          {subtitle}
        </p>
      </div>

      <ArrowRight size={15} color="#9ca3af" />
    </button>
  );
}

function EmptyBox({ icon: Icon = FileText, title, subtitle }) {
  return (
    <div
      style={{
        padding: "38px 20px",
        textAlign: "center",
      }}
    >
      <Icon size={38} color="#d1d5db" style={{ margin: "0 auto 12px", display: "block" }} />

      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#374151" }}>
        {title}
      </p>

      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>
        {subtitle}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
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

  const ml = isMobile ? 0 : sidebarWidth;

  const totalFaculty = stats?.total_faculty ?? 0;
  const totalEvaluators = stats?.total_evaluators ?? 0;
  const totalProposals = stats?.total_proposals ?? stats?.total_projects ?? 0;
  const systemUsers = stats?.system_users ?? 0;
  const totalBudget = stats?.total_budget ?? 0;

  const byStatus = stats?.byStatus || {};
  const approved           = byStatus.approved ?? 0;
  const submitted          = byStatus.submitted ?? 0;
  const presentationSched  = byStatus.presentation_scheduled ?? 0;
  const underEvaluation    = (byStatus.under_evaluation ?? 0) + (byStatus.evaluated ?? 0);
  const endorsed           = byStatus.endorsed ?? 0;
  const recommended        = byStatus.recommended ?? 0;
  const forRevision        = byStatus.for_revision ?? 0;
  const rejected           = byStatus.rejected ?? 0;
  const approvalRate = pct(approved, totalProposals);

  // Fixed: build barData from byDepartment — uses count as fallback if budget is 0
  const barData = (stats?.byDepartment || []).map((d) => ({
    dept:   d.department,
    budget: Math.round((d.total_budget || 0) / 1000),
    count:  d.count || 0,
  })).filter((d) => d.count > 0);

  const cards = [
    {
      label: "Total Faculty",
      value: loading ? "—" : fmt(totalFaculty),
      sub: "Active researchers",
      action: "Manage faculty",
      onClick: () => navigate("/admin/faculty"),
      icon: Users,
      color: "#f59e0b",
      bg: "#fefce8",
      border: "#fde68a",
      accent: "#f59e0b",
    },
    {
      label: "Total Evaluators",
      value: loading ? "—" : fmt(totalEvaluators),
      sub: "Assigned proposal evaluators",
      action: "Manage evaluators",
      onClick: () => navigate("/admin/evaluators"),
      icon: ClipboardList,
      color: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      accent: "#7c3aed",
    },
    {
      label: "Total Proposals",
      value: loading ? "—" : fmt(totalProposals),
      sub: "Submitted and active records",
      action: "View proposals",
      onClick: () => navigate("/admin/proposals"),
      icon: FileText,
      color: "#0e7490",
      bg: "#e0f2fe",
      border: "#bae6fd",
      accent: "#0e7490",
    },
    {
      label: "System Users",
      value: loading ? "—" : fmt(systemUsers),
      sub: "All active system accounts",
      icon: ShieldCheck,
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
      accent: "#16a34a",
    },
  ];

  const pieData = [
    { name: "Approved",               value: approved },
    { name: "Submitted",              value: submitted },
    { name: "Pres. Scheduled",        value: presentationSched },
    { name: "Under Evaluation",       value: underEvaluation },
    { name: "Endorsed",               value: endorsed },
    { name: "Recommended",            value: recommended },
    { name: "For Revision",           value: forRevision },
    { name: "Rejected",               value: rejected },
  ].filter((d) => d.value > 0);

  const workflowItems = [
    { label: "Submitted",             value: submitted,         icon: Clock,         bg: "#e0f2fe", color: "#0369a1" },
    { label: "Presentation Scheduled",value: presentationSched, icon: CalendarCheck, bg: "#dbeafe", color: "#1d4ed8" },
    { label: "Under Evaluation",      value: underEvaluation,   icon: Activity,      bg: "#f5f3ff", color: "#6d28d9" },
    { label: "Endorsed",              value: endorsed,           icon: CheckCircle2,  bg: "#dcfce7", color: "#15803d" },
    { label: "Recommended",           value: recommended,        icon: CheckCircle2,  bg: "#d1fae5", color: "#047857" },
    { label: "Approved",              value: approved,           icon: CheckCircle2,  bg: "#dcfce7", color: "#15803d" },
    { label: "For Revision",          value: forRevision,        icon: RotateCcw,     bg: "#fef3c7", color: "#d97706" },
    { label: "Rejected",              value: rejected,           icon: XCircle,       bg: "#fef2f2", color: "#dc2626" },
  ];

  const hasChartData = pieData.length > 0 || barData.length > 0;

  // ── Funding Data ──────────────────────────────────────────────────
  const parseBudget = (raw) => {
    if (!raw) return 0;
    const num = parseFloat(String(raw).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const localProjects    = proposals.filter((p) => !p.funding_type || p.funding_type === "local");
  const externalProjects = proposals.filter((p) => p.funding_type === "external");

  const localCount    = localProjects.length;
  const externalCount = externalProjects.length;
  const totalFundedCount = localCount + externalCount;

  const localBudget    = localProjects.reduce((s, p)    => s + parseBudget(p.budget || p.total_budget), 0);
  const externalBudget = externalProjects.reduce((s, p) => s + parseBudget(p.external_amount || p.budget || p.total_budget), 0);

  const localPct    = totalFundedCount > 0 ? Math.round((localCount    / totalFundedCount) * 100) : 0;
  const externalPct = totalFundedCount > 0 ? Math.round((externalCount / totalFundedCount) * 100) : 0;

  // Funding agencies breakdown for external
  const agencyMap = {};
  externalProjects.forEach((p) => {
    const agency = p.funding_agency || "Unknown Agency";
    if (!agencyMap[agency]) agencyMap[agency] = { name: agency, count: 0, budget: 0 };
    agencyMap[agency].count++;
    agencyMap[agency].budget += parseBudget(p.external_amount || p.budget || p.total_budget);
  });
  const agencyData = Object.values(agencyMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // Department funding breakdown — local vs external per dept
  const deptFundingMap = {};
  proposals.forEach((p) => {
    const dept = p.department_center?.name || p.department || p.creator?.department || "Unassigned";
    if (!deptFundingMap[dept]) deptFundingMap[dept] = { dept, local: 0, external: 0 };
    if (!p.funding_type || p.funding_type === "local") deptFundingMap[dept].local++;
    else deptFundingMap[dept].external++;
  });
  const deptFundingData = Object.values(deptFundingMap)
    .filter((d) => d.local + d.external > 0)
    .sort((a, b) => (b.local + b.external) - (a.local + a.external))
    .slice(0, 8);

  return (
    <>
      <style>{`
        .adm-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
        .adm-main-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px; }
        .adm-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .adm-shortcuts { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .adm-health-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
        .adm-funding-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .adm-funding-bottom { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 16px; }
        @media(max-width:1150px) {
          .adm-grid { grid-template-columns: repeat(2, 1fr); }
          .adm-main-grid { grid-template-columns: 1fr; }
          .adm-chart-grid { grid-template-columns: 1fr; }
          .adm-funding-bottom { grid-template-columns: 1fr 1fr; }
        }
        @media(max-width:700px) {
          .adm-grid { grid-template-columns: 1fr; }
          .adm-shortcuts { grid-template-columns: 1fr; }
          .adm-health-grid { grid-template-columns: 1fr 1fr; }
          .adm-funding-hero { grid-template-columns: 1fr; }
          .adm-funding-bottom { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
        <AdminNavbar onWidthChange={setSidebarWidth} />
        <div style={{ marginLeft: ml, flex: 1, display: "flex", flexDirection: "column",
          transition: "margin-left 0.22s ease", minWidth: 0 }}>
          <Topbar title="Dashboard" />
          <div style={{ padding: "24px", flex: 1 }}>

            {/* Welcome Banner */}
            <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)",
              borderRadius: 16, padding: "22px 24px", marginBottom: 20, color: "#fff",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: 18, flexWrap: "wrap", boxShadow: "0 10px 28px rgba(4, 120, 87, 0.25)" }}>
              <div>
                <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 800,
                  letterSpacing: ".08em", textTransform: "uppercase", opacity: 0.82 }}>
                  Admin Control Center
                </p>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 850, lineHeight: 1.2, color: "#fff" }}>
                  Research Project Management Dashboard
                </h2>
                <p style={{ margin: "7px 0 0", fontSize: 14, opacity: 0.9 }}>
                  Monitor proposal flow, manage faculty and evaluators, and track system activity.
                </p>
              </div>
              <button type="button" onClick={() => navigate("/admin/proposals")}
                style={{ ...HEADER_BTN, background: "#dcfce7", color: "#15803d" }}>
                <CalendarCheck size={15} /> Schedule Presentation
              </button>
            </div>

            {/* Stat Cards */}
            <div className="adm-grid">
              {cards.map((card) => <StatCard key={card.label} {...card} />)}
            </div>

            {/* Row 1: Workflow + Right Column */}
            <div className="adm-main-grid">

              {/* Proposal Workflow - 2 column grid */}
              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Proposal Workflow</h3>
                    <p style={CARD_SUB}>Current status of all submitted proposal records.</p>
                  </div>
                  <button type="button" onClick={() => navigate("/admin/proposals")} style={LINK_BTN}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {workflowItems.map((item) => {
                    const Icon = item.icon;
                    const percentage = pct(item.value, totalProposals);
                    return (
                      <div key={item.label} style={{ border: "1px solid #f1f5f9", borderRadius: 12,
                        padding: "12px 14px", background: "#fff" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: item.bg,
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Icon size={15} color={item.color} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>
                            {item.label}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 20, fontWeight: 850, color: "#111827" }}>
                            {loading ? "\u2014" : item.value}
                          </span>
                          <span style={{ fontSize: 11, color: "#9ca3af" }}>
                            {loading ? "" : `${percentage}%`}
                          </span>
                        </div>
                        <div style={{ width: "100%", height: 5, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
                          <div style={{ width: `${percentage}%`, height: "100%", borderRadius: 999, background: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right column: System Health + Quick Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* System Health */}
                <div style={CARD}>
                  <div style={CARD_TOP}>
                    <div>
                      <h3 style={CARD_H}>System Health</h3>
                      <p style={CARD_SUB}>Key metrics at a glance.</p>
                    </div>
                  </div>
                  <div className="adm-health-grid">
                    <div style={MINI_CARD}>
                      <CheckCircle2 size={22} color="#15803d" />
                      <p style={MINI_VALUE}>{loading ? "\u2014" : `${approvalRate}%`}</p>
                      <p style={MINI_LABEL}>Approval Rate</p>
                    </div>
                    <div style={MINI_CARD}>
                      <Wallet size={22} color="#0e7490" />
                      <p style={MINI_VALUE}>{loading ? "\u2014" : fmtCurrency(totalBudget)}</p>
                      <p style={MINI_LABEL}>Total Budget</p>
                    </div>
                    <div style={MINI_CARD}>
                      <Layers size={22} color="#7c3aed" />
                      <p style={MINI_VALUE}>{loading ? "\u2014" : fmt(totalProposals)}</p>
                      <p style={MINI_LABEL}>Total Records</p>
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#6b7280",
                      textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Needs Attention
                    </p>
                    {[
                      { icon: RotateCcw, label: "For Revision",     value: forRevision,     color: "#d97706", bg: "#fef3c7" },
                      { icon: XCircle,   label: "Rejected",          value: rejected,         color: "#dc2626", bg: "#fef2f2" },
                      { icon: Activity,  label: "Under Evaluation",  value: underEvaluation,  color: "#6d28d9", bg: "#f5f3ff" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} style={{ display: "flex", alignItems: "center",
                          justifyContent: "space-between", gap: 10, padding: "8px 12px",
                          borderRadius: 10, border: "1px solid #f1f5f9", background: "#fafafa" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 7, background: item.bg,
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon size={14} color={item.color} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{item.label}</span>
                          </div>
                          <span style={{ fontSize: 16, fontWeight: 850, color: item.color }}>
                            {loading ? "\u2014" : item.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={CARD}>
                  <div style={CARD_TOP}>
                    <div>
                      <h3 style={CARD_H}>Quick Actions</h3>
                      <p style={CARD_SUB}>Jump to common admin tasks.</p>
                    </div>
                  </div>
                  <div className="adm-shortcuts">
                    <ShortcutCard icon={Users}        title="Faculty"    subtitle="Manage researchers"  color="#f59e0b" bg="#fefce8" onClick={() => navigate("/admin/faculty")} />
                    <ShortcutCard icon={ClipboardList} title="Evaluators" subtitle="Manage evaluators"  color="#7c3aed" bg="#f5f3ff" onClick={() => navigate("/admin/evaluators")} />
                    <ShortcutCard icon={FileText}      title="Proposals"  subtitle="Schedule & review"  color="#0e7490" bg="#e0f2fe" onClick={() => navigate("/admin/proposals")} />
                    <ShortcutCard icon={BarChart3}     title="Reports"    subtitle="View system reports" color="#1d4ed8" bg="#dbeafe" onClick={() => navigate("/admin/reports")} />
                  </div>
                </div>

              </div>
            </div>

            {/* Row 2: Charts */}
            {!loading && !hasChartData ? (
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14,
                padding: "60px 24px", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <FileText size={40} color="#d1d5db" style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#374151" }}>No chart data yet</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>
                  Charts will appear once proposals are submitted and processed.
                </p>
              </div>
            ) : (
              <div className="adm-chart-grid">
                {pieData.length > 0 && (
                  <div style={CARD}>
                    <div style={CARD_TOP}>
                      <div>
                        <h3 style={CARD_H}>Status Distribution</h3>
                        <p style={CARD_SUB}>Breakdown of proposal statuses.</p>
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
                  <div style={CARD}>
                    <div style={CARD_TOP}>
                      <div>
                        <h3 style={CARD_H}>Projects by Department</h3>
                        <p style={CARD_SUB}>Number of projects per department.</p>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="dept" tick={{ fontSize: 11, fill: "#6b7280" }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} allowDecimals={false}
                          label={{ value: "Projects", angle: -90, position: "insideLeft", fontSize: 11, fill: "#9ca3af" }} />
                        <Tooltip formatter={(v, name) => name === "count" ? [v, "Projects"] : [`\u20b1${v}K`, "Budget"]} />
                        <Bar dataKey="count" fill="#15803d" radius={[4, 4, 0, 0]} maxBarSize={52} name="count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={CARD}>
                    <EmptyBox icon={Wallet} title="No department data"
                      subtitle="Chart will appear once proposals include department information." />
                  </div>
                )}
              </div>
            )}

            {/* ── Funding ─────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              {/* Section header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 4, height: 22, borderRadius: 4, background: "linear-gradient(180deg,#1d4ed8,#0e7490)" }} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 850, color: "#111827" }}>
                  Funding
                </h3>
                <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>
                  Local and external funding
                </span>
              </div>

              {/* Top 2 hero cards */}
              <div className="adm-funding-hero">

                {/* Local Funded */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb",
                  borderTop: "3px solid #15803d", borderRadius: 12, padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dcfce7",
                        border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Building2 size={16} color="#15803d" strokeWidth={1.8} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Locally Funded</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#15803d",
                      background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 20, padding: "2px 10px" }}>
                      {loading ? "—" : `${localPct}%`}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                    {loading ? "—" : localCount}
                  </p>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>
                    {loading ? "" : `${fmtCurrency(localBudget)} total budget`}
                  </p>
                  <div style={{ height: 5, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
                    <div style={{ width: `${localPct}%`, height: "100%", borderRadius: 99,
                      background: "#15803d", transition: "width 0.6s ease" }} />
                  </div>
                </div>

                {/* External Funded */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb",
                  borderTop: "3px solid #1d4ed8", borderRadius: 12, padding: "18px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: "#dbeafe",
                        border: "1px solid #bfdbfe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Globe size={16} color="#1d4ed8" strokeWidth={1.8} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Externally Funded</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#1d4ed8",
                      background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 20, padding: "2px 10px" }}>
                      {loading ? "—" : `${externalPct}%`}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 800, color: "#111827", lineHeight: 1 }}>
                    {loading ? "—" : externalCount}
                  </p>
                  <p style={{ margin: "0 0 10px", fontSize: 12, color: "#6b7280" }}>
                    {loading ? "" : `${fmtCurrency(externalBudget)} external budget`}
                  </p>
                  <div style={{ height: 5, borderRadius: 99, background: "#f3f4f6", overflow: "hidden" }}>
                    <div style={{ width: `${externalPct}%`, height: "100%", borderRadius: 99,
                      background: "#1d4ed8", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>

              {/* Bottom row: chart + agency table + dept table */}
              <div className="adm-funding-bottom">

                {/* Local vs External by Department bar chart */}
                <div style={{ ...CARD, marginBottom: 0 }}>
                  <div style={CARD_TOP}>
                    <div>
                      <h3 style={CARD_H}>By Department</h3>
                      <p style={CARD_SUB}>Funding per department.</p>
                    </div>
                  </div>
                  {deptFundingData.length === 0 ? (
                    <div style={{ padding: "30px 0", textAlign: "center" }}>
                      <Globe size={32} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>No data yet</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={deptFundingData} layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                        <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: "#374151" }}
                          width={72} />
                        <Tooltip
                          formatter={(v, name) => [v, name === "local" ? "Local" : "External"]} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }}
                          formatter={(v) => v === "local" ? "Local" : "External"} />
                        <Bar dataKey="local"    name="local"    fill="#15803d" radius={[0,4,4,0]} maxBarSize={14} stackId="a" />
                        <Bar dataKey="external" name="external" fill="#1d4ed8" radius={[0,4,4,0]} maxBarSize={14} stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Funding Agencies */}
                <div style={{ ...CARD, marginBottom: 0 }}>
                  <div style={CARD_TOP}>
                    <div>
                      <h3 style={CARD_H}>Funding Agencies</h3>
                      <p style={CARD_SUB}>External funding agencies.</p>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                      {externalCount} project{externalCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {agencyData.length === 0 ? (
                    <div style={{ padding: "30px 0", textAlign: "center" }}>
                      <Globe size={32} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>No external projects yet</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {agencyData.map((ag, i) => {
                        const pctAg = externalCount > 0 ? Math.round((ag.count / externalCount) * 100) : 0;
                        return (
                          <div key={ag.name}>
                            <div style={{ display: "flex", justifyContent: "space-between",
                              alignItems: "center", marginBottom: 4 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 6, background: "#eff6ff",
                                  border: "1px solid #bfdbfe", display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#1d4ed8" }}>
                                  {i + 1}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#111827",
                                  maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis",
                                  whiteSpace: "nowrap", display: "block" }}>
                                  {ag.name}
                                </span>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <span style={{ fontSize: 13, fontWeight: 850, color: "#1d4ed8" }}>{ag.count}</span>
                                <span style={{ fontSize: 10, color: "#9ca3af", marginLeft: 3 }}>proj</span>
                              </div>
                            </div>
                            <div style={{ height: 5, borderRadius: 99, background: "#e0f2fe", overflow: "hidden" }}>
                              <div style={{ width: `${pctAg}%`, height: "100%", borderRadius: 99,
                                background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", transition: "width 0.5s" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Budget comparison table */}
                <div style={{ ...CARD, marginBottom: 0 }}>
                  <div style={CARD_TOP}>
                    <div>
                      <h3 style={CARD_H}>Budget Comparison</h3>
                      <p style={CARD_SUB}>Budget per department.</p>
                    </div>
                  </div>
                  {deptFundingData.length === 0 ? (
                    <div style={{ padding: "30px 0", textAlign: "center" }}>
                      <TrendingUp size={32} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>No data yet</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            {["Department", "Local", "External", "Total"].map((h) => (
                              <th key={h} style={{ padding: "8px 10px",
                                textAlign: h === "Department" ? "left" : "center",
                                fontSize: 10, fontWeight: 700, color: "#9ca3af",
                                textTransform: "uppercase", letterSpacing: "0.05em",
                                borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {deptFundingData.map((d) => (
                            <tr key={d.dept} style={{ borderBottom: "1px solid #f9fafb" }}
                              onMouseEnter={(e) => e.currentTarget.style.background = "#fafafa"}
                              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                              <td style={{ padding: "9px 10px", fontSize: 12, fontWeight: 600,
                                color: "#374151", maxWidth: 110, overflow: "hidden",
                                textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {d.dept}
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                <span style={{ display: "inline-block", padding: "2px 8px",
                                  borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  background: "#dcfce7", color: "#15803d" }}>
                                  {d.local}
                                </span>
                              </td>
                              <td style={{ padding: "9px 10px", textAlign: "center" }}>
                                <span style={{ display: "inline-block", padding: "2px 8px",
                                  borderRadius: 20, fontSize: 11, fontWeight: 700,
                                  background: "#dbeafe", color: "#1d4ed8" }}>
                                  {d.external}
                                </span>
                              </td>
                              <td style={{ padding: "9px 10px", fontSize: 12, fontWeight: 850,
                                color: "#111827", textAlign: "center" }}>
                                {d.local + d.external}
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
            {/* ── End Funding ─────────────────────────────── */}

          </div>
        </div>
      </div>
    </>
  );
}

const HEADER_BTN = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "none",
  borderRadius: 10,
  background: "#fff",
  color: "#111827",
  padding: "10px 15px",
  fontSize: 13,
  fontWeight: 850,
  cursor: "pointer",
  boxShadow: "0 8px 18px rgba(0,0,0,0.12)",
};

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
  fontWeight: 850,
  color: "#111827",
};

const CARD_SUB = {
  margin: "4px 0 0",
  fontSize: 12,
  color: "#9ca3af",
};

const LINK_BTN = {
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#16a34a",
  fontSize: 13,
  fontWeight: 850,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: 0,
  whiteSpace: "nowrap",
};

const MINI_CARD = {
  border: "1px solid #f1f5f9",
  borderRadius: 13,
  background: "#fafafa",
  padding: "16px 12px",
  textAlign: "center",
};

const MINI_VALUE = {
  margin: "8px 0 2px",
  fontSize: 17,
  fontWeight: 850,
  color: "#111827",
};

const MINI_LABEL = {
  margin: 0,
  fontSize: 11,
  color: "#9ca3af",
  fontWeight: 700,
};

const ATTENTION_ROW = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  border: "1px solid #f1f5f9",
  borderRadius: 12,
  background: "#fff",
  padding: "13px 14px",
};

const ATTENTION_LABEL = {
  fontSize: 13,
  fontWeight: 800,
  color: "#374151",
};