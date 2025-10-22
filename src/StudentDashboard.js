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
  FaTrashAlt,
  FaChartLine,
  FaSignOutAlt,
  FaBell,
  FaBars,
  FaSun,
  FaMoon,
  FaDownload,
  FaUserTie,
  FaEdit,
  FaTrash,
  FaPlus,
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
          <div className="card shimmer-card p-4 rounded-4 border-0">
            <div className="placeholder-glow">
              <div className="placeholder col-8 mb-3"></div>
              <div className="placeholder col-6"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <style>
      {`
        .shimmer-card {
          background: linear-gradient(135deg, #f6f8fc, #e8ecf9);
          animation: shimmer 1.8s infinite alternate;
        }
        @keyframes shimmer {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}
    </style>
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


function StudentDashboard() {
  const [lecturers, setLecturers] = useState([]);
  const [expandedLecturer, setExpandedLecturer] = useState(null);
  const [reports, setReports] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [form, setForm] = useState({ lecturer_id: "", rating: 5, comment: "" });
  const [stats, setStats] = useState({
    totalReports: 0,
    totalLecturers: 0,
    totalRatings: 0,
  });
  const [activeTab, setActiveTab] = useState("stats");
  const [expandedReport, setExpandedReport] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [time, setTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(() => {
        try {
          return JSON.parse(localStorage.getItem("st_darkMode")) || false;
        } catch {
          return false;
        }
      });
    

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchAllData = () => {
    if (!token) return;

    axios
      .get("https://system-backend-2-ty55.onrender.com/lecturers", { headers })
      .then((res) => {
        setLecturers(res.data);
        setStats((prev) => ({ ...prev, totalLecturers: res.data.length }));
      })
      .catch(console.error);

    axios
      .get("https://system-backend-2-ty55.onrender.com/reports", { headers })
      .then((res) => {
        setReports(res.data);
        setStats((prev) => ({ ...prev, totalReports: res.data.length }));
      })
      .catch(console.error);

    axios
      .get("https://system-backend-2-ty55.onrender.com/ratings", { headers })
      .then((res) => {
        setRatings(res.data);
        setStats((prev) => ({ ...prev, totalRatings: res.data.length }));
      })
      .catch(console.error);

    axios
      .get("https://system-backend-2-ty55.onrender.com/assignments", { headers })
      .then((res) => setAssignments(res.data))
      .catch(console.error);
  };

  /* ---------- Live clock ---------- */
      useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
      }, []);
  
    /* ---------- Persist dark mode ---------- */
      useEffect(() => {
        try {
          localStorage.setItem("st_darkMode", JSON.stringify(darkMode));
        } catch {}
      }, [darkMode]);
    

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, lecturer_id: parseInt(form.lecturer_id) };

    axios
      .post("https://system-backend-2-ty55.onrender.com/rate", payload, { headers })
      .then(() => {
        alert("✅ Rating submitted successfully!");
        setForm({ lecturer_id: "", rating: 5, comment: "" });
        fetchAllData();
      })
      .catch((err) => {
        alert("⚠️ " + (err.response?.data?.error || err.message));
      });
  };

  useEffect(() => {
  document.body.style.backgroundColor = darkMode ? "#0b1220" : "#f9faff";
  document.body.style.color = darkMode ? "#f8f9fa" : "#212529";
}, [darkMode]);


  const handleDeleteRating = (id) => {
    if (!window.confirm("Are you sure you want to delete this rating?")) return;
    axios
      .delete(`https://system-backend-2-ty55.onrender.com/rate/${id}`, { headers })
      .then(() => {
        alert("🗑 Rating deleted successfully!");
        fetchAllData();
      })
      .catch(console.error);
  };

  const getLecturerName = (report) => {
    const lecturer =
      lecturers.find(
        (l) => l.user_id === report.lecturer_id || l.lecturer_id === report.lecturer_id
      ) || {};
    return lecturer.name || lecturer.full_name || "Unknown";
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
    }, 350);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

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
    
    

   const filterData = (data = [], keys = []) => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      keys.some((key) => (item[key] ?? "").toString().toLowerCase().includes(q))
    );
  };

  return (
    <Dashboard title="Student Dashboard">
      <div className="d-flex" style={{ minHeight: "100vh", background: "linear-gradient(to right, #eef2ff, #f9faff)" }}>
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
            {!collapsed && <h5 className="fw-bold text-primary mb-0">🎓 Student</h5>}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="btn btn-light rounded-circle shadow-sm toggle-btn"
            >
              <FaBars />
            </button>
          </div>

          {!collapsed && <p className="text-muted small text-center mb-3">{name}</p>}
          <hr />
          <nav className="nav flex-column gap-2">
            {[
              { key: "stats", icon: <FaChartLine />, label: "Dashboard" },
              { key: "reports", icon: <FaClipboardList />, label: "Reports" },
              { key: "rate", icon: <FaStar />, label: "Rate Lecturer" },
              { key: "ratings", icon: <FaChalkboardTeacher />, label: "My Ratings" },
            ].map((tab) => (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                key={tab.key}
                className={`btn nav-item d-flex align-items-center fw-semibold rounded-3 ${
                  activeTab === tab.key ? "btn-gradient text-white" : "btn-light text-dark"
                }`}
                onClick={() => handleTabChange(tab.key)}
              >
                <span className="me-2 fs-5">{tab.icon}</span>
                {!collapsed && tab.label}
              </motion.button>
            ))}
          </nav>

          <div className="mt-auto pt-4">
            <button
            onClick={() => setDarkMode((s) => !s)}
            className="btn btn-outline-secondary w-100 rounded-3 d-flex align-items-center justify-content-center"
            >
           {darkMode ? <FaSun className="me-2 text-warning" /> : <FaMoon className="me-2" />}
           {!collapsed && (darkMode ? "Light Mode" : "Dark Mode")}
           </button>
            <button
              onClick={handleLogout}
              className="btn btn-outline-danger w-100 rounded-3 d-flex align-items-center justify-content-center"
            >
              <FaSignOutAlt className="me-2" />
              {!collapsed && "Logout"}
            </button>
          </div>
        </aside>

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
        
          {/* Content */}
          <section className="flex-grow-1 p-4 overflow-auto">
            {loadingTab ? (
              <ShimmerLoader />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  variants={tabVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >


{/* Dashboard Cards */}
{activeTab === "stats" && (
  <div>
    {/* Dashboard Cards */}
    <div className="row g-4">
      {[
        { title: "Total Reports", value: stats.totalReports, color: "primary", icon: <FaClipboardList size={28} /> },
        { title: "Rate a lecturer", value: stats.totalLecturers, color: "success", icon: <FaChalkboardTeacher size={28} /> },
        { title: "Total Ratings", value: stats.totalRatings, color: "warning", icon: <FaStar size={28} /> },
      ].map((card, i) => (
        <motion.div key={i} className="col-md-4" whileHover={{ scale: 1.03 }}>
          <div
            className="card shadow-sm border-0 rounded-4 p-4"
            style={{ cursor: "pointer", transition: "0.3s" }}
            onClick={() => {
              if (card.title === "Total Reports") handleTabChange("reports");
              if (card.title === "Rate a lecturer") handleTabChange("rate");
              if (card.title === "Total Ratings") handleTabChange("ratings");
            }}
          >
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="fw-semibold text-muted mb-1">{card.title}</h6>
                <h2 className={`fw-bold text-${card.color} mb-0`}>{card.value}</h2>
              </div>
              <div className={`bg-${card.color} bg-opacity-10 text-${card.color} p-3 rounded-circle`}>
                {card.icon}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>

    {/* Monitoring Overview */}
<div className="row g-4 mt-3">
  <div className="col-12 col-xl-8">
    <div
      className="card p-3 shadow-sm rounded-4"
      style={{ background: darkMode ? "#0b1220" : "#ffffff", transition: "background 0.3s ease" }}
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
            plugins: { legend: { display: true, position: "bottom" } },
          }}
        />
      </div>

      {/* Stats Summary */}
      <div className="row g-3 mt-3">
        <div className="col-12 col-md-4">
          <div
            className="p-3 border rounded"
            style={{ background: darkMode ? "#0b1220" : "#f8f9fb" }}
          >
            <div className="small text-muted">Average Attendance</div>
            <div className="fw-bold fs-4">{avgAttendance}%</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="p-3 border rounded"
            style={{ background: darkMode ? "#0b1220" : "#f8f9fb" }}
          >
            <div className="small text-muted">Reports Reviewed</div>
            <div className="fw-bold fs-4">{feedbackCount}</div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div
            className="p-3 border rounded"
            style={{ background: darkMode ? "#0b1220" : "#f8f9fb" }}
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
                     <div className="card p-3 shadow-sm rounded-4" style={{ background: "" }}>
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
                                     <th>Time</th>
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
                                         <td>{r.lecture_time || ""}</td>
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
                                                 <strong>Venue:</strong> {r.venue || "N/A"}
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
                 

                 {/* Rating Form */}
                  {activeTab === "rate" && (
                    <div className="card shadow-sm p-4 mt-3 border-0 rounded-4">
                      <h4 className="fw-bold mb-3 text-dark">Rate a Lecturer</h4>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Select Lecturer</label>
                          <select
                            name="lecturer_id"
                            value={form.lecturer_id}
                            onChange={handleChange}
                            className="form-select rounded-3"
                            required
                          >
                            <option value="">-- Choose Lecturer --</option>
                            {lecturers.map((l) => (
                              <option key={l.user_id || l.lecturer_id} value={l.user_id || l.lecturer_id}>
                                {l.name || l.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Rating</label>
                          <select
                            name="rating"
                            value={form.rating}
                            onChange={handleChange}
                            className="form-select rounded-3"
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {n} Star{n > 1 && "s"}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Comment</label>
                          <textarea
                            name="comment"
                            value={form.comment}
                            onChange={handleChange}
                            className="form-control rounded-3"
                            placeholder="Write your feedback..."
                          />
                        </div>
                        <button type="submit" className="btn btn-primary w-100 rounded-3 shadow-sm">
                          Submit Rating
                        </button>
                      </form>
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
                                       <th>Rating</th>
                                       <th>Comment</th>
                                       <th>Date</th>
                                       <th>Action</th>
                                     </tr>
                                   </thead>
                                   <tbody>
                                     {ratings
                                       .filter((r) => r.lecturer_name === selectedLecturer)
                                       .map((r, j) => (
                                         <tr key={j}>
                                           <td>{r.rating} ⭐</td>
                                           <td>{r.comment || "No comment"}</td>
                                           <td>{r.created_at || r.date || "N/A"}</td>
                                           <button
                                           className="btn btn-sm btn-outline-danger rounded-circle"
                                           onClick={() => handleDeleteRating(r.rating_id)}
                                           >
                                           <FaTrashAlt />
                                           </button>
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
                           </div>
                         </div>
                 
                 

      {/* Extra CSS */}
      <style>
        {`
          .btn-gradient {
            background: linear-gradient(90deg, #007bff, #00b4d8);
            border: none;
          }
          .btn-gradient:hover {
            filter: brightness(1.1);
          }
          .glass-navbar {
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 0 0 20px 20px;
          }
          .sidebar .nav-item {
            transition: all 0.3s ease;
          }
          .sidebar .nav-item:hover {
            background: #f1f5ff;
          }
          .table-fade {
            mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
          }
        `}
      </style>
    </Dashboard>
  );
}

export default StudentDashboard;
