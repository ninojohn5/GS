import { LayoutDashboard, ClipboardCheck, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import logo from "../../assets/logo.png";
import { getSession } from "../../utils/auth";

export default function EvaluatorNavbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const session  = getSession();
  const userName = session?.name || "Evaluator";
  const initial  = userName.charAt(0).toUpperCase();

  const menu = [
    { name: "Dashboard",       icon: <LayoutDashboard size={20} />, path: "/evaluator/dashboard" },
    { name: "Evaluations",     icon: <ClipboardCheck size={20} />,  path: "/evaluator/evaluations" },
    { name: "Profile",   icon: <User size={20} />,       path: "/evaluator/profile" },

  ];

  return (
    <div className={`ev-sidebar ${collapsed ? "collapsed" : ""}`}>

      {/* Header */}
      <div className="ev-sidebar-header">
        <img src={logo} alt="logo" className="logo-img" />
        {!collapsed && (
          <div className="header-text">
            <h2>Research PMS</h2>
            <p>Evaluator</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <ul className="ev-sidebar-menu">
        {menu.map((item, i) => (
          <li
            key={i}
            className={location.pathname === item.path ? "active" : ""}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {!collapsed && <span>{item.name}</span>}
          </li>
        ))}
      </ul>

      {/* User at bottom */}
      {!collapsed && (
        <div className="ev-sidebar-user">
          <div
            className="ev-avatar-circle"
            style={{ background: "#391676" }}
          >
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
              {initial}
            </span>
          </div>
          <div>
            <strong>{userName}</strong>
            <small>Evaluator</small>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="ev-sidebar-footer">
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? "☰" : "←"}
        </button>
      </div>
    </div>
  );
}
