import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";

// Researcher pages
import Dashboard from "./pages/researcher/Dashboard";
import ResearchProject from "./pages/researcher/Projects";
import CreateProposal from "./pages/researcher/Proposals";
import ProjectView from "./pages/researcher/ProjectView";
import TeamManagement from "./pages/researcher/Team";
import Outputs from "./pages/researcher/Outputs";
import OutputsDetail from "./pages/researcher/OutputsDetail";
import StatusTracking from "./pages/researcher/StatusTracking";
import Profile from "./pages/researcher/Profile";

// Evaluator pages
import EvaluatorDashboard from "./pages/evaluator/Dashboard";
import Evaluations from "./pages/evaluator/Evaluations";
// import EvaluatorStatusTracking from "./pages/evaluator/StatusTracking";
import EvaluatorProfile from "./pages/evaluator/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFaculty from "./pages/admin/Faculty";
import AdminEvaluators from "./pages/admin/evaluators";
import AdminProposals from "./pages/admin/Proposals";
import AdminProjects from "./pages/admin/Projects";
import AdminReports from "./pages/admin/Reports";
import AdminProfile from "./pages/admin/Profile";

// Approver pages
import ApproverDashboard from "./pages/approver/Dashboard";
import ApproverPage from "./pages/approver/Approvals";
import ApproverProfile from "./pages/approver/Profile";

import "./App.css";

const getUserRole = () => localStorage.getItem("role");

const ProtectedRoute = ({ children, allowedRoles }) => {
  const role = getUserRole();
  if (!role) return <Navigate to="/login" />;
  if (!allowedRoles.includes(role)) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>

        {/* AUTH */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/profile" element={<Profile />} />

        {/* RESEARCHER */}
        <Route path="/researcher/dashboard" element={<ProtectedRoute allowedRoles={["researcher"]}><Dashboard /></ProtectedRoute>} />
        <Route path="/researcher/projects"  element={<ProtectedRoute allowedRoles={["researcher"]}><ResearchProject /></ProtectedRoute>} />
        <Route path="/researcher/proposals" element={<ProtectedRoute allowedRoles={["researcher"]}><CreateProposal /></ProtectedRoute>} />
        <Route path="/researcher/projects/:id" element={<ProtectedRoute allowedRoles={["researcher"]}><ProjectView /></ProtectedRoute>} />
        <Route path="/researcher/team"      element={<ProtectedRoute allowedRoles={["researcher"]}><TeamManagement /></ProtectedRoute>} />
        <Route path="/researcher/outputs"   element={<ProtectedRoute allowedRoles={["researcher"]}><Outputs /></ProtectedRoute>} />
        <Route path="/researcher/outputs/:id" element={<ProtectedRoute allowedRoles={["researcher"]}><OutputsDetail /></ProtectedRoute>} />
        <Route path="/researcher/status-tracking" element={<ProtectedRoute allowedRoles={["researcher"]}><StatusTracking /></ProtectedRoute>} />

        {/* EVALUATOR */}
        <Route path="/evaluator/dashboard"       element={<ProtectedRoute allowedRoles={["evaluator"]}><EvaluatorDashboard /></ProtectedRoute>} />
        <Route path="/evaluator/evaluations"     element={<ProtectedRoute allowedRoles={["evaluator"]}><Evaluations /></ProtectedRoute>} />
        <Route path="/evaluator/profile"         element={<ProtectedRoute allowedRoles={["evaluator"]}><EvaluatorProfile /></ProtectedRoute>} />

        {/* ADMIN */}
        <Route path="/admin/dashboard"  element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/faculty"    element={<ProtectedRoute allowedRoles={["admin"]}><AdminFaculty /></ProtectedRoute>} />
        <Route path="/admin/evaluators" element={<ProtectedRoute allowedRoles={["admin"]}><AdminEvaluators /></ProtectedRoute>} />
        <Route path="/admin/proposals"  element={<ProtectedRoute allowedRoles={["admin"]}><AdminProposals /></ProtectedRoute>} />
        <Route path="/admin/projects"   element={<ProtectedRoute allowedRoles={["admin"]}><AdminProjects /></ProtectedRoute>} />
        <Route path="/admin/reports"    element={<ProtectedRoute allowedRoles={["admin"]}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/profile"    element={<ProtectedRoute allowedRoles={["admin"]}><AdminProfile /></ProtectedRoute>} />

        {/* APPROVER — RDE Chief, Campus Director, VPRIE, President */}
        <Route path="/approver/dashboard" element={<ProtectedRoute allowedRoles={["rde_division_chief", "campus_director", "vprie", "president"]}><ApproverDashboard /></ProtectedRoute>} />
        <Route path="/approver/approvals" element={<ProtectedRoute allowedRoles={["rde_division_chief", "campus_director", "vprie", "president"]}><ApproverPage /></ProtectedRoute>} />
        <Route path="/approver/profile"   element={<ProtectedRoute allowedRoles={["rde_division_chief", "campus_director", "vprie", "president"]}><ApproverProfile /></ProtectedRoute>} />

        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<h1>404 - Page Not Found</h1>} />

      </Routes>
    </Router>
  );
}

export default App;