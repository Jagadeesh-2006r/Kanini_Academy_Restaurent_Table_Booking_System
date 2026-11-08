import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <i className="bi bi-egg-fried text-warning me-2 fs-3"></i>
          <span>SAVORIA</span>&nbsp;BISTRO
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          {/* Main Navigation Links */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                <i className="bi bi-house-door me-1"></i> Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/branches">
                <i className="bi bi-geo-alt me-1"></i> Branches
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">
                <i className="bi bi-info-circle me-1"></i> About
              </NavLink>
            </li>

            {/* Role-Specific Navigation */}
            {isAuthenticated && user?.role === 'CUSTOMER' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reservations/new">
                    <i className="bi bi-calendar-plus me-1"></i> Book Table
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/reservations/my">
                    <i className="bi bi-card-checklist me-1"></i> My Bookings
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/customer/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Dashboard
                  </NavLink>
                </li>
              </>
            )}

            {isAuthenticated && user?.role === 'STAFF' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/staff/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Staff Desk
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/staff/today">
                    <i className="bi bi-calendar-day me-1"></i> Today's Schedule
                  </NavLink>
                </li>
              </>
            )}

            {isAuthenticated && user?.role === 'ADMIN' && (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/admin/dashboard">
                    <i className="bi bi-speedometer2 me-1"></i> Overview
                  </NavLink>
                </li>
                <li className="nav-item dropdown">
                  <a
                    className="nav-link dropdown-toggle"
                    href="#"
                    role="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-sliders me-1"></i> Management
                  </a>
                  <ul className="dropdown-menu dropdown-menu-dark shadow">
                    <li>
                      <Link className="dropdown-item" to="/admin/branches">
                        <i className="bi bi-shop me-2"></i> Manage Branches
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/tables">
                        <i className="bi bi-grid-3x3-gap me-2"></i> Manage Tables
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/staff">
                        <i className="bi bi-people me-2"></i> Manage Staff
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <Link className="dropdown-item" to="/admin/reservations">
                        <i className="bi bi-journal-text me-2"></i> All Reservations
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/admin/reports">
                        <i className="bi bi-bar-chart-line me-2"></i> Analytics & Reports
                      </Link>
                    </li>
                  </ul>
                </li>
              </>
            )}
          </ul>

          {/* Right Action / Auth Buttons */}
          <div className="d-flex align-items-center gap-2">
            {isAuthenticated ? (
              <div className="d-flex align-items-center gap-3">
                <Link
                  to="/profile"
                  className="text-decoration-none text-light d-flex align-items-center gap-2 bg-dark bg-opacity-50 px-3 py-1.5 rounded-pill border border-secondary"
                  title="View Profile"
                >
                  <i className="bi bi-person-circle fs-5 text-warning"></i>
                  <span className="small fw-semibold">{user.name.split(' ')[0]}</span>
                  <span className={`badge ${user.role === 'ADMIN' ? 'bg-danger' : user.role === 'STAFF' ? 'bg-info text-dark' : 'bg-warning text-dark'} text-uppercase`} style={{ fontSize: '0.65rem' }}>
                    {user.role}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 rounded-pill px-3"
                  title="Sign Out"
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span className="d-none d-sm-inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-gold btn-sm px-3">
                  <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
                </Link>
                <Link to="/register" className="btn btn-gold btn-sm px-3">
                  <i className="bi bi-person-plus me-1"></i> Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

