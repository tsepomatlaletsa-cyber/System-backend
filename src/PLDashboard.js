// PLDashboard.js
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


function SimpleModal({ title, show, onClose, children, footer }) {
  
  useEffect(() => {
    if (show) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  if (!show) return null;
  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", background: "transparent" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
        style={{ cursor: "pointer" }}
        aria-hidden="true"
      />
    </>
  );
}


function PLDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [loadingTab, setLoadingTab] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLecturer, setExpandedLecturer] = useState(null);
  const [expandedReport, setExpandedReport] = useState(null);

  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [time, setTime] = useState(new Date());

  const token = localStorage.getItem("token");
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");
  const headers = { Authorization: `Bearer ${token}` };

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [selectedLecturer, setSelectedLecturer] = useState(null);

  const [addCourseForm, setAddCourseForm] = useState({ course_name: "", course_code: "" });
  const [editCourseForm, setEditCourseForm] = useState({ course_name: "", course_code: "" });
  const [assignForm, setAssignForm] = useState({ course_id: "", lecturer_id: "" });
  const [darkMode, setDarkMode] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("prl_darkMode")) || false;
      } catch {
        return false;
      }
    });
  

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
  
  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        const [coursesRes, lecturersRes, assignmentsRes, reportsRes, classesRes, ratingsRes] =
          await Promise.all([
            axios.get("https://system-backend-2-ty55.onrender.com/courses", { headers }),
            axios.get("https://system-backend-2-ty55.onrender.com/lecturers", { headers }),
            axios.get("https://system-backend-2-ty55.onrender.com/assignments", { headers }),
            axios.get("https://system-backend-2-ty55.onrender.com/reports", { headers }),
            axios.get("https://system-backend-2-ty55.onrender.com/classes", { headers }),
            axios.get("https://system-backend-2-ty55.onrender.com/ratings", { headers }),
          ]);

        setCourses(coursesRes.data || []);
        setLecturers(lecturersRes.data || []);
        setAssignments(assignmentsRes.data || []);
        setReports(reportsRes.data || []);
        setClasses(classesRes.data || []);
        setRatings(ratingsRes.data || []);
      } catch (err) {
        console.error("Data fetch error:", err);
        
      }
    };

    fetchAll();
  }, [token]);


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

  
  const tabVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.22 } },
  };

 
  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setLoadingTab(true);
    setTimeout(() => {
      setActiveTab(tab);
      setLoadingTab(false);
      setSearchQuery("");
    }, 250);
  };

  const handleLogout = () => {
    localStorage.clear();
     window.location.href = "/";
  };

  const openAddCourse = () => {
    setAddCourseForm({ course_name: "", course_code: "" });
    setShowAddCourse(true);
  };

  const submitAddCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://system-backend-2-ty55.onrender.com/courses", addCourseForm, { headers });
      setCourses((prev) => [...prev, res.data]);
      setShowAddCourse(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to add course");
    }
  };

  const openEditCourse = (course) => {
    setCourseToEdit(course);
    setEditCourseForm({ course_name: course.course_name || "", course_code: course.course_code || "" });
    setShowEditCourse(true);
  };

  const submitEditCourse = async (e) => {
    e.preventDefault();
    if (!courseToEdit) return;
    try {
      const res = await axios.put(`https://system-backend-2-ty55.onrender.com/courses/${courseToEdit.course_id}`, editCourseForm, { headers });
      setCourses((prev) => prev.map((c) => (c.course_id === courseToEdit.course_id ? res.data : c)));
      setShowEditCourse(false);
      setCourseToEdit(null);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update course");
    }
  };

  const confirmDelete = (type, id) => {
    setDeleteTarget({ type, id });
    setShowConfirmDelete(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    try {
      if (type === "course") {
        await axios.delete(`https://system-backend-2-ty55.onrender.com/courses/${id}`, { headers });
        setCourses((prev) => prev.filter((c) => c.course_id !== id));
      } else if (type === "assignment") {
        await axios.delete(`https://system-backend-2-ty55.onrender.com/assignments/${id}`, { headers });
        setAssignments((prev) => prev.filter((a) => a.assignment_id !== id));
      }
      setShowConfirmDelete(false);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("❌Access Denied, Only allowed to delete your assignments! ");
    }
  };

  const openAssignModal = () => {
    setAssignForm({ course_id: "", lecturer_id: "" });
    setShowAssignModal(true);
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://system-backend-2-ty55.onrender.com/assign-course", assignForm, { headers });
      setAssignments((prev) => [...prev, res.data]);
      setShowAssignModal(false);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to assign course");
    }
  };


  return (
    <Dashboard title="Program Leader Dashboard">
      <div className="d-flex" style={{ minHeight: "100vh", background: "#f4f7fb" }}>
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
            {!collapsed && <h5 className="fw-bold text-primary mb-0">📚 Program Leader</h5>}
            <button
              onClick={() => setCollapsed((s) => !s)}
              className="btn btn-light rounded-circle shadow-sm"
              aria-label="Toggle sidebar"
            >
              <FaBars />
            </button>
          </div>

          {!collapsed && <p className="text-muted small text-center mb-3">{name}</p>}
          <hr />

          <nav className="nav flex-column gap-2">
            {[
              { key: "dashboard", icon: <FaChartLine />, label: "Dashboard" },
              { key: "courses", icon: <FaChalkboardTeacher />, label: "Courses" },
              { key: "lecturers", icon: <FaUserTie />, label: "Lecturers" },
              { key: "assignments", icon: <FaClipboardList />, label: "Assign Courses" },
              { key: "reports", icon: <FaClipboardList />, label: "Reports" },
              { key: "classes", icon: <FaChalkboardTeacher />, label: "Classes" },
              { key: "ratings", icon: <FaStar />, label: "Ratings" },
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

        {/* Main Content */}
        <div className="flex-grow-1 d-flex flex-column">
          {/* Top Navbar */}
          <header
            className={`shadow-sm px-4 py-3 d-flex align-items-center justify-content-between ${darkMode ?
               "bg-secondary" : "bg-white"}`}
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

{/* Content Area */}
<div className="flex-grow-1 p-4 overflow-auto">
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
        {activeTab === "dashboard" && (
          <div className="container-fluid">
            <div className="row g-4 mb-4">
              {[
                {
                  label: "Total Courses",
                  value: courses.length,
                  tab: "courses",
                  icon: (
                    <FaChalkboardTeacher size={28} className="text-primary" />
                  ),
                },
                {
                  label: "Total Reports",
                  value: reports.length,
                  tab: "reports",
                  icon: <FaClipboardList size={28} className="text-success" />,
                },
                {
                  label: "Total Ratings",
                  value: ratings.length,
                  tab: "ratings",
                  icon: <FaStar size={28} className="text-warning" />,
                },
                {
                  label: "Total Assignments",
                  value: assignments.length,
                  tab: "assignments",
                  icon: <FaClipboardList size={28} className="text-info" />,
                },
                {
                  label: "Total Classes",
                  value: classes.length,
                  tab: "classes",
                  icon: <FaChalkboardTeacher size={28} className="text-danger" />,
                },
                {
                  label: "Total Lecturers",
                  value: lecturers.length,
                  tab: "lecturers",
                  icon: <FaUserTie size={28} className="text-secondary" />,
                },
              ].map((card, i) => (
                <div key={i} className="col-12 col-sm-6 col-md-4 col-lg-3">
                  <div
                    className="card p-3 shadow-sm rounded-4 border-0 h-100"
                    style={{ cursor: "pointer" }}
                    onClick={() => handleTabChange(card.tab)}
                  >
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{ fontSize: 28 }}>
                        {card.icon}
                      </div>
                      <div>
                        <h6 className="mb-0 text-muted">{card.label}</h6>
                        <h4 className="mb-0">{card.value}</h4>
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
     
                        
                      
                  {/* ----------------- Courses Tab ----------------- */}
                  {activeTab === "courses" && (
                    <div>
                      <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <h4 className="mb-0">Courses</h4>
                        <div className="d-flex gap-2 w-100 w-md-auto">
                          <input
                            type="text"
                            placeholder="Search Courses..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                          />
                          <button className="btn btn-primary" onClick={openAddCourse}>
                            <FaPlus className="me-2" /> Add
                          </button>

                          <button
                          className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                          onClick={() => exportToCSV(filterData(courses, []), "courses.csv")}
                          >
                          <FaDownload className="me-1" /> CSV
                          </button>
                        </div>
                      </div>

                       <div className="table-responsive card p-3" style={{ background:"" }}>
                       <table className="table table-bordered table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>#</th>
                              <th>Name</th>
                              <th>Code</th>
                              <th>Faculty</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterData(courses, ["course_name", "course_code", "faculty_name"]).map((c, i) => (
                              <tr key={c.course_id || i}>
                                <td style={{ width: 60 }}>{i + 1}</td>
                                <td>{c.course_name}</td>
                                <td>{c.course_code}</td>
                                <td>{c.faculty_name || "N/A"}</td>
                                <td className="text-end">
                                  <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openEditCourse(c)}>
                                    <FaEdit />
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete("course", c.course_id)}>
                                    <FaTrash />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {filterData(courses, ["course_name", "course_code", "faculty_name"]).length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center text-muted">No courses found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ----------------- Assignments Tab ----------------- */}
                  {activeTab === "assignments" && (
                    <div>
                      <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                        <h4 className="mb-0">Assign Lecturers</h4>
                        <div className="d-flex gap-2 w-100 w-md-auto">
                          <input
                            type="text"
                            placeholder="Search Assignments..."
                            className="form-control"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ minWidth: 220 }}
                          />
                          <button className="btn btn-success" onClick={openAssignModal}><FaPlus className="me-2" />Assign</button>
                          <button
                          className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                          onClick={() => exportToCSV(filterData(assignments, [""]), "assign.csv")}
                          >
                         <FaDownload className="me-1" /> CSV
                         </button>
                        </div>
                      </div>

                       <div className="table-responsive card p-3" style={{ background:"" }}>
                         <table className="table table-bordered table-hover align-middle mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>#</th>
                              <th>Course</th>
                              <th>Lecturer</th>
                              <th>Assigned At</th>
                              <th>Assigned By</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filterData(assignments, ["course_name", "lecturer_name"]).map((a, i) => (
                              <tr key={a.assignment_id || i}>
                                <td style={{ width: 60 }}>{i + 1}</td>
                                <td>{a.course_name}</td>
                                <td>{a.lecturer_name}</td>
                                <td>{a.assigned_at || "N/A"}</td>
                                <td>{a.assigned_by || "N/A"}</td>
                                <td className="text-end">
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => confirmDelete("assignment", a.assignment_id)}>
                                    <FaTrash />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {filterData(assignments, ["course_name", "lecturer_name"]).length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center text-muted">No assignments found</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
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
                        <td>{r.prl_feedback || ""}</td>
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


{/* ----------------- Classes Tab ----------------- */}
{activeTab === "classes" && (
  <div>
    {/* Header + Search + CSV Export */}
    <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <h4 className="mb-0">Classes</h4>
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
          onClick={() => {
            const exportData = filterData(classes, ["class_name", "year_of_study", "faculty_name", "description"]).map(c => ({
              "Name": c.class_name,
              "Year": c.year_of_study || "N/A",
              "Faculty": c.faculty_name || c.faculty?.name || "N/A",
              "Description": c.description || "-"
            }));
            exportToCSV(exportData, "classes.csv");
          }}
        >
          <FaDownload className="me-1" /> CSV
        </button>
      </div>
    </div>

    {/* Table */}
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
              <td style={{ width: 60 }}>{i + 1}</td>
              <td>{c.class_name}</td>
              <td>{c.year_of_study || "N/A"}</td>
              <td>{c.faculty_name || c.faculty?.name || "N/A"}</td>
              <td>{c.description || "-"}</td>
            </tr>
          ))}
          {filterData(classes, ["class_name", "faculty_name"]).length === 0 && (
            <tr>
              <td colSpan={5} className="text-center text-muted">No classes found</td>
            </tr>
          )}
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
          </div>
        </div>

        
        {/* Add Course */}
        <SimpleModal
          title="Add Course"
          show={showAddCourse}
          onClose={() => setShowAddCourse(false)}
          footer={
            <>
              <button className="btn btn-secondary" 
              onClick={() => setShowAddCourse(false)}>Cancel</button>
              <button form="addCourseForm" type="submit" className="btn btn-primary">Save</button>
            </>
          }
        >
          <form id="addCourseForm" onSubmit={submitAddCourse}>
            <div className="mb-3">
              <label className="form-label">Course Name</label>
              <input className="form-control" 
              value={addCourseForm.course_name} 
              onChange={(e) => 
              setAddCourseForm({ ...addCourseForm, course_name: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Course Code</label>
              <input className="form-control" 
              value={addCourseForm.course_code} 
              onChange={(e) => 
              setAddCourseForm({ ...addCourseForm, course_code: e.target.value })} required />
            </div>
          </form>
        </SimpleModal>

        {/* Edit Course */}
        <SimpleModal
          title="Edit Course"
          show={showEditCourse}
          onClose={() => { setShowEditCourse(false); setCourseToEdit(null); }}
          footer={
            <>
              <button className="btn btn-secondary" 
              onClick={() => { setShowEditCourse(false); setCourseToEdit(null); }}>Cancel</button>
              <button form="editCourseForm" type="submit" className="btn btn-primary">Update</button>
            </>
          }
        >
          <form id="editCourseForm" onSubmit={submitEditCourse}>
            <div className="mb-3">
              <label className="form-label">Course Name</label>
              <input className="form-control" value={editCourseForm.course_name} 
              onChange={(e) => setEditCourseForm({ ...editCourseForm, course_name: e.target.value })} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Course Code</label>
              <input className="form-control" value={editCourseForm.course_code} 
              onChange={(e) => setEditCourseForm({ ...editCourseForm, course_code: e.target.value })} required />
            </div>
          </form>
        </SimpleModal>

        {/* Assign Lecturer */}
        <SimpleModal
          title="Assign Lecturer to Course"
          show={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button form="assignForm" type="submit" className="btn btn-success">Assign</button>
            </>
          }
        >
          <form id="assignForm" onSubmit={submitAssign}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Course</label>
                <select className="form-select" value={assignForm.course_id} onChange={(e) => setAssignForm({ ...assignForm, course_id: e.target.value })} required>
                  <option value="">Select course</option>
                  {courses.map((c) => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                </select>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Lecturer</label>
                <select className="form-select" value={assignForm.lecturer_id} onChange={(e) => setAssignForm({ ...assignForm, lecturer_id: e.target.value })} required>
                  <option value="">Select lecturer</option>
                  {lecturers.map((l) => <option key={l.user_id} value={l.user_id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </form>
        </SimpleModal>

        {/* Confirm Delete */}
        <SimpleModal
          title="Confirm Delete"
          show={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowConfirmDelete(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={performDelete}>Delete</button>
            </>
          }
        >
          <p>Are you sure you want to delete this {deleteTarget?.type || "item"}? This action cannot be undone.</p>
        </SimpleModal>
      </div>
    </Dashboard>
  );
}

export default PLDashboard;
