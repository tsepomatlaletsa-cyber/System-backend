import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Student");
  const [facultyId, setFacultyId] = useState("");
  const [classId, setClassId] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("https://system-backend-2-ty55.onrender.com/faculties")
      .then((res) => setFaculties(res.data))
      .catch((err) => console.error("Failed to load faculties", err));

    axios
      .get("https://system-backend-2-ty55.onrender.com/classes")
      .then((res) => setClasses(res.data))
      .catch((err) => console.error("Failed to load classes", err));
  }, []);

  useEffect(() => {
    if (role !== "Student") setClassId("");
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === "Student" && !classId) {
      alert("Please select a class for Student role");
      return;
    }

    setLoading(true);
    try {
      await axios.post("https://system-backend-2-ty55.onrender.com/register", {
        name,
        email,
        password,
        role,
        faculty_id: facultyId,
        class_id: role === "Student" ? classId : null,
      });

      alert("Registration successful! Redirecting to login...");
      navigate("/"); // redirect to login
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
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

      {/* Register Card */}
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
          style={{ fontWeight: "bold", marginBottom: "20px" }}
        >
          Create Your Account
        </motion.h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Name</label>
            <input
              type="text"
              className="form-control rounded-3 border-0 shadow-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Email</label>
            <input
              type="email"
              className="form-control rounded-3 border-0 shadow-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control rounded-3 border-0 shadow-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a secure password"
              required
            />
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Role</label>
            <select
              className="form-select rounded-3 border-0 shadow-sm"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="Student">Student</option>
              <option value="Lecturer">Lecturer</option>
              <option value="PRL">PRL</option>
              <option value="PL">PL</option>
            </select>
          </div>

          <div className="mb-3 text-start">
            <label className="form-label fw-semibold">Faculty</label>
            <select
              className="form-select rounded-3 border-0 shadow-sm"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              required
            >
              <option value="">-- Select Faculty --</option>
              {faculties.map((f) => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.faculty_name}
                </option>
              ))}
            </select>
          </div>

          {role === "Student" && (
            <div className="mb-3 text-start">
              <label className="form-label fw-semibold">Class</label>
              <select
                className="form-select rounded-3 border-0 shadow-sm"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            type="submit"
            className="btn w-100 mb-3"
            style={{
              backgroundColor: "#00bfff",
              color: "white",
              fontWeight: "600",
              borderRadius: "8px",
            }}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </motion.button>
        </form>

        <p className="mt-4 text-center">
          Already have an account?{" "}
          <Link
            to="/"
            style={{ color: "#00bfff", fontWeight: "bold", textDecoration: "underline" }}
          >
            Login here
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

export default Register;
