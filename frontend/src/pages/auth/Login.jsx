// src/pages/auth/Login.jsx
import { useState, useRef, useEffect } from "react";
import "../../styles/auth.css";
import { useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";
import logo     from "../../assets/logo.png";
import schoolBg from "../../assets/school.png";
import { loginUser, dashboardRoute } from "../../utils/auth";

const ROLE_COLORS = {
  researcher:         "#1f7a1f",
  evaluator:          "#391676",
  admin:              "#f59e0b",
  approver:           "#141617",
  rde_division_chief: "#391676",
  campus_director:    "#391676",
  vprie:              "#141617",
  president:          "#141617",
};

const ROLES = [
  { value: "researcher",         label: "Researcher",           color: "#1f7a1f" },
  { value: "evaluator",          label: "Evaluator",            color: "#391676" },
  { value: "admin",              label: "Admin",                color: "#f59e0b" },
  { value: "rde_division_chief", label: "RDE Division Chief",   color: "#391676" },
  { value: "campus_director",    label: "Campus Director",      color: "#391676" },
  { value: "vprie",              label: "VPRIE",                color: "#141617" },
  { value: "president",          label: "University President", color: "#141617" },
];

export default function Login() {
  const [role,     setRole]     = useState("researcher");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const color = ROLE_COLORS[role] || "#1f7a1f";

  const handleSignIn = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const user = await loginUser(email, password, role);
      navigate(dashboardRoute(user.role));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.errors?.role?.[0] ||
        "Login failed. Please try again."
      );
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg" style={{ backgroundImage: `url(${schoolBg})` }}>
      <div
        className="auth-card"
        style={{ "--main-color": color }}
      >
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
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to continue to your account</p>

          {error && <div className="auth-error">{error}</div>}

          {/* Role */}
          <div className="form-group">
            <label>
              <ShieldCheck size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
              Select Role
            </label>
            <RoleDropdown
              roles={ROLES}
              value={role}
              onChange={(v) => { setRole(v); setError(""); }}
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label>
              <Mail size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@csu.edu.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label>
              <Lock size={13} color={color} strokeWidth={2} style={{ marginRight: 5, verticalAlign: "middle" }} />
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none",
                  cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", color: "#9ca3af",
                }}
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Button */}
          <button
            className="primary-btn"
            onClick={handleSignIn}
            disabled={loading}
            style={{ background: color }}
          >
            <LogIn size={18} />
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="auth-link">
            Don't have an account?{" "}
            <span onClick={() => navigate("/signup")} style={{ color }}>
              Sign Up
            </span>
          </p>
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", padding: "0 24px 18px", margin: 0 }}>
          © {new Date().getFullYear()} Caraga State University Graduate School
        </p>
      </div>
    </div>
  );
}

/* ── Custom Role Dropdown ──────────────────────────────────── */
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
      {/* Trigger */}
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

      {/* Options */}
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#fff",
          border: `1.5px solid ${selected.color}`,
          borderTop: "1px solid #f1f5f9",
          borderRadius: "0 0 8px 8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.10)",
          overflow: "hidden",
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