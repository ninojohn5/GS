// src/pages/approver/Profile.jsx
import { useState } from "react";
import ApproverNavbar from "../../components/approver/navbar";
import Topbar         from "../../components/Topbar";
import ProfileForm    from "../../components/ProfileForm";

export default function ApproverProfile() {
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isMobile = window.innerWidth < 768;

  return (
    <>
      <style>{`
        @media (max-width: 768px) { .apr-profile-content { margin-left: 0 !important; } }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
        <ApproverNavbar onWidthChange={setSidebarWidth} />
        <div
          className="apr-profile-content"
          style={{
            marginLeft: isMobile ? 0 : sidebarWidth,
            flex: 1, display: "flex", flexDirection: "column",
            transition: "margin-left 0.22s ease", minWidth: 0,
          }}>
          <Topbar title="My Profile" />
          <div style={{ padding: "24px", flex: 1 }}>
            <ProfileForm accentColor="#141617" />
          </div>
        </div>
      </div>
    </>
  );
}   