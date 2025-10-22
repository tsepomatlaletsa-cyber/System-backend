import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Limkokwing.jpg"; 

function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkStyle = (path) => ({
    color: location.pathname === path ? "#00bfff" : "white",
    textDecoration: "none",
    fontWeight: "500",
    margin: "0 15px",
    transition: "color 0.3s ease",
  });

  return (
    <nav
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        padding: "15px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={Logo}
          alt="Limkokwing University"
          style={{ width: "50px", height: "50px", borderRadius: "8px" }}
        />
        <h3 style={{ color: "white", margin: 0, fontWeight: "600" }}>
          Limkokwing Portal
        </h3>
      </div>

      {/* Hamburger button */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "white",
          fontSize: "1.8rem",
          cursor: "pointer",
        }}
        className="hamburger-btn"
      >
        &#9776;
      </button>

      {/* Links */}
      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
        className={`nav-links ${menuOpen ? "open" : ""}`}
      >
        <Link to="/" style={linkStyle("/")}>Home</Link>
        <Link to="/login" style={linkStyle("/login")}>Login</Link>
        <Link to="/register" style={linkStyle("/register")}>Register</Link>
      </div>

      {/* Inline styles for responsive behavior */}
      <style>
        {`
          @media (max-width: 768px) {
            .hamburger-btn {
              display: block;
            }
            .nav-links {
              display: ${menuOpen ? "flex" : "none"};
              flex-direction: column;
              width: 100%;
              margin-top: 10px;
              background: rgba(0,0,0,0.8);
              border-radius: 8px;
              padding: 10px 0;
            }
            .nav-links a {
              margin: 10px 0;
            }
          }
        `}
      </style>
    </nav>
  );
}

export default Navbar;
