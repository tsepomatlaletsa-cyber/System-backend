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

// --- Supabase config ---
const SUPABASE_URL = "https://hsnrrqwanpphrjaurmho.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// --- Helpers ---
const hidePassword = (user) => {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
};

function authenticateToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

// --- Supabase connection test ---
(async () => {
  const { data, error } = await supabase.from("users").select("user_id").limit(1);
  if (error) console.error("❌ DB connect fail:", error.message);
  else console.log("✅ Connected to Supabase");
})();

// ----------------- AUTH -----------------
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role, faculty_id, class_id } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role || !faculty_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from("users")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();
    if (existing) return res.status(409).json({ error: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into users table
    const { data: user, error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashedPassword, role, faculty_id }])
      .select()
      .single();
    if (error) throw error;

    // Insert into role-specific table
    switch (role) {
      case "Student":
        if (!class_id) return res.status(400).json({ error: "Class is required for students" });
        await supabase.from("students").insert([{ user_id: user.user_id, faculty_id, class_id }]);
        break;
      case "Lecturer":
        await supabase.from("lecturers").insert([{ user_id: user.user_id, faculty_id }]);
        break;
      case "PRL":
        await supabase.from("prls").insert([{ user_id: user.user_id, faculty_id }]);
        break;
      case "PL":
        await supabase.from("pls").insert([{ user_id: user.user_id, faculty_id }]);
        break;
      default:
        return res.status(400).json({ error: "Invalid role" });
    }

    // Get faculty name for returning in response
    const { data: faculty } = await supabase
      .from("faculties")
      .select("faculty_name")
      .eq("faculty_id", faculty_id)
      .single();

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name, faculty_id: user.faculty_id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return user info with faculty name
    res.status(201).json({
      message: "User registered",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        faculty: faculty?.faculty_name || null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/faculties", async (req, res) => {
  try {
    const { data, error } = await supabase.from("faculties").select("*");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch faculties" });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { emailOrName, password } = req.body;
    if (!emailOrName || !password) return res.status(400).json({ error: "Email/Name and password required" });

    const { data: users } = await supabase
      .from("users")
      .select("*")
      .or(`email.eq.${emailOrName},name.eq.${emailOrName}`)
      .limit(1);

    if (!users || users.length === 0) return res.status(404).json({ error: "User not found" });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name, faculty_id: user.faculty_id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, user_id: user.user_id, role: user.role, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- REPORTS -----------------
// ----------------- REPORTS -----------------
app.post("/reports", authenticateToken, authorizeRoles("Lecturer"), async (req, res) => {
  try {
    const {
      faculty_id,
      class_id,
      week_of_reporting,
      date_of_lecture,
      course_id,
      students_present,
      total_students,
      venue,
      lecture_time,
      topic,
      learning_outcomes,
      recommendations
    } = req.body;

    // Fetch course name/code
    const { data: course } = await supabase
      .from("courses")
      .select("*")
      .eq("course_id", course_id)
      .maybeSingle();

    // Fetch class name
    const { data: classData } = await supabase
      .from("classes")
      .select("class_name")
      .eq("class_id", class_id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("reports")
      .insert([{
        faculty_id: faculty_id || req.user.faculty_id,
        class_id,
        class_name: classData?.class_name || "", // <-- include class_name
        week_of_reporting,
        date_of_lecture,
        course_name: course?.course_name || "",
        course_code: course?.course_code || "",
        lecturer_name: req.user.name,
        students_present,
        total_students,
        venue,
        lecture_time,
        topic,
        learning_outcomes,
        recommendations,
        lecturer_id: req.user.user_id
      }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Report added", report: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/reports/:id", authenticateToken, authorizeRoles("Lecturer"), async (req, res) => {
  try {
    const reportId = req.params.id;
    const lecturerId = req.user.user_id;

    // Check if report exists and belongs to this lecturer
    const { data: existingReport, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("report_id", reportId)
      .eq("lecturer_id", lecturerId)
      .single();

    if (fetchError || !existingReport) {
      return res.status(404).json({ error: "Report not found or unauthorized" });
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from("reports")
      .delete()
      .eq("report_id", reportId)
      .eq("lecturer_id", lecturerId);

    if (deleteError) throw deleteError;

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("❌ Delete report error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


app.get("/reports", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select(`
        report_id,
        week_of_reporting,
        date_of_lecture,
        topic,
        learning_outcomes,
        recommendations,
        prl_feedback,
        students_present,
        total_students,
        venue,
        lecture_time,
        class_id,
        class_name,
        lecturer_id,
        lecturer_name,
        course_name,
        course_code
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map to ensure fallback values
    const reports = data.map(r => ({
      report_id: r.report_id,
      course_name: r.course_name || "Unknown Course",
      course_code: r.course_code || "N/A",
      class_name: r.class_name || "Unknown Class",
      lecturer_name: r.lecturer_name || "Unknown Lecturer",
      topic: r.topic || "N/A",
      date_of_lecture: r.date_of_lecture || "N/A",
      week_of_reporting: r.week_of_reporting || "N/A",
      prl_feedback: r.prl_feedback || "Pending",
      students_present: r.students_present ?? "N/A",
      total_students: r.total_students ?? "N/A",
      venue: r.venue || "N/A",
      lecture_time: r.lecture_time || "N/A",
      learning_outcomes: r.learning_outcomes || "N/A",
      recommendations: r.recommendations || "N/A",
    }));

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.put("/reports/:id/feedback", authenticateToken, authorizeRoles("PRL"), async (req, res) => {
  try {
    const { feedback } = req.body;
    const { id } = req.params;
    const { error } = await supabase
      .from("reports")
      .update({ prl_feedback: feedback })
      .eq("report_id", id);

    if (error) throw error;
    res.json({ message: "Feedback added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- COURSES -----------------
app.get("/courses", authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from("courses")
      .select("course_id, course_name, course_code, faculty_id, faculties(faculty_name)")
      .order("course_name", { ascending: true });

    if (req.user.role === "PRL") query = query.eq("faculty_id", req.user.faculty_id);

    const { data, error } = await query;
    if (error) throw error;

    // Map response to include faculty_name
    const mappedCourses = data.map(c => ({
      course_id: c.course_id,
      course_name: c.course_name,
      course_code: c.course_code,
      faculty_name: c.faculties?.faculty_name || "Unknown Faculty"
    }));

    res.json(mappedCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/courses", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { course_name, course_code } = req.body;
    const { data, error } = await supabase.from("courses").insert([{ course_name, course_code, faculty_id: req.user.faculty_id }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/courses/:id", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { id } = req.params;
    const { course_name, course_code } = req.body;

    // First, check if the course exists and belongs to this faculty
    const { data: existingCourse, error: fetchError } = await supabase
      .from("courses")
      .select("*")
      .eq("course_id", id)
      .eq("faculty_id", req.user.faculty_id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    // Update the course
    const { data: updatedCourse, error: updateError } = await supabase
      .from("courses")
      .update({ course_name, course_code })
      .eq("course_id", id)
      .eq("faculty_id", req.user.faculty_id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ message: "Course updated successfully", course: updatedCourse });
  } catch (err) {
    console.error("Update Course Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});




app.delete("/courses/:id", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if the course exists and belongs to this faculty
    const { data: existingCourse, error: fetchError } = await supabase
      .from("courses")
      .select("*")
      .eq("course_id", id)
      .eq("faculty_id", req.user.faculty_id)
      .single();

    if (fetchError || !existingCourse) {
      return res.status(404).json({ error: "Course not found or unauthorized" });
    }

    // Delete the course
    const { error: deleteError } = await supabase
      .from("courses")
      .delete()
      .eq("course_id", id)
      .eq("faculty_id", req.user.faculty_id);

    if (deleteError) throw deleteError;

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete Course Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- CLASSES -----------------


// Public endpoint to get all classes
app.get("/classes", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("class_id, class_name, year_of_study, description, faculty_id")
      .order("class_name", { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Failed to fetch classes:", err.message);
    res.status(500).json({ error: "Failed to fetch classes" });
  }
});





// ----------------- LECTURERS -----------------
app.get("/lecturers", authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("user_id, name, email, faculty_id").eq("role", "Lecturer");
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- RATINGS -----------------
app.post("/rate", authenticateToken, authorizeRoles("Student"), async (req, res) => {
  try {
    const { lecturer_id, rating, comment } = req.body;
    await supabase.from("lecturer_ratings").insert([{ lecturer_id, student_id: req.user.user_id, rating, comment }]);
    res.json({ message: "Rating submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/rate/:id", authenticateToken, authorizeRoles("Student"), async (req, res) => {
  try {
    const ratingId = req.params.id;
    const studentId = req.user.user_id;

    
    const { data: existingRating, error: fetchError } = await supabase
      .from("lecturer_ratings")
      .select("*")
      .eq("rating_id", ratingId)
      .eq("student_id", studentId)
      .single();

    if (fetchError || !existingRating) {
      return res.status(404).json({ error: "Rating not found or unauthorized" });
    }

    // Delete the rating
    const { error: deleteError } = await supabase
      .from("lecturer_ratings")
      .delete()
      .eq("rating_id", ratingId)
      .eq("student_id", studentId);

    if (deleteError) throw deleteError;

    res.json({ message: "Rating deleted successfully" });
  } catch (err) {
    console.error("❌ Delete rating error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ----------------- RATINGS -----------------
app.get("/ratings", authenticateToken, async (req, res) => {
  try {
    let query = supabase
      .from("lecturer_ratings")
      .select(`
        rating_id,
        rating,
        comment,
        created_at,
        lecturer:lecturer_id(user_id, name),
        student:student_id(user_id, name)
      `)
      .order("rating_id", { ascending: false });

    // 👇 If the user is a Student, show only their own ratings
    if (req.user.role === "Student") {
      query = query.eq("student_id", req.user.user_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    const ratings = data.map((r) => ({
      rating_id: r.rating_id,
      rating: r.rating,
      comment: r.comment || "No comment",
      lecturer_name: r.lecturer?.name || "Unknown Lecturer",
      student_name: r.student?.name || "Unknown Student",
      created_at: r.created_at
        ? new Date(r.created_at).toLocaleString()
        : "N/A",
    }));

    res.json(ratings);
  } catch (err) {
    console.error("Ratings Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});



// ----------------- RATINGS SUMMARY FOR STATS -----------------
app.get("/ratings-summary", authenticateToken, authorizeRoles("PRL"), async (req, res) => {
  try {
    const faculty_id = req.user.faculty_id;

    const { data: lecturers, error: lecturerError } = await supabase
      .from("users")
      .select("user_id, name")
      .eq("role", "Lecturer")
      .eq("faculty_id", faculty_id);

    if (lecturerError) throw lecturerError;

    const summary = await Promise.all(
      lecturers.map(async (lect) => {
        const { data: ratings } = await supabase
          .from("lecturer_ratings")
          .select("rating")
          .eq("lecturer_id", lect.user_id);

        const total_ratings = ratings?.length || 0;
        const avg_rating =
          total_ratings > 0
            ? (ratings.reduce((sum, r) => sum + r.rating, 0) / total_ratings).toFixed(1)
            : "0.0";

        return {
          lecturer_id: lect.user_id,
          lecturer_name: lect.name,
          total_ratings,
          avg_rating,
        };
      })
    );

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------- COURSE ASSIGNMENTS -----------------
app.post("/assign-course", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { course_id, lecturer_id } = req.body;
    await supabase.from("course_assignments").insert([{ course_id, lecturer_id, assigned_by: req.user.user_id }]);
    res.json({ message: "Course assigned" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/assignments", authenticateToken, authorizeRoles("PL", "PRL", "Lecturer"), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("course_assignments")
      .select(`
        assignment_id,
        assigned_at,
        course: courses(course_name, course_code),
        lecturer: users!lecturer_id(name),
        assigned_by_user: users!assigned_by(name),
        lecturer_id,
        course_id
      `)
      .order("assigned_at", { ascending: false });

    if (error) throw error;

    // Filter only for the logged-in lecturer if role is Lecturer
    const assignments = data
      .filter(a => req.user.role === "Lecturer" ? a.lecturer_id === req.user.user_id : true)
      .map(a => ({
        assignment_id: a.assignment_id,
        assigned_at: new Date(a.assigned_at).toLocaleDateString(),
        course_id: a.course_id,
        course_name: a.course?.course_name || "Unknown Course",
        course_code: a.course?.course_code || "N/A",
        lecturer_name: a.lecturer?.name || "Unknown Lecturer",
        assigned_by: a.assigned_by_user?.name || "Unknown",
      }));

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an assignment
app.delete("/assignments/:id", authenticateToken, authorizeRoles("PL"), async (req, res) => {
  try {
    const { id } = req.params;

    
    const { data: existingAssignment, error: fetchError } = await supabase
      .from("course_assignments")
      .select("*")
      .eq("assignment_id", id)
      .eq("assigned_by", req.user.user_id)
      .single();

    if (fetchError || !existingAssignment) {
      return res.status(404).json({ error: "Assignment not found or unauthorized" });
    }

   
    const { error: deleteError } = await supabase
      .from("course_assignments")
      .delete()
      .eq("assignment_id", id)
      .eq("assigned_by", req.user.user_id);

    if (deleteError) throw deleteError;

    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("Delete Assignment Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// ----------------- SERVER START -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
