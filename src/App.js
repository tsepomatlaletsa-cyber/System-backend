import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import LecturerDashboard from "./LecturerDashboard";
import StudentDashboard from "./StudentDashboard";
import PRLDashboard from "./PRLDashboard";
import PLDashboard from "./PLDashboard";
import ReportsPage from "./ReportsPage";

function App() {
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  const handleLogin = (userRole) => {
    setRole(userRole);
    localStorage.setItem("role", userRole);
  };

  return (
    <Router>
     
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/dashboard"
          element={
            role === "Lecturer" ? (
              <LecturerDashboard />
            ) : role === "Student" ? (
              <StudentDashboard />
            ) : role === "PRL" ? (
              <PRLDashboard />
            ) : role === "PL" ? (
              <PLDashboard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
