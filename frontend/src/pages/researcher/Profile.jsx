// src/pages/researcher/Profile.jsx
import Navbar  from "../../components/researcher/Navbar";
import Topbar  from "../../components/Topbar";
import "../../styles/researcher.css";
import ProfileForm from "../../components/ProfileForm";

export default function ResearcherProfile() {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="main-content">
        <Topbar title="My Profile" />
        <div className="dashboard-content">
          <ProfileForm accentColor="#1f7a1f" />
        </div>
      </div>
    </div>
  );
}