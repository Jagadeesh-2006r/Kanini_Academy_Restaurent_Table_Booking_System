import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { downloadReservationPDF } from '../utils/pdfGenerator';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ upcoming: [], past: [], cancelled: [] });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [resResponse, notifResponse] = await Promise.all([
        api.get('/reservations/my'),
        api.get('/notifications'),
      ]);
      setData(resResponse.data.data);
      setNotifications(notifResponse.data.data);
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const nextUpcoming = data.upcoming?.[0] || null;

  return (
    <div className="container py-5">
      {/* Welcome Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <h2 className="font-serif fw-bold mb-1">Hello, {user?.name}!</h2>
          <p className="text-muted small mb-0">Welcome to your personal Savoria dining portal</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <Link to="/reservations/new" className="btn btn-gold d-flex align-items-center gap-2">
            <i className="bi bi-plus-circle"></i> Book New Table
          </Link>
          <Link to="/reservations/my" className="btn btn-outline-dark">
            <i className="bi bi-card-checklist me-1"></i> All Bookings
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Quick Stat Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-success bg-opacity-10 text-success fs-4">
                    <i className="bi bi-calendar2-check"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0">{data.upcoming?.length || 0}</h3>
                    <span className="text-muted small">Upcoming Reservations</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-primary bg-opacity-10 text-primary fs-4">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0">{data.past?.length || 0}</h3>
                    <span className="text-muted small">Past Dining Visits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card custom-card p-3 border-0 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-3 rounded-circle bg-danger bg-opacity-10 text-danger fs-4">
                    <i className="bi bi-x-circle"></i>
                  </div>
                  <div>
                    <h3 className="fw-bold mb-0">{data.cancelled?.length || 0}</h3>
                    <span className="text-muted small">Cancelled Bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Left: Next Upcoming Reservation Spotlight */}
            <div className="col-lg-7">
              <div className="card custom-card p-4 border-0 mb-4 h-100">
                <h5 className="fw-bold mb-3 border-bottom pb-2 d-flex justify-content-between align-items-center">
                  <span>
                    <i className="bi bi-star-fill text-warning me-2"></i>
                    Next Confirmed Booking
                  </span>
                  {nextUpcoming && (
                    <span className="badge badge-status-booked">
                      CONFIRMED
                    </span>
                  )}
                </h5>

                {nextUpcoming ? (
                  <div className="p-3 rounded-3 bg-light border">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold text-dark fs-5 font-serif">
                        {nextUpcoming.branch?.branchName}
                      </span>
                      <span className="badge bg-dark font-monospace">
                        {nextUpcoming.referenceNumber}
                      </span>
                    </div>

                    <div className="row g-2 mb-3 small">
                      <div className="col-6">
                        <i className="bi bi-calendar-event text-warning me-1"></i>
                        <strong>Date:</strong> {new Date(nextUpcoming.reservationDate).toLocaleDateString()}
                      </div>
                      <div className="col-6">
                        <i className="bi bi-clock text-warning me-1"></i>
                        <strong>Time:</strong> {nextUpcoming.startTime} - {nextUpcoming.endTime}
                      </div>
                      <div className="col-6">
                        <i className="bi bi-people text-warning me-1"></i>
                        <strong>Guests:</strong> {nextUpcoming.partySize} People
                      </div>
                      <div className="col-6">
                        <i className="bi bi-grid text-warning me-1"></i>
                        <strong>Table:</strong> {nextUpcoming.table?.tableNumber} ({nextUpcoming.table?.seatingArea})
                      </div>
                    </div>

                    {nextUpcoming.specialRequest && (
                      <div className="p-2 rounded bg-white border small mb-3 text-secondary">
                        <strong>Request:</strong> "{nextUpcoming.specialRequest}"
                      </div>
                    )}

                    <div className="d-flex gap-2">
                      <button
                        onClick={() => downloadReservationPDF(nextUpcoming)}
                        className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1"
                      >
                        <i className="bi bi-file-earmark-pdf-fill text-danger"></i>
                        Download PDF Pass
                      </button>
                      <Link
                        to="/reservations/my"
                        className="btn btn-gold btn-sm d-flex align-items-center gap-1 ms-auto"
                      >
                        Manage Booking
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-calendar-x text-muted fs-1 mb-2"></i>
                    <p className="text-muted mb-3">You have no upcoming reservations scheduled.</p>
                    <Link to="/reservations/new" className="btn btn-gold btn-sm">
                      <i className="bi bi-calendar-plus me-1"></i> Book a Table Today
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Notifications Feed */}
            <div className="col-lg-5">
              <div className="card custom-card p-4 border-0 h-100">
                <h5 className="fw-bold mb-3 border-bottom pb-2 d-flex align-items-center justify-content-between">
                  <span>
                    <i className="bi bi-bell-fill text-warning me-2"></i>
                    Recent Notifications
                  </span>
                  <span className="badge bg-secondary rounded-pill small">
                    {notifications.filter(n => !n.isRead).length} unread
                  </span>
                </h5>

                {notifications.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    <i className="bi bi-chat-square-dots fs-3 d-block mb-2"></i>
                    No notifications yet.
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-2.5 rounded-3 border small d-flex justify-content-between align-items-start ${
                          notif.isRead ? 'bg-white' : 'bg-warning bg-opacity-10 border-warning border-opacity-25'
                        }`}
                      >
                        <div className="me-2">
                          <p className="mb-1 text-dark">{notif.message}</p>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {new Date(notif.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                            title="Mark as read"
                          >
                            <i className="bi bi-check2"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomerDashboard;

