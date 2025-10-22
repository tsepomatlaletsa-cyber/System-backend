import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";

function Login({ onLogin }) {
  const [emailOrName, setEmailOrName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDemoRoles, setShowDemoRoles] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e, demo = false, role = null) => {
    e.preventDefault();
    setLoading(true);

    try {
      let credentials;

      if (demo) {
        switch (role) {
          case "student":
            credentials = { emailOrName: "student@limkokwing.edu.ls", password: "demo123" };
            break;
          case "lecturer":
            credentials = { emailOrName: "lecturer@limkokwing.edu.ls", password: "demo123" };
            break;
          case "PL":
            credentials = { emailOrName: "admin@limkokwing.edu.ls", password: "demo123" };
            break;
          case "PRL":
            credentials = { emailOrName: "prl@limkokwing.edu.ls", password: "demo123" };
            break;
          default:
            credentials = { emailOrName: "demo@limkokwing.edu.ls", password: "demo123" };
        }
      } else {
        credentials = { emailOrName, password };
      }

      const res = await axios.post(
        "https://system-backend-2-ty55.onrender.com/login",
        credentials
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("email", res.data.email);
      localStorage.setItem("user_id", res.data.user_id);

      onLogin(res.data.role);
      navigate("/dashboard");
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
      setShowDemoRoles(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        backgroundImage:
          "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1400&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        flexDirection: "column",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.55)",
          zIndex: 0,
        }}
      ></div>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 3,
          width: "100%",
        }}
      >
        <Navbar />
      </div>



      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          position: "relative",
          zIndex: 2,
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "40px 50px",
          width: "90%",
          maxWidth: "450px",
          textAlign: "center",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontWeight: "bold", marginBottom: "10px" }}
        >
          Limkokwing University Portal
        </motion.h2>
        <p style={{ marginBottom: "30px" }}>Sign in to continue to your dashboard</p>

        {/* Login Form */}
        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Email or Username</label>
            <input
              type="text"
              className="form-control rounded-3 border-0 shadow-sm"
              value={emailOrName}
              onChange={(e) => setEmailOrName(e.target.value)}
              placeholder="Enter your email or username"
              required
            />
          </div>

          <div className="mb-4 text-start">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-3 border-0 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="btn w-100 mb-3"
            style={{
              backgroundColor: "#00bfff",
              color: "white",
              fontWeight: "600",
              borderRadius: "8px",
            }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            type="button"
            className="btn w-100 mb-3"
            style={{
              backgroundColor: "transparent",
              border: "2px solid #00bfff",
              color: "white",
              fontWeight: "600",
              borderRadius: "8px",
            }}
            onClick={() => setShowDemoRoles(!showDemoRoles)}
            disabled={loading}
          >
            🎯 Try Live Demo
          </motion.button>
        </form>
        

        {/* Demo Roles */}
        <AnimatePresence>
          {showDemoRoles && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4"
            >
              <p>Select a demo role:</p>
              <div className="d-flex flex-wrap gap-2 justify-content-center">
                {["student", "lecturer", "PL", "PRL"].map((role) => (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    key={role}
                    className="btn btn-sm fw-semibold"
                    style={{
                      minWidth: "95px",
                      backgroundColor: "white",
                      color: "black",
                    }}
                    onClick={(e) => handleSubmit(e, true, role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4">
          Don’t have an account?{" "}
          <Link
            to="/register"
            style={{ color: "#00bfff", fontWeight: "bold", textDecoration: "underline" }}
          >
            Register here
          </Link>
        </p>
      </motion.div>

      {/* Footer */}
      <footer
        style={{
          background: "rgba(0,0,0,0.7)",
          width: "100%",
          textAlign: "center",
          padding: "15px 0",
          fontSize: "0.9rem",
          marginTop: "40px",
          zIndex: 2,
          color: "white",
        }}
      >
        © {new Date().getFullYear()} Limkokwing University Portal. All Rights Reserved.
      </footer>
    </div>
  );
}

export default Login;
