// src/pages/approver/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ApproverNavbar from "../../components/approver/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
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
  ShieldCheck,
  CheckCircle2,
  FileText,
  TrendingUp,
  ArrowRight,
  Clock,
  RotateCcw,
  XCircle,
  Eye,
  Wallet,
  Activity,
} from "lucide-react";

const PIE_COLORS = ["#0e7490", "#16a34a", "#dc2626", "#d97706", "#6b7280"];

const STATUS_STYLES = {
  Pending: { bg: "#e0f2fe", color: "#0e7490", border: "#bae6fd" },
  Evaluated: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
  Endorsed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  Forwarded: { bg: "#fef9c3", color: "#a16207", border: "#fde68a" },
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  Returned: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const ROLE_COPY = {
  rde_division_chief: {
    title: "RDE Division Chief Dashboard",
    subtitle: "Review evaluated proposals awaiting endorsement.",
    nextAction: "Endorse proposals",
  },
  campus_director: {
    title: "Campus Director Dashboard",
    subtitle: "Review endorsed proposals awaiting recommendation.",
    nextAction: "Recommend proposals",
  },
  vprie: {
    title: "VPRIE Dashboard",
    subtitle: "Review recommended proposals awaiting forwarding.",
    nextAction: "Forward proposals",
  },
  president: {
    title: "University President Dashboard",
    subtitle: "Review forwarded proposals awaiting final approval.",
    nextAction: "Approve proposals",
  },
};

const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

const fmt = (n) => Number(n || 0).toLocaleString();

const fmtCurrency = (n) => `₱${Number(n || 0).toLocaleString()}`;

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
  const style = STATUS_STYLES[status] || {
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
      {status || "—"}
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
  accentColor,
}) {
  const navigate = useNavigate();

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
        <button
          type="button"
          onClick={() => navigate("/approver/approvals")}
          style={{
            marginTop: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: "#16a34a",
            display: "flex",
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

function EmptyBox({ icon: Icon = FileText, title, subtitle }) {
  return (
    <div
      style={{
        padding: "34px 20px",
        textAlign: "center",
        color: "#9ca3af",
      }}
    >
      <Icon size={34} color="#d1d5db" style={{ margin: "0 auto 10px", display: "block" }} />
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
  const [pendingItems, setPendingItems] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);
  const [me, setMe] = useState(null);
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

    Promise.allSettled([
      api.get("/dashboard/stats"),
      api.get("/approval/pending"),
      api.get("/approval/my-actions"),
      api.get("/me"),
    ])
      .then(([statsRes, pendingRes, completedRes, meRes]) => {
        setStats(statsRes.status === "fulfilled" ? statsRes.value.data || null : null);

        setPendingItems(
          pendingRes.status === "fulfilled" && Array.isArray(pendingRes.value.data)
            ? pendingRes.value.data
            : []
        );

        setCompletedItems(
          completedRes.status === "fulfilled" && Array.isArray(completedRes.value.data)
            ? completedRes.value.data
            : []
        );

        setMe(meRes.status === "fulfilled" ? meRes.value.data || null : null);
      })
      .finally(() => setLoading(false));
  }, []);

  const userRole = me?.user?.role || me?.role || "";
  const roleCopy = ROLE_COPY[userRole] || {
    title: "Approver Dashboard",
    subtitle: "Monitor proposals waiting for your approval action.",
    nextAction: "Review proposals",
  };

  const pending = stats?.pending ?? pendingItems.length ?? 0;
  const approved = stats?.approved ?? 0;
  const completed = stats?.completed ?? completedItems.length ?? 0;
  const rejected = stats?.rejected ?? 0;
  const returned = stats?.returned ?? 0;
  const total = stats?.total ?? pending + completed;
  const approvalRate = stats?.approvalRate ?? pct(approved, completed);

  const pieData = [
    { name: "Pending", value: stats?.byStatus?.pending ?? pending },
    { name: "Approved Actions", value: stats?.byStatus?.approved ?? approved },
    { name: "Rejected", value: stats?.byStatus?.rejected ?? rejected },
    { name: "Returned", value: stats?.byStatus?.returned ?? returned },
  ].filter((d) => d.value > 0);

  const barData = (stats?.byDepartment || []).map((d) => ({
    dept: d.department,
    budget: Math.round((d.total_budget || 0) / 1000),
    count: d.count || 0,
  }));

  const latestPending = pendingItems.slice(0, 5);
  const latestCompleted = completedItems.slice(0, 5);

  const ml = isMobile ? 0 : sidebarWidth;

  return (
    <>
      <style>{`
        .db-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .db-main-grid {
          display: grid;
          grid-template-columns: 1.45fr .9fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .db-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .db-table {
          width: 100%;
          border-collapse: collapse;
        }

        .db-table th {
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

        .db-table td {
          padding: 12px;
          font-size: 13px;
          color: #374151;
          vertical-align: middle;
          border-bottom: 1px solid #f1f5f9;
        }

        .db-table tr:last-child td {
          border-bottom: none;
        }

        .db-table tr:hover td {
          background: #fafafa;
        }

        @media(max-width:1150px) {
          .db-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .db-main-grid {
            grid-template-columns: 1fr;
          }

          .db-chart-grid {
            grid-template-columns: 1fr;
          }
        }

        @media(max-width:700px) {
          .db-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
        <ApproverNavbar onWidthChange={setSidebarWidth} />

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
            {/* Header */}
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
                boxShadow: "0 10px 28px rgba(22, 163, 74, 0.22)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    textTransform: "uppercase",
                    opacity: 0.82,
                  }}
                >
                  Approval Workspace
                </p>

                <h2
                    style={{
                      margin: 0,
                      fontSize: 24,
                      fontWeight: 800,
                      lineHeight: 1.2,
                      color: "#fff",
                    }}
                  >
                    {roleCopy.title}
                  </h2>

                <p
                  style={{
                    margin: "7px 0 0",
                    fontSize: 14,
                    opacity: 0.9,
                  }}
                >
                  {roleCopy.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/approver/approvals")}
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
                }}
              >
                {pending > 0 ? roleCopy.nextAction : "Open approvals"}
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Stat Cards */}
            <div className="db-stat-grid">
              <StatCard
                icon={ShieldCheck}
                iconColor="#0e7490"
                iconBg="#e0f2fe"
                accentColor="#0e7490"
                label="Pending Approval"
                value={loading ? "—" : pending}
                sub="Awaiting your decision"
                action={pending > 0 ? "Review now" : null}
              />

              <StatCard
                icon={CheckCircle2}
                iconColor="#16a34a"
                iconBg="#dcfce7"
                accentColor="#16a34a"
                label="Approved Actions"
                value={loading ? "—" : approved}
                sub="Endorsed, recommended, forwarded, or approved"
              />

              <StatCard
                icon={FileText}
                iconColor="#6b7280"
                iconBg="#f3f4f6"
                accentColor="#9ca3af"
                label="Total Records"
                value={loading ? "—" : total}
                sub="Pending plus completed actions"
              />

              <StatCard
                icon={TrendingUp}
                iconColor="#7c3aed"
                iconBg="#f5f3ff"
                accentColor="#7c3aed"
                label="Approval Rate"
                value={loading ? "—" : `${approvalRate}%`}
                sub="Approved actions over completed actions"
              />
            </div>

            {/* Action queue and flow summary */}
            <div className="db-main-grid">
              <div style={CARD}>
                <div style={CARD_TOP}>
                  <div>
                    <h3 style={CARD_H}>Action Queue</h3>
                    <p style={CARD_SUB}>Latest proposals waiting for your action.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/approver/approvals")}
                    style={LINK_BTN}
                  >
                    View all <ArrowRight size={13} />
                  </button>
                </div>

                {loading ? (
                  <EmptyBox icon={Clock} title="Loading queue..." subtitle="Fetching pending proposals." />
                ) : latestPending.length === 0 ? (
                  <EmptyBox
                    icon={CheckCircle2}
                    title="No pending proposals"
                    subtitle="You are all caught up for now."
                  />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="db-table">
                      <thead>
                        <tr>
                          <th>Ref No</th>
                          <th>Title</th>
                          <th>Researcher</th>
                          <th>Budget</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {latestPending.map((p) => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                              {p.reference_no || `PRJ-${String(p.id).padStart(3, "0")}`}
                            </td>

                            <td style={{ maxWidth: 240 }}>
                              <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>
                                {p.title}
                              </p>
                              {p.average_score && (
                                <span style={{ fontSize: 11, color: "#7c3aed" }}>
                                  Score: {p.average_score}/100
                                </span>
                              )}
                            </td>

                            <td>{p.submitted_by || "—"}</td>

                            <td style={{ whiteSpace: "nowrap" }}>{fmtCurrency(p.budget)}</td>

                            <td>
                              <StatusBadge status={p.status} />
                            </td>

                            <td>
                              <button
                                type="button"
                                onClick={() => navigate("/approver/approvals")}
                                style={SMALL_GREEN_BTN}
                              >
                                Review
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
                    <h3 style={CARD_H}>Approval Flow Summary</h3>
                    <p style={CARD_SUB}>Your current approval workload.</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {[
                    {
                      label: "Pending",
                      value: pending,
                      icon: Clock,
                      bg: "#e0f2fe",
                      color: "#0e7490",
                    },
                    {
                      label: "Approved Actions",
                      value: approved,
                      icon: CheckCircle2,
                      bg: "#dcfce7",
                      color: "#15803d",
                    },
                    {
                      label: "Returned",
                      value: returned,
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
                  ].map((item) => {
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

                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>
                            {item.label}
                          </span>
                        </div>

                        <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>
                          {loading ? "—" : item.value}
                        </span>
                      </div>
                    );
                  })}
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

                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  No data yet
                </p>

                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>
                  Charts will appear once proposals reach your approval stage.
                </p>
              </div>
            ) : (
              <div className="db-chart-grid">
                {pieData.length > 0 && (
                  <div style={CARD}>
                    <div style={CARD_TOP}>
                      <div>
                        <h3 style={CARD_H}>Approval Status Distribution</h3>
                        <p style={CARD_SUB}>Breakdown of your approval records.</p>
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

                {barData.length > 0 ? (
                  <div style={CARD}>
                    <div style={CARD_TOP}>
                      <div>
                        <h3 style={CARD_H}>Budget by Department</h3>
                        <p style={CARD_SUB}>Budget totals from proposals in your queue and records.</p>
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
                          label={{
                            value: "Budget (K)",
                            angle: -90,
                            position: "insideLeft",
                            fontSize: 11,
                            fill: "#9ca3af",
                          }}
                        />

                        <Tooltip
                          formatter={(v, name) => {
                            if (name === "budget") return [`₱${v}K`, "Budget"];
                            return [v, name];
                          }}
                        />

                        <Bar
                          dataKey="budget"
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={CARD}>
                    <EmptyBox
                      icon={Wallet}
                      title="No department budget data"
                      subtitle="Department budget chart will appear once proposals have department and budget data."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Recent completed actions */}
            <div style={CARD}>
              <div style={CARD_TOP}>
                <div>
                  <h3 style={CARD_H}>Recent Completed Actions</h3>
                  <p style={CARD_SUB}>Latest proposals you already acted on.</p>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/approver/approvals")}
                  style={LINK_BTN}
                >
                  Open records <ArrowRight size={13} />
                </button>
              </div>

              {loading ? (
                <EmptyBox icon={Activity} title="Loading actions..." subtitle="Fetching completed records." />
              ) : latestCompleted.length === 0 ? (
                <EmptyBox
                  icon={FileText}
                  title="No completed actions yet"
                  subtitle="Your completed actions will appear here after you review proposals."
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="db-table">
                    <thead>
                      <tr>
                        <th>Ref No</th>
                        <th>Title</th>
                        <th>Researcher</th>
                        <th>Your Action</th>
                        <th>Remarks</th>
                        <th>Date Acted</th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestCompleted.map((item) => (
                        <tr key={item.approval_id || item.project_id}>
                          <td style={{ fontWeight: 700, color: "#111827", whiteSpace: "nowrap" }}>
                            {item.reference_no || `PRJ-${String(item.project_id).padStart(3, "0")}`}
                          </td>

                          <td style={{ maxWidth: 260 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>
                              {item.title || "Untitled Proposal"}
                            </p>
                            {item.project_status && (
                              <span style={{ display: "inline-block", marginTop: 4 }}>
                                <StatusBadge status={item.project_status} />
                              </span>
                            )}
                          </td>

                          <td>{item.submitted_by || "—"}</td>

                          <td>
                            <StatusBadge status={item.action} />
                          </td>

                          <td style={{ maxWidth: 260 }}>
                            <span
                              style={{
                                display: "block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              title={item.remarks || ""}
                            >
                              {item.remarks || "—"}
                            </span>
                          </td>

                          <td style={{ whiteSpace: "nowrap" }}>
                            {item.acted_at || fmtDate(item.acted_at_raw)}
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
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#16a34a",
  fontSize: 13,
  fontWeight: 800,
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