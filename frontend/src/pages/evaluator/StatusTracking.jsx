import { useState, useEffect } from "react";
import { ChevronDown, FileText, Clock, CheckCircle2, TrendingUp, Activity } from "lucide-react";
import EvaluatorNavbar from "../../components/evaluator/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/evaluator.css";
import api from "../../utils/api";

const STATUS_BADGE_STYLES = {
  "Approved":         { bg: "#dcfce7", color: "#15803d" },
  "Under Evaluation": { bg: "#ede9fe", color: "#6d28d9" },
  "In Progress":      { bg: "#d1fae5", color: "#065f46" },
  "Submitted":        { bg: "#e0f2fe", color: "#0369a1" },
  "Draft":            { bg: "#f3f4f6", color: "#6b7280" },
  "Endorsed":         { bg: "#dcfce7", color: "#15803d" },
  "Recommended":      { bg: "#dcfce7", color: "#15803d" },
  "Forwarded":        { bg: "#e0f2fe", color: "#0369a1" },
  "Rejected":         { bg: "#fef2f2", color: "#dc2626" },
  "For Revision":     { bg: "#fef3c7", color: "#d97706" },
};

function TimelineIcon({ status, color }) {
  const style = {
    width: 36, height: 36, borderRadius: "50%",
    border: `2px solid ${color}`, background: "white",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  };
  if (status === "Draft")     return <div style={style}><FileText size={16} color={color} /></div>;
  if (status === "Submitted") return <div style={style}><Clock size={16} color={color} /></div>;
  if (status === "Approved")  return <div style={style}><CheckCircle2 size={16} color={color} /></div>;
  if (status === "Evaluated") return <div style={style}><TrendingUp size={16} color={color} /></div>;
  return <div style={style}><Activity size={16} color={color} /></div>;
}

export default function EvaluatorStatusTracking() {
  const [projects,     setProjects]     = useState([]);
  const [selectedId,   setSelectedId]   = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [loading,      setLoading]      = useState(false);

  useEffect(() => {
    api.get("/projects").then((res) => {
      setProjects(res.data);
      if (res.data.length > 0) setSelectedId(String(res.data[0].id));
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    api.get(`/projects/${selectedId}/status-history`)
      .then((res) => setTrackingData(res.data))
      .finally(() => setLoading(false));
  }, [selectedId]);

  const project = trackingData?.project;
  const history = trackingData?.history || [];
  const statusStyle = STATUS_BADGE_STYLES[project?.current_status] || STATUS_BADGE_STYLES["Draft"];

  return (
    <div className="dashboard-layout">
      <EvaluatorNavbar />
      <div className="main-content">
        <Topbar title="Status Tracking" />
        <div className="dashboard-content">

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              View detailed status history and timeline
            </h3>
          </div>

          {/* Project Selector */}
          <div className="cp-section" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
                Select Project:
              </label>
              <div className="cp-select-wrap" style={{ flex: 1 }}>
                <select className="cp-select" value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={{ fontSize: 14, padding: "10px 36px 10px 14px" }}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference_no} - {p.title}
                    </option>
                  ))}
                </select>
                <span className="cp-select-chevron"><ChevronDown size={14} /></span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          {project && (
            <div className="cp-section" style={{ marginBottom: 16 }}>
              <div className="cp-section-title">Current Status</div>
              <div className="st-current-grid">
                <div>
                  <p className="st-info-label">Reference No</p>
                  <p className="st-info-value">{project.reference_no}</p>
                </div>
                <div>
                  <p className="st-info-label">Current Status</p>
                  <span className="badge" style={{ background: statusStyle.bg, color: statusStyle.color, marginTop: 4, display: "inline-block" }}>
                    {project.current_status}
                  </span>
                </div>
                <div>
                  <p className="st-info-label">Submitted Date</p>
                  <p className="st-info-value">{project.submitted_at || "—"}</p>
                </div>
                <div>
                  <p className="st-info-label">Evaluation Score</p>
                  <p className="st-info-value">{project.evaluation_score ? `${project.evaluation_score}/100` : "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="cp-section" style={{ marginBottom: 16 }}>
            <div className="cp-section-title">Status History Timeline</div>
            {loading && <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading...</p>}
            {!loading && history.length === 0 && (
              <p style={{ color: "#9ca3af", fontSize: 14 }}>No status history yet.</p>
            )}
            <div className="st-timeline">
              {history.map((item, i) => {
                const hb = STATUS_BADGE_STYLES[item.status] || { bg: "#f3f4f6", color: "#6b7280" };
                return (
                  <div key={i} className="st-timeline-row">
                    <div className="st-timeline-left">
                      <TimelineIcon status={item.status} color={hb.color} />
                      {i < history.length - 1 && <div className="st-timeline-line" />}
                    </div>
                    <div className="st-timeline-card">
                      <div className="st-card-top">
                        <span className="badge" style={{ background: hb.bg, color: hb.color }}>
                          {item.status}
                        </span>
                        <span className="st-card-date">{item.date}<br />{item.time}</span>
                      </div>
                      {item.remarks && <p className="st-card-title">{item.remarks}</p>}
                      <p className="st-card-action">
                        Action by: <strong>{item.action_by}</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="st-stats">
            <div className="st-stat-card">
              <div className="st-stat-icon" style={{ background: "#f5f3ff" }}>
                <Clock size={22} color="#7c3aed" />
              </div>
              <div>
                <p className="st-stat-value">{history.length}</p>
                <p className="st-stat-label">Status Changes</p>
              </div>
            </div>
            <div className="st-stat-card">
              <div className="st-stat-icon" style={{ background: "#eff6ff" }}>
                <CheckCircle2 size={22} color="#2563eb" />
              </div>
              <div>
                <p className="st-stat-value">{project?.current_status || "—"}</p>
                <p className="st-stat-label">Current Status</p>
              </div>
            </div>
            <div className="st-stat-card">
              <div className="st-stat-icon" style={{ background: "#fefce8" }}>
                <TrendingUp size={22} color="#d97706" />
              </div>
              <div>
                <p className="st-stat-value">{project?.evaluation_score ? `${project.evaluation_score}/100` : "—"}</p>
                <p className="st-stat-label">Evaluation Score</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}