import { Routes, Route, Navigate } from "react-router-dom";
import StudentLogin from "./pages/StudentLogin.jsx";
import Ballot from "./pages/Ballot.jsx";
import Results from "./pages/Results.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StudentLogin />} />
      <Route path="/vote" element={<Ballot />} />
      <Route path="/results" element={<Results />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
