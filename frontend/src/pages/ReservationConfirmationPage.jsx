import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { downloadReservationPDF } from '../utils/pdfGenerator';

export const ReservationConfirmationPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [reservation, setReservation] = useState(location.state?.reservation || null);
  const [loading, setLoading] = useState(!reservation);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reservation && id) {
      api.get(`/reservations/${id}`)
        .then(res => setReservation(res.data.data))
        .catch(err => setError(err.response?.data?.message || 'Could not load reservation details.'))
        .finally(() => setLoading(false));
    }
  }, [id, reservation]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading confirmation...</span>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger max-w-500 mx-auto" role="alert">
          {error || 'Reservation record not found.'}
        </div>
        <Link to="/customer/dashboard" className="btn btn-outline-gold mt-3">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card custom-card p-4 p-md-5 border-0 shadow text-center">
            {/* Success Check Icon */}
            <div className="d-inline-flex p-3 rounded-circle bg-success bg-opacity-10 text-success mx-auto mb-3">
              <i className="bi bi-check-circle-fill fs-1"></i>
            </div>

            <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-1.5 mb-2 mx-auto fw-semibold">
              RESERVATION CONFIRMED
            </span>

            <h2 className="font-serif fw-bold mb-1">Your Table is Reserved!</h2>
            <p className="text-muted small mb-4">
              We look forward to hosting you at Savoria Bistro. Please find your reservation details below.
            </p>

            {/* Reference Number Banner */}
            <div className="p-3 bg-dark text-white rounded-3 mb-4 d-flex flex-column flex-sm-row justify-content-between align-items-center">
              <div className="text-sm-start mb-2 mb-sm-0">
                <span className="text-muted small d-block">Reservation Reference Number</span>
                <span className="fs-4 fw-bold font-monospace text-warning">{reservation.referenceNumber}</span>
              </div>
              <button
                onClick={() => downloadReservationPDF(reservation)}
                className="btn btn-gold btn-sm d-flex align-items-center gap-2"
              >
                <i className="bi bi-file-earmark-pdf-fill"></i> Download PDF Pass
              </button>
            </div>

            {/* Reservation Breakdown Table */}
            <div className="card border rounded-3 p-3 text-start mb-4 bg-light">
              <h6 className="fw-bold border-bottom pb-2 mb-3 text-dark">
                <i className="bi bi-receipt text-warning me-2"></i>
                Booking Information
              </h6>

              <div className="row g-3 small">
                <div className="col-sm-6">
                  <span className="text-muted d-block">Restaurant Branch</span>
                  <strong>{reservation.branch?.branchName}</strong>
                  <div className="text-muted small">{reservation.branch?.address}</div>
                </div>

                <div className="col-sm-6">
                  <span className="text-muted d-block">Date & Time Slot</span>
                  <strong>
                    {new Date(reservation.reservationDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </strong>
                  <div className="text-warning fw-semibold">{reservation.startTime} - {reservation.endTime}</div>
                </div>

                <div className="col-sm-6">
                  <span className="text-muted d-block">Party Size</span>
                  <strong>{reservation.partySize} Guests</strong>
                </div>

                <div className="col-sm-6">
                  <span className="text-muted d-block">Allocated Table (Automatic Selection)</span>
                  <span className="badge bg-dark me-2">{reservation.table?.tableNumber}</span>
                  <span className={`badge ${reservation.table?.seatingArea === 'OUTDOOR' ? 'badge-outdoor' : 'badge-indoor'}`}>
                    {reservation.table?.seatingArea} (Capacity: {reservation.table?.capacity})
                  </span>
                </div>

                {reservation.specialRequest && (
                  <div className="col-12 pt-2 border-top">
                    <span className="text-muted d-block">Special Requests</span>
                    <span className="fst-italic text-secondary">"{reservation.specialRequest}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link to="/reservations/my" className="btn btn-gold px-4 py-2">
                <i className="bi bi-card-checklist me-2"></i> View My Reservations
              </Link>
              <Link to="/reservations/new" className="btn btn-outline-dark px-4 py-2">
                <i className="bi bi-plus-circle me-2"></i> Make Another Reservation
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationConfirmationPage;
