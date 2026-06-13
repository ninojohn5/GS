import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  GitBranch,
  BookOpen,
  FileText,
  Users,
  Clock,
  Layers,
  X,
  Download,
  ExternalLink,
  Eye,
  AlertCircle,
  CheckCircle2,
  MapPin,
  UserCheck,
  ClipboardList,
  Trash2,
} from "lucide-react";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import api from "../../utils/api";
import { getSession } from "../../utils/auth";

const STATUS_CFG = {
  Approved: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", dot: "#15803d" },
  "Presentation Scheduled": { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  Scheduled: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  "Under Evaluation": { bg: "#ede9fe", color: "#6d28d9", border: "#ddd6fe", dot: "#7c3aed" },
  Evaluated: { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", dot: "#7c3aed" },
  Endorsed: { bg: "#dcfce7", color: "#15803d", border: "#bbf7d0", dot: "#15803d" },
  Recommended: { bg: "#dbeafe", color: "#1d4ed8", border: "#bfdbfe", dot: "#1d4ed8" },
  Forwarded: { bg: "#fef9c3", color: "#a16207", border: "#fde68a", dot: "#a16207" },
  "In Progress": { bg: "#d1fae5", color: "#065f46", border: "#a7f3d0", dot: "#059669" },
  Submitted: { bg: "#e0f2fe", color: "#0369a1", border: "#bae6fd", dot: "#0284c7" },
  Draft: { bg: "#f3f4f6", color: "#6b7280", border: "#e5e7eb", dot: "#9ca3af" },
  Rejected: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#dc2626" },
  "For Revision": { bg: "#fef3c7", color: "#d97706", border: "#fde68a", dot: "#d97706" },
};

const VIEW_TABS = ["Overview", "Team", "Evaluators", "Documents", "Work Plan", "Schedule"];

const DOCS = [
  {
    key: "proposal_form",
    altKeys: ["proposal_form_path"],
    label: "Proposal Form",
    icon: FileText,
    color: "#eff6ff",
    iconColor: "#1d4ed8",
    desc: "Signed project proposal form",
    multi: false,
  },
  {
    key: "cv_files",
    altKeys: ["cv_paths"],
    label: "CV of Proponents",
    icon: Users,
    color: "#fef9c3",
    iconColor: "#a16207",
    desc: "Curriculum vitae files submitted with the proposal",
    multi: true,
  },
  {
    key: "work_plan_file",
    altKeys: ["work_plan_path"],
    label: "Work Plan",
    icon: Calendar,
    color: "#dcfce7",
    iconColor: "#15803d",
    desc: "Detailed activities, timelines, responsibilities, and milestones",
    multi: false,
  },
  {
    key: "framework_file",
    altKeys: ["framework_path"],
    label: "Framework",
    icon: GitBranch,
    color: "#f5f3ff",
    iconColor: "#7c3aed",
    desc: "Research objectives, methodology, success indicators, and risks",
    multi: false,
  },
  {
    key: "references_file",
    altKeys: ["references_path"],
    label: "References",
    icon: BookOpen,
    color: "#fff7ed",
    iconColor: "#c2410c",
    desc: "References and citations in proper academic format",
    multi: false,
  },
];

const normalizeStatus = (status) => {
  if (status === "Presentation Scheduled") return "Scheduled";
  return status || "Draft";
};

const fmtDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const fmtShortDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const fmtTime = (value) => {
  if (!value) return "—";

  if (/^\d{2}:\d{2}/.test(value)) {
    const [h, m] = value.split(":");
    const date = new Date();
    date.setHours(Number(h), Number(m || 0), 0);

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return value;
};

const fmtBudget = (value) => {
  if (!value) return "—";
  return value;
};

const parseMaybeJson = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const getApiOrigin = () => {
  const base = import.meta.env.VITE_STORAGE_URL
    ? import.meta.env.VITE_STORAGE_URL.replace(/\/storage\/?$/, "")
    : (api?.defaults?.baseURL || "http://127.0.0.1:8000").replace(/\/api\/?$/, "");

  return base
    .replace(/\/api\/?$/, "")
    .replace(/\/api$/, "")
    .replace(/\/$/, "");
};

const toFileUrl = (path) => {
  if (!path || typeof path !== "string") return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("data:")) {
    return path;
  }

  const cleanPath = path.replace(/^public\//, "").replace(/^storage\//, "");

  return `${getApiOrigin()}/storage/${cleanPath}`;
};

const fileNameFromPath = (path) => {
  if (!path) return "File";

  const raw = String(path).split("?")[0].split("/").pop() || "File";

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

const isPreviewable = (url) => {
  if (!url) return false;

  const clean = String(url).toLowerCase();

  return (
    clean.startsWith("data:image") ||
    clean.includes(".pdf") ||
    clean.match(/\.(png|jpg|jpeg|webp|gif)$/)
  );
};

const getRelation = (project, snake, camel) => {
  return project?.[snake] || project?.[camel] || null;
};

const getDocRaw = (project, doc) => {
  const proposal = project?.proposal || {};

  const keys = [doc.key, ...(doc.altKeys || [])];

  for (const key of keys) {
    if (project?.[key]) return project[key];
    if (proposal?.[key]) return proposal[key];
  }

  return null;
};

const getDocFiles = (project, doc) => {
  const raw = getDocRaw(project, doc);
  const parsed = parseMaybeJson(raw, raw);

  const files = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];

  return files
    .filter(Boolean)
    .map((path) => ({
      path,
      url: toFileUrl(path),
      name: fileNameFromPath(path),
    }))
    .filter((file) => file.url);
};

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const style = STATUS_CFG[normalized] || STATUS_CFG.Draft;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 12,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: style.dot,
        }}
      />
      {normalized}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 800,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>

      <p
        style={{
          margin: "5px 0 0",
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
          lineHeight: 1.45,
        }}
      >
        {value || "—"}
      </p>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, iconColor, bg }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: bg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>

      <div style={{ minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: "#94a3b8",
          }}
        >
          {label}
        </p>

        <p
          style={{
            margin: "3px 0 0",
            fontSize: 15,
            fontWeight: 800,
            color: "#111827",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon = AlertCircle, title, subtitle }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "42px 20px",
        border: "1px dashed #d1d5db",
        borderRadius: 14,
        background: "#fafafa",
      }}
    >
      <Icon size={34} color="#cbd5e1" style={{ margin: "0 auto 12px", display: "block" }} />

      <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#374151" }}>
        {title}
      </p>

      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#94a3b8" }}>
        {subtitle}
      </p>
    </div>
  );
}

function DocModal({ doc, files, onClose }) {
  const Icon = doc.icon;
  const safeFiles = files || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeFile = safeFiles[activeIndex] || null;
  const canPreview = activeFile && isPreviewable(activeFile.url);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
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
          maxWidth: canPreview ? 900 : 520,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 22px",
            borderBottom: "1px solid #f1f5f9",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: doc.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={19} color={doc.iconColor} />
            </div>

            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#111827" }}>
                {doc.label}
              </h3>

              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                {safeFiles.length} file{safeFiles.length !== 1 ? "s" : ""} attached
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeFile && (
              <a
                href={activeFile.url}
                target="_blank"
                rel="noreferrer"
                download
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <Download size={14} />
                Download
              </a>
            )}

            {activeFile && (
              <a
                href={activeFile.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1f7a1f",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <ExternalLink size={14} />
                Open
              </a>
            )}

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
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {safeFiles.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              padding: "10px 22px",
              borderBottom: "1px solid #f1f5f9",
              overflowX: "auto",
              background: "#fafafa",
            }}
          >
            {safeFiles.map((file, index) => (
              <button
                key={`${file.url}-${index}`}
                onClick={() => setActiveIndex(index)}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 12px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: activeIndex === index ? 800 : 500,
                  background: activeIndex === index ? doc.color : "transparent",
                  color: activeIndex === index ? doc.iconColor : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <FileText size={13} />
                {file.name.length > 26 ? `${file.name.slice(0, 24)}…` : file.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto", background: "#f8fafc" }}>
          {!activeFile ? (
            <EmptyState
              title="No file selected"
              subtitle="Choose a file from the list."
            />
          ) : canPreview && activeFile.url.toLowerCase().includes(".pdf") ? (
            <iframe
              src={activeFile.url}
              title={doc.label}
              style={{
                width: "100%",
                height: "70vh",
                border: "none",
                display: "block",
              }}
            />
          ) : canPreview && activeFile.url.startsWith("data:image") ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <img
                src={activeFile.url}
                alt={activeFile.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          ) : canPreview && activeFile.url.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <img
                src={activeFile.url}
                alt={activeFile.name}
                style={{
                  maxWidth: "100%",
                  maxHeight: "70vh",
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 24px" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: doc.color,
                  margin: "0 auto 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={28} color={doc.iconColor} />
              </div>

              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#374151" }}>
                {activeFile.name}
              </p>

              <p style={{ margin: "6px 0 20px", fontSize: 13, color: "#94a3b8" }}>
              DOC and DOCX files cannot be previewed directly in the browser. Open or download the file instead. For direct preview, upload the document as PDF.
              </p>

              <a
                href={activeFile.url}
                target="_blank"
                rel="noreferrer"
                download
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "10px 18px",
                  borderRadius: 9,
                  background: "#1f7a1f",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                <Download size={15} />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ doc, files, onView }) {
  const Icon = doc.icon;
  const hasFiles = files.length > 0;

  return (
    <div
      style={{
        border: `1px solid ${hasFiles ? "#d1fae5" : "#e5e7eb"}`,
        background: "#fff",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: doc.color,
          color: doc.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111827" }}>
            {doc.label}
          </p>

          {hasFiles ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 20,
                background: "#dcfce7",
                color: "#15803d",
                border: "1px solid #bbf7d0",
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <CheckCircle2 size={11} />
              Uploaded
            </span>
          ) : (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 20,
                background: "#f3f4f6",
                color: "#6b7280",
                border: "1px solid #e5e7eb",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              Missing
            </span>
          )}
        </div>

        <p
          style={{
            margin: "4px 0 0",
            fontSize: 12,
            color: "#6b7280",
            lineHeight: 1.4,
          }}
        >
          {hasFiles
            ? `${files.length} file${files.length !== 1 ? "s" : ""}: ${files
                .map((f) => f.name)
                .join(", ")}`
            : doc.desc}
        </p>
      </div>

      <button
        disabled={!hasFiles}
        onClick={onView}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 13px",
          borderRadius: 8,
          border: hasFiles ? "1px solid #bbf7d0" : "1px solid #e5e7eb",
          background: hasFiles ? "#f0fdf4" : "#f9fafb",
          color: hasFiles ? "#15803d" : "#9ca3af",
          cursor: hasFiles ? "pointer" : "not-allowed",
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        <Eye size={14} />
        View
      </button>
    </div>
  );
}

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workPlanItems, setWorkPlanItems] = useState([]);
  const [error, setError] = useState("");

  // Work plan activity builder state
  const WP_MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const WP_MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const WP_EMPTY = { title:"", description:"", milestone:"Year 1",
    jan:false,feb:false,mar:false,apr:false,may:false,jun:false,
    jul:false,aug:false,sep:false,oct:false,nov:false,dec:false };
  const [showWpForm,  setShowWpForm]  = useState(false);
  const [newActivity, setNewActivity] = useState(WP_EMPTY);
  const [savingWp,    setSavingWp]    = useState(false);
  const [wpError,     setWpError]     = useState("");
  const [wpSuccess,   setWpSuccess]   = useState("");
  const currentUserId = parseInt(getSession()?.id || "0");

  const oralPresentation = getRelation(project, "oral_presentation", "oralPresentation");
  const evaluators = Array.isArray(oralPresentation?.evaluators) && oralPresentation.evaluators.length > 0
  ? oralPresentation.evaluators
  : Array.isArray(project?.preferred_evaluators_details) && project.preferred_evaluators_details.length > 0
  ? project.preferred_evaluators_details
  : Array.isArray(project?.evaluators)
  ? project.evaluators
  : [];

  const documentMap = useMemo(() => {
    if (!project) return {};

    return DOCS.reduce((acc, doc) => {
      acc[doc.key] = getDocFiles(project, doc);
      return acc;
    }, {});
  }, [project]);

  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .get(`/projects/${id}`)
      .then((res) => {
        setProject(res.data || null);
      })
      .catch((err) => {
        console.error("Project view fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load project.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === "Work Plan" && id) {
      api.get(`/projects/${id}/work-plan`)
        .then((res) => setWorkPlanItems(Array.isArray(res.data) ? res.data : []))
        .catch(() => setWorkPlanItems([]));
    }
  }, [activeTab, id]);

  const openDoc = (doc) => {
    setSelectedDoc(doc);
    setSelectedFiles(documentMap[doc.key] || []);
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Navbar />
        <div className="main-content">
          <Topbar title="Project View" />
          <div className="dashboard-content">
            <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading project details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="dashboard-layout">
        <Navbar />
        <div className="main-content">
          <Topbar title="Project View" />
          <div className="dashboard-content">
            <button
              onClick={() => navigate(-1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                background: "#f3f4f6",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                color: "#374151",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <ArrowLeft size={15} />
              Back
            </button>

            <EmptyState
              title="Unable to load project"
              subtitle={error || "Project record was not found."}
            />
          </div>
        </div>
      </div>
    );
  }

  const status = normalizeStatus(project.status);
  const sc = STATUS_CFG[status] || STATUS_CFG.Draft;

  const scheduleDate = oralPresentation?.presentation_date || oralPresentation?.defense_date;
  const scheduleTime = oralPresentation?.presentation_time || oralPresentation?.defense_time;
  const scheduleVenue = oralPresentation?.venue || oralPresentation?.presentation_venue;

  return (
    <>
      <style>{`
        .pv-grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }

        .pv-info-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px 28px;
        }

        .pv-doc-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .pv-evaluator-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }

        @media(max-width: 1100px) {
          .pv-grid-4,
          .pv-evaluator-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .pv-info-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media(max-width: 720px) {
          .pv-grid-4,
          .pv-evaluator-grid,
          .pv-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="dashboard-layout">
        <Navbar />

        <div className="main-content">
          <Topbar title="Project View" />

          <div className="dashboard-content">
            <button
              onClick={() => navigate("/researcher/projects")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                border: "none",
                background: "#f3f4f6",
                borderRadius: 8,
                padding: "8px 12px",
                cursor: "pointer",
                color: "#374151",
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              <ArrowLeft size={15} />
              Back to Projects
            </button>

            <div
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "20px 22px",
                marginBottom: 20,
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      marginBottom: 8,
                    }}
                  >
                    <StatusBadge status={project.status} />

                    <span
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        fontWeight: 700,
                      }}
                    >
                      {project.reference_no || `PRJ-${project.id}`}
                    </span>
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 850,
                      color: "#111827",
                      lineHeight: 1.3,
                    }}
                  >
                    {project.title || "Untitled Project"}
                  </h2>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 8,
                      color: "#6b7280",
                      fontSize: 13,
                    }}
                  >
                    <Layers size={14} />
                    <span>{project.type || project.scholarly_work_type || "Research"}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    borderRadius: 10,
                    background: scheduleDate ? "#eff6ff" : "#f9fafb",
                    color: scheduleDate ? "#1d4ed8" : "#6b7280",
                    border: scheduleDate ? "1px solid #bfdbfe" : "1px solid #e5e7eb",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  <Calendar size={15} />
                  {scheduleDate ? `Presentation: ${fmtShortDate(scheduleDate)}` : "No presentation schedule yet"}
                </div>
              </div>
            </div>

            <div className="pv-grid-4">
              <StatCard
                icon={FileText}
                label="Proposed Budget"
                value={fmtBudget(project.budget || project.total_budget)}
                iconColor="#0369a1"
                bg="#e0f2fe"
              />

              <StatCard
                icon={Calendar}
                label="Start Date"
                value={fmtShortDate(project.start_date)}
                iconColor="#15803d"
                bg="#dcfce7"
              />

              <StatCard
                icon={Clock}
                label="End Date"
                value={fmtShortDate(project.end_date)}
                iconColor="#c2410c"
                bg="#fff7ed"
              />

              <StatCard
                icon={Users}
                label="Proponents"
                value={`${project.proponents?.length || 0} member${project.proponents?.length !== 1 ? "s" : ""}`}
                iconColor="#7c3aed"
                bg="#f5f3ff"
              />
            </div>

            <div className="cp-tab-bar" style={{ marginBottom: 16 }}>
              {VIEW_TABS.map((tab) => (
                <button
                  key={tab}
                  className={`cp-tab-btn ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Overview" && (
              <div className="cp-section">
                <div className="cp-section-title">Project Information</div>

                <div className="pv-info-grid">
                  <InfoRow label="Reference No" value={project.reference_no || `PRJ-${project.id}`} />
                  <InfoRow label="Type" value={project.type || project.scholarly_work_type} />
                  <InfoRow label="Category" value={project.category} />
                  <InfoRow
                    label="Department"
                    value={
                      project.department_center?.name ||
                      project.departmentCenter?.name ||
                      project.creator?.department ||
                      "—"
                    }
                  />
                  <InfoRow label="Start Date" value={fmtDate(project.start_date)} />
                  <InfoRow label="End Date" value={fmtDate(project.end_date)} />
                  <InfoRow label="Lead Agency" value={project.lead_agency} />
                  <InfoRow label="Site / Area" value={project.site_area} />
                  <InfoRow label="Status" value={status} />
                </div>

                {(project.nature_and_significance ||
                  project.issues_to_address ||
                  project.objectives ||
                  project.methodology ||
                  project.significance_impact) && (
                  <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
                    {project.nature_and_significance && (
                      <InfoRow label="Nature and Significance" value={project.nature_and_significance} />
                    )}

                    {project.issues_to_address && (
                      <InfoRow label="Issues to Address" value={project.issues_to_address} />
                    )}

                    {project.objectives && <InfoRow label="Objectives" value={project.objectives} />}

                    {project.methodology && <InfoRow label="Methodology" value={project.methodology} />}

                    {project.significance_impact && (
                      <InfoRow label="Significance / Impact" value={project.significance_impact} />
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Team" && (
              <div className="cp-section">
                <div className="cp-section-title">Project Proponents</div>

                {!project.proponents || project.proponents.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No proponents found"
                    subtitle="No team members are attached to this project."
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {project.proponents.map((p, index) => {
                      const personnel = p.personnel || {};
                      const name = personnel.name || p.name || "Unknown";
                      const email = personnel.email || p.email || "—";
                      const department =
                        personnel.department ||
                        personnel.department_center?.name ||
                        p.department ||
                        "—";
                      const role = p.role || p.proponent_role || "Proponent";
                      const isLeader = role.toLowerCase().includes("leader") || index === 0;

                      return (
                        <div
                          key={p.id || p.personnel_id || index}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 16px",
                            borderRadius: 12,
                            border: `1.5px solid ${isLeader ? "#bbf7d0" : "#e5e7eb"}`,
                            background: isLeader ? "#f0fdf4" : "#fafafa",
                          }}
                        >
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: "50%",
                              background: isLeader ? "#15803d" : "#e5e7eb",
                              color: isLeader ? "#fff" : "#6b7280",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 800,
                              fontSize: 16,
                              flexShrink: 0,
                            }}
                          >
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                              }}
                            >
                              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#111827" }}>
                                {name}
                              </p>

                              {isLeader && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    color: "#15803d",
                                    background: "#dcfce7",
                                    padding: "2px 8px",
                                    borderRadius: 20,
                                    border: "1px solid #bbf7d0",
                                  }}
                                >
                                  Project Leader
                                </span>
                              )}
                            </div>

                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>
                              {email}
                            </p>

                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                              {department}
                            </p>
                          </div>

                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#374151",
                              background: "#f3f4f6",
                              padding: "4px 12px",
                              borderRadius: 20,
                              border: "1px solid #e5e7eb",
                              flexShrink: 0,
                            }}
                          >
                            {role}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Evaluators" && (
              <div className="cp-section">
                <div className="cp-section-title">Assigned Evaluators</div>

                {evaluators.length === 0 ? (
                  <EmptyState
                    icon={UserCheck}
                    title="No evaluators assigned yet"
                    subtitle="No evaluator assignment was saved with this proposal yet."                  />
                ) : (
                  <div className="pv-evaluator-grid">
                    {evaluators.map((ev, index) => (
                      <div
                        key={ev.id || index}
                        style={{
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 14,
                          padding: 16,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: "50%",
                              background: "#f5f3ff",
                              color: "#7c3aed",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 850,
                            }}
                          >
                            {(ev.name || "E").charAt(0).toUpperCase()}
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 850, color: "#111827" }}>
                              {ev.name || "Evaluator"}
                            </p>

                            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
                              {ev.email || "—"}
                            </p>
                          </div>
                        </div>

                        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
                          <InfoRow label="Department" value={ev.department || ev.department_center?.name || "—"} />
                          <InfoRow label="Position" value={ev.position || "Evaluator"} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "Documents" && (
              <div className="cp-section">
                <div className="cp-section-title">Submitted Documents</div>

                <div className="pv-doc-grid">
                  {DOCS.map((doc) => (
                    <DocumentCard
                      key={doc.key}
                      doc={doc}
                      files={documentMap[doc.key] || []}
                      onView={() => openDoc(doc)}
                    />
                  ))}
                </div>

                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: 12,
                    color: "#6b7280",
                    lineHeight: 1.5,
                  }}
                >
                </p>
              </div>
            )}

            {activeTab === "Work Plan" && (() => {
              const isCreator = project && parseInt(project.created_by) === currentUserId;
              const isDraft   = project?.status === "Draft";
              const isEditable = ["Draft", "Submitted"].includes(project?.status);
              const canEdit   = isCreator && isEditable;
              const handleAddActivity = async () => {
                if (!newActivity.title.trim()) { setWpError("Activity title is required."); return; }
                setWpError(""); setSavingWp(true);
                try {
                  const res = await api.post(`/projects/${id}/work-plan`, newActivity);
                  setWorkPlanItems((p) => [...p, res.data]);
                  setNewActivity(WP_EMPTY);
                  setShowWpForm(false);
                  setWpSuccess("Activity added!"); setTimeout(() => setWpSuccess(""), 2500);
                } catch (err) {
                  setWpError(err.response?.data?.message || "Failed to add activity.");
                } finally { setSavingWp(false); }
              };
              const handleDeleteActivity = async (actId) => {
                try {
                  await api.delete(`/projects/${id}/work-plan/${actId}`);
                  setWorkPlanItems((p) => p.filter((a) => a.id !== actId));
                } catch {}
              };
              return (
                <div className="cp-section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div className="cp-section-title" style={{ margin: 0 }}>Work Plan — Gantt Chart</div>
                    {canEdit && (
                      <button type="button" onClick={() => { setShowWpForm(true); setWpError(""); }}
                        style={{ padding: "7px 14px", borderRadius: 8, border: "none",
                          background: "#1f7a1f", color: "#fff", fontSize: 13, fontWeight: 600,
                          cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        + Add Activity
                      </button>
                    )}
                  </div>

                  {wpError && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
                    padding: "8px 12px", fontSize: 13, color: "#dc2626", marginBottom: 10 }}>{wpError}</div>}
                  {wpSuccess && <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", borderRadius: 8,
                    padding: "8px 12px", fontSize: 13, color: "#15803d", marginBottom: 10 }}>{wpSuccess}</div>}

                  {/* Read-only notice for locked projects */}
                  {isCreator && !isEditable && (
                    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8,
                      padding: "10px 14px", fontSize: 13, color: "#1e40af", marginBottom: 12,
                      display: "flex", alignItems: "center", gap: 8 }}>
                      🔒 Work plan is locked — the presentation has already been scheduled. No further changes can be made.
                    </div>
                  )}

                  {/* Add activity form */}
                  {showWpForm && (
                    <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12,
                      padding: "16px 18px", marginBottom: 16 }}>
                      <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#374151" }}>New Activity</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                        <div className="cp-field">
                          <label className="cp-label">Activity Title *</label>
                          <input className="cp-input" placeholder="e.g. Literature Review"
                            value={newActivity.title}
                            onChange={(e) => setNewActivity((p) => ({ ...p, title: e.target.value }))} />
                        </div>
                        <div className="cp-field">
                          <label className="cp-label">Milestone</label>
                          <select className="cp-input" value={newActivity.milestone}
                            onChange={(e) => setNewActivity((p) => ({ ...p, milestone: e.target.value }))}>
                            <option>Year 1</option><option>Year 2</option><option>Year 3</option>
                          </select>
                        </div>
                      </div>
                      <div className="cp-field" style={{ marginBottom: 12 }}>
                        <label className="cp-label">Description</label>
                        <input className="cp-input" placeholder="Brief description of this activity"
                          value={newActivity.description}
                          onChange={(e) => setNewActivity((p) => ({ ...p, description: e.target.value }))} />
                      </div>
                      <div className="cp-field" style={{ marginBottom: 14 }}>
                        <label className="cp-label">Active Months</label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                          {WP_MONTHS.map((m, i) => (
                            <label key={m} style={{ display: "flex", alignItems: "center", gap: 4,
                              padding: "4px 11px", borderRadius: 20, cursor: "pointer",
                              border: `1.5px solid ${newActivity[m] ? "#1f7a1f" : "#e5e7eb"}`,
                              background: newActivity[m] ? "#f0fdf4" : "#fff",
                              fontSize: 12, fontWeight: newActivity[m] ? 700 : 400,
                              color: newActivity[m] ? "#15803d" : "#374151", userSelect: "none" }}>
                              <input type="checkbox" checked={!!newActivity[m]} style={{ display: "none" }}
                                onChange={() => setNewActivity((p) => ({ ...p, [m]: !p[m] }))} />
                              {WP_MONTH_LABELS[i]}
                            </label>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => { setShowWpForm(false); setWpError(""); }}
                          style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                            background: "#fff", fontSize: 13, cursor: "pointer", color: "#374151" }}>
                          Cancel
                        </button>
                        <button type="button" onClick={handleAddActivity} disabled={savingWp}
                          style={{ padding: "7px 16px", borderRadius: 8, border: "none",
                            background: "#1f7a1f", color: "#fff", fontSize: 13, fontWeight: 600,
                            cursor: savingWp ? "not-allowed" : "pointer" }}>
                          {savingWp ? "Saving..." : "Add Activity"}
                        </button>
                      </div>
                    </div>
                  )}

                  {workPlanItems.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af",
                      border: "1px dashed #e5e7eb", borderRadius: 10 }}>
                      <ClipboardList size={36} style={{ marginBottom: 10 }} />
                      <p style={{ margin: 0, fontSize: 14 }}>No work plan activities yet.</p>
                      {canEdit && <p style={{ margin: "4px 0 0", fontSize: 12 }}>Click <strong>+ Add Activity</strong> to build your Gantt chart.</p>}
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      {/* ── Gantt Bar Chart ── */}
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 820 }}>
                        <thead>
                          <tr style={{ background: "#f9fafb" }}>
                            <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1.5px solid #e5e7eb",
                              fontWeight: 700, color: "#374151", minWidth: 180, width: 180 }}>Activity</th>
                            <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1.5px solid #e5e7eb",
                              fontWeight: 700, color: "#374151", minWidth: 80, width: 80 }}>Milestone</th>
                            <th style={{ padding: "10px 12px", textAlign: "left", borderBottom: "1.5px solid #e5e7eb",
                              fontWeight: 700, color: "#374151", width: "100%" }}>
                              {/* Month header ruler */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 0 }}>
                                {WP_MONTH_LABELS.map((m) => (
                                  <div key={m} style={{ textAlign: "center", fontSize: 11, fontWeight: 700,
                                    color: "#6b7280", padding: "0 2px" }}>{m}</div>
                                ))}
                              </div>
                            </th>
                            <th style={{ padding: "10px 12px", textAlign: "center", borderBottom: "1.5px solid #e5e7eb",
                              fontWeight: 700, color: "#374151", minWidth: 90 }}>Status</th>
                            {canEdit && (
                              <th style={{ padding: "10px 8px", textAlign: "center", borderBottom: "1.5px solid #e5e7eb",
                                fontWeight: 700, color: "#374151", width: 40 }}>Del</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {workPlanItems.map((item, i) => {
                            const statusColors = {
                              Completed:    { bg: "#dcfce7", color: "#15803d", bar: "#15803d" },
                              "In Progress":{ bg: "#dbeafe", color: "#1d4ed8", bar: "#1d4ed8" },
                              Pending:      { bg: "#f3f4f6", color: "#6b7280", bar: "#1f7a1f" },
                            };
                            const sc = statusColors[item.status] || statusColors.Pending;

                            // Build segments: consecutive checked months = one bar, gaps = empty space
                            const segments = WP_MONTHS.map((m) => !!item[m]);

                            return (
                              <tr key={item.id} style={{ borderBottom: "1px solid #f1f5f9",
                                background: i % 2 === 0 ? "#fff" : "#fafafa" }}>

                                {/* Activity name */}
                                <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111827",
                                  verticalAlign: "middle" }}>
                                  {item.title}
                                  {item.description && (
                                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6b7280",
                                      fontWeight: 400 }}>{item.description}</p>
                                  )}
                                </td>

                                {/* Milestone */}
                                <td style={{ padding: "10px 12px", color: "#374151",
                                  verticalAlign: "middle", fontSize: 11 }}>
                                  {item.milestone || "—"}
                                </td>

                                {/* Gantt bar column */}
                                <td style={{ padding: "8px 12px", verticalAlign: "middle" }}>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)",
                                    gap: 2, alignItems: "center", height: 28 }}>
                                    {segments.map((active, idx) => {
                                      const prevActive = idx > 0 && segments[idx - 1];
                                      const nextActive = idx < 11 && segments[idx + 1];
                                      const isFirst = active && !prevActive;
                                      const isLast  = active && !nextActive;
                                      const borderRadius = active
                                        ? `${isFirst ? "6px" : "0"} ${isLast ? "6px" : "0"} ${isLast ? "6px" : "0"} ${isFirst ? "6px" : "0"}`
                                        : "3px";
                                      return (
                                        <div key={idx} style={{
                                          height: active ? 22 : 6,
                                          borderRadius,
                                          background: active ? sc.bar : "#f1f5f9",
                                          opacity: active ? 1 : 0.6,
                                          transition: "all 0.15s",
                                          marginLeft: active && !prevActive ? 0 : active ? -2 : 0,
                                          marginRight: active && !nextActive ? 0 : active ? -2 : 0,
                                        }} />
                                      );
                                    })}
                                  </div>
                                </td>

                                {/* Status */}
                                <td style={{ padding: "10px 12px", textAlign: "center",
                                  verticalAlign: "middle" }}>
                                  <span style={{ display: "inline-block", padding: "3px 10px",
                                    borderRadius: 20, fontSize: 11, fontWeight: 600,
                                    background: sc.bg, color: sc.color }}>
                                    {item.status || "Pending"}
                                  </span>
                                </td>

                                {/* Delete */}
                                {canEdit && (
                                  <td style={{ padding: "10px 8px", textAlign: "center",
                                    verticalAlign: "middle" }}>
                                    <button type="button" onClick={() => handleDeleteActivity(item.id)}
                                      style={{ background: "none", border: "none", cursor: "pointer",
                                        color: "#dc2626", padding: 4, borderRadius: 4 }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = "#fef2f2"}
                                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            {activeTab === "Schedule" && (
              <div className="cp-section">
                <div className="cp-section-title">Oral Presentation Schedule</div>

                {!oralPresentation ? (
                  <EmptyState
                    icon={Calendar}
                    title="No oral presentation schedule yet"
                    subtitle="The status will remain submitted until admin schedules the date, time, venue, and evaluators."
                  />
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 14,
                    }}
                  >
                    <StatCard
                      icon={Calendar}
                      label="Presentation Date"
                      value={fmtDate(scheduleDate)}
                      iconColor="#1d4ed8"
                      bg="#dbeafe"
                    />

                    <StatCard
                      icon={Clock}
                      label="Presentation Time"
                      value={fmtTime(scheduleTime)}
                      iconColor="#7c3aed"
                      bg="#f5f3ff"
                    />

                    <StatCard
                      icon={MapPin}
                      label="Venue"
                      value={scheduleVenue || "—"}
                      iconColor="#15803d"
                      bg="#dcfce7"
                    />

                    <div
                      style={{
                        gridColumn: "1 / -1",
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 14,
                        padding: 18,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <ClipboardList size={17} color="#1f7a1f" />
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 850, color: "#111827" }}>
                          Schedule Summary
                        </p>
                      </div>

                      <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                        Your oral presentation is scheduled for{" "}
                        <strong>{fmtDate(scheduleDate)}</strong> at{" "}
                        <strong>{fmtTime(scheduleTime)}</strong>
                        {scheduleVenue ? (
                          <>
                            {" "}
                            in <strong>{scheduleVenue}</strong>.
                          </>
                        ) : (
                          "."
                        )}{" "}
                        Assigned evaluators are listed in the Evaluators tab.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDoc && (
        <DocModal
          doc={selectedDoc}
          files={selectedFiles}
          onClose={() => {
            setSelectedDoc(null);
            setSelectedFiles([]);
          }}
        />
      )}
    </>
  );
}