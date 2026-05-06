// src/components/ProfileForm.jsx
import { useState, useRef } from "react";
import api from "../utils/api";
import { getSession, setSession } from "../utils/auth";
import {
  User, Mail, Phone, MapPin, Lock,
  Eye, EyeOff, Camera, Save,
  CheckCircle2, AlertCircle,
} from "lucide-react";

function Field({ label, icon, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#374151",
        display: "flex", alignItems: "center", gap: 5 }}>
        {icon}{label}
      </label>
      {children}
    </div>
  );
}

function PasswordInput({ placeholder, value, show, onToggle, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 38px 9px 12px",
          border: "1px solid #d1d5db", borderRadius: 8,
          fontSize: 14, outline: "none", color: "#111827",
          boxSizing: "border-box",
        }} />
      <button onClick={onToggle} type="button"
        style={{
          position: "absolute", right: 10, top: "50%",
          transform: "translateY(-50%)", background: "none",
          border: "none", cursor: "pointer", color: "#9ca3af",
          display: "flex", padding: 0,
        }}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export default function ProfileForm({ accentColor = "#1f7a1f" }) {
  const session  = getSession() || {};
  const userRole = session.role_label || (session.role || "User").charAt(0).toUpperCase() + (session.role || "user").slice(1);
  const fileRef  = useRef(null);

  const [tab,     setTab]     = useState("profile");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  const [form, setForm] = useState({
    name:           session.name           || "",
    email:          session.email          || "",
    contact_number: session.contact_number || "",
    department:     session.department     || "",
    expertise:      session.expertise      || "",
    avatar:         session.avatar         || null,
  });

  const [pwForm, setPwForm] = useState({
    current_password: "", new_password: "", confirm_password: "",
  });
  const [showPw, setShowPw] = useState({ cur: false, new: false, conf: false });

  const initial = (form.name || "U").charAt(0).toUpperCase();

  const handleAvatarChange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, avatar: ev.target.result }));
    reader.readAsDataURL(f);
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError(""); setSaving(true);
    try {
      const res = await api.put("/profile", {
        name:           form.name,
        email:          form.email,
        contact_number: form.contact_number,
        department:     form.department,
        expertise:      form.expertise,
      });
      if (typeof setSession === "function") setSession({ ...session, ...res.data.user });
      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    setError("");
    if (!pwForm.current_password)                        { setError("Current password is required."); return; }
    if (pwForm.new_password.length < 8)                  { setError("New password must be at least 8 characters."); return; }
    if (pwForm.new_password !== pwForm.confirm_password) { setError("Passwords do not match."); return; }
    setSaving(true);
    try {
      await api.put("/profile/password", {
        current_password: pwForm.current_password,
        new_password:     pwForm.new_password,
      });
      setSuccess("Password changed successfully!");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally { setSaving(false); }
  };

  const pwStrength = (() => {
    const p = pwForm.new_password; if (!p) return null;
    const score = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length;
    if (score <= 1) return { label: "Weak",   color: "#dc2626", width: "25%"  };
    if (score === 2) return { label: "Fair",   color: "#f59e0b", width: "50%"  };
    if (score === 3) return { label: "Good",   color: "#1d4ed8", width: "75%"  };
    return               { label: "Strong", color: "#15803d", width: "100%" };
  })();

  const CARD = {
    background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
    padding: "22px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 20,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
          Manage your personal information and account settings
        </h3>
      </div>

      {/* Hero card */}
      <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: form.avatar ? "transparent" : accentColor,
            color: "#fff", fontWeight: 700, fontSize: 26,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", border: "3px solid #e5e7eb",
          }}>
            {form.avatar
              ? <img src={form.avatar} alt="avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initial}
          </div>
          <button onClick={() => fileRef.current.click()}
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 24, height: 24, borderRadius: "50%",
              background: accentColor, border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", padding: 0,
            }}>
            <Camera size={12} color="#fff" />
          </button>
          <input ref={fileRef} type="file" accept="image/*"
            style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{form.name || "—"}</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "#6b7280" }}>{form.email}</p>
          <span style={{
            display: "inline-block", marginTop: 6, padding: "3px 12px", borderRadius: 20,
            fontSize: 12, fontWeight: 600, background: accentColor + "20",
            color: accentColor, border: `1px solid ${accentColor}44`,
          }}>
            {userRole}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fef2f2",
          color: "#dc2626", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#dcfce7",
          color: "#15803d", padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontSize: 14 }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[{ key: "profile", label: "Profile Information" }, { key: "password", label: "Change Password" }].map(t => (
          <button key={t.key}
            onClick={() => { setTab(t.key); setError(""); setSuccess(""); }}
            style={{
              padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 500, cursor: "pointer",
              border: `1.5px solid ${tab === t.key ? accentColor : "#e5e7eb"}`,
              background: tab === t.key ? accentColor : "#fff",
              color: tab === t.key ? "#fff" : "#374151",
              transition: "all 0.13s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Information Tab */}
      {tab === "profile" && (
        <div style={CARD}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Personal Information
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
            <Field label="Full Name" icon={<User size={14} color="#9ca3af" />}>
              <input className="cp-input" type="text" placeholder="Your full name"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Email Address" icon={<Mail size={14} color="#9ca3af" />}>
              <input className="cp-input" type="email" placeholder="your@email.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Contact Number" icon={<Phone size={14} color="#9ca3af" />}>
              <input className="cp-input" type="tel" placeholder="e.g. 09123456789"
                value={form.contact_number} onChange={e => setForm(p => ({ ...p, contact_number: e.target.value }))} />
            </Field>
            <Field label="Department" icon={<MapPin size={14} color="#9ca3af" />}>
              <input className="cp-input" type="text" placeholder="e.g. College of Education"
                value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
            </Field>
            <div style={{ gridColumn: "1 / -1" }}>
              <Field label="Expertise / Bio">
                <textarea
                  placeholder="Write your expertise or a short bio..."
                  value={form.expertise}
                  onChange={e => setForm(p => ({ ...p, expertise: e.target.value }))}
                  style={{
                    width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
                    borderRadius: 8, fontSize: 14, outline: "none", color: "#111827",
                    minHeight: 90, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
                  }} />
              </Field>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={handleSaveProfile} disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 22px",
                borderRadius: 9, border: "none", background: accentColor, color: "#fff",
                fontWeight: 600, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
              <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {tab === "password" && (
        <div style={CARD}>
          <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#111827" }}>
            Change Password
          </h3>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6b7280" }}>
            Use at least 8 characters including a number and a symbol.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
            <Field label="Current Password">
              <PasswordInput placeholder="Enter current password" value={pwForm.current_password}
                show={showPw.cur} onToggle={() => setShowPw(p => ({ ...p, cur: !p.cur }))}
                onChange={v => setPwForm(p => ({ ...p, current_password: v }))} />
            </Field>
            <Field label="New Password">
              <PasswordInput placeholder="Enter new password" value={pwForm.new_password}
                show={showPw.new} onToggle={() => setShowPw(p => ({ ...p, new: !p.new }))}
                onChange={v => setPwForm(p => ({ ...p, new_password: v }))} />
              {pwStrength && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: pwStrength.width, background: pwStrength.color,
                      borderRadius: 99, transition: "width 0.3s ease" }} />
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: pwStrength.color, fontWeight: 600 }}>
                    {pwStrength.label}
                  </p>
                </div>
              )}
            </Field>
            <Field label="Confirm New Password">
              <PasswordInput placeholder="Re-enter new password" value={pwForm.confirm_password}
                show={showPw.conf} onToggle={() => setShowPw(p => ({ ...p, conf: !p.conf }))}
                onChange={v => setPwForm(p => ({ ...p, confirm_password: v }))} />
              {pwForm.confirm_password && pwForm.new_password !== pwForm.confirm_password && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#dc2626" }}>Passwords do not match</p>
              )}
              {pwForm.confirm_password && pwForm.new_password === pwForm.confirm_password && (
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "#15803d",
                  display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={11} /> Passwords match
                </p>
              )}
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button onClick={handleChangePassword} disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 22px",
                borderRadius: 9, border: "none", background: accentColor, color: "#fff",
                fontWeight: 600, fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
              }}>
              <Lock size={15} /> {saving ? "Updating…" : "Update Password"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}