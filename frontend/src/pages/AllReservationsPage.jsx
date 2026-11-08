import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { downloadReservationPDF } from '../utils/pdfGenerator';

export const AllReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/branches')
      .then(res => setBranches(res.data.data))
      .catch(err => console.error('Failed to load branches:', err));
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [selectedBranch, selectedStatus, filterDate]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBranch) params.branchId = selectedBranch;
      if (selectedStatus) params.status = selectedStatus;
      if (filterDate) params.date = filterDate;

      const res = await api.get('/admin/reservations', { params });
      setReservations(res.data.data);
    } catch (err) {
      console.error('Failed to load all reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminCancel = async (resId, refNumber) => {
    if (!window.confirm(`Are you sure you want to cancel reservation ${refNumber}?`)) return;

    try {
      const res = await api.patch(`/reservations/${resId}/cancel`);
      setFeedback({ type: 'success', message: res.data.message });
      fetchReservations();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to cancel reservation.',
      });
    }
  };

  const filtered = reservations.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const ref = r.referenceNumber?.toLowerCase() || '';
    const name = r.customer?.name?.toLowerCase() || '';
    const email = r.customer?.email?.toLowerCase() || '';
    const phone = r.customer?.phone || '';
    const table = r.table?.tableNumber?.toLowerCase() || '';
    return ref.includes(term) || name.includes(term) || email.includes(term) || phone.includes(term) || table.includes(term);
  });

  return (
    <div className="container-fluid px-lg-5 py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-uppercase px-2.5 py-1 mb-1">
            System Records
          </span>
          <h2 className="font-serif fw-bold mb-1">Master Reservation Registry</h2>
          <p className="text-muted small mb-0">Search, filter, and inspect all customer bookings across every restaurant branch</p>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show small py-2 px-3 rounded-3 mb-4`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close small p-2" onClick={() => setFeedback({ type: '', message: '' })}></button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card custom-card p-3 border-0 mb-4 bg-light">
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Branch</label>
            <select
              className="form-select form-select-sm"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.branchName}</option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label small fw-semibold text-muted mb-1">Status</label>
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="BOOKED">BOOKED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label small fw-semibold text-muted mb-1">Reservation Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label small fw-semibold text-muted mb-1">Search Anything</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-white">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Search reference, guest name, table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {(selectedBranch || selectedStatus || filterDate || searchTerm) && (
                <button
                  onClick={() => { setSelectedBranch(''); setSelectedStatus(''); setFilterDate(''); setSearchTerm(''); }}
                  className="btn btn-outline-secondary"
                  title="Clear filters"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Registry Table */}
      <div className="card custom-card border-0 shadow-sm overflow-hidden">
        <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="font-serif fw-bold mb-0">
            Total Results: {filtered.length}
          </h5>
          <span className="badge bg-light text-dark border">
            ACID Transaction Protected
          </span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading registry...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-journal-x text-muted fs-1 mb-2"></i>
            <p className="text-muted mb-0">No reservations matching the current criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Ref Number</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Date & Time</th>
                  <th>Table</th>
                  <th>Party</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <span className="font-monospace fw-bold text-dark">{res.referenceNumber}</span>
                    </td>
                    <td>
                      <strong className="text-dark d-block">{res.customer?.name}</strong>
                      <span className="text-muted" style={{ fontSize: '0.75rem' }}>{res.customer?.email} | {res.customer?.phone}</span>
                    </td>
                    <td>
                      <span className="fw-semibold text-dark">{res.branch?.branchName}</span>
                    </td>
                    <td>
                      <div>{new Date(res.reservationDate).toLocaleDateString()}</div>
                      <span className="badge bg-light text-dark border">
                        {res.startTime} - {res.endTime}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-dark me-1">{res.table?.tableNumber}</span>
                      <span className={`badge ${res.table?.seatingArea === 'OUTDOOR' ? 'badge-outdoor' : 'badge-indoor'}`}>
                        {res.table?.seatingArea}
                      </span>
                    </td>
                    <td>{res.partySize} Guests</td>
                    <td>
                      <span className={`badge ${
                        res.status === 'BOOKED' ? 'badge-status-booked' :
                        res.status === 'CANCELLED' ? 'badge-status-cancelled' : 'badge-status-completed'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          onClick={() => downloadReservationPDF(res)}
                          className="btn btn-outline-dark btn-sm py-1 px-2"
                          title="Download PDF"
                        >
                          <i className="bi bi-file-earmark-pdf"></i>
                        </button>
                        {res.status === 'BOOKED' && (
                          <button
                            onClick={() => handleAdminCancel(res.id, res.referenceNumber)}
                            className="btn btn-outline-danger btn-sm py-1 px-2"
                            title="Cancel Booking"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
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

export default AllReservationsPage;

