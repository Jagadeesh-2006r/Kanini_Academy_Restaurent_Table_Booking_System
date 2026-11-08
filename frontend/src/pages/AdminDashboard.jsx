import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-5">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-uppercase px-2.5 py-1 mb-2 fw-semibold">
            <i className="bi bi-shield-lock-fill me-1"></i> Administrator Portal
          </span>
          <h2 className="font-serif fw-bold mb-1">System Overview & Live Metrics</h2>
          <p className="text-muted small mb-0">Control branches, table layouts, staff credentials, and analyze reservations</p>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
          <Link to="/admin/branches" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-shop me-1"></i> Branches
          </Link>
          <Link to="/admin/tables" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-grid me-1"></i> Tables
          </Link>
          <Link to="/admin/staff" className="btn btn-outline-dark btn-sm">
            <i className="bi bi-person-plus me-1"></i> Add Staff
          </Link>
          <Link to="/admin/reports" className="btn btn-gold btn-sm">
            <i className="bi bi-bar-chart-line me-1"></i> Analytics
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading metrics...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-sm-6 col-xl-3">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small d-block mb-1">Total Reservations</span>
                    <h3 className="fw-bold mb-0 text-dark">{stats?.totalReservations || 0}</h3>
                  </div>
                  <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary fs-4">
                    <i className="bi bi-journal-check"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small d-block mb-1">Today's Bookings</span>
                    <h3 className="fw-bold mb-0 text-success">{stats?.todayReservations || 0}</h3>
                  </div>
                  <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success fs-4">
                    <i className="bi bi-calendar2-day"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small d-block mb-1">Upcoming Bookings</span>
                    <h3 className="fw-bold mb-0 text-warning">{stats?.upcomingReservations || 0}</h3>
                  </div>
                  <div className="p-3 rounded-circle bg-warning bg-opacity-10 text-warning fs-4">
                    <i className="bi bi-calendar2-plus"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-sm-6 col-xl-3">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted small d-block mb-1">Registered Customers</span>
                    <h3 className="fw-bold mb-0 text-info">{stats?.totalCustomers || 0}</h3>
                  </div>
                  <div className="p-3 rounded-circle bg-info bg-opacity-10 text-info fs-4">
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Branch-wise breakdown */}
          <div className="row g-4 mb-4">
            <div className="col-lg-8">
              <div className="card custom-card border-0 shadow-sm p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                  <h5 className="font-serif fw-bold mb-0">Branch Operating Summary</h5>
                  <Link to="/admin/branches" className="btn btn-sm btn-outline-secondary">
                    Manage All Branches
                  </Link>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Branch Name</th>
                        <th>Status</th>
                        <th>Total Tables</th>
                        <th>Total Bookings</th>
                        <th>Quick Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.branchWise?.map((b) => (
                        <tr key={b.branchId}>
                          <td className="fw-bold text-dark">{b.branchName}</td>
                          <td>
                            <span className={`badge ${b.active ? 'bg-success' : 'bg-secondary'}`}>
                              {b.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{b.tableCount} Tables</td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {b.reservationCount} Bookings
                            </span>
                          </td>
                          <td>
                            <Link to={`/admin/tables?branchId=${b.branchId}`} className="btn btn-outline-dark btn-sm py-0.5 px-2">
                              Tables
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card custom-card border-0 shadow-sm p-4 h-100">
                <h5 className="font-serif fw-bold mb-3 border-bottom pb-2">Admin Shortcuts</h5>
                <div className="d-grid gap-2">
                  <Link to="/admin/branches" className="btn btn-outline-dark text-start py-2.5">
                    <i className="bi bi-shop me-2 text-warning"></i> Add / Edit Restaurant Branches
                  </Link>
                  <Link to="/admin/tables" className="btn btn-outline-dark text-start py-2.5">
                    <i className="bi bi-grid-3x3-gap me-2 text-warning"></i> Configure Table Capacities
                  </Link>
                  <Link to="/admin/staff" className="btn btn-outline-dark text-start py-2.5">
                    <i className="bi bi-person-badge me-2 text-warning"></i> Create Staff Accounts
                  </Link>
                  <Link to="/admin/reservations" className="btn btn-outline-dark text-start py-2.5">
                    <i className="bi bi-journal-text me-2 text-warning"></i> View Master Reservation Log
                  </Link>
                  <Link to="/admin/reports" className="btn btn-outline-dark text-start py-2.5">
                    <i className="bi bi-pie-chart me-2 text-warning"></i> View Analytical Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

