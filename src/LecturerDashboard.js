import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Dashboard from "./Dashboard";
import "bootstrap/dist/css/bootstrap.min.css";
import { Bar } from "react-chartjs-2";
import { motion, AnimatePresence } from "framer-motion";
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
  FaSun,
  FaMoon,
  FaBars,
  FaSearch,
} from "react-icons/fa";
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

function LecturerDashboard() {
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [editingReport, setEditingReport] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleEditClick = (report) => {
  setEditingReport({ ...report }); // open modal pre-filled



  // Fill the form with existing report data
  setForm({
    report_id: report.report_id,       // add report_id if you want to track
    class_id: report.class_id,
    course_id: report.course_id,
    week_of_reporting: report.week_of_reporting,
    date_of_lecture: report.date_of_lecture,
    students_present: report.students_present,
    total_students: report.total_students,
    venue: report.venue,
    lecture_time: report.lecture_time,
    topic: report.topic,
    learning_outcomes: report.learning_outcomes,
    recommendations: report.recommendations,
  });

  // Set editing mode
  setEditingReport(report.report_id);
};


const handleUpdateReport = async () => {
  try {
    const token = localStorage.getItem("token");

    const res = await axios.put(
      `https://system-backend-2-ty55.onrender.com/reports/${editingReport.report_id}`,
      {
        week_of_reporting: editingReport.week_of_reporting,
        date_of_lecture: editingReport.date_of_lecture,
        course_name: editingReport.course_name,
        course_code: editingReport.course_code,
        students_present: editingReport.students_present,
        total_students: editingReport.total_students,
        venue: editingReport.venue,
        lecture_time: editingReport.lecture_time,
        topic: editingReport.topic,
        learning_outcomes: editingReport.learning_outcomes,
        recommendations: editingReport.recommendations,
        class_name: editingReport.class_name,
        class_id: editingReport.class_id,
        faculty_id: editingReport.faculty_id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    alert("✅ Report updated successfully!");

    // ✅ Update table immediately without refetch
    setReports((prev) =>
      prev.map((r) =>
        r.report_id === editingReport.report_id
          ? { ...r, ...editingReport }
          : r
      )
    );

    setEditingReport(null);
  } catch (err) {
    console.error("❌ Failed to update report:", err);
    alert("❌ Failed to update report.");
  }
};


  const [stats, setStats] = useState({ totalReports: 0, totalCourses: 0, totalRatings: 0 });

  const [activeTab, setActiveTab] = useState("stats");
  const [collapsed, setCollapsed] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [time, setTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("l_darkMode")) || false;
      } catch {
        return false;
      }
    });

    

const [sortConfig, setSortConfig] = useState({ key: "course_name", direction: "asc" });
const [currentPage, setCurrentPage] = useState(1);
const pageSize = 10;

const handleSort = (key) => {
  setSortConfig((prev) => {
    if (prev.key === key) {
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    }
    return { key, direction: "asc" };
  });
  setCurrentPage(1); // reset page when sorting
};

const filteredCourses = courses.filter(
  (c) =>
    c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.class_name || "").toLowerCase().includes(searchQuery.toLowerCase())
);

const sortedCourses = [...filteredCourses].sort((a, b) => {
  const key = sortConfig.key;
  if (!a[key]) return 1;
  if (!b[key]) return -1;
  if (a[key] < b[key]) return sortConfig.direction === "asc" ? -1 : 1;
  if (a[key] > b[key]) return sortConfig.direction === "asc" ? 1 : -1;
  return 0;
});

const paginatedCourses = sortedCourses.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);
   
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const user_id = parseInt(localStorage.getItem("user_id"));
  const email = localStorage.getItem("email");
  const faculty_id = localStorage.getItem("faculty_id");
  const headers = { Authorization: `Bearer ${token}` };


   /* ---------- Live clock ---------- */
    useEffect(() => {
      const timer = setInterval(() => setTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
  
    /* ---------- Persist dark mode ---------- */
    useEffect(() => {
      try {
        localStorage.setItem("l_darkMode", JSON.stringify(darkMode));
      } catch {}
    }, [darkMode]);
  

  // Fetch data
  useEffect(() => {
    if (!token || !user_id) return;

    const fetchData = async () => {
      try {
        const reportsRes = await axios.get("https://system-backend-2-ty55.onrender.com/reports", { headers });
        const myReports = reportsRes.data.filter((r) => r.lecturer_name === name);
        setReports(myReports);
        setStats((prev) => ({ ...prev, totalReports: myReports.length }));

        const assignmentsRes = await axios.get("https://system-backend-2-ty55.onrender.com/assignments", { headers });
        const uniqueCourses = Array.from(
          new Map(assignmentsRes.data.map((a) => [a.course_id, a])).values()
        );
        setCourses(uniqueCourses);
        setStats((prev) => ({ ...prev, totalCourses: uniqueCourses.length }));

        const classesRes = await axios.get("https://system-backend-2-ty55.onrender.com/classes", { headers });
        setClasses(classesRes.data);

        const ratingsRes = await axios.get("https://system-backend-2-ty55.onrender.com/ratings", { headers });
        const myRatings = ratingsRes.data.filter((r) => r.lecturer_name === name);
        setRatings(myRatings);
        setStats((prev) => ({ ...prev, totalRatings: myRatings.length }));
      } catch (err) {
        console.error("Data fetch error:", err);
      }
    };

    fetchData();
  }, [token, user_id, name]);

  // Form state for Submit Report
  const [form, setForm] = useState({
    class_id: "",
    course_id: "",
    week_of_reporting: "",
    date_of_lecture: "",
    students_present: "",
    total_students: "",
    venue: "",
    lecture_time: "",
    topic: "",
    learning_outcomes: "",
    recommendations: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmitReport = (e) => {
    e.preventDefault();
    const payload = { ...form, lecturer_name: name, lecturer_id: user_id };

    axios
      .post("https://system-backend-2-ty55.onrender.com/reports", payload, { headers })
      .then((res) => {
        alert("✅ Report submitted successfully!");
        setReports((prev) => [res.data.report, ...prev]);
        setForm({
          class_id: "",
          course_id: "",
          week_of_reporting: "",
          date_of_lecture: "",
          students_present: "",
          total_students: "",
          venue: "",
          lecture_time: "",
          topic: "",
          learning_outcomes: "",
          recommendations: "",
        });
      })
      .catch((err) => {
        console.error(err.response?.data || err.message);
        alert("⚠️ Error submitting report: " + (err.response?.data?.error || err.message));
      });
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.25 } },
  };

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setLoadingTab(true);
    setTimeout(() => {
      setActiveTab(tab);
      setLoadingTab(false);
    }, 300);
  };

  
  const filteredReports = reports.filter(
    (r) =>
      r.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };


  return (
    <Dashboard title="Lecturer Dashboard">
      <div className="d-flex" style={{ minHeight: "100vh", background: "linear-gradient(to right, #f4f7fb, #edf1ff)" }}>
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
            {!collapsed && <h5 className="fw-bold text-primary mb-0">👨‍🏫 Lecturer</h5>}
            <button onClick={() => setCollapsed(!collapsed)} className="btn btn-light rounded-circle shadow-sm">
              <FaBars />
            </button>
          </div>
          {!collapsed && <p className="text-muted small text-center mb-3">{name}</p>}
          <hr />

          <nav className="nav flex-column gap-2">
            {[
              { key: "stats", icon: <FaChartLine color="#1d232dff" />, label: "Dashboard" },
              { key: "assigned", icon: <FaClipboardList color="#1d232dff" />, label: "Assigned Courses" },
              { key: "report", icon: <FaChalkboardTeacher color="#1d232dff" />, label: "Submit Report" },
              { key: "monitoring", icon: <FaChartLine color="#1d232dff" />, label: "Monitoring" },
              { key: "ratings", icon: <FaStar color="#1d232dff" />, label: "Ratings" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`btn d-flex align-items-center fw-semibold rounded-3 ${activeTab === tab.key ? "btn-primary text-white" : "btn-light text-dark"}`}
                onClick={() => handleTabChange(tab.key)}
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

          <div className="mt-auto pt-4">
            <button onClick={handleLogout} className="btn btn-outline-danger w-100 rounded-3">
              <FaSignOutAlt className="me-2" />
              {!collapsed && "Logout"}
            </button>
          </div>
          </div>
        </aside>

               {/* Main Content */}
                <div className="flex-grow-1 d-flex flex-column">
                  {/* Top Navbar */}
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
                        <div className={`fw-semibold `} style={{ fontSize: 12 }}>
                          {time.toLocaleDateString()} • {time.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
        
                    <div className="d-flex align-items-center gap-3">
                       <div className={`fw-semibold `}>{"WELCOME"}</div>
                      <button className="btn btn-light rounded-circle shadow-sm" aria-label="Notifications">
                        <FaBell className="text-primary" />
                      </button>
                      <div className="d-flex align-items-center">
                        <ProfilePicture  size={32} className="text-secondary me-2" />
                        {!collapsed && (
                          <div className="text-end">
                            <div className="mb-0 fw-semibold text-dark"></div>
                            <small className="text-muted"></small>
                          </div>
                        )}
                      </div>
                    </div>
                  </header>
        

          <section className="flex-grow-1 p-4 overflow-auto">
            {loadingTab ? (
              <ShimmerLoader />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="visible" exit="exit">
 
 
{/* Dashboard Cards + Monitoring Overview */}
{activeTab === "stats" && (
  <div>
    {/* Dashboard Cards */}
    <div className="row g-4 mb-4">
      {[
        { title: "Total Reports", value: stats.totalReports, icon: <FaClipboardList size={28} />, color: "primary", tab: "report" },
        { title: "Total Courses", value: stats.totalCourses, icon: <FaChalkboardTeacher size={28} />, color: "success", tab: "assigned" },
        { title: "Total Ratings", value: stats.totalRatings, icon: <FaStar size={28} />, color: "warning", tab: "ratings" },
      ].map((card, i) => (
        <div key={i} className="col-12 col-sm-6 col-md-4">
          <div
            className="card p-4 shadow-sm rounded-4 border-0"
            style={{ cursor: "pointer" }}
            onClick={() => handleTabChange(card.tab)}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1 text-muted">{card.title}</h6>
                <h4 className={`mb-0 text-${card.color}`}>{card.value}</h4>
              </div>
              <div className={`p-3 rounded-circle bg-${card.color} bg-opacity-10 text-${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

{/* Monitoring Overview */}
<div className="row g-4">
  <div className="col-12 col-xl-8">
    <div
      className="card p-3 shadow-sm rounded-4"
      style={{
        background: darkMode ? "#0b1220" : "#ffffff",
        transition: "background 0.3s ease",
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="mb-0">Monitoring Overview</h5>
        <div className="small text-muted">{reports.length} classes</div>
      </div>

      {/* Chart */}
      <div style={{ height: 360 }}>
        <Bar
          data={monitoringData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true, position: "bottom" },
            },
          }}
        />
      </div>

      {/* Stats Summary */}
      <div className="row g-3 mt-3">
        <div className="col-12 col-md-4">
          <div
            className="p-3 border rounded text-center"
            style={{
              background: darkMode ? "#0b1220" : "#f8f9fb",
              transition: "background 0.3s ease",
            }}
          >
            <div className="small text-muted">Average Attendance</div>
            <div className="fw-bold fs-4">{avgAttendance}%</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="p-3 border rounded text-center"
            style={{
              background: darkMode ? "#0b1220" : "#f8f9fb",
              transition: "background 0.3s ease",
            }}
          >
            <div className="small text-muted">Reports Reviewed</div>
            <div className="fw-bold fs-4">{feedbackCount}</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="p-3 border rounded text-center"
            style={{
              background: darkMode ? "#0b1220" : "#f8f9fb",
              transition: "background 0.3s ease",
            }}
          >
            <div className="small text-muted">Total Ratings</div>
            <div className="fw-bold fs-4">{ratings.length}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>
)}


{/* Assigned Courses */}
{activeTab === "assigned" && (
  <div className="card shadow-sm p-4 mt-3 border-0 rounded-4">
    <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 gap-2">
      <h4 className="fw-bold mb-2 mb-md-0 text-dark">Assigned Courses</h4>
      <div className="d-flex gap-2 w-100 w-md-auto">
        <input
          type="text"
          className="form-control"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="btn btn-outline-primary"
          onClick={() => exportToCSV(filteredCourses, "assigned_courses.csv")}
        >
          Export CSV
        </button>
      </div>
    </div>

    <div className="table-responsive">
      <table className="table table-bordered table-hover align-middle">
        <thead className="table-light">
          <tr>
            {[
              { label: "#", key: "index" },
              { label: "Course Code", key: "course_code" },
              { label: "Course Name", key: "course_name" },
              { label: "Class", key: "class_name" },
              { label: "Year", key: "year_of_study" },
            ].map((col) => (
              <th
                key={col.key}
                style={{ cursor: col.key !== "index" ? "pointer" : "default" }}
                onClick={() => col.key !== "index" && handleSort(col.key)}
              >
                {col.label}{" "}
                {sortConfig.key === col.key && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedCourses.map((c, i) => (
            <tr key={c.course_id}>
              <td>{(currentPage - 1) * pageSize + i + 1}</td>
              <td>{c.course_code}</td>
              <td>{c.course_name}</td>
              <td>{c.class_name || "N/A"}</td>
              <td>{c.year_of_study || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Pagination */}
    <div className="d-flex justify-content-between align-items-center mt-3">
      <button
        className="btn btn-sm btn-outline-secondary"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage((p) => p - 1)}
      >
        Prev
      </button>
      <span>
        Page {currentPage} of {Math.ceil(filteredCourses.length / pageSize)}
      </span>
      <button
        className="btn btn-sm btn-outline-secondary"
        disabled={currentPage * pageSize >= filteredCourses.length}
        onClick={() => setCurrentPage((p) => p + 1)}
      >
        Next
      </button>
    </div>
  </div>
)} 

{activeTab === "report" && (
  <div className="card shadow-sm p-4 mt-3 border-0 rounded-4">
    <h4 className="fw-bold mb-3 text-dark">Reports</h4>

    {/* Button to toggle form */}
    <div className="mb-3 text-end">
      <button
        className="btn btn-success rounded-4"
        onClick={() => setShowForm(!showForm)}
      >
        {showForm ? "Hide Form" : "Submit New Report"}
      </button>
    </div>

    {/* Conditional Submit Form */}
    {showForm && (
      <div className="card p-4 mb-4 shadow-sm rounded-4 border-1 border-light">
        <h5 className="fw-semibold mb-4 text-dark">Submit Lecture Report</h5>
        <form onSubmit={handleSubmitReport}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Class</label>
              <select
                className="form-select"
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.class_id} value={cls.class_id}>
                    {cls.class_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Course</label>
              <select
                className="form-select"
                name="course_id"
                value={form.course_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.course_id} value={c.course_id}>
                    {c.course_name} ({c.course_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Week of Reporting</label>
              <input
                type="text"
                name="week_of_reporting"
                value={form.week_of_reporting}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g., Week 5"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Date of Lecture</label>
              <input
                type="date"
                name="date_of_lecture"
                value={form.date_of_lecture}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Students Present</label>
              <input
                type="number"
                name="students_present"
                value={form.students_present}
                onChange={handleChange}
                className="form-control"
                min="0"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Total Students</label>
              <input
                type="number"
                name="total_students"
                value={form.total_students}
                onChange={handleChange}
                className="form-control"
                min="0"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Venue</label>
              <input
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                className="form-control"
                placeholder="Lecture Hall / Room"
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Lecture Time</label>
              <input
                type="time"
                name="lecture_time"
                value={form.lecture_time}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Topic Covered</label>
              <input
                type="text"
                name="topic"
                value={form.topic}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Learning Outcomes</label>
              <textarea
                name="learning_outcomes"
                value={form.learning_outcomes}
                onChange={handleChange}
                className="form-control"
                rows="3"
                required
              ></textarea>
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Recommendations / Remarks</label>
              <textarea
                name="recommendations"
                value={form.recommendations}
                onChange={handleChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>

            <div className="col-12 text-end">
              <button type="submit" className="btn btn-primary rounded-4 px-4">
                Submit Report
              </button>
            </div>
          </div>
        </form>
      </div>
    )}

    <table className="table table-bordered table-hover align-middle">
  <thead className="table-light">
    <tr>
      <th>#</th>
      <th>Course</th>
      <th>Class</th>
      <th>Date</th>
      <th>Week</th>
      <th>PRL Feedback</th>
      <th>Actions</th> 
    </tr>
  </thead>
  <tbody>
    {filteredReports.length ? (
      filteredReports.map((r, i) => (
        <tr key={r.report_id}>
          <td>{i + 1}</td>
          <td>{r.course_name}</td>
          <td>{r.class_name}</td>
          <td>{r.date_of_lecture}</td>
          <td>{r.week_of_reporting}</td>
          <td>{r.prl_feedback || "Pending"}</td>
          <td>
            <button
              className="btn btn-sm btn-outline-primary rounded-pill"
              onClick={() => handleEditClick(r)}
            >
              Edit
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="8" className="text-center text-muted">
          No reports available.
        </td>
      </tr>
    )}
  </tbody>
</table>

{editingReport && (
  <div
    className="modal fade show d-block"
    style={{ background: "rgba(0,0,0,0.6)" }}
    onClick={() => setEditingReport(null)}
  >
    <div
      className="modal-dialog modal-lg modal-dialog-centered"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-content rounded-4 border-0 shadow">
        <div className="modal-header border-0">
          <h5 className="modal-title">
            Edit Report #{editingReport.report_id}
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setEditingReport(null)}
          />
        </div>

        <div className="modal-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Topic</label>
              <input
                type="text"
                className="form-control"
                value={editingReport.topic || ""}
                onChange={(e) =>
                  setEditingReport({ ...editingReport, topic: e.target.value })
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={editingReport.date_of_lecture || ""}
                onChange={(e) =>
                  setEditingReport({
                    ...editingReport,
                    date_of_lecture: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Week</label>
              <input
                type="number"
                className="form-control"
                value={editingReport.week_of_reporting || ""}
                onChange={(e) =>
                  setEditingReport({
                    ...editingReport,
                    week_of_reporting: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Actual Students</label>
              <input
                type="number"
                className="form-control"
                value={editingReport.actual_students || ""}
                onChange={(e) =>
                  setEditingReport({
                    ...editingReport,
                    actual_students: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Learning Outcomes</label>
              <textarea
                className="form-control"
                rows={3}
                value={editingReport.learning_outcomes || ""}
                onChange={(e) =>
                  setEditingReport({
                    ...editingReport,
                    learning_outcomes: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Recommendations</label>
              <textarea
                className="form-control"
                rows={3}
                value={editingReport.recommendations || ""}
                onChange={(e) =>
                  setEditingReport({
                    ...editingReport,
                    recommendations: e.target.value,
                  })
                }
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">PRL Feedback</label>
              <input
                type="text"
                className="form-control"
                value={editingReport.prl_feedback || ""}
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="modal-footer border-0">
          <button
            className="btn btn-secondary rounded-pill px-3"
            onClick={() => setEditingReport(null)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary rounded-pill px-4"
            onClick={handleUpdateReport}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)}
</div>
)}                  {/*MONITORING TAB */}
                  {activeTab === "monitoring" && (
                    <div>
                      <h4 className="mb-3">Monitoring Overview</h4>
                      <div className="card p-3 mb-3" style={{ background: "" }}>
                        <div style={{ height: 480 }}>
                          <Bar data={monitoringData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-12 col-md-4">
                          <div className="card p-3" style={{ background: "" }}>
                            <div className="small text-muted">Average Attendance</div>
                            <div className="fw-bold fs-4">{avgAttendance}%</div>
                            <div className="small text-muted">{reports.length} classes</div>
                          </div>
                        </div>
                        <div className="col-12 col-md-8">
                          <div className="card p-3" style={{ background: "" }}>
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
     

                  

                 
{/* Ratings */}
{activeTab === "ratings" && (
  <div className="card shadow-sm p-4 mt-3 border-0 rounded-4">
    <h4 className="fw-bold mb-3 text-dark">Student Ratings</h4>

    {/* Ratings Table */}
    <div className="table-responsive mb-4">
      <table className="table table-bordered table-hover align-middle">
        <thead className="table-light">
          <tr>
            <th>#</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {ratings.length > 0 ? (
            ratings.map((r, i) => (
              <tr key={r.rating_id}>
                <td>{i + 1}</td>
                <td className="fw-bold text-warning">{r.rating} ⭐</td>
                <td>{r.comment || "-"}</td>
                <td>{new Date(r.created_at).toLocaleDateString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center text-muted py-3">
                No ratings available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* Ratings Evaluation Summary */}
    {ratings.length > 0 && (() => {
      const avgRating =
        ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length;

      const counts = [1, 2, 3, 4, 5].map(
        (n) => ratings.filter((r) => r.rating === n).length
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
        <div className="border-top pt-3 mt-2">
          <h5 className="fw-bold mb-2 text-dark">Performance Summary</h5>

          <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
            <div className="fs-4 fw-bold text-warning">
              ⭐ {avgRating.toFixed(1)} / 5
            </div>
            <div className="text-muted">
              Based on {ratings.length}{" "}
              {ratings.length === 1 ? "rating" : "ratings"}
            </div>
          </div>

          {/* Rating Distribution Bars */}
          <div className="mb-3">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = counts[star - 1];
              const percentage = (count / ratings.length) * 100 || 0;
              return (
                <div key={star} className="d-flex align-items-center mb-1">
                  <span className="me-2" style={{ width: 35 }}>
                    {star}⭐
                  </span>
                  <div
                    className="progress flex-grow-1"
                    style={{ height: 10, background: "#f1f1f1" }}
                  >
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="ms-2 small text-muted">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Feedback Text */}
          <div className="alert alert-light border rounded-4 shadow-sm mb-0">
            <strong>Summary:</strong> {feedback}
          </div>
        </div>
      );
    })()}
  </div>
)}

{/* End of Tabs */}
</motion.div>
</AnimatePresence>
)}
</section>
</div>

</div>
</Dashboard>
);
}

export default LecturerDashboard;
                  