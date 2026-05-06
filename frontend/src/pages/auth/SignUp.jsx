// src/pages/auth/SignUp.jsx
import { useState, useRef, useEffect } from "react";
import "../../styles/auth.css";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, ShieldCheck, User, Mail, Lock,
  Eye, EyeOff, ArrowRight, ArrowLeft,
} from "lucide-react";
import logo     from "../../assets/logo.png";
import schoolBg from "../../assets/school.png";
import { registerUser, dashboardRoute } from "../../utils/auth";

const ROLE_COLORS = {
  researcher: "#1f7a1f",
  evaluator:  "#391676",
};

const ROLES = [
  { value: "researcher", label: "Researcher", color: "#1f7a1f" },
  { value: "evaluator",  label: "Evaluator",  color: "#391676" },
];

/* icon shorthand */
const Ico = ({ d, d2, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ marginRight: 5, verticalAlign: "middle", flexShrink: 0 }}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

export default function SignUp() {
  const [step, setStep] = useState(1); // 1 = account, 2 = profile

  /* step 1 */
  const [role,     setRole]     = useState("researcher");
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [showConf, setShowConf] = useState(false);

  /* step 2 */
  const [department, setDepartment] = useState("");
  const [program,    setProgram]    = useState("");
  const [position,   setPosition]   = useState("");

  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const color = ROLE_COLORS[role] || "#1f7a1f";

  /* ── Step 1 → 2 validation ── */
  const handleNext = () => {
    setError("");
    if (!name.trim())        { setError("Full name is required."); return; }
    if (!email.trim())       { setError("Email is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setStep(2);
  };

  /* ── Final submit ── */
  const handleSignUp = async () => {
    setError(""); setLoading(true);
    try {
      const user = await registerUser(name, email, password, role, {
        department, program, position,
      });
      navigate(dashboardRoute(user.role));
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors)[0][0] : err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg" style={{ backgroundImage: `url(${schoolBg})` }}>
      <div className="auth-card" style={{ "--main-color": color }}>

        {/* ── Header ── */}
        <div className="card-header">
          <img src={logo} alt="CSU Logo" className="school-logo" />
          <h1 className="school-name">Research PMS</h1>
          <div className="school-divider">
            <span className="divider-line" />
            <span className="school-sub">GRADUATE SCHOOL</span>
            <span className="divider-line" />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="card-body">
          <h2>Create Account</h2>
          <p className="subtitle">Sign up to get started</p>

          {/* Step indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18, justifyContent: "center" }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%",
                  background: step >= s ? color : "#e5e7eb",
                  color: step >= s ? "#fff" : "#9ca3af",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, transition: "background 0.25s",
                }}>
                  {s}
                </div>
                <span style={{ fontSize: 12, fontWeight: step === s ? 600 : 400,
                  color: step === s ? color : "#9ca3af" }}>
                  {s === 1 ? "Account" : "Profile"}
                </span>
                {s < 2 && (
                  <div style={{ width: 24, height: 1.5, background: step > s ? color : "#e5e7eb",
                    transition: "background 0.25s", margin: "0 2px" }} />
                )}
              </div>
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* ══ STEP 1: Account Info ══ */}
          {step === 1 && (
            <>
              {/* Role */}
              <div className="form-group">
                <label>
                  <ShieldCheck size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Select Role
                </label>
                <RoleDropdown roles={ROLES} value={role} onChange={(v) => { setRole(v); setError(""); }} />
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label>
                  <User size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Full Name
                </label>
                <input type="text" placeholder="Dr. Juan Dela Cruz"
                  value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>
                  <Mail size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Email Address
                </label>
                <input type="email" placeholder="name@csu.edu.ph"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              {/* Password */}
              <div className="form-group">
                <label>
                  <Lock size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showPw ? "text" : "password"} placeholder="At least 6 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingRight: 42 }} />
                  <EyeBtn show={showPw} toggle={() => setShowPw(p => !p)} />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label>
                  <Lock size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input type={showConf ? "text" : "password"} placeholder="Re-enter your password"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    style={{ paddingRight: 42 }} />
                  <EyeBtn show={showConf} toggle={() => setShowConf(p => !p)} />
                </div>
              </div>

              {/* Next */}
              <button className="primary-btn" onClick={handleNext} style={{ background: color }}>
                Next <ArrowRight size={17} />
              </button>
            </>
          )}

          {/* ══ STEP 2: Profile Details ══ */}
          {step === 2 && (
            <>
              {/* Department — full width */}
              <div className="form-group">
                <label>
                  <Ico color={color}
                    d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                    d2="M9 22V12h6v10" />
                  Department
                </label>
                <input type="text" placeholder="e.g. College of Engineering"
                  value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>

              {/* Program — full width */}
              <div className="form-group">
                <label>
                  <Ico color={color}
                    d="M22 10v6M2 10l10-5 10 5-10 5z"
                    d2="M6 12v5c3 3 9 3 12 0v-5" />
                  Program
                </label>
                <input type="text" placeholder="e.g. MS Computer Science"
                  value={program} onChange={(e) => setProgram(e.target.value)} />
              </div>

              {/* Position — full width */}
              <div className="form-group">
                <label>
                  <Ico color={color}
                    d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
                    d2="M16 3h-2a2 2 0 0 0-2 2v2h6V5a2 2 0 0 0-2-2z" />
                  Position
                </label>
                <input type="text" placeholder="e.g. Asst. Professor"
                  value={position} onChange={(e) => setPosition(e.target.value)} />
              </div>

              {/* Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "11px 16px", border: `1.5px solid ${color}`,
                    borderRadius: 8, background: "#fff", color, fontWeight: 600,
                    fontSize: 14, cursor: "pointer",
                  }}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="primary-btn"
                  onClick={handleSignUp} disabled={loading}
                  style={{ background: color, margin: 0 }}>
                  <UserPlus size={17} />
                  {loading ? "Creating account..." : "Create Account"}
                </button>
              </div>
            </>
          )}

          <p className="auth-link" style={{ marginTop: 14 }}>
            Already have an account?{" "}
            <span onClick={() => navigate("/login")} style={{ color }}>Sign In</span>
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", padding: "0 24px 18px", margin: 0 }}>
          © {new Date().getFullYear()} Caraga State University Graduate School
        </p>
      </div>
    </div>
  );
}

/* ── Eye toggle button ───────────────────────────────────── */
function EyeBtn({ show, toggle }) {
  return (
    <button type="button" tabIndex={-1} onClick={toggle}
      style={{
        position: "absolute", right: 12, top: "50%",
        transform: "translateY(-50%)", background: "none",
        border: "none", cursor: "pointer", padding: 0,
        display: "flex", alignItems: "center", color: "#9ca3af",
      }}>
      {show ? <EyeOff size={17} /> : <Eye size={17} />}
    </button>
  );
}

/* ── Custom Role Dropdown ────────────────────────────────── */
function RoleDropdown({ roles, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = roles.find(r => r.value === value) || roles[0];

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: 10 }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", boxSizing: "border-box",
          border: `1.5px solid ${selected.color}`,
          borderRadius: open ? "8px 8px 0 0" : 8,
          background: "#fff", cursor: "pointer",
          boxShadow: `0 0 0 3px ${hexGlow(selected.color)}`,
          transition: "border-radius 0.15s",
        }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: selected.color, flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "0.93rem", fontWeight: 500, color: "#111827", textAlign: "left" }}>
          {selected.label}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#fff", border: `1.5px solid ${selected.color}`,
          borderTop: "1px solid #f1f5f9", borderRadius: "0 0 8px 8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.10)", overflow: "hidden",
        }}>
          {roles.map((r, i) => {
            const active = r.value === value;
            return (
              <button key={r.value} type="button"
                onClick={() => { onChange(r.value); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", border: "none",
                  borderBottom: i < roles.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: active ? r.color + "12" : "#fff",
                  cursor: "pointer", textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { e.currentTarget.style.background = active ? r.color + "12" : "#fff"; }}
              >
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.93rem", fontWeight: active ? 600 : 400,
                  color: active ? r.color : "#374151" }}>
                  {r.label}
                </span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={r.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function hexGlow(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},0.14)`;
}