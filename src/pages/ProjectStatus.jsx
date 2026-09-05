import React from "react";
import { Link } from "react-router-dom";

export const ProjectStatus = () => (
  <main className="project-status-page">
    <section className="project-status-card">
      <span className="status-dot" />
      <span className="eyebrow">NAWI / LEGAL METROLOGY</span>
      <h1>Project is working</h1>
      <p>The NAWI instrument testing and approval system is running successfully.</p>
      <div className="project-status-actions"><Link to="/login">Open Login</Link><Link className="secondary" to="/admin/dashbaord">Admin Dashboard</Link></div>
    </section>
  </main>
);
