import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Dashboard from "./Dashboard";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar } from "react-chartjs-2";
import ProfilePicture from "./ProfilePicture";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import {
  FaChalkboardTeacher,
  FaClipboardList,
  FaStar,
  FaChartLine,
  FaSignOutAlt,
  FaBell,
  FaBars,
  FaDownload,
  FaMoon,
  FaSun,
  FaCheckCircle,
  FaTimesCircle,
  FaClipboardCheck,
  FaTasks,
  FaUserTie,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/* ---------- Small helpers ---------- */
const formatGreeting = (date) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const ShimmerLoader = () => (
  <div className="w-100">
    <div className="row g-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="col-md-4">
          <div className="card p-4 rounded-4 border-0">
            <div className="placeholder-glow">
              <div className="placeholder col-8 mb-3"></div>
              <div className="placeholder col-6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ---------- CSV Export ----------
const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(","));
  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/* ---------- Main Component ---------- */
function PRLDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name") || "PRL";
  const email = localStorage.getItem("email");
  const faculty_id = localStorage.getItem("faculty_id");
  const headers = { Authorization: `Bearer ${token}` };

  // UI state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [expandedLecturer, setExpandedLecturer] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);


  const [loadingTab, setLoadingTab] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("prl_darkMode")) || false;
    } catch {
      return false;
    }
  });
  const [time, setTime] = useState(new Date());
  const [toast, setToast] = useState(null); 
  const [tasks, setTasks] = useState([
    { id: 1, text: "Review pending feedback", done: false },
    { id: 2, text: "Check low-attendance classes", done: false },
    { id: 3, text: "Send reminders to lecturers", done: false },
  ]);

  // Data
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /* ---------- Live clock ---------- */
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ---------- Persist dark mode ---------- */
  useEffect(() => {
    try {
      localStorage.setItem("prl_darkMode", JSON.stringify(darkMode));
    } catch {}
  }, [darkMode]);

  /* ---------- Fetch data ---------- */
  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        const [coursesRes, reportsRes, classesRes, ratingsRes, lecturersRes, assignmentsRes] =
          await Promise.all([
            axios.get(`https://system-backend-2-ty55.onrender.com/courses${faculty_id ? `?faculty_id=${faculty_id}` : ""}`, { headers }),
            axios.get(`https://system-backend-2-ty55.onrender.com/reports${faculty_id ? `?faculty_id=${faculty_id}` : ""}`, { headers }),
            axios.get(`https://system-backend-2-ty55.onrender.com/classes`, { headers }),
            axios.get(`https://system-backend-2-ty55.onrender.com/ratings${faculty_id ? `?faculty_id=${faculty_id}` : ""}`, { headers }),
            axios.get(`https://system-backend-2-ty55.onrender.com/lecturers`, { headers }),
            axios.get(`https://system-backend-2-ty55.onrender.com/assignments`, { headers }),
          ]);

        setCourses(coursesRes.data || []);
        setReports(reportsRes.data || []);
        setClasses(classesRes.data || []);
        setRatings(ratingsRes.data || []);
        setLecturers(lecturersRes.data || []);
        setAssignments(assignmentsRes.data || []);
      } catch (err) {
        console.error("Data fetch error:", err);
        setToast({ type: "error", message: "Error fetching data" });
      }
    };
    fetchAll();
  }, [token, faculty_id]);

  /* ---------- Derived metrics ---------- */
  const avgAttendance = useMemo(() => {
    if (!reports.length) return 0;
    const totalPct = reports.reduce((sum, r) => {
      const pct = r.total_students ? (r.students_present || 0) / r.total_students : 0;
      return sum + pct;
    }, 0);
    return Math.round((totalPct / reports.length) * 100);
  }, [reports]);

  const feedbackCount = useMemo(() => reports.filter((r) => r.prl_feedback).length, [reports]);

  const monitoringData = useMemo(() => ({
    labels: reports.map((r) => r.class_name || `Class ${r.class_id || "-"}`),
    datasets: [
      {
        label: "Student Attendance %",
        data: reports.map((r) =>
          r.total_students ? Math.round((r.students_present / r.total_students) * 100 * 100) / 100 : 0
        ),
        backgroundColor: darkMode ? "rgba(255,206,86,0.6)" : "rgba(75,192,192,0.6)",
      },
    ],
  }), [reports, darkMode]);

  const topLecturers = useMemo(() => {
    return lecturers
      .map((l) => {
        const related = ratings.filter((r) => r.lecturer_id === l.lecturer_id);
        const avg = related.length ? related.reduce((s, x) => s + (x.rating || 0), 0) / related.length : 0;
        return { ...l, avgRating: Number(avg.toFixed(2)) };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 3);
  }, [lecturers, ratings]);

  /* ---------- Filters ---------- */
  const filterData = (data = [], keys = []) => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      keys.some((key) => (item[key] ?? "").toString().toLowerCase().includes(q))
    );
  };

  /* ---------- Toast helpers ---------- */
  const showToast = (type, message, timeout = 3000) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), timeout);
  };

  /* ---------- Feedback save ---------- */
  const handleFeedbackChange = (reportId, value) => {
    setReports((prev) => prev.map((r) => (r.report_id === reportId ? { ...r, prl_feedback: value } : r)));
  };

  const handleFeedbackSave = async (reportId, feedback) => {
    try {
      await axios.put(
        `https://system-backend-2-ty55.onrender.com/reports/${reportId}/feedback`,
        { feedback },
        { headers }
      );
      try {
        const confettiModule = await import("canvas-confetti");
        const confetti = confettiModule.default || confettiModule;
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
      showToast("success", "Feedback saved");
    } catch (err) {
      console.error(err);
      showToast("error", "Error saving feedback");
    }
  };

  /* ---------- Tabs ---------- */
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setLoadingTab(true);
    setTimeout(() => {
      setActiveTab(tab);
      setLoadingTab(false);
      setSearchQuery("");
    }, 220);
  };

  /* ---------- Logout ---------- */
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  /* ---------- Tasks ---------- */
  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const addTask = (text) => {
    const nextId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
    setTasks((p) => [{ id: nextId, text, done: false }, ...p]);
  };

  /* ---------- animation variants ---------- */
  const tabVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32 } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
  };

  /* ---------- theme styles ---------- */
  const pageBg = darkMode ? "#0f1724" : "linear-gradient(to right, #f4f7fb, #edf1ff)";
  const cardBg = darkMode ? "#111827" : "#fff";
  const textColorClass = darkMode ? "text-light" : "text-dark";
  const subtleText = darkMode ? "text-secondary" : "text-muted";

  return (
    <Dashboard title="Program Review Leader Dashboard">
      <div className="d-flex" style={{ minHeight: "100vh", background: pageBg }}>
        {/* Sidebar */}
        <aside
          className={`shadow-sm p-3 d-flex flex-column ${darkMode ? "bg-dark" : "bg-white"}`}
          style={{
            width: collapsed ? 80 : 260,
            transition: "width 0.22s ease",
            position: "sticky",
            top: 0,
            height: "100vh",
            borderTopRightRadius: 20,
            borderBottomRightRadius: 20,
            zIndex: 20,
            overflow: "auto",
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-3">
            {!collapsed && <h5 className="fw-bold text-primary mb-0">📚 PRL Dashboard</h5>}
            <button onClick={() => setCollapsed((s) => !s)} className="btn btn-light rounded-circle shadow-sm">
              <FaBars />
            </button>
          </div>

          {!collapsed && <p className={`${subtleText} small text-center mb-3`}>{name}</p>}
          <hr />

          <nav className="nav flex-column gap-2">
            {[
              { key: "dashboard", icon: <FaChartLine />, label: "Dashboard" },
              { key: "courses", icon: <FaChalkboardTeacher />, label: "Courses" },
              { key: "reports", icon: <FaClipboardList />, label: "Reports" },
              { key: "lecturers", icon: <FaUserTie />, label: "Lecturers" },
              { key: "monitoring", icon: <FaChartLine />, label: "Monitoring" },
              { key: "classes", icon: <FaChalkboardTeacher />, label: "Classes" },
              { key: "ratings", icon: <FaStar />, label: "Ratings"},
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn d-flex align-items-center fw-semibold rounded-3 ${
                  activeTab === tab.key ? "btn-primary text-white" : "btn-light text-dark"
                }`}
                onClick={() => handleTabChange(tab.key)}
                style={{ whiteSpace: "nowrap" }}
              >
                <span className="me-2 fs-5">{tab.icon}</span>
                {!collapsed && tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-4 d-flex flex-column gap-2">
            <button
              onClick={() => setDarkMode((s) => !s)}
              className="btn btn-outline-secondary rounded-3 d-flex align-items-center justify-content-center"
            >
              {darkMode ? <FaSun className="me-2 text-warning" /> : <FaMoon className="me-2" />}
              {!collapsed && (darkMode ? "Light Mode" : "Dark Mode")}
            </button>

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger rounded-3 d-flex align-items-center justify-content-center"
            >
              <FaSignOutAlt className="me-2" />
              {!collapsed && "Logout"}
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className={`flex-grow-1 d-flex flex-column ${textColorClass}`}>
          {/* Header */}
          <header
            className={`shadow-sm px-4 py-3 d-flex align-items-center justify-content-between ${darkMode ? "bg-secondary" : "bg-white"}`}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 55,
              borderBottomLeftRadius: 20,
              borderBottomRightRadius: 20,
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div>
                <div className="small text-uppercase fw-semibold" style={{ letterSpacing: 0.6 }}>
                  {formatGreeting(time)}, <span className="fw-bold">{name.split(" ")[0] || name}</span>
                </div>
                <div className={`fw-semibold ${subtleText}`} style={{ fontSize: 12 }}>
                  {time.toLocaleDateString()} • {time.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-none d-md-block text-end me-2">
              <div className={`fw-semibold ${subtleText}`}>{"WELCOME"}</div>
                <div className="small">{faculty_id ? `Faculty: ${faculty_id}` : ""}</div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button className="btn btn-light rounded-circle shadow-sm"><FaBell className="text-primary" /></button>
                <ProfilePicture size={36} />
              </div>
            </div>
          </header>

          {/* Content */}
          <section className="flex-grow-1 p-4 overflow-auto">
            {loadingTab ? (
              <ShimmerLoader />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="visible" exit="exit">
                  {/* -------- DASHBOARD TAB -------- */}
                  {activeTab === "dashboard" && (
                    <>
                      <div className="row g-4 mb-4">
                        {/* Cards */}
                        <div className="col-12">
                          <div className="row g-3">
                            {/* Courses card clickable */}
                            <div className="col-12 col-md-4 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg, cursor: "pointer" }}
                                onClick={() => handleTabChange("courses")}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <div className="small text-uppercase text-muted">Courses</div>
                                    <h4 className="mb-0">{courses.length}</h4>
                                  </div>
                                  <div className="display-6 text-primary"><FaChalkboardTeacher /></div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Reports card clickable */}
                            <div className="col-12 col-md-4 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg, cursor: "pointer" }}
                                onClick={() => handleTabChange("reports")}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <div className="small text-uppercase text-muted">Reports</div>
                                    <h4 className="mb-0">{reports.length}</h4>
                                  </div>
                                  <div className="display-6 text-primary"><FaClipboardList /></div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Lecturers card clickable */}
                            <div className="col-12 col-md-4 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg, cursor: "pointer" }}
                                onClick={() => handleTabChange("lecturers")}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <div className="small text-uppercase text-muted">Lecturers</div>
                                    <h4 className="mb-0">{lecturers.length}</h4>
                                  </div>
                                  <div className="display-6 text-primary"><FaUserTie /></div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Classes card clickable */}
                            <div className="col-12 col-md-4 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg, cursor: "pointer" }}
                                onClick={() => handleTabChange("classes")}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <div className="small text-uppercase text-muted">Classes</div>
                                    <h4 className="mb-0">{classes.length}</h4>
                                  </div>
                                  <div className="display-6 text-primary"><FaChalkboardTeacher /></div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Ratings card clickable */}
                            <div className="col-12 col-md-4 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg, cursor: "pointer" }}
                                onClick={() => handleTabChange("ratings")}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <div className="small text-uppercase text-muted">Ratings</div>
                                    <h4 className="mb-0">{ratings.length}</h4>
                                  </div>
                                  <div className="display-6 text-primary"><FaStar /></div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Feedback Given card */}
                            <div className="col-12 col-md-4 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg }}
                              >
                                <div className="d-flex align-items-center justify-content-between">
                                  <div>
                                    <div className="small text-uppercase text-muted">Feedback Given</div>
                                    <h4 className="mb-0">{feedbackCount}</h4>
                                  </div>
                                  <div className="display-6 text-primary"><FaClipboardCheck /></div>
                                </div>
                              </motion.div>
                            </div>

                            {/* Avg Attendance card */}
                            <div className="col-12 col-md-6 col-xl-3">
                              <motion.div whileHover={{ scale: 1.02 }}
                                className="card p-3 shadow-sm rounded-4"
                                style={{ background: cardBg }}
                              >
                                <div>
                                  <div className="small text-uppercase text-muted">Avg Attendance</div>
                                  <h4 className="mb-0">{avgAttendance}%</h4>
                                  <div className={`small ${subtleText}`}>Across monitored classes</div>
                                </div>
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </div>


                     {/* Main grid: left chart + right tasks + top lecturers */}
                      <div className="row g-4">
                        <div className="col-12 col-xl-8">
                          <div className="card p-3 shadow-sm rounded-4" style={{ background: cardBg }}>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h5 className="mb-0">Monitoring Overview</h5>
                              <div className="small text-muted">{reports.length} classes</div>
                            </div>
                            <div style={{ height: 360 }}>
                              <Bar data={monitoringData} options={{ responsive: true, maintainAspectRatio: false }} />
                            </div>

                            <div className="row g-3 mt-3">
                              <div className="col-12 col-md-4">
                                <div className="p-3 border rounded" style={{ background: darkMode ? "#0b1220" : "#f8f9fb" }}>
                                  <div className="small text-muted">Average Attendance</div>
                                  <div className="fw-bold fs-4">{avgAttendance}%</div>
                                </div>
                              </div>
                              <div className="col-12 col-md-4">
                                <div className="p-3 border rounded" style={{ background: darkMode ? "#0b1220" : "#f8f9fb" }}>
                                  <div className="small text-muted">Reports Reviewed</div>
                                  <div className="fw-bold fs-4">{feedbackCount}</div>
                                </div>
                              </div>
                              <div className="col-12 col-md-4">
                                <div className="p-3 border rounded" style={{ background: darkMode ? "#0b1220" : "#f8f9fb" }}>
                                  <div className="small text-muted">Total Ratings</div>
                                  <div className="fw-bold fs-4">{ratings.length}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>


                        {/* Tasks */}
                        <div className="col-12 col-xl-4">
                          <div className="card p-3 shadow-sm rounded-4 mb-3" style={{ background: cardBg }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <h6 className="mb-0">Tasks <small className="text-muted">• quick actions</small></h6>
                              <FaTasks />
                            </div>

                            <div className="list-group mt-2">
                              {tasks.map((t) => (
                                <div key={t.id} className="list-group-item d-flex align-items-center justify-content-between">
                                  <div className="d-flex align-items-center gap-3">
                                    <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                                    <div className={t.done ? "text-decoration-line-through small" : "small"}>{t.text}</div>
                                  </div>
                                  <div className="small text-muted">{t.done ? <FaCheckCircle /> : <FaTimesCircle />}</div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 d-flex gap-2">
                              <input id="taskInput" className="form-control form-control-sm" placeholder="New task..." />
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  const el = document.getElementById("taskInput");
                                  if (el && el.value.trim()) {
                                    addTask(el.value.trim());
                                    el.value = "";
                                    showToast("success", "Task added");
                                  }
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>

  {/*Top Rated Lecturers */}
<div className="card p-3 shadow-sm rounded-4 mt-3" style={{ background: cardBg }}>
  <div className="d-flex align-items-center justify-content-between mb-2">
    <h6 className="mb-0 fw-bold">Top Rated Lecturers</h6>
    <small className="text-muted">Based on student feedback</small>
  </div>

  <div className="table-responsive">
    <table className="table table-sm table-hover align-middle mt-2 mb-0">
      <thead className="table-light">
        <tr>
          <th>#</th>
          <th>Lecturer</th>
          <th className="text-end">Average Rating ⭐</th>
        </tr>
      </thead>
      <tbody>
        {topLecturers && topLecturers.length > 0 ? (

    
    [...topLecturers]
      .sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0))
      .map((l, i) => {
        const lecturerName = l.lecturer_name || l.name || l.full_name || "N/A";
        const avgRating = parseFloat(l.avgRating || 0).toFixed(1);


            return (
              <tr key={i}>
    <td className="fw-semibold text-muted">{i + 1}</td>
    <td>{l.lecturer_name || l.name || l.full_name || "N/A"}</td>
    <td className="text-end fw-bold text-warning">{parseFloat(l.avgRating || 0).toFixed(1)}</td>
  </tr>
);
})

        ) : (
          <tr>
            <td colSpan={3} className="text-center text-muted py-3">
              No ratings yet
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* Summary Footer */}
  {topLecturers && topLecturers.length > 0 && (
    <div className="mt-3 small text-muted border-top pt-2">
      <strong>Summary:</strong>{" "}
      {topLecturers[0].avgRating >= 4.5
        ? "Excellent teaching performance across lecturers."
        : topLecturers[0].avgRating >= 3.5
        ? "Good ratings overall with room for improvement."
        : "Average ratings detected — encourage student engagement."}
    </div>
  )}

  {/* See All Ratings Button */}
  <div className="text-center mt-3">
    <button
      className="btn btn-sm btn-outline-primary rounded-pill px-4"
      onClick={() => {
        setActiveTab("ratings");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      See All Ratings
    </button>
  </div>
</div>
</div>
</div>
</>
)}

{/* -------- LECTURERS TAB -------- */}
{activeTab === "lecturers" && (
  <div>
    {/* Header */}
    <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
      <h4 className="mb-2 mb-md-0">Lecturers</h4>
      <div className="d-flex w-100 w-md-auto gap-2 flex-column flex-md-row">
        <input
          type="text"
          placeholder="Search Lecturers..."
          className="form-control w-100 w-md-25"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn btn-outline-primary d-flex align-items-center justify-content-center"
          onClick={() => {
            const exportData = filterData(lecturers, ["lecturer_name", "email", "faculty_name"]).map((l) => ({
              Name: l.lecturer_name || l.name || l.full_name || "N/A",
              Email: l.email || "",
              Faculty: l.faculty_name || "",
            }));
            exportToCSV(exportData, "lecturers.csv");
          }}
        >
          <FaDownload className="me-1" /> CSV
        </button>
      </div>
    </div>

    {/* Table */}
    <div className="table-responsive card p-3" style={{ background: "" }}>
      <table className="table table-bordered table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Faculty</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filterData(lecturers, ["lecturer_name", "email", "faculty_name"]).map((l, i) => {
            const lecturerName = l.lecturer_name || l.name || l.full_name || "N/A";
            const lecturerReports = reports.filter(r => r.lecturer_name === lecturerName);
            const lecturerRatings = ratings.filter(rt => rt.lecturer_name === lecturerName);
            const isExpanded = expandedRow === l.lecturer_id;

            return (
              <React.Fragment key={l.lecturer_id || i}>
                <tr>
                  <td>{i + 1}</td>
                  <td>{lecturerName}</td>
                  <td>{l.email || "N/A"}</td>
                  <td>{l.faculty_name || "N/A"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-dark"
                      onClick={() => setExpandedRow(isExpanded ? null : l.lecturer_id)}
                    >
                      {isExpanded ? "Hide" : "View More"}
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr>
                    <td colSpan={5}>
                      <div className="p-3 border rounded bg-light">
                        {/* Lecturer Reports */}
                        <h6 className="fw-bold mb-2">Reports</h6>
                        {lecturerReports.length > 0 ? (
                          <ul className="list-unstyled mb-3">
                            {lecturerReports.map((rep, idx) => (
                              <li key={idx} className="mb-2">
                                <strong>{rep.class_name}</strong> — {rep.topic || "No topic"}  
                                <span className="text-muted"> ({rep.date_of_lecture || "N/A"})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted mb-3">No reports available</p>
                        )}

                        {/* Lecturer Ratings */}
                        <h6 className="fw-bold mb-2">Ratings</h6>
                        {lecturerRatings.length > 0 ? (
                          <ul className="list-unstyled">
                            {lecturerRatings.map((rt, idx) => (
                              <li key={idx} className="mb-1">
                                ⭐ {rt.rating} — <em>{rt.comment || "No comment"}</em>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted">No ratings available</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}

          {!filterData(lecturers, ["lecturer_name", "email", "faculty_name"]).length && (
            <tr>
              <td colSpan={5} className="text-muted text-center">
                No lecturers found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}


{/* -------- COURSES TAB (exportable) -------- */}
{activeTab === "courses" && (
  <div>
    <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
      <h4 className="mb-2 mb-md-0">Courses</h4>

      <div className="d-flex w-100 w-md-auto gap-2 flex-column flex-md-row">
        <input
          type="text"
          placeholder="Search Courses..."
          className="form-control w-100 w-md-25"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn btn-outline-primary d-flex align-items-center justify-content-center"
          onClick={() =>
            exportToCSV(
              filterData(courses, ["course_name", "course_code", "faculty_name"]),
              "courses.csv"
            )
          }
        >
          <FaDownload className="me-1" /> CSV
        </button>
      </div>
    </div>

      <div className="table-responsive card p-3 mb-4" style={{ background: "" }}>
       <table className="table table-bordered table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Code</th>
            <th>Faculty</th>
          </tr>
        </thead>
        <tbody>
          {filterData(courses, ["course_name", "course_code", "faculty_name"]).map((c, i) => (
            <tr key={c.course_id || i}>
              <td>{i + 1}</td>
              <td>{c.course_name}</td>
              <td>{c.course_code}</td>
              <td>{c.faculty_name || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}



{activeTab === "reports" && (
  <div>
    {/* Header + Search + Export */}
    <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
      <h4 className="mb-2 mb-md-0">Lecturer Reports & PRL Feedback</h4>
      <div className="d-flex w-100 w-md-auto gap-2 flex-column flex-md-row">
        <input
          type="text"
          placeholder="Search Reports..."
          className="form-control w-100 w-md-25"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn btn-outline-primary d-flex align-items-center justify-content-center"
          onClick={() =>
            exportToCSV(
              filterData(reports, [
                "course_name",
                "class_name",
                "lecturer_name",
                "topic",
              ]),
              "reports.csv"
            )
          }
        >
          <FaDownload className="me-1" /> CSV
        </button>
      </div>
    </div>

    {/* Grouped by Lecturer */}
    <div className="card p-3 shadow-sm rounded-4" style={{ background: cardBg }}>
      {Object.entries(
        filterData(reports, [
          "course_name",
          "class_name",
          "lecturer_name",
          "topic",
        ]).reduce((acc, r) => {
          const lecturer = r.lecturer_name || "Unknown Lecturer";
          if (!acc[lecturer]) acc[lecturer] = [];
          acc[lecturer].push(r);
          return acc;
        }, {})
      ).map(([lecturer, lecturerReports], index) => (
        <div key={index} className="mb-4">
          {/* Lecturer Header */}
          <div
            className="d-flex justify-content-between align-items-center p-3 border rounded bg-light"
            style={{ cursor: "pointer" }}
            onClick={() =>
              setExpandedLecturer(expandedLecturer === lecturer ? null : lecturer)
            }
          >
            <h5 className="mb-0">
              <FaUserTie className="me-2 text-primary" />
              {lecturer}
            </h5>
            <span className="badge bg-secondary">
              {lecturerReports.length} Reports
            </span>
          </div>

          {/* Lecturer Reports Table */}
          {expandedLecturer === lecturer && (
            <div className="table-responsive mt-3">
              <table className="table table-bordered table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Class</th>
                    <th>Date</th>
                    <th>Feedback</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturerReports.map((r, i) => (
                    <React.Fragment key={r.report_id || i}>
                      <tr>
                        <td>{i + 1}</td>
                        <td>{r.class_name}</td>
                        <td>{r.date_of_lecture || "N/A"}</td>
                        <td style={{ minWidth: 220 }}>
                          <input
                            type="text"
                            value={r.prl_feedback || ""}
                            onChange={(e) =>
                              handleFeedbackChange(r.report_id, e.target.value)
                            }
                            onBlur={() =>
                              handleFeedbackSave(r.report_id, r.prl_feedback)
                            }
                            className="form-control form-control-sm"
                          />
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-dark"
                            type="button"
                            onClick={() =>
                              setExpandedReport(
                                expandedReport === r.report_id
                                  ? null
                                  : r.report_id
                              )
                            }
                          >
                            {expandedReport === r.report_id
                              ? "Hide"
                              : "View More"}
                          </button>
                        </td>
                      </tr>

                      {/* Report Extra Details */}
                      {expandedReport === r.report_id && (
                        <tr>
                          <td colSpan={5}>
                            <div className="p-3 border rounded bg-light">
                              <p>
                                <strong>Topic:</strong> {r.topic || "N/A"}
                              </p>
                              <p>
                                <strong>Time:</strong> {r.lecture_time || "N/A"}
                              </p>
                              <p>
                                <strong>Venue:</strong> {r.venue || "N/A"}
                              </p>
                              <p>
                                <strong>Students Present:</strong>{" "}
                                {r.students_present || "N/A"}
                              </p>
                              <p>
                                <strong>Total Students:</strong>{" "}
                                {r.total_students || "N/A"}
                              </p>
                              <p>
                                <strong>Learning Outcomes:</strong>{" "}
                                {r.learning_outcomes || "N/A"}
                              </p>
                              <p>
                                <strong>Recommendations:</strong>{" "}
                                {r.recommendations || "N/A"}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

                  {/* -------- MONITORING TAB (keeps chart but expands area) -------- */}
                  {activeTab === "monitoring" && (
                    <div>
                      <h4 className="mb-3">Monitoring Overview</h4>
                      <div className="card p-3 mb-3" style={{ background: cardBg }}>
                        <div style={{ height: 480 }}>
                          <Bar data={monitoringData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-4">
                          <div className="card p-3" style={{ background: cardBg }}>
                            <div className="small text-muted">Average Attendance</div>
                            <div className="fw-bold fs-4">{avgAttendance}%</div>
                            <div className="small text-muted">{reports.length} classes</div>
                          </div>
                        </div>
                        <div className="col-12 col-md-8">
                          <div className="card p-3" style={{ background: cardBg }}>
                            <h6>Quick Insights</h6>
                            <ul className="mb-0">
                              <li>Total reports: {reports.length}</li>
                              <li>Feedback submitted: {feedbackCount}</li>
                              <li>Total lecturers: {lecturers.length}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
     

{activeTab === "classes" && (
  <div>
    <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
      <h4 className="mb-2 mb-md-0">Classes</h4>

      <div className="d-flex w-100 w-md-auto gap-2 flex-column flex-md-row">
        <input
          type="text"
          placeholder="Search Classes..."
          className="form-control w-100 w-md-25"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn btn-outline-primary d-flex align-items-center justify-content-center"
          onClick={() =>
            exportToCSV(
              filterData(classes, ["class_name", "year_of_study", "faculty_name", "description"]),
              "classes.csv"
            )
          }
        >
          <FaDownload className="me-1" /> CSV
        </button>
      </div>
    </div>

    <div className="table-responsive card p-3 mb-4" style={{ background: "" }}>
      <table className="table table-bordered table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Year</th>
            <th>Faculty</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {filterData(classes, ["class_name", "faculty_name"]).map((c, i) => (
            <tr key={c.class_id || i}>
              <td>{i + 1}</td>
              <td>{c.class_name}</td>
              <td>{c.year_of_study || "N/A"}</td>
              <td>{c.faculty_name || "N/A"}</td>
              <td>{c.description || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}    


{/* ----------------- Ratings Tab ----------------- */}
{activeTab === "ratings" && (
  <div>
    <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <h4 className="mb-0">Ratings</h4>
      <input
        type="text"
        placeholder="Search Lecturers..."
        className="form-control"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ minWidth: 220 }}
      />
      <button
        className="btn btn-outline-primary d-flex align-items-center justify-content-center"
        onClick={() => exportToCSV(filterData(ratings, []), "ratings.csv")}
      >
        <FaDownload className="me-1" /> CSV
      </button>
    </div>

    {/* Grouped Lecturers */}
    <div className="row g-3">
      {Object.entries(
        ratings.reduce((acc, r) => {
          if (!acc[r.lecturer_name]) acc[r.lecturer_name] = [];
          acc[r.lecturer_name].push(r);
          return acc;
        }, {})
      )
        .filter(([name]) =>
          name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map(([lecturer, lecturerRatings], i) => (
          <div key={i} className="col-12 col-md-6 col-lg-4">
            <div
              className="card shadow-sm border-0 rounded-4 p-3 h-100"
              style={{ cursor: "pointer", transition: "0.3s" }}
              onClick={() => setSelectedLecturer(lecturer)}
            >
              <div className="d-flex align-items-center justify-content-between">
                <h5 className="mb-0">{lecturer}</h5>
                <span className="badge bg-primary">
                  {lecturerRatings.length} Ratings
                </span>
              </div>
              <div className="mt-2 text-muted small">
                Avg Rating:{" "}
                <strong>
                  {(
                    lecturerRatings.reduce((sum, r) => sum + r.rating, 0) /
                    lecturerRatings.length
                  ).toFixed(1)}{" "}
                  ⭐
                </strong>
              </div>
            </div>
          </div>
        ))}

      {ratings.length === 0 && (
        <div className="text-center text-muted mt-3">No ratings found</div>
      )}
    </div>

    {/* Lecturer Detail Modal */}
    {selectedLecturer && (
      <div
        className="modal fade show d-block"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => setSelectedLecturer(null)}
      >
        <div
          className="modal-dialog modal-lg modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content rounded-4 border-0 shadow">
            <div className="modal-header border-0">
              <h5 className="modal-title">
                Ratings for {selectedLecturer}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedLecturer(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="table-responsive mb-4">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Student</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings
                      .filter((r) => r.lecturer_name === selectedLecturer)
                      .map((r, j) => (
                        <tr key={j}>
                          <td>{r.student_name}</td>
                          <td>{r.rating} ⭐</td>
                          <td>{r.comment || "No comment"}</td>
                          <td>{r.created_at || r.date || "N/A"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Ratings Summary Section */}
              {(() => {
                const lecturerRatings = ratings.filter(
                  (r) => r.lecturer_name === selectedLecturer
                );
                if (lecturerRatings.length === 0) return null;

                const avgRating =
                  lecturerRatings.reduce((a, r) => a + r.rating, 0) /
                  lecturerRatings.length;

                const counts = [1, 2, 3, 4, 5].map(
                  (n) => lecturerRatings.filter((r) => r.rating === n).length
                );

                const feedback =
                  avgRating >= 4.5
                    ? "Outstanding performance 👏"
                    : avgRating >= 3.5
                    ? "Good job! Keep it up 💪"
                    : avgRating >= 2.5
                    ? "Fair, needs some improvement ⚙️"
                    : "Below average — consider engaging more with students ⚠️";

                return (
                  <div className="border-top pt-3">
                    <h5 className="fw-bold text-dark mb-2">
                      Performance Summary
                    </h5>
                    <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                      <div className="fs-4 fw-bold text-warning">
                        ⭐ {avgRating.toFixed(1)} / 5
                      </div>
                      <div className="text-muted">
                        Based on {lecturerRatings.length}{" "}
                        {lecturerRatings.length === 1
                          ? "rating"
                          : "ratings"}
                      </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="mb-3">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count = counts[star - 1];
                        const percentage =
                          (count / lecturerRatings.length) * 100 || 0;
                        return (
                          <div
                            key={star}
                            className="d-flex align-items-center mb-1"
                          >
                            <span className="me-2" style={{ width: 35 }}>
                              {star}⭐
                            </span>
                            <div
                              className="progress flex-grow-1"
                              style={{
                                height: 10,
                                background: "#f1f1f1",
                              }}
                            >
                              <div
                                className="progress-bar bg-warning"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="ms-2 small text-muted">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="alert alert-light border rounded-4 shadow-sm mb-0">
                      <strong>Summary:</strong> {feedback}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
)}



   </motion.div>
    </AnimatePresence>
    )}
  </section>
</main>


        {/* Toast */}
        <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 9999 }}>
          {toast && (
            <div className={`toast show align-items-center text-white ${toast.type === "success" ? "bg-success" : "bg-danger"}`} role="alert">
              <div className="d-flex">
                <div className="toast-body d-flex align-items-center">
                  {toast.type === "success" ? <FaCheckCircle className="me-2"/> : <FaTimesCircle className="me-2" />}
                  {toast.message}
                </div>
                <button type="button" className="btn-close btn-close-white ms-2 me-2" onClick={() => setToast(null)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Dashboard>
  );
}

export default PRLDashboard;
