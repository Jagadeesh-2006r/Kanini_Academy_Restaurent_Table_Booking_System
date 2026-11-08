import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/health')
      .then(res => {
        setHealth(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('API health check error:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container">
          <a className="navbar-brand fw-bold" href="/">
            <i className="bi bi-cup-hot-fill text-warning me-2"></i>
            SAVORIA <span>BISTRO</span>
          </a>
          <div className="ms-auto text-light small d-none d-md-block">
            <span className="badge bg-success me-2">● Online</span>
            Table Reservation System
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container my-auto py-5 text-center">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <span className="badge rounded-pill bg-warning text-dark px-3 py-2 mb-3 fw-semibold">
              <i className="bi bi-stars me-1"></i> Stage 1: Setup & Database Complete
            </span>
            <h1 className="display-4 fw-bold mb-3">
              Fine Dining Meets Seamless Reservations
            </h1>
            <p className="lead text-muted mb-4">
              Welcome to the full-stack Restaurant Table Reservation System. Experience smart table allocation, real-time availability, and multi-role dashboards for Customers, Staff, and Administrators.
            </p>

            <div className="card custom-card p-4 mx-auto text-start shadow-sm mb-4" style={{ maxWidth: '600px' }}>
              <h5 className="fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-check2-circle text-success me-2"></i>
                Backend & Database Status
              </h5>
              <div className="row g-2">
                <div className="col-sm-6">
                  <div className="p-2 border rounded bg-light small">
                    <strong>Frontend:</strong> React 18 + Vite + Bootstrap 5
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-2 border rounded bg-light small">
                    <strong>Backend:</strong> Node.js + Express REST API
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-2 border rounded bg-light small">
                    <strong>Database:</strong> PostgreSQL 18 + Prisma ORM
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-2 border rounded bg-light small">
                    <strong>API Status:</strong> {loading ? 'Checking...' : health?.status === 'ok' ? 'Connected (200 OK)' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <button className="btn btn-gold px-4 py-2">
                <i className="bi bi-calendar2-check me-2"></i> Explore Branches
              </button>
              <button className="btn btn-outline-gold px-4 py-2">
                <i className="bi bi-shield-lock me-2"></i> Sign In
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer-custom py-3 text-center small">
        <div className="container">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} Savoria Restaurant Table Reservation System. Built with React, Node.js, Express & PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
