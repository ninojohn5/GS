import { useState, useRef, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Upload,
  Check,
  Plus,
  Trash2,
  Send,
  X,
  CheckCircle2,
  ChevronDown,
  AlertCircle,
  Save,
  FileCheck,
  Pen,
  RotateCcw,
  FileText,
  BookOpen,
  Users,
  Printer,
  Crown,
  Star,
  User2,
  ChevronUp,
} from "lucide-react";
import Navbar from "../../components/researcher/Navbar";
import Topbar from "../../components/Topbar";
import "../../styles/researcher.css";
import api from "../../utils/api";

const TABS = ["Overview", "Work Plan", "Framework", "References", "Review"];

const PROPONENT_ROLES = [
  {
    value: "leader",
    label: "Leader",
    color: "#92400e",
    bg: "#fffbeb",
    border: "#fcd34d",
    Icon: Crown,
  },
  {
    value: "co-leader",
    label: "Co-Leader",
    color: "#5b21b6",
    bg: "#f5f3ff",
    border: "#c4b5fd",
    Icon: Star,
  },
  {
    value: "member",
    label: "Member",
    color: "#1e40af",
    bg: "#eff6ff",
    border: "#bfdbfe",
    Icon: User2,
  },
];

const getRoleStyle = (role) =>
  PROPONENT_ROLES.find((r) => r.value === role) || PROPONENT_ROLES[2];

const EMPTY_FORM = {
  title: "",
  scholarly_work_type: "Research",
  category: "",
  lead_agency: "",
  site_area: "",
  total_budget: "",
  funding_type: "local",
  funding_agency: "",
  external_amount: "",
  start_date: "",
  end_date: "",
  proponents: [],
  signatures: {},
  similar_work_elsewhere: false,
  similar_work_details: "",
  is_first_time: true,
  past_works: [],
  has_external_collab: false,
  external_collab_details: "",
  submitted_elsewhere: false,
  other_agency_name: "",
  other_agency_amount: "",
  agency_difference_extent: "",
  cv_files: [],
  proposal_form: null,
};

const normalizeJsonObject = (value) => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};

const normalizeJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const normalizeIdArray = (value) => {
  return normalizeJsonArray(value)
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return Number(item.id || item.personnel_id || item.evaluator_id);
      }

      return Number(item);
    })
    .filter((id) => Number.isFinite(id));
};

const pickRandomEvaluators = (list, count = 3) => {
  const safeList = Array.isArray(list) ? list : [];

  return [...safeList]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};

function RoleBadge({ role, small }) {
  const rs = getRoleStyle(role);
  const { Icon } = rs;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: small ? 10 : 11,
        fontWeight: 700,
        padding: small ? "1px 7px" : "2px 9px",
        borderRadius: 20,
        color: rs.color,
        background: rs.bg,
        border: `1.5px solid ${rs.border}`,
      }}
    >
      <Icon size={small ? 9 : 10} strokeWidth={2.5} /> {rs.label}
    </span>
  );
}

function FieldLabel({ label }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: "#fff",
        background: "#94a3b8",
        padding: "1px 6px",
        borderRadius: 4,
        minWidth: 32,
        textAlign: "center",
        letterSpacing: "0.04em",
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

function DetailChip({ label, value }) {
  if (!value) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 9px",
        borderRadius: 999,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        fontSize: 12,
        color: "#334155",
        lineHeight: 1,
        maxWidth: "100%",
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontWeight: 600,
          color: "#0f172a",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function ProponentDetails({ department, program, position }) {
  const hasDetails = department || program || position;

  if (!hasDetails) {
    return (
      <p
        style={{
          margin: "4px 0 0",
          fontSize: 12,
          color: "#94a3b8",
          fontStyle: "italic",
        }}
      >
        No profile details added
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        flexWrap: "wrap",
        marginTop: 7,
      }}
    >
      <DetailChip label="Department" value={department} />
      <DetailChip label="Program" value={program} />
      <DetailChip label="Position" value={position} />
    </div>
  );
}

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null);
  const lastPos = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [tab, setTab] = useState("draw");
  const fileRef = useRef(null);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * sx,
        y: (e.touches[0].clientY - rect.top) * sy,
      };
    }

    return {
      x: (e.clientX - rect.left) * sx,
      y: (e.clientY - rect.top) * sy,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    if (!drawing) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPos.current = pos;
    setHasDrawn(true);
    onChange(canvas.toDataURL("image/png"));
  };

  const stopDraw = () => setDrawing(false);

  const clear = () => {
    canvasRef.current?.getContext("2d").clearRect(0, 0, 560, 120);
    setHasDrawn(false);
    onChange(null);
  };

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: "1.5px solid #e2e8f0",
        background: "#fff",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {["draw", "upload"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              padding: "9px 0",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: tab === t ? 700 : 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: tab === t ? "#fff" : "#f8fafc",
              color: tab === t ? "#1f7a1f" : "#94a3b8",
              borderBottom:
                tab === t ? "2px solid #1f7a1f" : "2px solid #f1f5f9",
              transition: "all 0.15s",
            }}
          >
            {t === "draw" ? <Pen size={12} /> : <Upload size={12} />}
            {t === "draw" ? "Draw Signature" : "Upload Image"}
          </button>
        ))}
      </div>

      {tab === "draw" && (
        <>
          <canvas
            ref={canvasRef}
            width={560}
            height={120}
            style={{
              display: "block",
              width: "100%",
              cursor: "crosshair",
              background:
                "repeating-linear-gradient(0deg,transparent,transparent 29px,#f1f5f9 30px)",
              touchAction: "none",
            }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "7px 12px",
              borderTop: "1px solid #f1f5f9",
              background: "#fafafa",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontStyle: "italic",
              }}
            >
              {hasDrawn || value
                ? "Signature captured"
                : "Sign with your mouse or touch above"}
            </span>

            {(hasDrawn || value) && (
              <button
                type="button"
                onClick={clear}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "#ef4444",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <RotateCcw size={11} /> Clear
              </button>
            )}
          </div>
        </>
      )}

      {tab === "upload" && (
        <div style={{ padding: 16 }}>
          <div className="cp-file-row">
            <button
              type="button"
              className="cp-file-btn"
              onClick={() => fileRef.current.click()}
            >
              Choose File
            </button>

            <span className="cp-file-name">
              {value ? "Signature uploaded" : "No file chosen"}
            </span>

            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (ev) => onChange(ev.target.result);
                reader.readAsDataURL(file);
              }}
            />
          </div>

          {value && (
            <img
              src={value}
              alt="sig"
              style={{
                maxHeight: 60,
                marginTop: 10,
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                padding: 4,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function QCheckbox({ name, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
      {[true, false].map((v) => (
        <label
          key={String(v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: value === v ? 600 : 400,
            color: "#374151",
          }}
        >
          <div
            style={{
              width: 17,
              height: 17,
              borderRadius: 4,
              flexShrink: 0,
              border: `2px solid ${value === v ? "#1f7a1f" : "#d1d5db"}`,
              background: value === v ? "#1f7a1f" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {value === v && <Check size={10} color="#fff" strokeWidth={3} />}
          </div>

          <input
            type="radio"
            name={name}
            style={{ display: "none" }}
            checked={value === v}
            onChange={() => onChange(v)}
          />

          {v ? "Yes" : "No"}
        </label>
      ))}
    </div>
  );
}

function ExistingFileNote({ label, path }) {
  if (!path) return null;

  return (
    <div
      style={{
        marginTop: 6,
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#15803d",
      }}
    >
      <FileCheck size={13} /> Existing {label} already uploaded
    </div>
  );
}

function ProponentCard({ p, form, setForm, isOnlySigned }) {
  const [sigOpen, setSigOpen] = useState(false);
  const rs = getRoleStyle(p.proponent_role || "member");
  const hasSig = !!form.signatures?.[String(p.id)];

  const leaderTaken = (form.proponents || []).some(
    (x) => x.proponent_role === "leader" && String(x.id) !== String(p.id)
  );

  const coLeaderTaken = (form.proponents || []).some(
    (x) => x.proponent_role === "co-leader" && String(x.id) !== String(p.id)
  );

  const handleRoleChange = (newRole) => {
    setForm((f) => ({
      ...f,
      proponents: f.proponents.map((x) =>
        String(x.id) === String(p.id) ? { ...x, proponent_role: newRole } : x
      ),
    }));
  };

  const handleRemove = (e) => {
    e.stopPropagation();
  
    setForm((f) => {
      const sigs = { ...(f.signatures || {}) };
      delete sigs[String(p.id)];
  
      return {
        ...f,
        proponents: f.proponents.filter((x) => String(x.id) !== String(p.id)),
        signatures: sigs,
      };
    });
  };

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: `1.5px solid ${hasSig ? "#86efac" : rs.border}`,
        background: "#fff",
        boxShadow: hasSig
          ? "0 0 0 3px #dcfce7"
          : "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow 0.2s, border-color 0.2s",
      }}
    >
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${rs.color}, ${rs.color}88)`,
        }}
      />

      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            flexShrink: 0,
            background: `${rs.color}18`,
            color: rs.color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 17,
            border: `1.5px solid ${rs.color}30`,
          }}
        >
          {p.name?.charAt(0)?.toUpperCase()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              {p.name}
            </span>

            <RoleBadge role={p.proponent_role || "member"} />

            {hasSig && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#15803d",
                  background: "#f0fdf4",
                  border: "1px solid #86efac",
                  padding: "1px 8px",
                  borderRadius: 20,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Pen size={9} strokeWidth={2.5} /> Signed
              </span>
            )}
          </div>

          <ProponentDetails
            department={p.department}
            program={p.program}
            position={p.position}
          />
        </div>

        <button
              type="button"
              onClick={(e) => handleRemove(e)}
              title="Remove proponent"
              style={{
                flexShrink: 0,
                width: 30,
                height: 30,
                borderRadius: 8,
                border: "1.5px solid #fecaca",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              ×
            </button>
      </div>

      <div
        style={{
          padding: "10px 16px",
          background: "#f8fafc",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginRight: 4,
          }}
        >
          Team Role
        </span>

        {PROPONENT_ROLES.map((r) => {
          const active = (p.proponent_role || "member") === r.value;
          const disabled =
            (r.value === "leader" && leaderTaken) ||
            (r.value === "co-leader" && coLeaderTaken);
          const { Icon: RIcon } = r;

          return (
            <button
              key={r.value}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && handleRoleChange(r.value)}
              title={
                disabled ? `${r.label} already assigned` : `Set as ${r.label}`
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 11px",
                borderRadius: 20,
                border: "1.5px solid",
                borderColor: active ? r.color : "#e2e8f0",
                background: active ? r.bg : "#fff",
                color: active ? r.color : disabled ? "#d1d5db" : "#64748b",
                fontWeight: active ? 700 : 500,
                fontSize: 12,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.45 : 1,
                transition: "all 0.15s",
              }}
            >
              <RIcon size={11} strokeWidth={2.5} /> {r.label}
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: "1px solid #f1f5f9" }}>
        <button
          type="button"
          onClick={() => setSigOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            border: "none",
            cursor: "pointer",
            background: hasSig ? "#f0fdf4" : "#fafafa",
            transition: "background 0.15s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <Pen size={13} color={hasSig ? "#15803d" : "#64748b"} />

            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: hasSig ? "#15803d" : "#475569",
              }}
            >
              {hasSig ? "Signature attached" : "Click card to sign"}
            </span>

            {isOnlySigned && hasSig && (
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  fontStyle: "italic",
                }}
              >
                (representative signer)
              </span>
            )}
          </div>

          {sigOpen ? (
            <ChevronUp size={14} color="#94a3b8" />
          ) : (
            <ChevronDown size={14} color="#94a3b8" />
          )}
        </button>

        {sigOpen && (
          <div style={{ padding: "14px 16px 16px", background: "#fff" }}>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 12,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Only one proponent needs to sign. This signature will represent the team.
            </p>

            <SignaturePad
              value={form.signatures?.[String(p.id)] || null}
              onChange={(sig) =>
                setForm((f) => ({
                  ...f,
                  signatures: {
                    ...(f.signatures || {}),
                    [String(p.id)]: sig,
                  },
                }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({
  form,
  setForm,
  preferredEvaluators,
  setPreferredEvaluators,
  proponentsList,
  evaluatorsList,
  existingFiles,
  canAutoAssignEvaluators,
}) {
  useEffect(() => {
    if (!canAutoAssignEvaluators) return;
    if (preferredEvaluators.length > 0) return;
    if (!Array.isArray(evaluatorsList) || evaluatorsList.length === 0) return;

    const randomThree = pickRandomEvaluators(evaluatorsList, 3);
    setPreferredEvaluators(randomThree);
  }, [
    canAutoAssignEvaluators,
    evaluatorsList,
    preferredEvaluators.length,
    setPreferredEvaluators,
  ]);

  const signedCount = (form.proponents || []).filter(
    (p) => !!form.signatures?.[String(p.id)]
  ).length;

  const leaderTaken = (form.proponents || []).some(
    (p) => p.proponent_role === "leader"
  );

  const handleAddProponent = (pid) => {
    if (!pid) return;
    if (form.proponents.some((p) => String(p.id) === pid)) return;

    const found = proponentsList.find((p) => String(p.id) === pid);
    if (!found) return;

    const defaultRole = !leaderTaken ? "leader" : "member";

    setForm((f) => ({
      ...f,
      proponents: [...f.proponents, { ...found, proponent_role: defaultRole }],
      signatures: {
        ...(f.signatures || {}),
        [String(found.id)]: f.signatures?.[String(found.id)] || null,
      },
    }));
  };

  return (
    <>
      <div className="cp-section">
        <div className="cp-section-title">Basic Information</div>

        <div className="cp-field">
          <label className="cp-label">Title of the Scholarly Work *</label>
          <input
            className="cp-input"
            type="text"
            placeholder="Enter the full title of your research or project"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div className="cp-field" style={{ marginTop: 14 }}>
          <label className="cp-label">Type of Scholarly Work *</label>

          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}
          >
            {["Research", "Extension"].map(
              (type) => (
                <label
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 9,
                    cursor: "pointer",
                    border: `1.5px solid ${
                      form.scholarly_work_type === type ? "#1f7a1f" : "#e5e7eb"
                    }`,
                    background:
                      form.scholarly_work_type === type ? "#f0fdf4" : "#fff",
                    fontSize: 13,
                    fontWeight: form.scholarly_work_type === type ? 600 : 400,
                    color:
                      form.scholarly_work_type === type ? "#15803d" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="scholarly_work_type"
                    style={{ display: "none" }}
                    checked={form.scholarly_work_type === type}
                    onChange={() =>
                      setForm({ ...form, scholarly_work_type: type })
                    }
                  />

                  {form.scholarly_work_type === type && (
                    <Check size={13} color="#15803d" />
                  )}

                  {type}
                </label>
              )
            )}
          </div>
        </div>

        <div className="cp-grid-2" style={{ marginTop: 14 }}>
          <div className="cp-field">
            <label className="cp-label">Category</label>
            <select
              className="cp-input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="">— Select Category —</option>
              <option value="Basic Research">Basic Research</option>
              <option value="Applied Research">Applied Research</option>
              <option value="Developmental Research">Developmental Research</option>
              <option value="Action Research">Action Research</option>
            </select>
          </div>

          <div className="cp-field">
            <label className="cp-label">Lead Agency</label>
            <input
              className="cp-input"
              type="text"
              placeholder="e.g. Caraga State University"
              value={form.lead_agency}
              onChange={(e) => setForm({ ...form, lead_agency: e.target.value })}
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">Site / Area</label>
            <input
              className="cp-input"
              type="text"
              placeholder="e.g. Main Campus"
              value={form.site_area}
              onChange={(e) => setForm({ ...form, site_area: e.target.value })}
            />
          </div>

          <div />
        </div>

        {/* Row 1: Budget + Funding Type */}
        <div className="cp-grid-2" style={{ marginTop: 14 }}>
          <div className="cp-field">
            <label className="cp-label">Total Proposed Budget *</label>
            <input
              className="cp-input"
              type="text"
              placeholder="e.g. ₱250,000 or To be determined"
              value={form.total_budget}
              onChange={(e) => setForm({ ...form, total_budget: e.target.value })}
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">Funding Type *</label>
            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              {[
                { value: "local",    label: "Locally Funded" },
                { value: "external", label: "Externally Funded" },
              ].map((ft) => (
                <label
                  key={ft.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 16px", borderRadius: 9, cursor: "pointer",
                    border: `1.5px solid ${form.funding_type === ft.value ? "#1f7a1f" : "#e5e7eb"}`,
                    background: form.funding_type === ft.value ? "#f0fdf4" : "#fff",
                    fontSize: 13,
                    fontWeight: form.funding_type === ft.value ? 600 : 400,
                    color: form.funding_type === ft.value ? "#15803d" : "#374151",
                    transition: "all 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="funding_type"
                    style={{ display: "none" }}
                    checked={form.funding_type === ft.value}
                    onChange={() => setForm({ ...form, funding_type: ft.value, funding_agency: "", external_amount: "" })}
                  />
                  {form.funding_type === ft.value && <Check size={13} color="#15803d" />}
                  {ft.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Agency + Amount — only when External */}
        {form.funding_type === "external" && (
          <div className="cp-grid-2" style={{ marginTop: 12 }}>
            <div className="cp-field">
              <label className="cp-label">Funding Agency *</label>
              <input
                className="cp-input"
                type="text"
                placeholder="e.g. DOST, CHED"
                value={form.funding_agency}
                onChange={(e) => setForm({ ...form, funding_agency: e.target.value })}
              />
            </div>
            <div className="cp-field">
              <label className="cp-label">Amount from Agency</label>
              <input
                className="cp-input"
                type="text"
                placeholder="e.g. ₱500,000"
                value={form.external_amount}
                onChange={(e) => setForm({ ...form, external_amount: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Row 3: Start + End Date */}
        <div className="cp-grid-2" style={{ marginTop: 12 }}>
          <div className="cp-field">
            <label className="cp-label">Proposed Starting Date *</label>
            <input
              className="cp-input"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          <div className="cp-field">
            <label className="cp-label">Proposed Completion Date *</label>
            <input
              className="cp-input"
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="cp-field" style={{ marginTop: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <div>
              <label className="cp-label" style={{ margin: 0 }}>
                Research Team *
              </label>

              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>
                Add proponents and assign their role. Only one signature is
                required.
              </p>
            </div>

            {form.proponents.length > 0 && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: signedCount >= 1 ? 700 : 400,
                  color: signedCount >= 1 ? "#15803d" : "#94a3b8",
                  flexShrink: 0,
                }}
              >
                <Pen size={12} /> {signedCount}/{form.proponents.length} signed
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 14,
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px solid #f1f5f9",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                fontWeight: 700,
                marginRight: 4,
                alignSelf: "center",
              }}
            >
              ROLES:
            </span>

            {PROPONENT_ROLES.map((r) => {
              const { Icon } = r;

              return (
                <span
                  key={r.value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 9px",
                    borderRadius: 20,
                    color: r.color,
                    background: r.bg,
                    border: `1.5px solid ${r.border}`,
                  }}
                >
                  <Icon size={10} strokeWidth={2.5} /> {r.label}
                </span>
              );
            })}

            <span
              style={{
                fontSize: 11,
                color: "#94a3b8",
                alignSelf: "center",
                marginLeft: 2,
              }}
            >
              one Leader required
            </span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div className="cp-select-wrap">
              <select
                className="cp-select"
                value=""
                onChange={(e) => {
                  handleAddProponent(e.target.value);
                  e.target.value = "";
                }}
                style={{
                  borderRadius: 10,
                  borderColor: "#e2e8f0",
                  fontSize: 13,
                }}
              >
                <option value="">＋ Add a proponent to the team…</option>

                {proponentsList
                  .filter(
                    (p) =>
                      !form.proponents.some(
                        (added) => String(added.id) === String(p.id)
                      )
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.department ? ` — ${p.department}` : ""}
                    </option>
                  ))}
              </select>

              <span className="cp-select-chevron">
                <ChevronDown size={14} />
              </span>
            </div>
          </div>

          {proponentsList.length === 0 && (
            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                borderRadius: 10,
                padding: "10px 14px",
                color: "#9a3412",
                fontSize: 12,
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              No proponents available. Add faculty accounts in the admin Faculty
              page first.
            </div>
          )}

          {form.proponents.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 20px",
                background: "#f8fafc",
                borderRadius: 12,
                border: "1.5px dashed #e2e8f0",
              }}
            >
              <Users size={28} color="#cbd5e1" style={{ marginBottom: 8 }} />

              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "#94a3b8",
                  fontWeight: 500,
                }}
              >
                No proponents added yet
              </p>

              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#cbd5e1" }}>
                Use the dropdown above to add team members
              </p>
            </div>
          ) : (
            <>
              {signedCount === 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: "10px 14px",
                    background: "#fefce8",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    marginBottom: 12,
                    fontSize: 12,
                    color: "#92400e",
                  }}
                >
                  <AlertCircle
                    size={14}
                    style={{ flexShrink: 0, marginTop: 1 }}
                  />
                  <span>
                    One proponent must attach a signature before submitting.
                    Click <strong>"Attach signature"</strong> on any card below.
                  </span>
                </div>
              )}

              {signedCount >= 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    border: "1px solid #86efac",
                    borderRadius: 10,
                    marginBottom: 12,
                    fontSize: 12,
                    color: "#15803d",
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={14} /> Signature requirement met.
                  Proposal can be submitted.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {form.proponents.map((p) => (
                  <ProponentCard
                    key={p.id}
                    p={p}
                    form={form}
                    setForm={setForm}
                    isOnlySigned={
                      signedCount === 1 && !!form.signatures?.[String(p.id)]
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="cp-section">
        <div className="cp-section-title">Additional Information</div>

        <div className="cp-q-block">
          <p className="cp-q-text">
            Is similar work being carried out elsewhere? If yes, please give
            details.
          </p>

          <QCheckbox
            name="similar_elsewhere"
            value={form.similar_work_elsewhere}
            onChange={(v) =>
              setForm({
                ...form,
                similar_work_elsewhere: v,
                similar_work_details: v ? form.similar_work_details : "",
              })
            }
          />

          {form.similar_work_elsewhere && (
            <div className="cp-cond-box" style={{ marginTop: 10 }}>
              <textarea
                className="cp-textarea"
                placeholder="Please give details..."
                value={form.similar_work_details}
                onChange={(e) =>
                  setForm({ ...form, similar_work_details: e.target.value })
                }
              />
            </div>
          )}
        </div>

        <div className="cp-q-block">
          <p className="cp-q-text">
            Are there any external groups or individuals, aside from the
            proponent(s), collaborating in this work?
          </p>

          <QCheckbox
            name="collab"
            value={form.has_external_collab}
            onChange={(v) =>
              setForm({
                ...form,
                has_external_collab: v,
                external_collab_details: v ? form.external_collab_details : "",
              })
            }
          />

          {form.has_external_collab && (
            <div className="cp-cond-box" style={{ marginTop: 10 }}>
              <textarea
                className="cp-textarea"
                placeholder="Please specify collaborators..."
                value={form.external_collab_details}
                onChange={(e) =>
                  setForm({ ...form, external_collab_details: e.target.value })
                }
              />
            </div>
          )}
        </div>

        <div className="cp-q-block">
          <p className="cp-q-text">
            Has this proposal been submitted to another agency for support?
          </p>

          <QCheckbox
            name="elsewhere"
            value={form.submitted_elsewhere}
            onChange={(v) =>
              setForm({
                ...form,
                submitted_elsewhere: v,
                other_agency_name: v ? form.other_agency_name : "",
                other_agency_amount: v ? form.other_agency_amount : "",
                agency_difference_extent: v
                  ? form.agency_difference_extent
                  : "",
              })
            }
          />

          {form.submitted_elsewhere && (
            <div className="cp-cond-box" style={{ marginTop: 10 }}>
              <div className="cp-detail-grid">
                <div>
                  <div className="cp-col-label">Agency Name</div>
                  <input
                    className="cp-input"
                    type="text"
                    placeholder="Agency name"
                    value={form.other_agency_name}
                    onChange={(e) =>
                      setForm({ ...form, other_agency_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <div className="cp-col-label">Amount Requested (₱)</div>
                  <input
                    className="cp-input"
                    type="number"
                    placeholder="Amount"
                    value={form.other_agency_amount}
                    onChange={(e) =>
                      setForm({ ...form, other_agency_amount: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  To what extent is the proposed project different?
                </p>

                <textarea
                  className="cp-textarea"
                  placeholder="Describe how this proposal differs..."
                  value={form.agency_difference_extent}
                  style={{ minHeight: 90 }}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      agency_difference_extent: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        <div className="cp-q-block">
          <p className="cp-q-text">
            Is this your first time to apply for the proposed scholarly work?
          </p>

          <QCheckbox
            name="first_time"
            value={form.is_first_time}
            onChange={(v) =>
              setForm({
                ...form,
                is_first_time: v,
                past_works: v ? [] : form.past_works,
              })
            }
          />

          {!form.is_first_time && (
            <div style={{ marginTop: 14 }}>
              <p
                style={{
                  margin: "0 0 10px",
                  fontSize: 13,
                  color: "#374151",
                  fontStyle: "italic",
                }}
              >
                List past works within three years:
              </p>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f9fafb",
                        borderBottom: "1px solid #e5e7eb",
                      }}
                    >
                      {[
                        "Title(s)",
                        "Duration",
                        "Budget Amount (₱)",
                        "Status",
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "10px 12px",
                            textAlign: "left",
                            fontWeight: 600,
                            fontSize: 12,
                            color: "#6b7280",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {(form.past_works || []).length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "18px 12px",
                            textAlign: "center",
                            color: "#9ca3af",
                            fontSize: 12,
                            fontStyle: "italic",
                          }}
                        >
                          No past works added yet.
                        </td>
                      </tr>
                    )}

                    {(form.past_works || []).map((pw, i) => (
                      <tr
                        key={pw.id || i}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "6px 8px" }}>
                          <input
                            className="cp-input"
                            style={{ width: "100%", minWidth: 140 }}
                            placeholder="Title"
                            value={pw.title}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                past_works: f.past_works.map((r, idx) =>
                                  idx === i
                                    ? { ...r, title: e.target.value }
                                    : r
                                ),
                              }))
                            }
                          />
                        </td>

                        <td style={{ padding: "6px 8px" }}>
                          <input
                            className="cp-input"
                            style={{ width: 120 }}
                            placeholder="e.g. 2022-2023"
                            value={pw.duration}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                past_works: f.past_works.map((r, idx) =>
                                  idx === i
                                    ? { ...r, duration: e.target.value }
                                    : r
                                ),
                              }))
                            }
                          />
                        </td>

                        <td style={{ padding: "6px 8px" }}>
                          <input
                            className="cp-input"
                            type="number"
                            style={{ width: 120 }}
                            placeholder="0"
                            value={pw.budget}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                past_works: f.past_works.map((r, idx) =>
                                  idx === i
                                    ? { ...r, budget: e.target.value }
                                    : r
                                ),
                              }))
                            }
                          />
                        </td>

                        <td style={{ padding: "6px 8px" }}>
                          <select
                            className="cp-input"
                            style={{ width: 130 }}
                            value={pw.status}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                past_works: f.past_works.map((r, idx) =>
                                  idx === i
                                    ? { ...r, status: e.target.value }
                                    : r
                                ),
                              }))
                            }
                          >
                            <option value="">Select</option>
                            <option>Completed</option>
                            <option>Ongoing</option>
                            <option>Terminated</option>
                          </select>
                        </td>

                        <td style={{ padding: "6px 8px", textAlign: "center" }}>
                          <button
                            type="button"
                            className="cp-delete-btn"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                past_works: f.past_works.filter(
                                  (_, idx) => idx !== i
                                ),
                              }))
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div
                  style={{
                    padding: "10px 12px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#1f7a1f",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        past_works: [
                          ...(f.past_works || []),
                          {
                            id: Date.now(),
                            title: "",
                            duration: "",
                            budget: "",
                            status: "",
                          },
                        ],
                      }))
                    }
                  >
                    <Plus size={14} /> Add Row
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="cp-section">
        <div className="cp-section-title">Required Documents</div>

        <div className="cp-field">
          <label className="cp-label">Curriculum Vitae of Proponents *</label>
          <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 10px" }}>
            Upload one CV per proponent.{" "}
            {form.proponents?.length > 0 && (
              <span style={{ fontWeight: 700, color: (form.cv_files?.length || 0) === form.proponents.length ? "#15803d" : "#d97706" }}>
                {form.cv_files?.length || 0} / {form.proponents.length} uploaded
              </span>
            )}
          </p>

          {/* List of added CVs with individual delete */}
          {(form.cv_files?.length || 0) > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {Array.from(form.cv_files).map((file, i) => (
                <div key={`${file.name}-${i}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13 }}>
                  <FileCheck size={14} color="#15803d" />
                  <span style={{ flex: 1, color: "#111827", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = Array.from(form.cv_files).filter((_, idx) => idx !== i);
                      setForm((f) => ({ ...f, cv_files: updated }));
                    }}
                    title="Remove this CV"
                    style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", color: "#dc2626", padding: "2px 7px", flexShrink: 0, display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600 }}
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {existingFiles.cv_files && (form.cv_files?.length || 0) === 0 && (
            <div style={{ padding: "7px 12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, fontSize: 13, color: "#15803d", marginBottom: 10 }}>
              ✓ Previously uploaded CV file(s)
            </div>
          )}

          {/* Under count warning */}
          {form.proponents?.length > 0 && (form.cv_files?.length || 0) > 0 && (form.cv_files?.length || 0) < form.proponents.length && (
            <div style={{ padding: "8px 12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 8, fontSize: 13, color: "#92400e", marginBottom: 10 }}>
              ⚠ Missing {form.proponents.length - form.cv_files.length} CV(s). Please make sure the number of CVs matches the number of proponents ({form.proponents.length}).
            </div>
          )}

          {/* Over count error */}
          {form.proponents?.length > 0 && (form.cv_files?.length || 0) > form.proponents.length && (
            <div style={{ padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: 13, color: "#dc2626", marginBottom: 10 }}>
              ✗ Too many CVs uploaded ({form.cv_files.length} files for {form.proponents.length} proponent(s)). Please remove the extra CV(s).
            </div>
          )}

          {/* Single button — supports both single and multiple selection */}
          <button type="button" className="cp-file-btn"
            onClick={() => document.getElementById("cv-upload-input").click()}>
            <Plus size={13} /> Add CV(s)
          </button>
          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 5 }}>
            Click to add. Hold <strong>Ctrl</strong> (or <strong>Cmd</strong>) to select multiple at once.
          </p>

          <input id="cv-upload-input" type="file" multiple accept=".pdf,.doc,.docx" style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files);
              if (files.length) setForm((f) => ({ ...f, cv_files: [...Array.from(f.cv_files || []), ...files] }));
              e.target.value = "";
            }}
          />
        </div>

        <div className="cp-field" style={{ marginTop: 14 }}>
          <label className="cp-label">Project Proposal Form *</label>

          <div className="cp-file-row">
            <button
              type="button"
              className="cp-file-btn"
              onClick={() =>
                document.getElementById("proposal-form-upload").click()
              }
            >
              Choose File
            </button>

            <span className="cp-file-name">
              {form.proposal_form?.name ??
                (existingFiles.proposal_form
                  ? "Existing proposal form uploaded"
                  : "No file chosen")}
            </span>

            <button
              type="button"
              className="cp-file-upload-icon"
              onClick={() =>
                document.getElementById("proposal-form-upload").click()
              }
            >
              <Upload size={16} color="#6b7280" />
            </button>

            <input
              id="proposal-form-upload"
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) =>
                setForm({
                  ...form,
                  proposal_form: e.target.files[0] || null,
                })
              }
            />
          </div>

          {form.proposal_form && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 6,
                fontSize: 12,
                color: "#15803d",
              }}
            >
              <FileCheck size={13} /> {form.proposal_form.name}
            </div>
          )}

          <ExistingFileNote
            label="proposal form"
            path={existingFiles.proposal_form}
          />
        </div>
      </div>

      <div className="cp-section">
        <div className="cp-section-title">Evaluator Assignment</div>

        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748b" }}>
          Three evaluators are randomly assigned by the system. Researchers can
          only view the assigned evaluators. Only the admin can change or remove
          evaluator assignments.
        </p>

        <div className="ev-evaluator-list">
          {preferredEvaluators.length === 0 ? (
            <div
              style={{
                padding: "18px",
                border: "1px dashed #d1d5db",
                borderRadius: 10,
                color: "#9ca3af",
                fontSize: 13,
                textAlign: "center",
                background: "#fafafa",
              }}
            >
              No evaluators assigned yet. The system will assign three
              evaluators once evaluator accounts are available.
            </div>
          ) : (
            preferredEvaluators.slice(0, 3).map((ev, index) => (
              <div key={ev.id} className="ev-evaluator-card preferred">
                <div
                  className="ev-evaluator-avatar"
                  style={{ background: "#f5f3ff", color: "#7c3aed" }}
                >
                  {ev.name?.charAt(0) || "E"}
                </div>

                <div className="ev-evaluator-info">
                  <p className="ev-evaluator-name">{ev.name}</p>

                  <p className="ev-evaluator-pos">
                    {ev.position || "Evaluator"} -{" "}
                    {ev.department || ev.program || "No department"}
                  </p>

                  <p className="ev-evaluator-exp">
                    {ev.expertise || "No expertise listed"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  <span className="ev-preferred-badge">
                    Assigned {index + 1}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function WorkPlanTab({ file, setFile, existingFile }) {
  const ref = useRef(null);

  return (
    <div className="cp-section">
      <div className="cp-section-title">Work Plan</div>

      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
        Upload your detailed work plan document.
      </p>

      <div className="cp-field">
        <label className="cp-label">Work Plan Document *</label>

        <div className="cp-file-row">
          <button
            type="button"
            className="cp-file-btn"
            onClick={() => ref.current.click()}
          >
            Choose File
          </button>

          <span className="cp-file-name">
            {file?.name ??
              (existingFile ? "Existing work plan uploaded" : "No file chosen")}
          </span>

          <button
            type="button"
            className="cp-file-upload-icon"
            onClick={() => ref.current.click()}
          >
            <Upload size={16} color="#6b7280" />
          </button>

          <input
            ref={ref}
            type="file"
            accept=".pdf,.doc,.docx,.xlsx"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </div>

        {file && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              fontSize: 12,
              color: "#15803d",
            }}
          >
            <FileCheck size={13} /> {file.name}
          </div>
        )}

        <ExistingFileNote label="work plan" path={existingFile} />
      </div>
    </div>
  );
}

function UploadTab({
  title,
  subtitle,
  fieldLabel,
  note,
  accept,
  file,
  setFile,
  existingFile,
}) {
  const ref = useRef(null);

  return (
    <div className="cp-section">
      <div className="cp-section-title">{title}</div>

      <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 20px" }}>
        {subtitle}
      </p>

      <div className="cp-field">
        <label className="cp-label">{fieldLabel} *</label>

        <div className="cp-file-row">
          <button
            type="button"
            className="cp-file-btn"
            onClick={() => ref.current.click()}
          >
            Choose File
          </button>

          <span className="cp-file-name">
            {file?.name ??
              (existingFile
                ? `Existing ${title.toLowerCase()} uploaded`
                : "No file chosen")}
          </span>

          <button
            type="button"
            className="cp-file-upload-icon"
            onClick={() => ref.current.click()}
          >
            <Upload size={16} color="#6b7280" />
          </button>

          <input
            ref={ref}
            type="file"
            accept={accept}
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
        </div>

        {file && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 6,
              fontSize: 12,
              color: "#15803d",
            }}
          >
            <FileCheck size={13} /> {file.name}
          </div>
        )}

        <ExistingFileNote label={title.toLowerCase()} path={existingFile} />
      </div>

      {note && (
        <div className="cp-note-box">
          <strong>Note:</strong> {note}
        </div>
      )}
    </div>
  );
}

function OutputsTab({
  form,
  workPlanFile,
  frameworkFile,
  referencesFile,
  existingFiles,
}) {
  const handlePrint = () => {
    const fmtDate = (d) =>
      d
        ? new Date(d).toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—";

    const today = new Date().toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const fileRows = [
      {
        label: "Project Proposal Form",
        file: form.proposal_form,
        existing: existingFiles.proposal_form,
      },
      {
        label: "Curriculum Vitae",
        file: form.cv_files?.[0],
        existing: existingFiles.cv_files,
      },
      {
        label: "Work Plan",
        file: workPlanFile,
        existing: existingFiles.work_plan_file,
      },
      {
        label: "Project Framework",
        file: frameworkFile,
        existing: existingFiles.framework_file,
      },
      {
        label: "References",
        file: referencesFile,
        existing: existingFiles.references_file,
      },
    ];

    const roleLabel = (r) =>
      ({ leader: "Leader", "co-leader": "Co-Leader", member: "Member" }[r] ||
        "Member");

    const roleColor = (r) =>
      ({ leader: "#92400e", "co-leader": "#5b21b6", member: "#1e40af" }[r] ||
        "#1e40af");

    const roleBg = (r) =>
      ({ leader: "#fffbeb", "co-leader": "#f5f3ff", member: "#eff6ff" }[r] ||
        "#eff6ff");

    const proponentRows = (form.proponents || [])
      .map((p) => {
        const signature = form.signatures?.[String(p.id)];
        const sigImg = signature
          ? `<div style="width:160px;height:60px;margin:0 auto;display:flex;align-items:center;justify-content:center;"><img src="${signature}" alt="sig" style="max-height:55px;max-width:150px;object-fit:contain;display:block;"/></div>`
          : `<span style="color:#d1d5db;font-style:italic;font-size:10pt;">—</span>`;

        const role = p.proponent_role || "member";
        const programPos =
          [p.program, p.position].filter(Boolean).join(" · ") || "—";

        return `<tr>
          <td style="padding:10px 12px;font-weight:600;border-bottom:1px solid #f1f5f9;">${p.name}</td>
          <td style="padding:10px 12px;color:#374151;border-bottom:1px solid #f1f5f9;font-size:10pt;font-weight:500;">${p.department || "—"}</td>
          <td style="padding:10px 12px;color:#6b7280;border-bottom:1px solid #f1f5f9;font-size:10pt;">${programPos}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
            <span style="display:inline-block;padding:2px 9px;border-radius:20px;font-size:9pt;font-weight:700;color:${roleColor(
              role
            )};background:${roleBg(role)};">${roleLabel(role)}</span>
          </td>
          <td style="padding:10px 12px;text-align:center;border-bottom:1px solid #f1f5f9;">${sigImg}</td>
        </tr>`;
      })
      .join("");

    const fileList = fileRows
      .map(({ label, file, existing }) => {
        const uploaded = file || existing;
        const name = file?.name || (existing ? "Previously uploaded" : "Not uploaded");
        const color = uploaded ? "#15803d" : "#9ca3af";

        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;">
            <span style="color:${color};font-weight:700;margin-right:8px;">${uploaded ? "✔" : "✗"}</span>
            <span style="color:${uploaded ? "#111827" : "#9ca3af"};font-style:${uploaded ? "normal" : "italic"};">${label}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f9fafb;color:${color};font-weight:${uploaded ? 600 : 400};">${name}</td>
        </tr>`;
      })
      .join("");

    const additionalInfo = [];

    if (form.similar_work_elsewhere) {
      additionalInfo.push(
        `<li><b>Similar work elsewhere:</b> ${
          form.similar_work_details || "Yes"
        }</li>`
      );
    }

    if (form.has_external_collab) {
      additionalInfo.push(
        `<li><b>External collaboration:</b> ${
          form.external_collab_details || "Yes"
        }</li>`
      );
    }

    if (form.submitted_elsewhere) {
      additionalInfo.push(
        `<li><b>Submitted to another agency:</b> ${
          form.other_agency_name || "—"
        } — ₱${Number(form.other_agency_amount || 0).toLocaleString()}</li>`
      );
    }

    if (!form.is_first_time) {
      additionalInfo.push(`<li><b>First-time application:</b> No</li>`);
    }

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>Research Proposal - ${form.title || "Untitled"}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:"Times New Roman",Times,serif;font-size:12pt;color:#111827;background:#fff;}
      @page{size:A4;margin:25mm 20mm;}
      @media print{.no-print{display:none!important;}table{page-break-inside:avoid;}}
      .page{max-width:780px;margin:0 auto;padding:40px 48px;}
      .header{text-align:center;margin-bottom:28px;padding-bottom:20px;border-bottom:3px double #1f3864;}
      .uni-name{font-size:13pt;font-weight:700;color:#1f3864;letter-spacing:.04em;text-transform:uppercase;}
      .office{font-size:10pt;color:#6b7280;margin-top:2px;}
      .doc-title{font-size:17pt;font-weight:700;color:#1f3864;margin:14px 0 6px;line-height:1.3;}
      .badge{display:inline-block;margin-top:8px;padding:4px 16px;border-radius:20px;background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;font-size:11pt;font-weight:600;}
      .section{margin-bottom:28px;}
      .section-title{display:flex;align-items:center;gap:8px;font-size:11pt;font-weight:700;color:#1f3864;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #1f3864;padding-bottom:6px;margin-bottom:14px;}
      .num{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#1f3864;color:#fff;font-size:10pt;font-weight:700;flex-shrink:0;}
      .info-grid{display:grid;grid-template-columns:200px 1fr;gap:6px 12px;}
      .info-label{font-size:11pt;color:#6b7280;font-weight:500;padding:4px 0;}
      .info-value{font-size:11pt;color:#111827;font-weight:500;padding:4px 0;border-bottom:1px dotted #e5e7eb;}
      table{width:100%;border-collapse:collapse;font-size:11pt;}
      thead tr{background:#f0f4f8;}
      thead th{padding:10px 12px;text-align:left;font-size:10pt;font-weight:700;color:#1f3864;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #1f3864;}
      .add-info{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;}
      .add-info li{margin-bottom:8px;font-size:11pt;color:#374151;margin-left:18px;}
      .footer{text-align:center;margin-top:36px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:9pt;color:#9ca3af;}
      .print-btn{display:block;margin:0 auto 24px;padding:10px 28px;background:#1f3864;color:#fff;border:none;border-radius:8px;font-size:13pt;font-weight:600;cursor:pointer;}
    </style></head><body><div class="page">
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    <div class="header">
      <p class="uni-name">Caraga State University</p>
      <p class="office">Office of the Vice President for Research, Innovation &amp; Extension</p>
      <h1 class="doc-title">${form.title || "Untitled Proposal"}</h1>
      <p style="font-size:10pt;color:#6b7280;">Date Generated: ${today}</p>
      <span class="badge">${form.scholarly_work_type || "Research"}</span>
    </div>
    <div class="section">
      <div class="section-title"><span class="num">I</span> Basic Information</div>
      <div class="info-grid">
        <span class="info-label">Title</span><span class="info-value">${form.title || "—"}</span>
        <span class="info-label">Type</span><span class="info-value">${form.scholarly_work_type || "—"}</span>
        <span class="info-label">Category</span><span class="info-value">${form.category || "—"}</span>
        <span class="info-label">Lead Agency</span><span class="info-value">${form.lead_agency || "—"}</span>
        <span class="info-label">Site / Area</span><span class="info-value">${form.site_area || "—"}</span>
        <span class="info-label">Total Budget</span><span class="info-value">${form.total_budget || "—"}</span>
        <span class="info-label">Start Date</span><span class="info-value">${fmtDate(form.start_date)}</span>
        <span class="info-label">End Date</span><span class="info-value">${fmtDate(form.end_date)}</span>
        ${
          form.submitted_elsewhere
            ? `<span class="info-label">Other Agency</span><span class="info-value">${form.other_agency_name || "—"}</span><span class="info-label">Agency Amount</span><span class="info-value">₱${Number(form.other_agency_amount || 0).toLocaleString()}</span>`
            : ""
        }
      </div>
    </div>
    <div class="section">
      <div class="section-title"><span class="num">II</span> Research Team</div>
      ${
        (form.proponents || []).length === 0
          ? `<p style="color:#9ca3af;font-style:italic;">No proponents added.</p>`
          : `<table><thead><tr><th>Name</th><th>Department</th><th>Program · Position</th><th>Role</th><th style="text-align:center;">Signature</th></tr></thead><tbody>${proponentRows}</tbody></table>`
      }
    </div>
    ${
      additionalInfo.length > 0
        ? `<div class="section"><div class="section-title"><span class="num">III</span> Additional Information</div><div class="add-info"><ul>${additionalInfo.join("")}</ul></div></div>`
        : ""
    }
    <div class="section">
      <div class="section-title"><span class="num">${
        additionalInfo.length > 0 ? "IV" : "III"
      }</span> Attached Documents</div>
      <table><thead><tr><th>Document</th><th>Status / File Name</th></tr></thead><tbody>${fileList}</tbody></table>
    </div>
    <div class="footer">Generated by Research PMS - Caraga State University - ${today}</div>
    </div></body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  const Section = ({ icon: Icon, title, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "2px solid #1f7a1f",
        }}
      >
        <Icon size={16} color="#1f7a1f" />

        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 700,
            color: "#1f7a1f",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "sans-serif",
          }}
        >
          {title}
        </h3>
      </div>

      {children}
    </div>
  );

  const Row = ({ label, value }) => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "190px 1fr",
        gap: 8,
        marginBottom: 8,
        fontSize: 13,
      }}
    >
      <span style={{ color: "#6b7280", fontWeight: 500 }}>{label}</span>

      <span style={{ color: "#111827", fontWeight: 500 }}>
        {value || (
          <span style={{ color: "#d1d5db", fontStyle: "italic" }}>
            Not provided
          </span>
        )}
      </span>
    </div>
  );

  const fileRows = [
    {
      label: "Project Proposal Form",
      file: form.proposal_form,
      existing: existingFiles.proposal_form,
    },
    {
      label: "Curriculum Vitae",
      file: form.cv_files?.[0],
      existing: existingFiles.cv_files,
    },
    {
      label: "Work Plan",
      file: workPlanFile,
      existing: existingFiles.work_plan_file,
    },
    {
      label: "Project Framework",
      file: frameworkFile,
      existing: existingFiles.framework_file,
    },
    {
      label: "References",
      file: referencesFile,
      existing: existingFiles.references_file,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Review Proposal Document
          </h3>

          <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
            Read-only preview. All entered information is compiled here.
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "8px 18px",
            borderRadius: 9,
            border: "none",
            background: "#1f7a1f",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: "40px 36px",
          maxWidth: 900,
          width: "100%",
          margin: "0 auto",
          boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
          fontFamily: "Georgia, serif",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 32,
            paddingBottom: 24,
            borderBottom: "3px double #1f7a1f",
          }}
        >
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 10,
              color: "#6b7280",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
            }}
          >
            Caraga State University - Research PMS
          </p>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: 20,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.35,
            }}
          >
            {form.title || (
              <span style={{ color: "#d1d5db" }}>Untitled Proposal</span>
            )}
          </h1>

          <span
            style={{
              display: "inline-block",
              padding: "4px 14px",
              borderRadius: 20,
              background: "#f0fdf4",
              color: "#15803d",
              border: "1px solid #bbf7d0",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "sans-serif",
            }}
          >
            {form.scholarly_work_type || "Research"}
          </span>
        </div>

        <Section icon={BookOpen} title="I. Basic Information">
          <Row label="Title" value={form.title} />
          <Row label="Type of Scholarly Work" value={form.scholarly_work_type} />
          <Row label="Category" value={form.category} />
          <Row label="Lead Agency" value={form.lead_agency} />
          <Row label="Site / Area" value={form.site_area} />
          <Row
            label="Total Proposed Budget"
            value={form.total_budget || null}
          />
          <Row label="Proposed Start Date" value={form.start_date} />
          <Row label="Proposed End Date" value={form.end_date} />

          {form.submitted_elsewhere && (
            <>
              <Row label="Other Agency" value={form.other_agency_name} />
              <Row
                label="Agency Amount"
                value={
                  form.other_agency_amount
                    ? `₱${Number(form.other_agency_amount).toLocaleString()}`
                    : null
                }
              />
            </>
          )}
        </Section>

        <Section icon={Users} title="II. Research Team">
          {!form.proponents || form.proponents.length === 0 ? (
            <p style={{ color: "#9ca3af", fontSize: 13, fontStyle: "italic" }}>
              No proponents added.
            </p>
          ) : (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 13,
                  tableLayout: "fixed",
                  minWidth: 560,
                }}
              >
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "22%" }} />
                </colgroup>

                <thead>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    {[
                      "Name",
                      "Department",
                      "Program · Position",
                      "Team Role",
                      "Signature",
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          padding: "6px 8px",
                          textAlign: i === 4 ? "center" : "left",
                          color: "#6b7280",
                          fontWeight: 600,
                          fontFamily: "sans-serif",
                          fontSize: 11,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {form.proponents.map((p) => {
                    const signature = form.signatures?.[String(p.id)];
                    const rs = getRoleStyle(p.proponent_role || "member");
                    const { Icon } = rs;

                    return (
                      <tr
                        key={p.id}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td
                          style={{
                            padding: "12px 8px",
                            fontWeight: 600,
                            verticalAlign: "middle",
                            wordBreak: "break-word",
                          }}
                        >
                          {p.name}
                        </td>

                        <td
                          style={{
                            padding: "12px 8px",
                            color: "#374151",
                            verticalAlign: "middle",
                            fontSize: 12,
                            fontWeight: 500,
                            wordBreak: "break-word",
                          }}
                        >
                          {p.department || (
                            <span
                              style={{ color: "#d1d5db", fontStyle: "italic" }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: "12px 8px",
                            color: "#6b7280",
                            verticalAlign: "middle",
                            fontSize: 12,
                            wordBreak: "break-word",
                          }}
                        >
                          {[p.program, p.position].filter(Boolean).join(" · ") || (
                            <span
                              style={{ color: "#d1d5db", fontStyle: "italic" }}
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td
                          style={{ padding: "12px 8px", verticalAlign: "middle" }}
                        >
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "2px 9px",
                              borderRadius: 20,
                              color: rs.color,
                              background: rs.bg,
                              border: `1.5px solid ${rs.border}`,
                            }}
                          >
                            <Icon size={10} strokeWidth={2.5} /> {rs.label}
                          </span>
                        </td>

                        <td
                          style={{
                            padding: "8px 6px",
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          {signature ? (
                            <div
                              style={{
                                width: "100%",
                                height: 46,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                src={signature}
                                alt="sig"
                                style={{
                                  maxHeight: 38,
                                  maxWidth: 100,
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          ) : (
                            <span
                              style={{
                                color: "#d1d5db",
                                fontSize: 11,
                                fontStyle: "italic",
                              }}
                            >
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section icon={FileText} title="III. Attached Documents">
          {fileRows.map(({ label, file, existing }) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
                borderBottom: "1px solid #f9fafb",
                fontSize: 13,
              }}
            >
              {file || existing ? (
                <>
                  <FileCheck size={14} color="#15803d" />
                  <span style={{ color: "#111827" }}>
                    {label}:{" "}
                    <span style={{ color: "#15803d", fontWeight: 600 }}>
                      {file?.name || "Uploaded"}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <X size={14} color="#d1d5db" />
                  <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                    {label}: not uploaded
                  </span>
                </>
              )}
            </div>
          ))}
        </Section>

        <div
          style={{
            marginTop: 40,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            fontSize: 11,
            color: "#9ca3af",
            fontFamily: "sans-serif",
          }}
        >
          Generated by Research PMS -{" "}
          {new Date().toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
    </div>
  );
}

function getCompletion({
  form,
  workPlanFile,
  frameworkFile,
  referencesFile,
  existingFiles,
}) {
  const agencyComplete =
    !form.submitted_elsewhere ||
    (form.other_agency_name &&
      form.other_agency_amount &&
      form.agency_difference_extent);

  const pastWorksOk =
    form.is_first_time ||
    (form.past_works?.length > 0 &&
      form.past_works.every((pw) => pw.title && pw.status));

  const hasProponents = (form.proponents?.length || 0) > 0;
  const hasLeader = (form.proponents || []).some(
    (p) => p.proponent_role === "leader"
  );
  const hasAnySig = (form.proponents || []).some(
    (p) => !!form.signatures?.[String(p.id)]
  );

  return {
    Overview: !!(
      form.title &&
      form.scholarly_work_type &&
      form.total_budget &&
      form.start_date &&
      form.end_date &&
      hasProponents &&
      hasLeader &&
      hasAnySig &&
      (form.proposal_form || existingFiles.proposal_form) &&
      agencyComplete &&
      pastWorksOk
    ),
    "Work Plan": !!(workPlanFile || existingFiles.work_plan_file),
    Framework: !!(frameworkFile || existingFiles.framework_file),
    References: !!(referencesFile || existingFiles.references_file),
    Review: true,
  };
}

export default function Proposals() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("project_id");

  const [activeTab, setActiveTab] = useState("Overview");
  const [proponentsList, setProponentsList] = useState([]);
  const [evaluatorsList, setEvaluatorsList] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preferredEvaluators, setPreferredEvaluators] = useState([]);
  const [savedEvaluatorIds, setSavedEvaluatorIds] = useState([]);
  const [workPlanFile, setWorkPlanFile] = useState(null);
  const [frameworkFile, setFrameworkFile] = useState(null);
  const [referencesFile, setReferencesFile] = useState(null);
  const [existingFiles, setExistingFiles] = useState({
    proposal_form: null,
    cv_files: null,
    work_plan_file: null,
    framework_file: null,
    references_file: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [projectStatus, setProjectStatus] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/admin/faculty")
      .then((r) => setProponentsList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setProponentsList([]));

    api
      .get("/admin/evaluators")
      .then((r) => setEvaluatorsList(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEvaluatorsList([]));
  }, []);

  useEffect(() => {
    if (!projectId) return;

    setLoadingDraft(true);
    setError("");

    api
      .get(`/proposals/${projectId}`)
      .then((res) => {
        const project = res.data?.project || res.data || {};
        const proposal = res.data?.proposal || {};
        setProjectStatus(project.status || "");
        const parsedPastWorks = normalizeJsonArray(proposal.past_works);
        const parsedPreferredEvaluatorIds = normalizeIdArray(
          proposal.preferred_evaluators
        );

        const rawSignatures = {
          ...normalizeJsonObject(project.signatures),
          ...normalizeJsonObject(proposal.signatures),
        };

        const loadedSignatures = Object.fromEntries(
          Object.entries(rawSignatures).map(([k, v]) => [String(k), v])
        );

        const loadedProponents = Array.isArray(project.proponents)
          ? project.proponents
          : Array.isArray(proposal.proponents)
          ? proposal.proponents
          : [];

        setForm((cur) => ({
          ...cur,
          title: project.title || proposal.title || "",
          scholarly_work_type:
            project.scholarly_work_type ||
            project.type ||
            proposal.scholarly_work_type ||
            "Research",
          category: project.category || proposal.category || "",
          lead_agency: project.lead_agency || proposal.lead_agency || "",
          site_area: project.site_area || proposal.site_area || "",
          total_budget: project.total_budget || project.budget || proposal.total_budget || "",
          funding_type: project.funding_type || proposal.funding_type || "local",
          funding_agency: project.funding_agency || proposal.funding_agency || "",
          external_amount: project.external_amount || proposal.external_amount || "",
          start_date: project.start_date || proposal.start_date || "",
          end_date: project.end_date || proposal.end_date || "",
          proponents: loadedProponents,
          signatures: loadedSignatures,
          similar_work_elsewhere: !!proposal.similar_work_elsewhere,
          similar_work_details: proposal.similar_work_details || "",
          is_first_time: proposal.is_first_time !== false,
          past_works: parsedPastWorks,
          has_external_collab: !!proposal.has_external_collab,
          external_collab_details: proposal.external_collab_details || "",
          submitted_elsewhere: !!proposal.submitted_elsewhere,
          other_agency_name: proposal.other_agency_name || "",
          other_agency_amount: proposal.other_agency_amount || "",
          agency_difference_extent:
            proposal.agency_difference_extent ||
            proposal.difference_explanation ||
            "",
        }));

        setExistingFiles({
          proposal_form:
            project.proposal_form_path ||
            project.proposal_form ||
            proposal.proposal_form_path ||
            proposal.proposal_form ||
            null,
          cv_files:
            project.cv_paths ||
            project.cv_files ||
            proposal.cv_paths ||
            proposal.cv_files ||
            null,
          work_plan_file:
            project.work_plan_path ||
            project.work_plan_file ||
            proposal.work_plan_path ||
            proposal.work_plan_file ||
            null,
          framework_file:
            project.framework_path ||
            project.framework_file ||
            proposal.framework_path ||
            proposal.framework_file ||
            null,
          references_file:
            project.references_path ||
            project.references_file ||
            proposal.references_path ||
            proposal.references_file ||
            null,
        });

        setSavedEvaluatorIds(parsedPreferredEvaluatorIds);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || "Failed to load draft. Please try again."
        );
      })
      .finally(() => setLoadingDraft(false));
  }, [projectId]);

  useEffect(() => {
    if (!Array.isArray(evaluatorsList) || evaluatorsList.length === 0) return;
    if (!Array.isArray(savedEvaluatorIds) || savedEvaluatorIds.length === 0) {
      return;
    }

    const loadedEvaluators = evaluatorsList.filter((e) =>
      savedEvaluatorIds.includes(Number(e.id))
    );

    setPreferredEvaluators(loadedEvaluators.slice(0, 3));
  }, [evaluatorsList, savedEvaluatorIds]);

  const INPUT_TABS = ["Overview", "Work Plan", "Framework", "References"];
  const completion = getCompletion({
    form,
    workPlanFile,
    frameworkFile,
    referencesFile,
    existingFiles,
  });
  const allComplete = INPUT_TABS.every((t) => completion[t]);
  const incompleteTabs = INPUT_TABS.filter((t) => !completion[t]);

  const buildPayload = () => {
    const fd = new FormData();

    if (projectId) fd.append("project_id", projectId);

    [
      "title",
      "scholarly_work_type",
      "category",
      "lead_agency",
      "site_area",
      "total_budget",
      "funding_type",
      "funding_agency",
      "external_amount",
      "start_date",
      "end_date",
      "similar_work_elsewhere",
      "similar_work_details",
      "is_first_time",
      "has_external_collab",
      "external_collab_details",
      "submitted_elsewhere",
      "other_agency_name",
      "other_agency_amount",
      "agency_difference_extent",
    ].forEach((key) => fd.append(key, form[key] ?? ""));

    fd.append(
      "proponents",
      JSON.stringify(
        (form.proponents || []).map((p) => ({
          id: p.id,
          role: p.proponent_role || "member",
        }))
      )
    );

    fd.append("past_works", JSON.stringify(form.past_works || []));
    fd.append("signatures", JSON.stringify(form.signatures || {}));

    fd.append(
      "preferred_evaluators",
      JSON.stringify(preferredEvaluators.slice(0, 3).map((e) => Number(e.id)))
    );

    form.cv_files?.forEach((f) => fd.append("cv_files[]", f));
        
    if (form.proposal_form) fd.append("proposal_form", form.proposal_form);
    if (workPlanFile) fd.append("work_plan_file", workPlanFile);
    if (frameworkFile) fd.append("framework_file", frameworkFile);
    if (referencesFile) fd.append("references_file", referencesFile);

    return fd;
  };

  const handleSaveDraft = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.post("/proposals/draft", buildPayload(), {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Draft saved successfully!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save draft.");
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(""), 3500);
    }
  };

  const handleSubmit = async () => {
    if (!allComplete) {
      setError(`Complete these sections first: ${incompleteTabs.join(", ")}.`);
      return;
    }

    // CV count must match proponent count
    const proponentCount = form.proponents?.length || 0;
    const newCvCount = form.cv_files?.length || 0;

    if (proponentCount > 0 && newCvCount > 0 && newCvCount < proponentCount) {
      setError(
        `CV count mismatch: You have ${proponentCount} proponent(s) but only ${newCvCount} CV file(s) uploaded. Please upload one CV per proponent.`
      );
      setActiveTab("Overview");
      return;
    }

    if (proponentCount > 0 && newCvCount > proponentCount) {
      setError(
        `Too many CVs: You have ${newCvCount} CV file(s) but only ${proponentCount} proponent(s). Please remove the extra CV(s).`
      );
      setActiveTab("Overview");
      return;
    }

    if (proponentCount > 0 && newCvCount === 0 && !existingFiles.cv_files) {
      setError("Please upload a CV for each proponent before submitting.");
      setActiveTab("Overview");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await api.post("/proposals", buildPayload(), {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("Proposal submitted successfully!");
      setActiveTab("Review");
      setTimeout(() => navigate("/researcher/projects"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Overview":
        return (
          <OverviewTab
            form={form}
            setForm={setForm}
            preferredEvaluators={preferredEvaluators}
            setPreferredEvaluators={setPreferredEvaluators}
            proponentsList={proponentsList}
            evaluatorsList={evaluatorsList}
            existingFiles={existingFiles}
            canAutoAssignEvaluators={
              !projectId || (!loadingDraft && savedEvaluatorIds.length === 0)
            }
          />
        );

      case "Work Plan":
        return (
          <WorkPlanTab
            file={workPlanFile}
            setFile={setWorkPlanFile}
            existingFile={existingFiles.work_plan_file}
          />
        );

      case "Framework":
        return (
          <UploadTab
            title="Project Framework"
            subtitle="Upload your project framework document"
            fieldLabel="Project Framework Document"
            accept=".pdf,.doc,.docx"
            file={frameworkFile}
            setFile={setFrameworkFile}
            existingFile={existingFiles.framework_file}
          />
        );

      case "References":
        return (
          <UploadTab
            title="References and Citations"
            subtitle="Upload your references document"
            fieldLabel="References Document"
            accept=".pdf,.doc,.docx"
            note="Include all references and citations in proper academic format."
            file={referencesFile}
            setFile={setReferencesFile}
            existingFile={existingFiles.references_file}
          />
        );

      case "Review":
        return (
          <OutputsTab
            form={form}
            workPlanFile={workPlanFile}
            frameworkFile={frameworkFile}
            referencesFile={referencesFile}
            existingFiles={existingFiles}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />

      <div className="main-content">
        <Topbar
          title={projectId ? "Continue Research Proposal" : "Create Research Proposal"}
        />

        <div className="dashboard-content">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
              Complete the project details, add proponents, upload required
              documents, then save as draft or submit for review.
            </h3>
          </div>

          {loadingDraft && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#f9fafb",
                color: "#6b7280",
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              Loading draft...
            </div>
          )}

          {projectStatus === "For Revision" && (
            <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10,
              padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>⚠️</span>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 14, fontWeight: 700, color: "#92400e" }}>
                  This proposal was returned for revision
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#a16207" }}>
                  Review the approver remarks, make changes, then click <strong>Resubmit Proposal</strong>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                background: "#fef2f2",
                color: "#dc2626",
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#dcfce7",
                color: "#15803d",
                padding: "12px 16px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 14,
              }}
            >
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}

          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 18,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <AlertCircle
              size={18}
              color="#15803d"
              style={{ flexShrink: 0, marginTop: 2 }}
            />

            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#14532d",
                }}
              >
                Fill everything here before submitting.
              </p>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "#166534",
                  lineHeight: 1.5,
                }}
              >
                Add proponents, assign team roles, and have at least one
                proponent attach a signature. Upload all required documents,
                then save as draft or submit for review.
              </p>
            </div>
          </div>

          {projectId && (
            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              You are continuing an existing draft. Saving or submitting will
              update this draft.
            </div>
          )}

          {activeTab !== "Review" && (
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  {INPUT_TABS.filter((t) => completion[t]).length} /{" "}
                  {INPUT_TABS.length} sections completed
                </span>

                {allComplete && (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#15803d",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <CheckCircle2 size={13} /> All sections complete
                  </span>
                )}
              </div>

              <div
                style={{
                  height: 6,
                  background: "#f1f5f9",
                  borderRadius: 99,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${
                      (INPUT_TABS.filter((t) => completion[t]).length /
                        INPUT_TABS.length) *
                      100
                    }%`,
                    background: "#1f7a1f",
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          )}

          <div className="cp-tab-bar" style={{ flexWrap: "wrap", gap: 4 }}>
            {TABS.map((tab) => {
              const done = completion[tab] && tab !== "Review";
              const active = activeTab === tab;
              const isReview = tab === "Review";

              return (
                <button
                  key={tab}
                  type="button"
                  className={`cp-tab-btn ${active ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    ...(isReview && !active
                      ? {
                          borderStyle: "dashed",
                          color: "#6d28d9",
                          borderColor: "#ddd6fe",
                        }
                      : {}),
                  }}
                >
                  {done && !active && (
                    <CheckCircle2
                      size={13}
                      color="#15803d"
                      style={{ flexShrink: 0 }}
                    />
                  )}

                  {isReview && <FileText size={13} style={{ flexShrink: 0 }} />}

                  {tab}

                  {!done && !active && !isReview && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#d1d5db",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {renderTab()}

          {activeTab !== "Review" && (
            <div className="cp-form-actions">
              <button
                type="button"
                className="cp-btn"
                style={{ display: "flex", alignItems: "center", gap: 7 }}
                onClick={handleSaveDraft}
                disabled={saving || loadingDraft}
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save as Draft"}
              </button>

              <div className="cp-actions-right">
                {!allComplete && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#c2410c",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={13} /> Incomplete:{" "}
                    {incompleteTabs.join(", ")}
                  </span>
                )}

                <button
                  type="button"
                  className="cp-btn primary"
                  style={{
                    background: allComplete ? (projectStatus === "For Revision" ? "#d97706" : "#1f7a1f") : "#9ca3af",
                    borderColor: allComplete ? (projectStatus === "For Revision" ? "#d97706" : "#1f7a1f") : "#9ca3af",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    cursor: allComplete ? "pointer" : "not-allowed",
                  }}
                  onClick={handleSubmit}
                  disabled={submitting || !allComplete || loadingDraft}
                >
                  <Send size={14} />
                  {submitting ? "Submitting..." : projectStatus === "For Revision" ? "Resubmit Proposal" : "Submit Proposal"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "Review" && (
            <div className="cp-form-actions">
              <button
                type="button"
                className="cp-btn"
                onClick={() => setActiveTab("Overview")}
              >
                Back to Edit
              </button>

              <button
                type="button"
                className="cp-btn primary"
                style={{
                  background: allComplete ? (projectStatus === "For Revision" ? "#d97706" : "#1f7a1f") : "#9ca3af",
                  borderColor: allComplete ? (projectStatus === "For Revision" ? "#d97706" : "#1f7a1f") : "#9ca3af",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: allComplete ? "pointer" : "not-allowed",
                }}
                onClick={handleSubmit}
                disabled={submitting || !allComplete || loadingDraft}
              >
                <Send size={14} />
                {submitting ? "Submitting..." : projectStatus === "For Revision" ? "Resubmit Proposal" : "Submit Proposal"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}