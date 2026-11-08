import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const HomePage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data.data))
      .catch(err => console.error('Failed to load branches:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Luxury Hero Banner */}
      <section className="position-relative text-white py-5" style={{
        background: 'linear-gradient(135deg, #18191c 0%, #2a2016 100%)',
        borderBottom: '2px solid rgba(194, 136, 51, 0.3)',
      }}>
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge rounded-pill bg-warning text-dark px-3 py-2 mb-3 fw-semibold text-uppercase tracking-wider">
                <i className="bi bi-award me-1"></i> Premier Dining Experience
              </span>
              <h1 className="display-4 fw-bold mb-3 font-serif">
                Exceptional Flavors, <br />
                <span className="text-warning">Guaranteed Seating.</span>
              </h1>
              <p className="lead text-light text-opacity-75 mb-4">
                Reserve your table effortlessly across our premier restaurant branches. Powered by intelligent table allocation, zero double bookings, and real-time live availability.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/reservations/new" className="btn btn-gold btn-lg px-4 py-3 d-flex align-items-center gap-2">
                  <i className="bi bi-calendar-check-fill"></i> Reserve a Table Now
                </Link>
                <Link to="/branches" className="btn btn-outline-light btn-lg px-4 py-3 d-flex align-items-center gap-2">
                  <i className="bi bi-compass"></i> Explore Branches
                </Link>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card bg-dark bg-opacity-75 border-secondary text-white p-4 rounded-4 shadow-lg">
                <div className="d-flex align-items-center gap-3 mb-3 border-bottom border-secondary pb-3">
                  <div className="p-3 rounded-circle bg-warning text-dark">
                    <i className="bi bi-stars fs-4"></i>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">Smart Seating Engine</h5>
                    <small className="text-muted">Real-Time PostgreSQL Persistence</small>
                  </div>
                </div>

                <div className="d-flex flex-column gap-3 small">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-warning mt-1"></i>
                    <div>
                      <strong>Optimal Table Allocation:</strong> Automatically matches the smallest available table to your party size.
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-warning mt-1"></i>
                    <div>
                      <strong>Zero Double Booking:</strong> Database transactions with concurrency locks prevent conflicting reservations.
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-warning mt-1"></i>
                    <div>
                      <strong>Multi-Branch Selection:</strong> Choose indoor or outdoor coastal and downtown seating areas.
                    </div>
                  </div>
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-check-circle-fill text-warning mt-1"></i>
                    <div>
                      <strong>Instant PDF Confirmations:</strong> Download official confirmation passes with reference numbers.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Branches Section */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h6 className="text-uppercase text-warning fw-bold letter-spacing-1">Destinations</h6>
            <h2 className="font-serif fw-bold">Our Restaurant Locations</h2>
            <p className="text-muted">Select your favorite ambiance for intimate evenings or family celebrations</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Loading branches...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4 justify-content-center">
              {branches.map((b) => (
                <div key={b.id} className="col-md-6 col-lg-5">
                  <div className="card custom-card h-100 p-4 border-0 shadow-sm d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success fw-semibold px-2.5 py-1">
                          <i className="bi bi-clock me-1"></i> {b.openingTime} - {b.closingTime}
                        </span>
                        <span className="badge bg-light text-secondary border">
                          {b.slotLength} min slots
                        </span>
                      </div>

                      <h4 className="font-serif fw-bold mb-2">{b.branchName}</h4>
                      <p className="text-muted small mb-3">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i> {b.address}
                      </p>

                      <div className="d-flex gap-2 mb-4">
                        <span className="badge badge-indoor">
                          <i className="bi bi-house-door me-1"></i> {b.indoorCount} Indoor Tables
                        </span>
                        <span className="badge badge-outdoor">
                          <i className="bi bi-sun me-1"></i> {b.outdoorCount} Outdoor Tables
                        </span>
                      </div>
                    </div>

                    <div className="d-flex gap-2 pt-3 border-top">
                      <Link
                        to={`/reservations/new?branchId=${b.id}`}
                        className="btn btn-gold flex-grow-1 text-center"
                      >
                        <i className="bi bi-calendar2-plus me-1"></i> Book Table
                      </Link>
                      <Link
                        to={`/branches/${b.id}`}
                        className="btn btn-outline-secondary px-3"
                        title="View Branch Details"
                      >
                        <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h6 className="text-uppercase text-warning fw-bold letter-spacing-1">Simple 3-Step Process</h6>
            <h2 className="font-serif fw-bold">How Savoria Reservations Work</h2>
          </div>

          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="card custom-card p-4 h-100 border-0 bg-transparent">
                <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-10 text-warning mx-auto mb-3">
                  <i className="bi bi-geo-alt fs-2"></i>
                </div>
                <h5 className="fw-bold mb-2">1. Choose Branch & Date</h5>
                <p className="text-muted small">
                  Select your preferred dining destination, date up to 30 days ahead, and your party size.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card custom-card p-4 h-100 border-0 bg-transparent">
                <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-10 text-warning mx-auto mb-3">
                  <i className="bi bi-clock-history fs-2"></i>
                </div>
                <h5 className="fw-bold mb-2">2. Pick an Available Slot</h5>
                <p className="text-muted small">
                  Our algorithm generates valid slots according to operating hours and verifies table capacities live.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card custom-card p-4 h-100 border-0 bg-transparent">
                <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-10 text-warning mx-auto mb-3">
                  <i className="bi bi-check2-circle fs-2"></i>
                </div>
                <h5 className="fw-bold mb-2">3. Instant Confirmation</h5>
                <p className="text-muted small">
                  Receive your unique reference number (`RES-YYYYMMDD-0001`), floor allocation, and download your PDF pass.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

