import React, { useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';

function LecturerForm({ onReportAdded }) {
  const token = localStorage.getItem("token");
  const lecturerName = localStorage.getItem("name");

  const [formData, setFormData] = useState({
    faculty_name: "",
    class_name: "",
    week_of_reporting: "",
    date_of_lecture: "",
    course_name: "",
    course_code: "",
    lecturer_name: lecturerName || "",
    students_present: "",
    total_students: "",
    venue: "",
    lecture_time: "",
    topic: "",
    learning_outcomes: "",
    recommendations: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/reports", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Report submitted successfully!");
      setFormData({
        faculty_name: "",
        class_name: "",
        week_of_reporting: "",
        date_of_lecture: "",
        course_name: "",
        course_code: "",
        lecturer_name: lecturerName || "",
        students_present: "",
        total_students: "",
        venue: "",
        lecture_time: "",
        topic: "",
        learning_outcomes: "",
        recommendations: "",
      });
      onReportAdded();
    } catch (error) {
      console.error(error);
      alert("Failed to submit report. Please try again.");
    }
  };

  return (
    <div className="card shadow-sm p-4 mt-4 mb-4">
      <h4 className="mb-3">📋 Weekly Lecturer Report Form</h4>
      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Faculty Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Faculty Name</label>
            <input
              type="text"
              name="faculty_name"
              value={formData.faculty_name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Class Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Class Name</label>
            <input
              type="text"
              name="class_name"
              value={formData.class_name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Week of Reporting */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Week of Reporting</label>
            <input
              type="text"
              name="week_of_reporting"
              value={formData.week_of_reporting}
              onChange={handleChange}
              className="form-control"
              placeholder="e.g. Week 3"
              required
            />
          </div>

          {/* Date of Lecture */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Date of Lecture</label>
            <input
              type="date"
              name="date_of_lecture"
              value={formData.date_of_lecture}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Course Name */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Course Name</label>
            <input
              type="text"
              name="course_name"
              value={formData.course_name}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Course Code */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Course Code</label>
            <input
              type="text"
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Lecturer’s Name (auto-filled) */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Lecturer’s Name</label>
            <input
              type="text"
              name="lecturer_name"
              value={formData.lecturer_name}
              className="form-control"
              readOnly
            />
          </div>

          {/* Actual Number of Students Present */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Actual Number of Students Present</label>
            <input
              type="number"
              name="students_present"
              value={formData.students_present}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Total Registered Students */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Total Number of Registered Students</label>
            <input
              type="number"
              name="total_students"
              value={formData.total_students}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Venue */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Venue of the Class</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Lecture Time */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Scheduled Lecture Time</label>
            <input
              type="time"
              name="lecture_time"
              value={formData.lecture_time}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Topic */}
          <div className="col-md-6 mb-3">
            <label className="form-label">Topic Taught</label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Learning Outcomes */}
          <div className="col-12 mb-3">
            <label className="form-label">Learning Outcomes of the Topic</label>
            <textarea
              name="learning_outcomes"
              value={formData.learning_outcomes}
              onChange={handleChange}
              className="form-control"
              rows="3"
              required
            ></textarea>
          </div>

          {/* Recommendations */}
          <div className="col-12 mb-3">
            <label className="form-label">Lecturer’s Recommendations</label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleChange}
              className="form-control"
              rows="3"
              required
            ></textarea>
          </div>
        </div>

        <button type="submit" className="btn btn-success">Submit Report</button>
      </form>
    </div>
  );
}

export default LecturerForm;
