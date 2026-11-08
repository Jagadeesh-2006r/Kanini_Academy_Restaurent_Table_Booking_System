import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const [filterDate, setFilterDate] = useState(todayStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStaffReservations();
  }, [filterDate, statusFilter]);

  const fetchStaffReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/staff/reservations', { params });
      setReservations(res.data.data);
    } catch (err) {
      console.error('Failed to load staff reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reservations.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const custName = r.customer?.name?.toLowerCase() || '';
    const custPhone = r.customer?.phone || '';
    const ref = r.referenceNumber?.toLowerCase() || '';
    const tbl = r.table?.tableNumber?.toLowerCase() || '';
    return custName.includes(term) || custPhone.includes(term) || ref.includes(term) || tbl.includes(term);
  });

  const totalGuests = filtered.reduce((sum, r) => sum + (r.status === 'BOOKED' ? r.partySize : 0), 0);
  const activeBookings = filtered.filter(r => r.status === 'BOOKED').length;

  return (
    <div className="container-fluid px-lg-5 py-5">
      {/* Branch Header Banner */}
      <div className="card custom-card p-4 border-0 mb-4 bg-dark text-white">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center">
          <div>
            <span className="badge bg-warning text-dark text-uppercase px-2.5 py-1 mb-2 fw-bold">
              Staff Front Desk
            </span>
            <h2 className="font-serif fw-bold mb-1 text-white">
              {user?.branch?.branchName || 'Assigned Branch Desk'}
            </h2>
            <p className="text-secondary small mb-0">
              <i className="bi bi-geo-alt-fill text-warning me-1"></i>
              {user?.branch?.address || 'Restaurant Branch'} | Staff Member: <strong>{user?.name}</strong>
            </p>
          </div>

          <div className="d-flex gap-3 mt-3 mt-md-0">
            <div className="text-center px-3 py-2 bg-secondary bg-opacity-25 rounded-3 border border-secondary">
              <span className="text-secondary small d-block">Active Bookings</span>
              <strong className="fs-4 text-warning">{activeBookings}</strong>
            </div>
            <div className="text-center px-3 py-2 bg-secondary bg-opacity-25 rounded-3 border border-secondary">
              <span className="text-secondary small d-block">Total Guests</span>
              <strong className="fs-4 text-white">{totalGuests}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card custom-card p-3 border-0 mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Filter by Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">Active (BOOKED)</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-1">Search Guest / Reference / Table</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search name, phone, ref, table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-2 text-md-end mt-md-4">
            <button
              onClick={() => { setFilterDate(todayStr); setStatusFilter(''); setSearchTerm(''); }}
              className="btn btn-outline-secondary btn-sm w-100"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Reset to Today
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card custom-card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="font-serif fw-bold mb-0">
            Reservations ({filtered.length})
          </h5>
          <span className="badge bg-light text-dark border">
            Viewing: {filterDate || 'All Dates'}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading floor records...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-calendar-x text-muted fs-1 mb-2"></i>
            <p className="text-muted mb-0">No reservations found for this date or filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Ref Number</th>
                  <th>Customer Name</th>
                  <th>Phone Number</th>
                  <th>Time Slot</th>
                  <th>Table</th>
                  <th>Party</th>
                  <th>Special Requests</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-monospace fw-bold text-dark">{r.referenceNumber}</span>
                    </td>
                    <td>
                      <strong className="text-dark">{r.customer?.name}</strong>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{r.customer?.email}</div>
                    </td>
                    <td>
                      <a href={`tel:${r.customer?.phone}`} className="text-decoration-none text-dark">
                        <i className="bi bi-telephone me-1 text-muted"></i>
                        {r.customer?.phone}
                      </a>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        <i className="bi bi-clock me-1 text-warning"></i>
                        {r.startTime} - {r.endTime}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-dark me-1">{r.table?.tableNumber}</span>
                      <span className={`badge ${r.table?.seatingArea === 'OUTDOOR' ? 'badge-outdoor' : 'badge-indoor'}`}>
                        {r.table?.seatingArea}
                      </span>
                    </td>
                    <td>
                      <span className="fw-bold">{r.partySize}</span> Guests
                    </td>
                    <td style={{ maxWidth: '220px' }}>
                      {r.specialRequest ? (
                        <span className="text-secondary fst-italic">"{r.specialRequest}"</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${
                        r.status === 'BOOKED' ? 'badge-status-booked' :
                        r.status === 'CANCELLED' ? 'badge-status-cancelled' : 'badge-status-completed'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
