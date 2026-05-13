import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronDown,
  Trash2,
  RotateCcw,
} from "lucide-react";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";

const statusClass = {
  Approved: "approved",
  "Under Evaluation": "evaluating",
  "In Progress": "progress",
  Submitted: "submitted",
  Draft: "draft",
  Rejected: "rejected",
  "For Revision": "revision",
  Archived: "draft",
};

export default function ResearchProjects() {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects(statusFilter);
  }, [statusFilter]);

  const fetchProjects = async (filter = statusFilter) => {
    setLoading(true);

    try {
      const endpoint =
        filter === "Archived" ? "/projects?archived=1" : "/projects";

      const res = await api.get(endpoint);
      const data = Array.isArray(res.data) ? res.data : [];

      setProjects(data);
    } catch (err) {
      console.error(err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter((p) => {
    const searchText = query.toLowerCase();

    const projectStatus = p.is_archived ? "Archived" : p.status || "Draft";

    const matchQuery =
      p.title?.toLowerCase().includes(searchText) ||
      p.reference_no?.toLowerCase().includes(searchText) ||
      p.type?.toLowerCase().includes(searchText) ||
      p.scholarly_work_type?.toLowerCase().includes(searchText) ||
      p.department?.toLowerCase().includes(searchText) ||
      p.department_center?.name?.toLowerCase().includes(searchText);

    const matchStatus =
      statusFilter === "All Status" ||
      statusFilter === "Archived" ||
      projectStatus === statusFilter;

    return matchQuery && matchStatus;
  });

  const startNewProposal = () => {
    navigate("/researcher/proposals");
  };

  const handleProjectAction = (project) => {
    if (!project?.id) return;

    const status = project.status || "Draft";

    if (status === "Draft" || status === "For Revision") {
      navigate(`/researcher/proposals?project_id=${project.id}`);
      return;
    }

    navigate(`/researcher/projects/${project.id}`);
  };

  const handleArchiveProject = async (project) => {
    if (!project?.id) return;

    const ok = window.confirm(
      `Archive "${project.title || "this project"}"?\n\nThis will hide it from your researcher project list. Admin can still view it.`
    );

    if (!ok) return;

    try {
      await api.patch(`/projects/${project.id}/archive`, {
        archive_reason: "Archived by researcher",
      });

      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to archive project.");
    }
  };

  const handleRestoreProject = async (project) => {
    if (!project?.id) return;

    const ok = window.confirm(
      `Restore "${project.title || "this project"}"?\n\nThis will move it back to your active research project list.`
    );

    if (!ok) return;

    try {
      await api.patch(`/projects/${project.id}/restore`);

      setProjects((prev) => prev.filter((p) => p.id !== project.id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to restore project.");
    }
  };

  const getActionLabel = (status) => {
    if ((status || "Draft") === "Draft") return "Continue";
    if (status === "For Revision") return "Revise";
    return "View";
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="main-content">
        <Topbar title="Research Projects" />

        <div className="dashboard-content">
          <div className="page-header">
            <div>
              <h3 className="page-subtitle">
                Manage drafts, submitted proposals, and approved research projects
              </h3>
            </div>

            <button className="create-btn" onClick={startNewProposal}>
              <Plus size={16} /> Start New Proposal
            </button>
          </div>

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 18,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#14532d",
              }}
            >
              Create and continue projects from the proposal form.
            </p>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13,
                color: "#166534",
                lineHeight: 1.5,
              }}
            >
              Draft projects can be continued here. Open a draft, complete all
              required sections, then submit it for review from the proposal
              form.
            </p>
          </div>

          <div className="search-filter-bar">
            <div className="search-left">
              <Search size={18} color="#9ca3af" />

              <input
                type="text"
                placeholder="Search by title, reference number, type, or department..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="filter-right">
              <Filter size={16} color="#6b7280" />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option>All Status</option>
                <option>Draft</option>
                <option>Submitted</option>
                <option>Under Evaluation</option>
                <option>In Progress</option>
                <option>Approved</option>
                <option>For Revision</option>
                <option>Rejected</option>
                <option>Archived</option>
              </select>

              <ChevronDown size={15} color="#6b7280" />
            </div>
          </div>

          <div className="table-wrapper">
            <h4 className="table-title">
              {loading ? "Loading..." : `Projects (${filtered.length})`}
            </h4>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Reference No</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          color: "#9ca3af",
                          padding: 24,
                        }}
                      >
                        Loading projects...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    filtered.map((p) => {
                      const status = p.is_archived
                        ? "Archived"
                        : p.status || "Draft";

                      return (
                        <tr key={p.id}>
                          <td>{p.reference_no || "—"}</td>

                          <td>
                            <strong>{p.title || "Untitled Project"}</strong>
                          </td>

                          <td>{p.type || p.scholarly_work_type || "—"}</td>

                          <td>
                            {p.budget || p.total_budget || "—"}
                          </td>

                          <td>
                            <span
                              className={`badge ${
                                statusClass[status] || "draft"
                              }`}
                            >
                              {status}
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {status === "Archived" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreProject(p)}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#15803d",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: 13,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  <RotateCcw size={14} />
                                  Restore
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleProjectAction(p)}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      color:
                                        status === "Draft" ||
                                        status === "For Revision"
                                          ? "#1f7a1f"
                                          : "#15803d",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      padding: 0,
                                      fontSize: 13,
                                    }}
                                  >
                                    {getActionLabel(status)}
                                  </button>

                                  <button
                                    type="button"
                                    title="Archive project"
                                    onClick={() => handleArchiveProject(p)}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      color: "#dc2626",
                                      width: 28,
                                      height: 28,
                                      borderRadius: 6,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      padding: 0,
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "#fef2f2";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "transparent";
                                    }}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: "center",
                          color: "#9ca3af",
                          padding: 24,
                        }}
                      >
                        {statusFilter === "Archived" ? (
                          "No archived projects found."
                        ) : (
                          <>
                            No projects found. Click{" "}
                            <strong>Start New Proposal</strong> to create one.
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {!loading && projects.length === 0 && statusFilter !== "Archived" && (
            <div
              style={{
                marginTop: 18,
                background: "#fff",
                border: "1px dashed #d1d5db",
                borderRadius: 12,
                padding: "28px 20px",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                No research projects yet.
              </p>

              <p
                style={{
                  margin: "6px 0 16px",
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                Start from the proposal form so you can complete all required
                sections in one place.
              </p>

              <button
                className="create-btn"
                onClick={startNewProposal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={16} /> Start New Proposal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}