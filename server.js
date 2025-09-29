// server.js
import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// --- Config / sanity checks ---
const SUPABASE_URL = "https://hsnrrqwanpphrjaurmho.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;
if (!SUPABASE_KEY) {
  console.warn(
    "⚠️  SUPABASE_KEY is not set. Make sure your .env has SUPABASE_KEY (service role key)."
  );
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// JWT secret: support both JWT_SECRET and SECRET_KEY env names
const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY || "secretkey";

// --- Helper: remove sensitive fields from user objects ---
const hidePassword = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

// --- Test connection at startup (non-blocking) ---
async function testSupabaseConnection() {
  try {
    // use a lightweight query
    const { data, error } = await supabase.from("users").select("user_id").limit(1);
    if (error) throw error;
    console.log("✅ Connected to Supabase successfully!");
  } catch (err) {
    console.error("❌ Supabase connection failed:", err.message || err);
  }
}
testSupabaseConnection();

// --------------------- MIDDLEWARE ---------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied (no token)" });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    // keep a lightweight user representation in req.user
    req.user = payload;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

// --------------------- AUTH ROUTES ---------------------

// Register user
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, faculty_id } = req.body;

    // Basic validation
    if (!name || !email || !password || !role || typeof faculty_id === "undefined") {
      return res.status(400).json({ error: "All fields are required: name,email,password,role,faculty_id" });
    }

    // Check duplicate email
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing email:", checkError);
      return res.status(500).json({ error: "Database error while checking email" });
    }
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert and return inserted row(s)
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role, faculty_id }])
      .select(); // request returning rows

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: error.message || "Failed to register user" });
    }

    // return the created user without password
    const createdUser = Array.isArray(data) && data.length ? hidePassword(data[0]) : null;
    res.status(201).json({ message: "User registered", user: createdUser });
  } catch (err) {
    console.error("Register route error:", err);
    res.status(500).json({ error: err.message || "Server error during registration" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      console.error("Login lookup error:", error);
      return res.status(500).json({ error: "Database error during login" });
    }
    if (!data) return res.status(401).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, data.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { user_id: data.user_id, role: data.role, email: data.email },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, role: data.role });
  } catch (err) {
    console.error("Login route error:", err);
    res.status(500).json({ error: err.message || "Server error during login" });
  }
});

// Get all users (safe: hide passwords)
app.get("/users", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    // hide password before returning
    const safe = Array.isArray(data) ? data.map(hidePassword) : [];
    res.json(safe);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
});

// --------------------- REPORTS ---------------------

// Add report (Lecturer only)
app.post("/reports", authenticateToken, authorizeRoles("Lecturer"), async (req, res) => {
  try {
    const { class_name, topic, recommendations } = req.body;
    const lecturer_id = req.user.user_id;

    if (!class_name || !topic) {
      return res.status(400).json({ error: "class_name and topic are required" });
    }

    const { data, error } = await supabase
      .from("reports")
      .insert([{ class_name, topic, recommendations, lecturer_id }])
      .select();

    if (error) {
      console.error("Insert report error:", error);
      return res.status(500).json({ error: error.message || "Failed to add report" });
    }

    res.status(201).json({ message: "Report added", report: Array.isArray(data) ? data[0] : data });
  } catch (err) {
    console.error("Add report error:", err);
    res.status(500).json({ error: err.message || "Server error adding report" });
  }
});

// Get all reports (authenticated)
app.get("/reports", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch reports" });
  }
});

// PRL adds feedback
app.put("/reports/:id/feedback", authenticateToken, authorizeRoles("PRL"), async (req, res) => {
  try {
    const { feedback } = req.body;
    const { id } = req.params;

    if (!feedback) return res.status(400).json({ error: "Feedback is required" });

    const { error } = await supabase
      .from("reports")
      .update({ prl_feedback: feedback })
      .eq("report_id", id);

    if (error) throw error;
    res.json({ message: "Feedback added" });
  } catch (err) {
    console.error("Add feedback error:", err);
    res.status(500).json({ error: err.message || "Failed to add feedback" });
  }
});

// Lecturer dashboard
app.get("/lecturer-dashboard", authenticateToken, authorizeRoles("Lecturer"), async (req, res) => {
  try {
    const lecturerId = req.user.user_id;

    const { data: reports, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("lecturer_id", lecturerId);

    if (reportError) throw reportError;

    // Adjust the select to match your schema; here we request lecturer_ratings
    const { data: ratings, error: ratingError } = await supabase
      .from("lecturer_ratings")
      .select("*")
      .eq("lecturer_id", lecturerId)
      .order("created_at", { ascending: false });

    if (ratingError) throw ratingError;

    res.json({ reports, ratings });
  } catch (err) {
    console.error("Lecturer dashboard error:", err);
    res.status(500).json({ error: err.message || "Failed to load lecturer dashboard" });
  }
});

// --------------------- RATINGS ---------------------

// Student rates lecturer
app.post("/rate", authenticateToken, authorizeRoles("Student"), async (req, res) => {
  try {
    const { lecturer_id, rating, comment } = req.body;
    const student_id = req.user.user_id;

    if (!lecturer_id || !rating) return res.status(400).json({ error: "lecturer_id and rating are required" });

    const { error } = await supabase
      .from("lecturer_ratings")
      .insert([{ lecturer_id, student_id, rating, comment }]);

    if (error) throw error;
    res.json({ message: "Rating submitted" });
  } catch (err) {
    console.error("Rate error:", err);
    res.status(500).json({ error: err.message || "Failed to submit rating" });
  }
});

// Get average ratings (RPC)
app.get("/ratings", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("get_average_ratings");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get ratings error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch ratings" });
  }
});

// --------------------- COURSE ASSIGNMENTS (PL) ---------------------

// Assign course to lecturer
app.post("/assign-course", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { course_id, lecturer_id } = req.body;
    const assigned_by = req.user.user_id;

    if (!course_id || !lecturer_id) return res.status(400).json({ error: "course_id and lecturer_id required" });

    const { error } = await supabase
      .from("course_assignments")
      .insert([{ course_id, lecturer_id, assigned_by }]);

    if (error) throw error;
    res.json({ message: "Course assigned" });
  } catch (err) {
    console.error("Assign course error:", err);
    res.status(500).json({ error: err.message || "Failed to assign course" });
  }
});

// View all assignments (PL only)
app.get("/assignments", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course_assignments")
      .select("assignment_id, assigned_at, courses(course_name, course_code), users(name)")
      .order("assigned_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Get assignments error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch assignments" });
  }
});

// --------------------- SERVER START ---------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
