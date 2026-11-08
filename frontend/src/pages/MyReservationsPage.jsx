import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { downloadReservationPDF } from '../utils/pdfGenerator';

export const MyReservationsPage = () => {
  const [data, setData] = useState({ upcoming: [], past: [], cancelled: [] });
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Modify Modal State
  const [modifyingRes, setModifyingRes] = useState(null);
  const [modDate, setModDate] = useState('');
  const [modTime, setModTime] = useState('');
  const [modPartySize, setModPartySize] = useState(2);
  const [modSpecialRequest, setModSpecialRequest] = useState('');
  const [modSubmitting, setModSubmitting] = useState(false);
  const [modError, setModError] = useState('');

  // Cancel Confirmation State
  const [cancellingRes, setCancellingRes] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reservations/my');
      setData(res.data.data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModifyModal = (reservation) => {
    setModifyingRes(reservation);
    const d = new Date(reservation.reservationDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setModDate(`${yyyy}-${mm}-${dd}`);
    setModTime(reservation.startTime);
    setModPartySize(reservation.partySize);
    setModSpecialRequest(reservation.specialRequest || '');
    setModError('');
  };

  const handleModifySubmit = async (e) => {
    e.preventDefault();
    if (!modifyingRes) return;
    setModSubmitting(true);
    setModError('');

    try {
      await api.put(`/reservations/${modifyingRes.id}`, {
        reservationDate: modDate,
        startTime: modTime,
        partySize: parseInt(modPartySize, 10),
        specialRequest: modSpecialRequest,
      });

      setModifyingRes(null);
      setActionMessage({ type: 'success', text: `Reservation ${modifyingRes.referenceNumber} updated successfully!` });
      fetchReservations();
    } catch (err) {
      setModError(err.response?.data?.message || 'Failed to modify reservation. The requested slot may be full.');
    } finally {
      setModSubmitting(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancellingRes) return;
    setCancelSubmitting(true);

    try {
      await api.patch(`/reservations/${cancellingRes.id}/cancel`);
      setCancellingRes(null);
      setActionMessage({ type: 'success', text: `Reservation ${cancellingRes.referenceNumber} has been cancelled and table released.` });
      fetchReservations();
    } catch (err) {
      setActionMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to cancel reservation.' });
    } finally {
      setCancelSubmitting(false);
    }
  };

  const currentList = data[activeTab] || [];

  return (
    <div className="container py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="font-serif fw-bold mb-1">My Reservations</h2>
          <p className="text-muted small mb-0">Track, modify, or download PDF passes for your dining bookings</p>
        </div>
        <div className="mt-3 mt-md-0">
          <Link to="/reservations/new" className="btn btn-gold btn-sm d-flex align-items-center gap-1">
            <i className="bi bi-plus-lg"></i> Book Another Table
          </Link>
        </div>
      </div>

      {actionMessage.text && (
        <div className={`alert alert-${actionMessage.type} alert-dismissible fade show small py-2 px-3 rounded-3 mb-4`} role="alert">
          <i className="bi bi-info-circle-fill me-2"></i>
          {actionMessage.text}
          <button type="button" className="btn-close small p-2" onClick={() => setActionMessage({ type: '', text: '' })}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
        <li className="nav-item">
          <button
            className={`btn btn-sm ${activeTab === 'upcoming' ? 'btn-dark' : 'btn-light border'}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <i className="bi bi-calendar2-check me-1"></i>
            Upcoming Bookings ({data.upcoming?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn btn-sm ${activeTab === 'past' ? 'btn-dark' : 'btn-light border'}`}
            onClick={() => setActiveTab('past')}
          >
            <i className="bi bi-clock-history me-1"></i>
            Past Visits ({data.past?.length || 0})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn btn-sm ${activeTab === 'cancelled' ? 'btn-dark' : 'btn-light border'}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <i className="bi bi-x-circle me-1"></i>
            Cancelled ({data.cancelled?.length || 0})
          </button>
        </li>
      </ul>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading reservations...</span>
          </div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="card custom-card p-5 text-center my-4">
          <i className="bi bi-calendar-x text-muted fs-1 mb-3"></i>
          <h5>No {activeTab} reservations found.</h5>
          <p className="text-muted small">You don't have any bookings under this category right now.</p>
          {activeTab === 'upcoming' && (
            <Link to="/reservations/new" className="btn btn-gold btn-sm mx-auto">
              Make a Reservation Now
            </Link>
          )}
        </div>
      ) : (
        <div className="row g-4">
          {currentList.map((res) => (
            <div key={res.id} className="col-lg-6">
              <div className="card custom-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-dark font-monospace px-2.5 py-1">
                      {res.referenceNumber}
                    </span>
                    <span className={`badge ${
                      res.status === 'BOOKED' ? 'badge-status-booked' :
                      res.status === 'CANCELLED' ? 'badge-status-cancelled' : 'badge-status-completed'
                    }`}>
                      {res.status}
                    </span>
                  </div>

                  <h4 className="font-serif fw-bold mb-1 text-dark">{res.branch?.branchName}</h4>
                  <p className="text-muted small mb-3">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                    {res.branch?.address}
                  </p>

                  <div className="row g-2 p-2.5 rounded-3 bg-light border small mb-3">
                    <div className="col-6">
                      <span className="text-muted d-block">Date</span>
                      <strong>{new Date(res.reservationDate).toLocaleDateString()}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Time Slot</span>
                      <strong className="text-dark">{res.startTime} - {res.endTime}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Party Size</span>
                      <strong>{res.partySize} Guests</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted d-block">Allocated Table</span>
                      <strong>{res.table?.tableNumber} ({res.table?.seatingArea})</strong>
                    </div>
                  </div>

                  {res.specialRequest && (
                    <div className="small text-secondary mb-3">
                      <strong>Special Request:</strong> "{res.specialRequest}"
                    </div>
                  )}
                </div>

                <div className="d-flex flex-wrap gap-2 pt-3 border-top mt-auto">
                  <button
                    onClick={() => downloadReservationPDF(res)}
                    className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1"
                    title="Download Official PDF Pass"
                  >
                    <i className="bi bi-file-earmark-pdf-fill text-danger"></i> PDF
                  </button>

                  {res.status === 'BOOKED' && (
                    <>
                      <button
                        onClick={() => openModifyModal(res)}
                        className="btn btn-outline-warning text-dark btn-sm d-flex align-items-center gap-1"
                      >
                        <i className="bi bi-pencil-square"></i> Modify
                      </button>

                      <button
                        onClick={() => setCancellingRes(res)}
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 ms-auto"
                      >
                        <i className="bi bi-x-circle"></i> Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modify Reservation Modal */}
      {modifyingRes && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title font-serif fw-bold">
                  Modify Booking: {modifyingRes.referenceNumber}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModifyingRes(null)}></button>
              </div>
              <form onSubmit={handleModifySubmit}>
                <div className="modal-body">
                  {modError && (
                    <div className="alert alert-danger small py-2 px-3 rounded-3 mb-3">
                      {modError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">New Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={modDate}
                      onChange={(e) => setModDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Start Time (HH:mm)</label>
                      <input
                        type="time"
                        className="form-control"
                        value={modTime}
                        onChange={(e) => setModTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Party Size</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        className="form-control"
                        value={modPartySize}
                        onChange={(e) => setModPartySize(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Special Request</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={modSpecialRequest}
                      onChange={(e) => setModSpecialRequest(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setModifyingRes(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold btn-sm" disabled={modSubmitting}>
                    {modSubmitting ? 'Checking Table Availability...' : 'Confirm Reschedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingRes && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title font-serif fw-bold text-danger">
                  Cancel Reservation?
                </h5>
                <button type="button" className="btn-close" onClick={() => setCancellingRes(null)}></button>
              </div>
              <div className="modal-body text-center py-4">
                <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-2 d-block"></i>
                <h6>Are you sure you want to cancel booking <strong>{cancellingRes.referenceNumber}</strong>?</h6>
                <p className="text-muted small mb-0">
                  This will immediately release table <strong>{cancellingRes.table?.tableNumber}</strong> for other guests.
                </p>
              </div>
              <div className="modal-footer border-top">
                <button type="button" className="btn btn-light btn-sm" onClick={() => setCancellingRes(null)}>
                  Keep Booking
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleCancelSubmit}
                  disabled={cancelSubmitting}
                >
                  {cancelSubmitting ? 'Releasing Table...' : 'Yes, Cancel Reservation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservationsPage;
