import React, { useEffect, useState } from "react";
import axios from "axios";

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get("http://localhost:5000/reports", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setReports(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="container mt-5">
      <h2>All Reports</h2>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>ID</th>
            <th>Class</th>
            <th>Topic</th>
            <th>Recommendations</th>
            <th>Lecturer</th>
            <th>PRL Feedback</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(r => (
            <tr key={r.report_id}>
              <td>{r.report_id}</td>
              <td>{r.class_name}</td>
              <td>{r.topic}</td>
              <td>{r.recommendations}</td>
              <td>{r.lecturer_id}</td>
              <td>{r.prl_feedback || "No feedback"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportsPage;
