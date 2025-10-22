import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import jImage from "./j.jpg";
import Navbar from "./Navbar";

function Home() {
  return (
    <div
      style={{
        backgroundImage: `url(${jImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        color: "white",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.55)",
          position: "absolute",
          width: "100%",
          height: "100%",
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

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        style={{
          zIndex: 2,
          marginTop: "120px",
          background: "rgba(255,255,255,0.1)",
          padding: "40px 50px",
          borderRadius: "20px",
          backdropFilter: "blur(2px)",
          width: "90%",
          maxWidth: "850px",
        }}
      >
        <h1 style={{ fontWeight: "bold", marginBottom: "10px" }}>
          Limkokwing University Portal
        </h1>
        <p style={{ fontSize: "1.2rem", marginBottom: "30px" }}>
          Creativity & Innovation at the Heart of Education
        </p>

        <h3 className="fw-semibold mb-4">Select Your Role</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {["Student", "Lecturer", "PRL", "PL"].map((role) => (
            <motion.div
              whileHover={{ scale: 1.05 }}
              key={role}
              style={{
                background: "rgba(0,0,0,0.7)",
                borderRadius: "12px",
                padding: "25px 30px",
                minWidth: "180px",
                color: "white",
                boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
              }}
            >
              <h4 style={{ fontWeight: "bold" }}>{role}</h4>
              <p style={{ fontSize: "0.9rem" }}>Access your dashboard</p>
              <Link
                to="/login"
                style={{
                  display: "inline-block",
                  backgroundColor: "#00bfff",
                  color: "white",
                  borderRadius: "8px",
                  padding: "6px 18px",
                  textDecoration: "none",
                  marginTop: "10px",
                }}
              >
                Login
              </Link>
            </motion.div>
          ))}
        </div>

        <p style={{ marginTop: "30px" }}>
          Don't have an account?{" "}
          <Link
            to="/register"
            style={{
              color: "#00bfff",
              fontWeight: "bold",
              textDecoration: "underline",
            }}
          >
            Register Here
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
          zIndex: 2,
          marginTop: "40px",
        }}
      >
        © {new Date().getFullYear()} Limkokwing University of Creative
        Technology. All Rights Reserved.
      </footer>
    </div>
  );
}

export default Home;
