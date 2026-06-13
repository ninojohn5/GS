// src/pages/admin/Projects.jsx
import { useEffect, useState } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  Search,
  ChevronDown,
  FolderOpen,
  Eye,
  X,
  User,
  Calendar,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";

const STATUS_STYLE = {
  Submitted: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  "Presentation Scheduled": { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Under Evaluation": { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  Evaluated: { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  Endorsed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Forwarded: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "In Progress": { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const OUTPUT_STATUS_STYLE = {
  Pending: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  "In Progress": { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  Completed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
};

const PROJECT_STATUSES = [
  "Submitted",
  "Presentation Scheduled",
  "Under Evaluation",
  "Evaluated",
  "Endorsed",
  "Recommended",
  "Forwarded",
  "Approved",
  "In Progress",
  "Rejected",
  "For Revision",
];

const fmtMoney = (v) => {
  if (!v && v !== 0) return "—";
  const str = String(v).trim();
  if (!str || str === "0") return "—";
  const cleaned = str.replace(/[₱,\s]/g, "");
  const num = parseFloat(cleaned);
  if (!isNaN(num) && cleaned.replace(/[\d.]/g, "") === "") {
    if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000)     return `₱${(num / 1_000).toFixed(1)}K`;
    return `₱${num.toLocaleString()}`;
  }
  return `₱${str}`;
};

const fmtDate = (d) => {
  if (!d) return "-";

  try {
    return new Date(d).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

const getReference = (p) =>
  p?.reference_no || p?.project_id || p?.proposal_id || `PRJ-${p?.id}`;

const getResearcherName = (p) =>
  p?.creator?.name || p?.researcher || p?.created_by_name || "-";

const getDepartment = (p) =>
  p?.department_center?.name ||
  p?.departmentCenter?.name ||
  p?.department ||
  p?.creator?.department ||
  "-";

const getType = (p) => p?.type || p?.scholarly_work_type || "-";
const getBudget = (p) => p?.budget || p?.total_budget || 0;

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: "#9ca3af",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        {icon}
        {label}
      </p>

      <p
        style={{
          margin: "4px 0 0",
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
          lineHeight: 1.4,
        }}
      >
        {value || "-"}
      </p>
    </div>
  );
}

function DetailModal({ project, onClose }) {
  const status = project?.status || "Submitted";
  const style = STATUS_STYLE[status] || STATUS_STYLE.Submitted;

  const [outputs, setOutputs] = useState([]);
  const [loadingOutputs, setLoadingOutputs] = useState(true);
  const [outputsError, setOutputsError] = useState("");

  useEffect(() => {
    if (!project?.id) return;

    setLoadingOutputs(true);
    setOutputsError("");
    setOutputs([]);

    api
      .get(`/projects/${project.id}/outputs`)
      .then((res) => {
        setOutputs(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => {
        console.error("Failed to load project outputs:", err);
        setOutputs([]);
        setOutputsError("Failed to load research outputs.");
      })
      .finally(() => setLoadingOutputs(false));
  }, [project?.id]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 880,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "20px 24px 16px",
            borderBottom: "1px solid #f1f5f9",
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              {getReference(project)}
            </p>

            <h2
              style={{
                margin: "4px 0 0",
                fontSize: 18,
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.3,
              }}
            >
              {project?.title || "Untitled"}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              padding: 7,
              display: "flex",
              color: "#374151",
              flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "20px 24px 24px" }}>
          <div style={{ marginBottom: 18 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 14px",
                borderRadius: 20,
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <CheckCircle2 size={14} />
              {status}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px 24px",
              marginBottom: 22,
            }}
          >
            <InfoRow icon={<User size={14} />} label="Researcher" value={getResearcherName(project)} />
            <InfoRow icon={<BookOpen size={14} />} label="Department" value={getDepartment(project)} />
            <InfoRow icon={<FileText size={14} />} label="Type" value={getType(project)} />
            <InfoRow icon={<Calendar size={14} />} label="Start Date" value={fmtDate(project?.start_date)} />
            <InfoRow icon={<Calendar size={14} />} label="End Date" value={fmtDate(project?.end_date)} />
            <InfoRow
              icon={<Calendar size={14} />}
              label="Submitted Date"
              value={fmtDate(project?.submitted_at || project?.created_at)}
            />
          </div>

          <div
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Budget
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              {fmtMoney(getBudget(project))}
            </p>
          </div>

          <div style={{ marginBottom: 22 }}>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: 12,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Description
            </p>

            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "#374151",
                lineHeight: 1.6,
              }}
            >
              {project?.description || project?.abstract || "No description available."}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#f9fafb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <FileText size={15} color="#f59e0b" />
                  Research Outputs
                </p>

                <p
                  style={{
                    margin: "3px 0 0",
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  Uploaded project outputs and attached files
                </p>
              </div>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b7280",
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                {outputs.length} file record{outputs.length === 1 ? "" : "s"}
              </span>
            </div>

            {loadingOutputs && (
              <p
                style={{
                  margin: 0,
                  padding: 18,
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                Loading outputs...
              </p>
            )}

            {!loadingOutputs && outputsError && (
              <p
                style={{
                  margin: 0,
                  padding: 18,
                  fontSize: 13,
                  color: "#dc2626",
                }}
              >
                {outputsError}
              </p>
            )}

            {!loadingOutputs && !outputsError && outputs.length === 0 && (
              <p
                style={{
                  margin: 0,
                  padding: 18,
                  fontSize: 13,
                  color: "#9ca3af",
                }}
              >
                No research outputs uploaded yet.
              </p>
            )}

            {!loadingOutputs && !outputsError && outputs.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
                      <th style={TH}>Output Type</th>
                      <th style={TH}>Description</th>
                      <th style={{ ...TH, textAlign: "center" }}>Status</th>
                      <th style={{ ...TH, textAlign: "center" }}>Target Date</th>
                      <th style={TH}>Uploaded File</th>
                    </tr>
                  </thead>

                  <tbody>
                    {outputs.map((output) => {
                      const outputStatus = output.status || "Pending";
                      const outputStyle =
                        OUTPUT_STATUS_STYLE[outputStatus] ||
                        OUTPUT_STATUS_STYLE.Pending;

                      return (
                        <tr key={output.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                          <td
                            style={{
                              padding: "11px 12px",
                              color: "#111827",
                              fontWeight: 700,
                              verticalAlign: "top",
                              minWidth: 130,
                            }}
                          >
                            {output.output_type || "-"}
                          </td>

                          <td
                            style={{
                              padding: "11px 12px",
                              color: "#374151",
                              lineHeight: 1.45,
                              verticalAlign: "top",
                              minWidth: 220,
                            }}
                          >
                            {output.description || "-"}
                          </td>

                          <td
                            style={{
                              padding: "11px 12px",
                              textAlign: "center",
                              verticalAlign: "top",
                              minWidth: 110,
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                padding: "3px 10px",
                                borderRadius: 999,
                                background: outputStyle.bg,
                                color: outputStyle.color,
                                border: `1px solid ${outputStyle.border}`,
                                fontSize: 12,
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {outputStatus}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: "11px 12px",
                              color: "#374151",
                              textAlign: "center",
                              verticalAlign: "top",
                              minWidth: 115,
                            }}
                          >
                            {fmtDate(output.target_date)}
                          </td>

                          <td
                            style={{
                              padding: "11px 12px",
                              verticalAlign: "top",
                              minWidth: 160,
                            }}
                          >
                            {output.file_url ? (
                              <a
                                href={output.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 5,
                                  color: "#1d4ed8",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  lineHeight: 1.35,
                                }}
                              >
                                <Eye size={13} />
                                {output.file_name
                                  ? output.file_name.length > 28
                                    ? `${output.file_name.slice(0, 28)}...`
                                    : output.file_name
                                  : "View file"}
                              </a>
                            ) : (
                              <span style={{ color: "#9ca3af" }}>No file</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const TH = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 800,
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};

function DeleteConfirmModal({ project, onClose, onConfirm, deleting }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: "18px 22px 14px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 17,
                fontWeight: 700,
                color: "#dc2626",
              }}
            >
              Delete Project
            </h2>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              This action cannot be undone.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "#f3f4f6",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              padding: 6,
              display: "flex",
              color: "#374151",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "20px 22px 22px" }}>
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.5,
            }}
          >
            Are you sure you want to delete{" "}
            <strong>"{project?.title || getReference(project)}"</strong>?
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              disabled={deleting}
              style={{
                padding: "9px 20px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: deleting ? "not-allowed" : "pointer",
                fontSize: 14,
                color: "#374151",
                fontWeight: 500,
              }}
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              disabled={deleting}
              style={{
                padding: "9px 22px",
                borderRadius: 8,
                border: "none",
                background: deleting ? "#fca5a5" : "#dc2626",
                color: "#fff",
                cursor: deleting ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Trash2 size={15} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("success");
    }, 4000);
  };

  const fetchProjects = async () => {
    setLoading(true);

    try {
      const res = await api.get("/admin/proposals");
      const data = Array.isArray(res.data) ? res.data : [];

      const projectLikeData = data.filter((p) => {
        if (!p.status) return true;
        return PROJECT_STATUSES.includes(p.status);
      });

      setProjects(projectLikeData);
      setFiltered(projectLikeData);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
      setFiltered([]);
      showMessage("Failed to load projects.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();

    const result = projects.filter((p) => {
      const status = p.status || "Submitted";

      const matchesStatus =
        statusFilter === "All Status" || status === statusFilter;

      const matchesSearch =
        String(p.title || "").toLowerCase().includes(q) ||
        String(getReference(p) || "").toLowerCase().includes(q) ||
        String(getResearcherName(p) || "").toLowerCase().includes(q) ||
        String(getDepartment(p) || "").toLowerCase().includes(q) ||
        String(getType(p) || "").toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });

    setFiltered(result);
  }, [search, statusFilter, projects]);

  const deleteProjectRequest = async (projectId) => {
    try {
      return await api.delete(`/admin/projects/${projectId}`);
    } catch (projectRouteError) {
      const status = projectRouteError?.response?.status;

      if (status === 404 || status === 405) {
        return await api.delete(`/admin/proposals/${projectId}`);
      }

      throw projectRouteError;
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget?.id) return;

    setDeleting(true);

    try {
      await deleteProjectRequest(deleteTarget.id);

      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setFiltered((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);

      showMessage("Project deleted successfully.", "success");
    } catch (error) {
      console.error("Delete project error:", error);

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to delete project. Please check the backend delete route.";

      showMessage(backendMessage, "error");
    } finally {
      setDeleting(false);
    }
  };

  const ml = isMobile ? 0 : sidebarWidth;

  const totalBudget = projects.reduce((sum, p) => {
    const raw = getBudget(p);
    const num = parseFloat(String(raw || "0").replace(/[^\d.]/g, ""));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const submittedCount = projects.filter((p) => p.status === "Submitted").length;
  const approvedCount = projects.filter((p) => p.status === "Approved").length;

  return (
    <>
      <style>{`
        .admin-project-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 22px;
        }

        .admin-project-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .admin-filter-bar {
          display: grid;
          grid-template-columns: 1fr 240px;
          gap: 12px;
          margin-bottom: 18px;
          align-items: stretch;
        }

        .admin-search-box {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .admin-search-box input {
          flex: 1;
          border: none;
          outline: none;
          padding: 12px 0;
          font-size: 14px;
          color: #111827;
          background: transparent;
        }

        .admin-select-wrap {
          position: relative;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .admin-select-wrap select {
          width: 100%;
          appearance: none;
          border: none;
          outline: none;
          background: transparent;
          padding: 12px 38px 12px 14px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
        }

        .admin-select-wrap svg {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }

        .admin-table-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }

        .admin-table-scroll {
          overflow-x: auto;
        }

        .admin-project-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-project-table th {
          padding: 10px 12px;
          text-align: center;
          font-size: 12px;
          font-weight: 800;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          white-space: nowrap;
        }

        .admin-project-table td {
          padding: 11px 12px;
          font-size: 13px;
          color: #374151;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          text-align: center;
        }

        .admin-project-table tr:last-child td {
          border-bottom: none;
        }

        .admin-project-table tr:hover td {
          background: #fafafa;
        }

        @media (max-width: 1100px) {
          .admin-project-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 760px) {
          .admin-project-grid,
          .admin-filter-bar {
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
          <Topbar title="Projects Management" />

          <div style={{ padding: "24px", flex: 1 }}>
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                Monitor submitted proposals, approved projects, and active research projects
              </h3>
            </div>

            {message && (
              <div
                style={{
                  background: messageType === "error" ? "#fef2f2" : "#dcfce7",
                  color: messageType === "error" ? "#dc2626" : "#15803d",
                  border:
                    messageType === "error"
                      ? "1px solid #fecaca"
                      : "1px solid #bbf7d0",
                  padding: "12px 16px",
                  borderRadius: 10,
                  marginBottom: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {messageType === "error" ? (
                  <AlertCircle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                {message}
              </div>
            )}

            <div className="admin-project-grid">
              <div className="admin-project-card">
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Total Records
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#111827" }}>
                  {loading ? "-" : projects.length}
                </p>
              </div>

              <div className="admin-project-card">
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Submitted
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#0369a1" }}>
                  {loading ? "-" : submittedCount}
                </p>
              </div>

              <div className="admin-project-card">
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Approved
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: "#15803d" }}>
                  {loading ? "-" : approvedCount}
                </p>
              </div>

              <div className="admin-project-card">
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                  Total Budget
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800, color: "#111827" }}>
                  {loading ? "-" : fmtMoney(totalBudget)}
                </p>
              </div>
            </div>

            <div className="admin-filter-bar">
              <div className="admin-search-box">
                <Search size={18} color="#9ca3af" />
                <input
                  type="text"
                  placeholder="Search by title, reference number, researcher, department, or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="admin-select-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  {PROJECT_STATUSES.map((projectStatus) => (
                    <option key={projectStatus}>{projectStatus}</option>
                  ))}
                </select>
                <ChevronDown size={15} color="#6b7280" />
              </div>
            </div>

            <div className="admin-table-card">
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#111827",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FolderOpen size={17} color="#f59e0b" />
                  Research Projects / Proposals
                </h4>

                <span style={{ fontSize: 13, color: "#6b7280" }}>
                  {loading ? "Loading..." : `${filtered.length} shown`}
                </span>
              </div>

              <div className="admin-table-scroll">
                <table className="admin-project-table">
                  <thead>
                    <tr>
                      <th>Reference No</th>
                      <th>Title</th>
                      <th>Researcher</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: 28,
                            color: "#9ca3af",
                          }}
                        >
                          Loading records...
                        </td>
                      </tr>
                    )}

                    {!loading &&
                      filtered.map((project) => {
                        const projectStatus = project.status || "Submitted";
                        const projectStyle =
                          STATUS_STYLE[projectStatus] || STATUS_STYLE.Submitted;

                        return (
                          <tr key={project.id}>
                            <td style={{ fontWeight: 700 }}>
                              {getReference(project)}
                            </td>

                            <td>
                              <strong style={{ color: "#111827" }}>
                                {project.title || "Untitled"}
                              </strong>
                            </td>

                            <td>{getResearcherName(project)}</td>
                            <td>{getDepartment(project)}</td>

                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 11px",
                                  borderRadius: 999,
                                  background: projectStyle.bg,
                                  color: projectStyle.color,
                                  border: `1px solid ${projectStyle.border}`,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {projectStatus}
                              </span>
                            </td>

                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  gap: 6,
                                }}
                              >
                                <button
                                  onClick={() => setViewing(project)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "6px 12px",
                                    borderRadius: 7,
                                    border: "1px solid #e5e7eb",
                                    background: "#fff",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: "#374151",
                                  }}
                                >
                                  <Eye size={13} />
                                  View
                                </button>

                                <button
                                  onClick={() => setDeleteTarget(project)}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 5,
                                    padding: "6px 12px",
                                    borderRadius: 7,
                                    border: "none",
                                    background: "#dc2626",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#fff",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  <Trash2 size={13} />
                                  Delete
                                </button>
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
                            padding: 34,
                            color: "#9ca3af",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <AlertCircle size={28} color="#d1d5db" />
                            <span>No records found.</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewing && (
        <DetailModal project={viewing} onClose={() => setViewing(null)} />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteProject}
          deleting={deleting}
        />
      )}
    </>
  );
}