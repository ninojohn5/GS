import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import api from "../../utils/api";

const STATUS_STYLES = {
  "Approved":         { bg: "#dcfce7", color: "#15803d" },
  "Under Evaluation": { bg: "#ede9fe", color: "#6d28d9" },
  "In Progress":      { bg: "#d1fae5", color: "#065f46" },
  "Submitted":        { bg: "#e0f2fe", color: "#0369a1" },
  "Draft":            { bg: "#f3f4f6", color: "#6b7280" },
};

export default function Outputs() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/projects")
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="main-content">
        <Topbar title="Outputs" />
        <div className="dashboard-content">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
              Select a project to view its research outputs
            </h3>
          </div>
          <div className="cp-section">
            <div className="cp-section-title">Your Projects</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {loading && <p style={{ color: "#9ca3af", fontSize: 14 }}>Loading...</p>}
              {!loading && projects.length === 0 && (
                <p style={{ color: "#9ca3af", fontSize: 14 }}>No projects found.</p>
              )}
              {projects.map((p, i) => {
                const s = STATUS_STYLES[p.status] || STATUS_STYLES["Draft"];
                return (
                  <div key={p.id} className="wp-project-row"
                    style={{ borderTop: i === 0 ? "1px solid #f3f4f6" : "none" }}
                    onClick={() => navigate(`/researcher/outputs/${p.id}`)}>
                    <div>
                      <p className="wp-project-title">{p.title}</p>
                      <p className="wp-project-sub">{p.reference_no}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="badge" style={{ background: s.bg, color: s.color }}>{p.status}</span>
                      <Package size={18} color="#9ca3af" />
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