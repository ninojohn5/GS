// src/pages/evaluator/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import EvaluatorNavbar from "../../components/evaluator/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/evaluator.css";
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
  ClipboardList,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Clock3,
  BarChart3,
  Activity,
  Star,
} from "lucide-react";

const PIE_COLORS = ["#0e7490", "#16a34a", "#7c3aed", "#f59e0b", "#dc2626", "#6b7280"];

const pct = (n, t) => (t ? Math.round((n / t) * 100) : 0);

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  sub,
  action,
  onClick,
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
          fontSize: 30,
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
          onClick={onClick}
          style={{
            marginTop: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 700,
            color: accentColor,
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

export default function EvaluatorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    api
      .get("/dashboard/stats")
      .then((res) => setStats(res.data || null))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const awaitingEvaluation = stats?.awaiting_evaluation ?? 0;
  const evaluated = stats?.evaluated ?? 0;
  const totalProposals = stats?.total_proposals ?? 0;
  const avgScore = stats?.avg_score ?? 0;
  const completionRate = pct(evaluated, awaitingEvaluation + evaluated);

  const pieData = useMemo(() => {
    return Object.entries(stats?.status_counts || {})
      .map(([name, value]) => ({ name, value }))
      .filter((item) => Number(item.value) > 0);
  }, [stats]);

  const barData = useMemo(() => {
    return [
      { name: "Awaiting", value: awaitingEvaluation },
      { name: "Evaluated", value: evaluated },
      { name: "Total", value: totalProposals },
    ];
  }, [awaitingEvaluation, evaluated, totalProposals]);

  const hasChartData = pieData.length > 0 || barData.some((item) => item.value > 0);

  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, name, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 34;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

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

  const workflowItems = [
    {
      label: "Awaiting Evaluation",
      value: awaitingEvaluation,
      color: "#7c3aed",
      bg: "#f5f3ff",
      icon: Clock3,
    },
    {
      label: "Completed Evaluations",
      value: evaluated,
      color: "#15803d",
      bg: "#dcfce7",
      icon: CheckCircle2,
    },
    {
      label: "Average Score",
      value: avgScore,
      color: "#ea580c",
      bg: "#fff7ed",
      icon: Star,
    },
  ];

  return (
    <>
      <style>{`
        .ev-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .ev-main-grid {
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 20px;
          margin-bottom: 22px;
        }

        .ev-chart-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 1150px) {
          .ev-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .ev-main-grid,
          .ev-chart-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .ev-stat-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-layout">
        <EvaluatorNavbar />

        <div className="main-content">
          <Topbar title="Dashboard" />

          <div className="dashboard-content">
          {/* HERO */}
          <div
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #10b981 100%)",
              borderRadius: 16,
              padding: "22px 24px",
              marginBottom: 22,
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 18,
              flexWrap: "wrap",
              overflow: "hidden",
              boxShadow: "0 10px 28px rgba(4, 120, 87, 0.22)",
            }}
          >
            <div
              style={{
                minWidth: 0,
                flex: "1 1 420px",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.86)",
                }}
              >
                Evaluation Workspace
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 850,
                  lineHeight: 1.2,
                  color: "#fff",
                }}
              >
                Evaluator Dashboard
              </p>

              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.92)",
                  lineHeight: 1.5,
                  maxWidth: 760,
                }}
              >
                Review assigned proposals, monitor evaluation progress, and track scoring activity.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/evaluator/evaluations")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
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
                whiteSpace: "nowrap",
                flexShrink: 0,
                maxWidth: "100%",
              }}
            >
              Go to Evaluations <ArrowRight size={15} />
            </button>
          </div>

            {/* STATS */}
            <div className="ev-stat-grid">
              <StatCard
                icon={ClipboardList}
                iconColor="#6d28d9"
                iconBg="#f5f3ff"
                accentColor="#6d28d9"
                label="Awaiting Evaluation"
                value={loading ? "—" : awaitingEvaluation}
                sub="Proposals ready for your review"
                action={awaitingEvaluation > 0 ? "Start evaluating" : null}
                onClick={() => navigate("/evaluator/evaluations")}
              />

              <StatCard
                icon={CheckCircle2}
                iconColor="#15803d"
                iconBg="#dcfce7"
                accentColor="#15803d"
                label="Evaluated"
                value={loading ? "—" : evaluated}
                sub="Completed evaluations"
              />

              <StatCard
                icon={FileText}
                iconColor="#0369a1"
                iconBg="#e0f2fe"
                accentColor="#0369a1"
                label="Total Proposals"
                value={loading ? "—" : totalProposals}
                sub="Visible proposal records"
              />

              <StatCard
                icon={TrendingUp}
                iconColor="#ea580c"
                iconBg="#fff7ed"
                accentColor="#ea580c"
                label="Avg. Score"
                value={loading ? "—" : avgScore}
                sub="Average given evaluation score"
              />
            </div>

            {/* SECOND ROW */}
            <div className="ev-main-grid">
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "20px 22px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      Evaluation Progress
                    </h3>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 12,
                        color: "#9ca3af",
                      }}
                    >
                      Quick overview of your current evaluation workload.
                    </p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  {workflowItems.map((item) => {
                    const Icon = item.icon;
                    const maxBase = item.label === "Average Score" ? 100 : (awaitingEvaluation + evaluated || 1);
                    const width = item.label === "Average Score"
                      ? Math.min(Number(item.value || 0), 100)
                      : pct(item.value, maxBase);

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

                          <div style={{ textAlign: "right" }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: 800,
                                color: "#111827",
                              }}
                            >
                              {loading ? "—" : item.value}
                            </p>
                          </div>
                        </div>

                        <div
                          style={{
                            width: "100%",
                            height: 8,
                            borderRadius: 999,
                            background: "#f3f4f6",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${width}%`,
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

              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "20px 22px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    Quick Summary
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 12,
                      color: "#9ca3af",
                    }}
                  >
                    Helpful metrics for your evaluator role.
                  </p>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "14px 15px",
                      background: "#fafafa",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "#e0f2fe",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BarChart3 size={18} color="#0369a1" />
                      </div>

                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
                          Completion Rate
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9ca3af" }}>
                          Based on pending and completed evaluations
                        </p>
                      </div>
                    </div>

                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: 24,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {loading ? "—" : `${completionRate}%`}
                    </p>

                    <div
                      style={{
                        width: "100%",
                        height: 9,
                        borderRadius: 999,
                        background: "#f3f4f6",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${completionRate}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "linear-gradient(90deg, #047857, #34d399)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px solid #f1f5f9",
                      borderRadius: 12,
                      padding: "14px 15px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Activity size={18} color="#6d28d9" />
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827" }}>
                        Need action now
                      </p>
                    </div>

                    <p
                      style={{
                        margin: "10px 0 0",
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#6d28d9",
                      }}
                    >
                      {loading ? "—" : awaitingEvaluation}
                    </p>

                    <p style={{ margin: "4px 0 0", fontSize: 12, color: "#9ca3af" }}>
                      proposal{awaitingEvaluation === 1 ? "" : "s"} currently waiting for your evaluation
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/evaluator/evaluations")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      border: "none",
                      borderRadius: 10,
                      background: "#15803d",
                      color: "#fff",
                      padding: "11px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Open Evaluations <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* CHARTS */}
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
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#374151",
                  }}
                >
                  No data yet
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9ca3af" }}>
                  Charts will appear once proposals are assigned and evaluated.
                </p>
              </div>
            ) : (
              <div className="ev-chart-grid">
                {pieData.length > 0 && (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: "20px 22px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 4px",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      Project Status Distribution
                    </h3>

                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9ca3af" }}>
                      Status overview of proposal records visible to evaluators.
                    </p>

                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          dataKey="value"
                          labelLine
                          label={renderCustomLabel}
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {barData.some((item) => item.value > 0) && (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 14,
                      padding: "20px 22px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 4px",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      Evaluation Overview
                    </h3>

                    <p style={{ margin: "0 0 16px", fontSize: 12, color: "#9ca3af" }}>
                      Quick comparison of your pending, completed, and visible proposals.
                    </p>

                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#15803d" radius={[6, 6, 0, 0]} maxBarSize={60} />
                      </BarChart>
                    </ResponsiveContainer>
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