import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const StaffTodayPage = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/staff/reservations?view=today')
      .then(res => setReservations(res.data.data))
      .catch(err => console.error('Failed to load today reservations:', err))
      .finally(() => setLoading(false));
  }, []);

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Group reservations by startTime
  const groupedByTime = {};
  for (const r of reservations) {
    if (!groupedByTime[r.startTime]) {
      groupedByTime[r.startTime] = [];
    }
    groupedByTime[r.startTime].push(r);
  }

  const sortedTimes = Object.keys(groupedByTime).sort();

  return (
    <div className="container-fluid px-lg-5 py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <span className="badge bg-danger px-2.5 py-1 text-uppercase mb-1">
            <i className="bi bi-broadcast me-1"></i> Live Floor View
          </span>
          <h2 className="font-serif fw-bold mb-1">Today's Dining Schedule</h2>
          <p className="text-muted small mb-0">
            {todayStr} | {user?.branch?.branchName || 'Assigned Branch'}
          </p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <button onClick={() => window.print()} className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-printer me-1"></i> Print Floor Run-Sheet
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading today schedule...</span>
          </div>
        </div>
      ) : sortedTimes.length === 0 ? (
        <div className="card custom-card p-5 text-center my-4">
          <i className="bi bi-check2-circle text-success fs-1 mb-3"></i>
          <h5>No reservations scheduled for today yet.</h5>
          <p className="text-muted small">New bookings made for today will show up here automatically.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-4">
          {sortedTimes.map((timeSlot) => (
            <div key={timeSlot} className="card custom-card border-0 shadow-sm overflow-hidden">
              <div className="card-header bg-dark text-white py-2.5 d-flex justify-content-between align-items-center">
                <span className="fw-bold font-monospace fs-6">
                  <i className="bi bi-clock-fill text-warning me-2"></i>
                  {timeSlot} Service
                </span>
                <span className="badge bg-secondary">
                  {groupedByTime[timeSlot].length} Table(s) Booked
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Table</th>
                      <th>Reference</th>
                      <th>Guest Name</th>
                      <th>Phone</th>
                      <th>Party Size</th>
                      <th>Special Requests</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByTime[timeSlot].map((res) => (
                      <tr key={res.id}>
                        <td>
                          <span className="badge bg-dark fs-6">{res.table?.tableNumber}</span>
                          <span className="text-muted ms-1 small">({res.table?.seatingArea})</span>
                        </td>
                        <td className="font-monospace fw-semibold">{res.referenceNumber}</td>
                        <td className="fw-bold text-dark">{res.customer?.name}</td>
                        <td>{res.customer?.phone}</td>
                        <td>{res.partySize} Guests</td>
                        <td>{res.specialRequest || <span className="text-muted">—</span>}</td>
                        <td>
                          <span className={`badge ${
                            res.status === 'BOOKED' ? 'badge-status-booked' : 'badge-status-cancelled'
                          }`}>
                            {res.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffTodayPage;
