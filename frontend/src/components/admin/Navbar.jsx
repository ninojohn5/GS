import {
  LayoutDashboard,
  Users,
  ClipboardList,
  FileText,
  BarChart2,
  FolderOpen,
  User,           
  Menu,
  X,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import logo from "../../assets/logo.png";
import { getSession, clearSession } from "../../utils/auth";


const MENU = [
  { name: "Dashboard",            icon: LayoutDashboard, path: "/admin/dashboard"  },
  { name: "Faculty Management",   icon: Users,           path: "/admin/faculty"    },
  { name: "Evaluator Management", icon: ClipboardList,   path: "/admin/evaluators" },
  { name: "Proposals Management", icon: FileText,        path: "/admin/proposals"  },
  { name: "Projects Management",  icon: FolderOpen,      path: "/admin/projects"   },
  { name: "Reports",              icon: BarChart2,       path: "/admin/reports"    },
  { name: "Profile",              icon: User,            path: "/admin/profile"    },
];

const ACTIVE_BG    = "#f59e0b";
const ACTIVE_COLOR = "#fff";

export default function AdminNavbar({ onWidthChange }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768);

  const session  = getSession?.() || {};
  const userName = session?.name      || "Admin";
  const userRole = session?.role_label || "Admin";
  const initial  = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (onWidthChange) {
      if (isMobile)       onWidthChange(0);
      else if (collapsed) onWidthChange(72);
      else                onWidthChange(240);
    }
  }, [isMobile, collapsed, onWidthChange]);

  const handleLogout = () => {
    if (typeof clearSession === "function") clearSession();
    else localStorage.removeItem("session");
    navigate("/login");
  };

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  /* ── Sidebar body ─────────────────────────────────── */
  const SidebarBody = () => (
    <div style={{
      width:         isMobile ? 240 : collapsed ? 72 : 240,
      height:        "100vh",
      background:    "#fff",
      borderRight:   "1px solid #e5e7eb",
      display:       "flex",
      flexDirection: "column",
      overflow:      "hidden",
      transition:    "width 0.22s ease",
      flexShrink:    0,
    }}>

      {/* Brand */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        gap:            10,
        padding:        collapsed && !isMobile ? "18px 0" : "16px 16px",
        justifyContent: collapsed && !isMobile ? "center" : "flex-start",
        borderBottom:   "1px solid #f1f5f9",
        flexShrink:     0,
      }}>
        <img src={logo} alt="logo"
          style={{ width: 60, height: 60, objectFit: "contain", flexShrink: 0 }}
          onError={e => { e.target.style.display = "none"; }} />
        {(!collapsed || isMobile) && (
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#111827" }}>Research PMS</p>
            <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{userRole}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{
        flex: 1, padding: "18px 10px",
        display: "flex", flexDirection: "column", gap: 6,
        overflowY: "auto", overflowX: "hidden",
      }}>
        {MENU.map(({ name, icon: Icon, path }) => {
          if (!Icon) return null;
          const active = location.pathname === path || location.pathname.startsWith(path + "/");
          return (
            <button key={path}
              title={collapsed && !isMobile ? name : undefined}
              onClick={() => handleNav(path)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding:        collapsed && !isMobile ? "10px 0" : "10px 14px",
                justifyContent: collapsed && !isMobile ? "center" : "flex-start",
                borderRadius: 8, border: "none",
                background: active ? ACTIVE_BG : "transparent",
                cursor: "pointer", transition: "background 0.15s", flexShrink: 0,
              }}>
              <Icon size={20} color={active ? ACTIVE_COLOR : "#6b7280"} strokeWidth={1.8} />
              {(!collapsed || isMobile) && (
                <span style={{
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  color: active ? ACTIVE_COLOR : "#374151", whiteSpace: "nowrap",
                }}>
                  {name}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding:        collapsed && !isMobile ? "12px 0" : "12px 16px",
        justifyContent: collapsed && !isMobile ? "center" : "flex-start",
        borderTop: "1px solid #f1f5f9", flexShrink: 0, overflow: "hidden",
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: ACTIVE_BG, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 13, flexShrink: 0,
        }}>
          {initial}
        </div>
        {(!collapsed || isMobile) && (
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#111827",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {userName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#6b7280" }}>{userRole}</p>
          </div>
        )}
      </div>

      {/* Collapse button */}
      {!isMobile && (
        <div style={{ padding: "8px 12px 14px", flexShrink: 0 }}>
          <button onClick={() => setCollapsed(c => !c)}
            title={collapsed ? "Expand" : "Collapse"}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              padding: "9px 0", borderRadius: 9, border: "1px solid #e5e7eb",
              background: "#f9fafb", cursor: "pointer",
              fontSize: 16, color: "#374151", fontWeight: 500, transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
            onMouseLeave={e => e.currentTarget.style.background = "#f9fafb"}>
            {collapsed ? "☰" : "←"}
          </button>
        </div>
      )}
    </div>
  );

  /* Mobile */
  if (isMobile) return (
    <>
      <button onClick={() => setMobileOpen(o => !o)}
        style={{
          position: "fixed", top: 14, left: 14, zIndex: 300,
          width: 38, height: 38, borderRadius: 9,
          border: "1px solid #e5e7eb", background: "#fff",
          cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>
        {mobileOpen ? <X size={20} color="#374151" /> : <Menu size={20} color="#374151" />}
      </button>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200 }} />
      )}

      <div style={{
        position: "fixed", top: 0, left: mobileOpen ? 0 : -260,
        zIndex: 250, height: "100vh", transition: "left 0.25s ease",
        boxShadow: mobileOpen ? "4px 0 20px rgba(0,0,0,0.15)" : "none",
      }}>
        <SidebarBody />
      </div>
    </>
  );

  /* Desktop */
  return (
    <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 100 }}>
      <SidebarBody />
    </div>
  );
}