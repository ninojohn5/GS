import Navbar  from "../../components/evaluator/Navbar"; 
import Topbar  from "../../components/Topbar";
import ProfileForm from "../../components/ProfileForm";

export default function EvaluatorProfile() {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="main-content">
        <Topbar title="My Profile" />
        <div className="dashboard-content">
          <ProfileForm accentColor="#391676" />
        </div>
      </div>
    </div>
  );
}