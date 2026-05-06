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

const fmtCurrency = (n) => `₱${Number(n || 0).toLocaleString()}`;

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
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    setLoading(true);

    api
      .get("/dashboard/stats")
      .then((res) => setStats(res.data || null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const ml = isMobile ? 0 : sidebarWidth;

  const totalFaculty = stats?.total_faculty ?? 0;
  const totalEvaluators = stats?.total_evaluators ?? 0;
  const totalProposals = stats?.total_proposals ?? stats?.total_projects ?? 0;
  const systemUsers = stats?.system_users ?? 0;
  const totalBudget = stats?.total_budget ?? 0;

  const byStatus = stats?.byStatus || {};
  const approved = byStatus.approved ?? 0;
  const submitted = byStatus.submitted ?? 0;
  const underEvaluation = byStatus.under_evaluation ?? 0;
  const forRevision = byStatus.for_revision ?? 0;
  const rejected = byStatus.rejected ?? 0;
  const approvalRate = pct(approved, totalProposals);

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
    { name: "Approved", value: approved },
    { name: "Submitted", value: submitted },
    { name: "Under Evaluation", value: underEvaluation },
    { name: "For Revision", value: forRevision },
    { name: "Rejected", value: rejected },
  ].filter((d) => d.value > 0);

  const barData = (stats?.byDepartment || []).map((d) => ({
    dept: d.department,
    budget: Math.round((d.total_budget || 0) / 1000),
    count: d.count || 0,
  }));

  const workflowItems = [
    {
      label: "Submitted",
      value: submitted,
      icon: Clock,
      bg: "#e0f2fe",
      color: "#0369a1",
    },
    {
      label: "Under Evaluation",
      value: underEvaluation,
      icon: Activity,
      bg: "#f5f3ff",
      color: "#6d28d9",
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

  const hasChartData = pieData.length > 0 || barData.length > 0;

  return (
    <>
      <style>{`
        .adm-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .adm-main-grid {
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .adm-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .adm-shortcuts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media(max-width:1150px) {
          .adm-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .adm-main-grid {
            grid-template-columns: 1fr;
          }

          .adm-chart-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width:700px) {
          .adm-grid {
            grid-template-columns: 1fr;
          }

          .adm-shortcuts {
            grid-template-columns: 1fr;
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
          <Topbar title="Dashboard" />

          <div style={{ padding: "24px", flex: 1 }}>
            {/* Welcome header */}
            <div
              style={{
                background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)",
                borderRadius: 16,
                padding: "22px 24px",
                marginBottom: 20,
                color: "#fff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 18,
                flexWrap: "wrap",
                boxShadow: "0 10px 28px rgba(4, 120, 87, 0.25)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    opacity: 0.82,
                  }}
                >
                  Admin Control Center
                </p>

                <h2
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 850,
                    lineHeight: 1.2,
                    color: "#fff",
                  }}
                >
                  Research Project Management Dashboard
                </h2>

                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: 14,
                    opacity: 0.9,
                    color: "#fff",
                  }}
                >
                  Monitor proposal flow, manage faculty and evaluators, and track system activity.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate("/admin/proposals")}
                  style={{
                    ...HEADER_BTN,
                    background: "#dcfce7",
                    color: "#15803d",
                  }}
                >
                  Schedule in Proposal Management <CalendarCheck size={15} />
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="adm-grid">
              {cards.map((card) => (
                <StatCard key={card.label} {...card} />
              ))}
            </div>

            {/* Main summary */}
            <div className="adm-main-grid">
              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Proposal Workflow Summary</h3>
                    <p style={CARD_SUB}>Current status of submitted proposal records.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/admin/proposals")}
                    style={LINK_BTN}
                  >
                    View proposals <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {workflowItems.map((item) => {
                    const Icon = item.icon;
                    const percentage = pct(item.value, totalProposals);

                    return (
                      <div
                        key={item.label}
                        style={{
                          border: "1px solid #f1f5f9",
                          borderRadius: 12,
                          padding: "12px 14px",
                          background: "#fff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 12,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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

                            <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
                              {item.label}
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <p style={{ margin: 0, fontSize: 18, fontWeight: 850, color: "#111827" }}>
                              {loading ? "—" : item.value}
                            </p>
                            <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
                              {loading ? "—" : `${percentage}%`}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            width: "100%",
                            height: 7,
                            borderRadius: 999,
                            background: "#f3f4f6",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${percentage}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: item.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Management Shortcuts</h3>
                    <p style={CARD_SUB}>Jump directly into common admin tasks.</p>
                  </div>
                </div>

                <div className="adm-shortcuts">
                  <ShortcutCard
                    icon={Users}
                    title="Faculty"
                    subtitle="View and manage faculty accounts"
                    color="#f59e0b"
                    bg="#fefce8"
                    onClick={() => navigate("/admin/faculty")}
                  />

                  <ShortcutCard
                    icon={ClipboardList}
                    title="Evaluators"
                    subtitle="Manage evaluator records"
                    color="#7c3aed"
                    bg="#f5f3ff"
                    onClick={() => navigate("/admin/evaluators")}
                  />

                  <ShortcutCard
                    icon={FileText}
                    title="Proposals"
                    subtitle="Review submissions and schedule presentations"
                    color="#0e7490"
                    bg="#e0f2fe"
                    onClick={() => navigate("/admin/proposals")}
                  />

                  <ShortcutCard
                    icon={BarChart3}
                    title="Reports"
                    subtitle="Open system reports"
                    color="#1d4ed8"
                    bg="#dbeafe"
                    onClick={() => navigate("/admin/reports")}
                  />
                </div>
              </div>
            </div>

            {/* Health overview */}
            <div className="adm-chart-grid">
              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Project Health Overview</h3>
                    <p style={CARD_SUB}>Fast snapshot of proposal outcomes.</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 12,
                  }}
                >
                  <div style={MINI_CARD}>
                    <CheckCircle2 size={22} color="#15803d" />
                    <p style={MINI_VALUE}>{loading ? "—" : `${approvalRate}%`}</p>
                    <p style={MINI_LABEL}>Approval Rate</p>
                  </div>

                  <div style={MINI_CARD}>
                    <Wallet size={22} color="#0e7490" />
                    <p style={MINI_VALUE}>
                      {loading ? "—" : fmtCurrency(totalBudget)}
                    </p>
                    <p style={MINI_LABEL}>Total Budget</p>
                  </div>

                  <div style={MINI_CARD}>
                    <Layers size={22} color="#7c3aed" />
                    <p style={MINI_VALUE}>
                      {loading ? "—" : fmt(totalProposals)}
                    </p>
                    <p style={MINI_LABEL}>Active Records</p>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>
                      Completion Strength
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>
                      {loading ? "—" : `${approvalRate}%`}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: 10,
                      borderRadius: 999,
                      background: "#f3f4f6",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${approvalRate}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: "linear-gradient(90deg, #16a34a, #86efac)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Attention Needed</h3>
                    <p style={CARD_SUB}>Records that may need admin follow-up.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={ATTENTION_ROW}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <AlertCircle size={18} color="#d97706" />
                      <span style={ATTENTION_LABEL}>For Revision</span>
                    </div>
                    <StatusBadge status={`${forRevision} records`} />
                  </div>

                  <div style={ATTENTION_ROW}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <XCircle size={18} color="#dc2626" />
                      <span style={ATTENTION_LABEL}>Rejected</span>
                    </div>
                    <StatusBadge status={`${rejected} records`} />
                  </div>

                  <div style={ATTENTION_ROW}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Activity size={18} color="#6d28d9" />
                      <span style={ATTENTION_LABEL}>Under Evaluation</span>
                    </div>
                    <StatusBadge status={`${underEvaluation} records`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            {!loading && !hasChartData ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "60px 24px",
                  textAlign: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <FileText
                  size={40}
                  color="#d1d5db"
                  style={{ margin: "0 auto 12px", display: "block" }}
                />

                <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#374151" }}>
                  No chart data yet
                </p>

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
                        <h3 style={CARD_H}>Project Status Distribution</h3>
                        <p style={CARD_SUB}>Breakdown of submitted proposal statuses.</p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={PieLabel}
                          labelLine
                          dataKey="value"
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
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
                        <h3 style={CARD_H}>Budget by Department</h3>
                        <p style={CARD_SUB}>Budget totals grouped by department or center.</p>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={barData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

                        <XAxis
                          dataKey="dept"
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          interval={0}
                          angle={-15}
                          textAnchor="end"
                        />

                        <YAxis
                          tick={{ fontSize: 11, fill: "#6b7280" }}
                          label={{
                            value: "Budget (K)",
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 11,
                            fill: "#9ca3af",
                          }}
                        />

                        <Tooltip formatter={(v) => [`₱${v}K`, "Budget"]} />

                        <Bar
                          dataKey="budget"
                          fill="#15803d"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={52}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={CARD}>
                    <EmptyBox
                      icon={Wallet}
                      title="No department budget data"
                      subtitle="Budget chart will appear once proposals have department and budget information."
                    />
                  </div>
                )}
              </div>
            )}
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