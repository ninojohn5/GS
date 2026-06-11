import { useEffect, useState } from "react";
import AdminNavbar from "../../components/admin/navbar";
import Topbar from "../../components/Topbar";
import api from "../../utils/api";
import {
  Search, ChevronDown, FolderOpen, Eye, X,
  User, Calendar, BookOpen, FileText,
  CheckCircle2, AlertCircle, Trash2,
} from "lucide-react";
import "../../styles/admin.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  Submitted:                { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  "Presentation Scheduled": { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe" },
  "Under Evaluation":       { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe" },
  Evaluated:                { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
  Endorsed:                 { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Recommended:              { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  Forwarded:                { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd" },
  Approved:                 { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
  "In Progress":            { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  Rejected:                 { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  "For Revision":           { bg: "#fef3c7", color: "#d97706", border: "#fde68a" },
};

const OUTPUT_STATUS_STYLE = {
  Pending:      { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb" },
  "In Progress":{ bg: "#d1fae5", color: "#065f46", border: "#a7f3d0" },
  Completed:    { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0" },
};

const PROJECT_STATUSES = [
  "Submitted","Presentation Scheduled","Under Evaluation","Evaluated",
  "Endorsed","Recommended","Forwarded","Approved","In Progress","Rejected","For Revision",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtMoney = (v) => {
  const n = Number(v || 0);
  return n ? `₱${n.toLocaleString()}` : "-";
};

const fmtDate = (d) => {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  } catch { return d; }
};

const getReference      = (p) => p?.reference_no || p?.project_id || p?.proposal_id || `PRJ-${p?.id}`;
const getResearcherName = (p) => p?.creator?.name || p?.researcher || p?.created_by_name || "-";
const getDepartment     = (p) => p?.department_center?.name || p?.departmentCenter?.name || p?.department || p?.creator?.department || "-";
const getType           = (p) => p?.type || p?.scholarly_work_type || "-";
const getBudget         = (p) => p?.budget || p?.total_budget || 0;

// ─── InfoRow ──────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <p className="proj-info-label">{icon}{label}</p>
      <p className="proj-info-value">{value || "-"}</p>
    </div>
  );
}

// ─── DetailModal ──────────────────────────────────────────────────────────────

function DetailModal({ project, onClose }) {
  const status = project?.status || "Submitted";
  const style  = STATUS_STYLE[status] || STATUS_STYLE.Submitted;

  const [outputs, setOutputs]               = useState([]);
  const [loadingOutputs, setLoadingOutputs] = useState(true);
  const [outputsError, setOutputsError]     = useState("");

  useEffect(() => {
    if (!project?.id) return;
    setLoadingOutputs(true);
    setOutputsError("");
    setOutputs([]);
    api.get(`/projects/${project.id}/outputs`)
      .then((res) => setOutputs(Array.isArray(res.data) ? res.data : []))
      .catch(() => { setOutputs([]); setOutputsError("Failed to load research outputs."); })
      .finally(() => setLoadingOutputs(false));
  }, [project?.id]);

  return (
    <div className="proj-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-detail-modal">

        {/* Header */}
        <div className="proj-modal-header">
          <div style={{ minWidth: 0 }}>
            <p className="proj-modal-ref">{getReference(project)}</p>
            <h2 className="proj-modal-title">{project?.title || "Untitled"}</h2>
          </div>
          <button className="proj-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Body */}
        <div className="proj-modal-body">
          <div style={{ marginBottom: 18 }}>
            <span className="proj-status-badge" style={{
              background: style.bg, color: style.color, border: `1px solid ${style.border}`,
            }}>
              <CheckCircle2 size={14} />{status}
            </span>
          </div>

          <div className="proj-info-grid">
            <InfoRow icon={<User size={14} />}     label="Researcher"      value={getResearcherName(project)} />
            <InfoRow icon={<BookOpen size={14} />}  label="Department"      value={getDepartment(project)} />
            <InfoRow icon={<FileText size={14} />}  label="Type"            value={getType(project)} />
            <InfoRow icon={<Calendar size={14} />}  label="Start Date"      value={fmtDate(project?.start_date)} />
            <InfoRow icon={<Calendar size={14} />}  label="End Date"        value={fmtDate(project?.end_date)} />
            <InfoRow icon={<Calendar size={14} />}  label="Submitted Date"  value={fmtDate(project?.submitted_at || project?.created_at)} />
          </div>

          <div className="proj-budget-box">
            <p className="proj-budget-label">Budget</p>
            <p className="proj-budget-value">{fmtMoney(getBudget(project))}</p>
          </div>

          <div style={{ marginBottom: 22 }}>
            <p className="proj-section-label">Description</p>
            <p className="proj-description">
              {project?.description || project?.abstract || "No description available."}
            </p>
          </div>

          {/* Outputs */}
          <div className="proj-outputs-card">
            <div className="proj-outputs-header">
              <div>
                <p className="proj-outputs-title">
                  <FileText size={15} color="#f59e0b" /> Research Outputs
                </p>
                <p className="proj-outputs-sub">Uploaded project outputs and attached files</p>
              </div>
              <span className="proj-outputs-count">
                {outputs.length} file record{outputs.length === 1 ? "" : "s"}
              </span>
            </div>

            {loadingOutputs && <p className="proj-outputs-msg">Loading outputs...</p>}
            {!loadingOutputs && outputsError && <p className="proj-outputs-msg proj-outputs-err">{outputsError}</p>}
            {!loadingOutputs && !outputsError && outputs.length === 0 && (
              <p className="proj-outputs-msg">No research outputs uploaded yet.</p>
            )}
            {!loadingOutputs && !outputsError && outputs.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="adm-table proj-outputs-table">
                  <thead>
                    <tr>
                      <th>Output Type</th>
                      <th>Description</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                      <th style={{ textAlign: "center" }}>Target Date</th>
                      <th>Uploaded File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputs.map((output) => {
                      const os = OUTPUT_STATUS_STYLE[output.status || "Pending"] || OUTPUT_STATUS_STYLE.Pending;
                      return (
                        <tr key={output.id}>
                          <td style={{ fontWeight: 700, color: "#111827", minWidth: 130 }}>
                            {output.output_type || "-"}
                          </td>
                          <td style={{ minWidth: 220 }}>{output.description || "-"}</td>
                          <td style={{ textAlign: "center", minWidth: 110 }}>
                            <span className="adm-status-pill" style={{
                              background: os.bg, color: os.color, border: `1px solid ${os.border}`,
                            }}>
                              {output.status || "Pending"}
                            </span>
                          </td>
                          <td style={{ textAlign: "center", minWidth: 115 }}>{fmtDate(output.target_date)}</td>
                          <td style={{ minWidth: 160 }}>
                            {output.file_url ? (
                              <a href={output.file_url} target="_blank" rel="noopener noreferrer"
                                className="proj-file-link">
                                <Eye size={13} />
                                {output.file_name
                                  ? output.file_name.length > 28 ? `${output.file_name.slice(0, 28)}...` : output.file_name
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

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({ project, onClose, onConfirm, deleting }) {
  return (
    <div className="proj-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="proj-delete-modal">
        <div className="proj-modal-header">
          <div>
            <h2 className="proj-modal-title" style={{ color: "#dc2626" }}>Delete Project</h2>
            <p className="proj-modal-ref">This action cannot be undone.</p>
          </div>
          <button className="proj-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="proj-delete-body">
          <p className="proj-delete-msg">
            Are you sure you want to delete{" "}
            <strong>"{project?.title || getReference(project)}"</strong>?
          </p>
          <div className="proj-delete-footer">
            <button className="fac-cancel-btn" onClick={onClose} disabled={deleting}>Cancel</button>
            <button className="proj-delete-btn" onClick={onConfirm} disabled={deleting}>
              <Trash2 size={15} />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AdminProjects() {
  const [projects, setProjects]         = useState([]);
  const [filtered, setFiltered]         = useState([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [loading, setLoading]           = useState(true);
  const [viewing, setViewing]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [message, setMessage]           = useState("");
  const [messageType, setMessageType]   = useState("success");
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage(text); setMessageType(type);
    setTimeout(() => { setMessage(""); setMessageType("success"); }, 4000);
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res  = await api.get("/admin/proposals");
      const data = Array.isArray(res.data) ? res.data : [];
      const filtered = data.filter((p) => !p.status || PROJECT_STATUSES.includes(p.status));
      setProjects(filtered);
      setFiltered(filtered);
    } catch {
      setProjects([]); setFiltered([]);
      showMessage("Failed to load projects.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(projects.filter((p) => {
      const matchStatus = statusFilter === "All Status" || p.status === statusFilter;
      const matchSearch = [p.title, getReference(p), getResearcherName(p), getDepartment(p), getType(p)]
        .some((v) => String(v || "").toLowerCase().includes(q));
      return matchStatus && matchSearch;
    }));
  }, [search, statusFilter, projects]);

  const deleteProjectRequest = async (id) => {
    try {
      return await api.delete(`/admin/projects/${id}`);
    } catch (err) {
      const s = err?.response?.status;
      if (s === 404 || s === 405) return await api.delete(`/admin/proposals/${id}`);
      throw err;
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
    } catch (err) {
      showMessage(
        err?.response?.data?.message || err?.response?.data?.error ||
        "Failed to delete project. Please check the backend delete route.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  const totalBudget    = projects.reduce((sum, p) => sum + Number(getBudget(p) || 0), 0);
  const submittedCount = projects.filter((p) => p.status === "Submitted").length;
  const approvedCount  = projects.filter((p) => p.status === "Approved").length;

  return (
    <div className="adm-page">
      <AdminNavbar onWidthChange={setSidebarWidth} />

      <div className="adm-main" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
        <Topbar title="Projects Management" />

        <div className="adm-content">
          <div style={{ marginBottom: 24 }}>
            <h3 className="proj-page-sub">
              Monitor submitted proposals, approved projects, and active research projects
            </h3>
          </div>

          {/* Toast */}
          {message && (
            <div className={`proj-toast ${messageType === "error" ? "proj-toast-error" : "proj-toast-success"}`}>
              {messageType === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              {message}
            </div>
          )}

          {/* Stat cards */}
          <div className="proj-stat-grid">
            {[
              { label: "Total Records", value: loading ? "-" : projects.length,        color: "#111827" },
              { label: "Submitted",     value: loading ? "-" : submittedCount,          color: "#0369a1" },
              { label: "Approved",      value: loading ? "-" : approvedCount,           color: "#15803d" },
              { label: "Total Budget",  value: loading ? "-" : fmtMoney(totalBudget),  color: "#111827", small: true },
            ].map(({ label, value, color, small }) => (
              <div key={label} className="proj-stat-card">
                <p className="proj-stat-label">{label}</p>
                <p className="proj-stat-value" style={{ color, fontSize: small ? 20 : 26 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="proj-filter-bar">
            <div className="proj-search-box">
              <Search size={18} color="#9ca3af" />
              <input
                className="proj-search-input"
                type="text"
                placeholder="Search by title, reference number, researcher, department, or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="proj-select-wrap">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="proj-select">
                <option>All Status</option>
                {PROJECT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={15} color="#6b7280" className="proj-select-chevron" />
            </div>
          </div>

          {/* Table card */}
          <div className="proj-table-card">
            <div className="proj-table-card-header">
              <h4 className="proj-table-title">
                <FolderOpen size={17} color="#f59e0b" />
                Research Projects / Proposals
              </h4>
              <span className="proj-table-count">
                {loading ? "Loading..." : `${filtered.length} shown`}
              </span>
            </div>

            <div className="proj-table-scroll">
              <table className="proj-table">
                <thead>
                  <tr>
                    {["Reference No","Title","Researcher","Department","Status","Action"]
                      .map((h) => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={6} className="proj-td-center proj-td-msg">Loading records...</td></tr>
                  )}

                  {!loading && filtered.map((project) => {
                    const ps = STATUS_STYLE[project.status] || STATUS_STYLE.Submitted;
                    return (
                      <tr key={project.id}>
                        <td style={{ fontWeight: 700 }}>{getReference(project)}</td>
                        <td><strong style={{ color: "#111827" }}>{project.title || "Untitled"}</strong></td>
                        <td>{getResearcherName(project)}</td>
                        <td>{getDepartment(project)}</td>
                        <td>
                          <span className="adm-status-pill" style={{
                            background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                          }}>
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <div className="proj-action-btns">
                            <button className="proj-view-btn" onClick={() => setViewing(project)}>
                              <Eye size={13} /> View
                            </button>
                            <button className="proj-del-btn" onClick={() => setDeleteTarget(project)}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="proj-td-center proj-td-msg">
                        <div className="proj-empty-cell">
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

      {viewing     && <DetailModal project={viewing} onClose={() => setViewing(null)} />}
      {deleteTarget && (
        <DeleteConfirmModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteProject}
          deleting={deleting}
        />
      )}
    </div>
  );
}