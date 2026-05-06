import { Bell, LogOut, CheckCheck, X, UserCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, clearSession } from "../utils/auth";

const NOTIFICATIONS = [
  { id: 1, type: "approval",   title: "Proposal Approved",     message: "Your proposal 'Climate Change Impact' has been approved.",        time: "2 min ago",   read: false },
  { id: 2, type: "evaluation", title: "Evaluation Completed",   message: "PRJ-002 evaluation completed with score 88/100.",                time: "1 hour ago",  read: false },
  { id: 3, type: "review",     title: "Proposal Under Review",  message: "PRJ-004 has been forwarded to the Dean of Research.",           time: "3 hours ago", read: false },
  { id: 4, type: "team",       title: "New Team Member Added",  message: "Dr. Rachel Lee has been added to your research team.",          time: "Yesterday",   read: true  },
  { id: 5, type: "budget",     title: "Budget Plan Updated",    message: "Your budget plan for PRJ-003 was reviewed and updated.",        time: "Yesterday",   read: true  },
  { id: 6, type: "deadline",   title: "Upcoming Deadline",      message: "Work plan milestone due in 3 days for PRJ-001.",                time: "2 days ago",  read: true  },
];

const TYPE_DOT = {
  approval:   "#1f7a1f",
  evaluation: "#7c3aed",
  review:     "#d97706",
  team:       "#2563eb",
  budget:     "#ea580c",
  deadline:   "#dc2626",
};

export default function Topbar({ title = "Dashboard" }) {
  const [dropdownOpen,   setDropdownOpen]   = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const [notifications,  setNotifications]  = useState(NOTIFICATIONS);

  const dropdownRef = useRef(null);
  const notifRef    = useRef(null);
  const navigate    = useNavigate();

  const session  = getSession();
  const userName = session?.name || "User";
  const userRole = session?.role
    ? session.role.charAt(0).toUpperCase() + session.role.slice(1)
    : "Guest";
  const initial  = userName.charAt(0).toUpperCase();
  const avatarBg = {
    researcher:         "#1f7a1f",
    evaluator:          "#391676",
    admin:              "#f59e0b",
    approver:           "#141617",
    rde_division_chief: "#391676",
    campus_director:    "#391676",
    vprie:              "#141617",
    president:          "#141617",
  }[session?.role] || "#1f7a1f";

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current    && !notifRef.current.contains(e.target))    setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout  = () => { clearSession(); navigate("/login"); };
  const markAllRead   = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const markRead      = id => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss       = id => setNotifications(p => p.filter(n => n.id !== id));

  return (
    <>
      {/* ── sticky topbar ── */}
      <div style={{
        position:     "sticky",   /* sticks to top while page content scrolls underneath */
        top:          0,
        zIndex:       50,
        height:       90,
        background:   "#fff",
        borderBottom: "1px solid #e5e7eb",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        padding:      "0 28px",
        flexShrink:   0,
        boxShadow:    "0 1px 4px rgba(0,0,0,0.06)",
      }}>
        {/* Left — title */}
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#111827", lineHeight: 1.2 }}>{title}</h1>
          <p  style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>Research Project Proposal Management System</p>
        </div>

        {/* Right — bell + user */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

          {/* ── Notification Bell ── */}
          <div style={{ position: "relative" }} ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false); }}
              style={{
                position:   "relative",
                background: "none",
                border:     "none",
                cursor:     "pointer",
                padding:    6,
                display:    "flex",
                color:      "#6b7280",
              }}
            >
              <Bell size={21} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span style={{
                  position:   "absolute",
                  top:        2,
                  right:      2,
                  minWidth:   17,
                  height:     17,
                  borderRadius: 99,
                  background: "#ef4444",
                  color:      "#fff",
                  fontSize:   10,
                  fontWeight: 700,
                  display:    "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding:    "0 4px",
                  lineHeight: 1,
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {notifOpen && (
              <div style={{
                position:   "absolute",
                top:        "calc(100% + 10px)",
                right:      0,
                width:      340,
                background: "#fff",
                border:     "1px solid #e5e7eb",
                borderRadius: 14,
                boxShadow:  "0 8px 30px rgba(0,0,0,0.12)",
                zIndex:     200,
                overflow:   "hidden",
              }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px 10px", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>Notifications</p>
                    {unreadCount > 0 && <p style={{ margin: "2px 0 0", fontSize: 12, color: "#6b7280" }}>{unreadCount} unread</p>}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#f59e0b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <CheckCheck size={14} /> Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div style={{ maxHeight: 320, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "32px 16px", textAlign: "center" }}>
                      <Bell size={28} color="#d1d5db" style={{ margin: "0 auto 8px", display: "block" }} />
                      <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n.id)}
                        style={{
                          display:    "flex",
                          alignItems: "flex-start",
                          gap:        10,
                          padding:    "11px 16px",
                          cursor:     "pointer",
                          background: n.read ? "#fff" : "#fffbeb",
                          borderBottom: "1px solid #f9fafb",
                          transition: "background 0.12s",
                        }}
                      >
                        {/* dot */}
                        <div style={{ paddingTop: 5, flexShrink: 0 }}>
                          <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: TYPE_DOT[n.type] || "#9ca3af" }} />
                        </div>
                        {/* text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: n.read ? 400 : 600, color: n.read ? "#6b7280" : "#111827" }}>{n.title}</span>
                            <span style={{ fontSize: 11, color: "#9ca3af", whiteSpace: "nowrap", flexShrink: 0 }}>{n.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>{n.message}</p>
                        </div>
                        {/* dismiss */}
                        <button
                          onClick={e => { e.stopPropagation(); dismiss(n.id); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9ca3af", flexShrink: 0, display: "flex" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                    <button onClick={() => setNotifications([])}
                      style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                      Clear all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── User dropdown ── */}
          <div style={{ position: "relative" }} ref={dropdownRef}>
            <div
              onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
                <strong style={{ fontSize: 13, color: "#111827", lineHeight: 1.3 }}>{userName}</strong>
                <small  style={{ fontSize: 11, color: "#6b7280" }}>{userRole}</small>
              </div>
              <div style={{
                width:          36,
                height:         36,
                borderRadius:   "50%",
                background:     avatarBg,
                color:          "#fff",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontWeight:     700,
                fontSize:       15,
                flexShrink:     0,
              }}>
                {initial}
              </div>
            </div>

            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{
                position:     "absolute",
                top:          "calc(100% + 10px)",
                right:        0,
                minWidth:     180,
                background:   "#fff",
                border:       "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow:    "0 8px 24px rgba(0,0,0,0.1)",
                zIndex:       200,
                overflow:     "hidden",
              }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <strong style={{ fontSize: 13, color: "#111827", display: "block" }}>{userName}</strong>
                  <small  style={{ fontSize: 11, color: "#6b7280" }}>{userRole}</small>
                </div>
                {/* View Profile */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    const role = session?.role || "researcher";
                    const profileRoutes = {
                      researcher: "/researcher/profile",
                      admin:      "/admin/profile",
                      approver:   "/approver/profile",
                      rde_division_chief: "/approver/profile",
                      campus_director:    "/approver/profile",
                      vprie:              "/approver/profile",
                      president:          "/approver/profile",
                      evaluator:  "/evaluator/profile",
                    };
                    navigate(profileRoutes[role] || "/researcher/profile");
                  }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                    padding: "11px 16px", border: "none", background: "none",
                    cursor: "pointer", fontSize: 13, color: "#374151",
                    fontWeight: 500, textAlign: "left",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <UserCircle size={15} color="#6b7280" /> View Profile
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    width:   "100%",
                    display: "flex",
                    alignItems: "center",
                    gap:     8,
                    padding: "11px 16px",
                    border:  "none",
                    background: "none",
                    cursor:  "pointer",
                    fontSize: 13,
                    color:   "#dc2626",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}