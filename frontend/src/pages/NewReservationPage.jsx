import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const NewReservationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(searchParams.get('branchId') || '');

  // Calculate min (today) and max (today + 30 days) dates
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  const maxYear = maxDate.getFullYear();
  const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
  const maxDay = String(maxDate.getDate()).padStart(2, '0');
  const maxDateStr = `${maxYear}-${maxMonth}-${maxDay}`;

  const [reservationDate, setReservationDate] = useState(todayStr);
  const [partySize, setPartySize] = useState(2);
  const [seatingArea, setSeatingArea] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');

  // Availability state
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // Booking submit state
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Load branches
  useEffect(() => {
    api.get('/branches')
      .then(res => {
        setBranches(res.data.data);
        if (!selectedBranchId && res.data.data.length > 0) {
          setSelectedBranchId(String(res.data.data[0].id));
        }
      })
      .catch(err => console.error('Error fetching branches:', err));
  }, []);

  // Fetch availability whenever branch, date, partySize, or seatingArea changes
  useEffect(() => {
    if (!selectedBranchId || !reservationDate || !partySize) return;

    setCheckingAvailability(true);
    setBookingError('');
    setSelectedSlot(null);
    setAvailabilityMessage('');

    const params = {
      branchId: selectedBranchId,
      date: reservationDate,
      partySize,
    };
    if (seatingArea) params.seatingArea = seatingArea;

    api.get('/availability', { params })
      .then(res => {
        const result = res.data.data;
        if (result.noSuitableTablesFound) {
          setAvailabilityMessage(res.data.message || `No suitable table for party size ${partySize}.`);
          setSlots([]);
        } else {
          setSlots(result.slots || []);
        }
      })
      .catch(err => {
        setAvailabilityMessage(err.response?.data?.message || 'Failed to check slot availability.');
        setSlots([]);
      })
      .finally(() => setCheckingAvailability(false));
  }, [selectedBranchId, reservationDate, partySize, seatingArea]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookingError('');

    if (!selectedSlot) {
      setBookingError('Please choose an available time slot.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        branchId: parseInt(selectedBranchId, 10),
        reservationDate,
        startTime: selectedSlot.startTime,
        partySize: parseInt(partySize, 10),
        seatingArea: seatingArea || undefined,
        specialRequest: specialRequest || undefined,
      };

      const res = await api.post('/reservations', payload);
      const createdRes = res.data.data;
      navigate(`/reservations/confirmation/${createdRes.id}`, { state: { reservation: createdRes } });
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
        'Could not complete reservation. The slot may have just been booked. Please try another slot.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedBranch = branches.find(b => String(b.id) === String(selectedBranchId));

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="text-center mb-4">
            <span className="badge rounded-pill bg-warning text-dark px-3 py-1.5 mb-2 fw-semibold">
              Instant Table Allocation
            </span>
            <h2 className="font-serif fw-bold mb-1">Reserve Your Dining Table</h2>
            <p className="text-muted small">
              Real-time availability with guaranteed optimal table allocation
            </p>
          </div>

          {bookingError && (
            <div className="alert alert-danger d-flex align-items-center py-2.5 px-3 rounded-3 mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill fs-5 me-2"></i>
              <div>{bookingError}</div>
            </div>
          )}

          <div className="card custom-card p-4 p-md-5 border-0 shadow">
            <form onSubmit={handleSubmit}>
              <div className="row g-4 mb-4">
                {/* Branch Selection */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    <i className="bi bi-shop text-warning me-1"></i> Select Branch
                  </label>
                  <select
                    className="form-select"
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    required
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchName} ({b.address.split(',')[0]})
                      </option>
                    ))}
                  </select>
                  {selectedBranch && (
                    <div className="form-text small mt-1 text-muted">
                      Operating hours: {selectedBranch.openingTime} - {selectedBranch.closingTime} ({selectedBranch.slotLength} min slots)
                    </div>
                  )}
                </div>

                {/* Date Selection */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    <i className="bi bi-calendar-event text-warning me-1"></i> Reservation Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={reservationDate}
                    min={todayStr}
                    max={maxDateStr}
                    onChange={(e) => setReservationDate(e.target.value)}
                    required
                  />
                  <div className="form-text small mt-1 text-muted">
                    Reservations open up to 30 days in advance (until {maxDateStr})
                  </div>
                </div>

                {/* Party Size */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    <i className="bi bi-people text-warning me-1"></i> Number of Guests (Party Size)
                  </label>
                  <select
                    className="form-select"
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value, 10))}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                  <div className="form-text small mt-1 text-muted">
                    Our system assigns the smallest table that comfortably fits your group.
                  </div>
                </div>

                {/* Seating Preference */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-secondary">
                    <i className="bi bi-sun text-warning me-1"></i> Seating Area Preference
                  </label>
                  <select
                    className="form-select"
                    value={seatingArea}
                    onChange={(e) => setSeatingArea(e.target.value)}
                  >
                    <option value="">No Preference (Any Available Table)</option>
                    <option value="INDOOR">Indoor Dining Room</option>
                    <option value="OUTDOOR">Outdoor Open-Air Terrace</option>
                  </select>
                </div>
              </div>

              {/* Time Slots Selection Section */}
              <div className="mb-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <label className="form-label fw-bold mb-0 text-dark">
                    <i className="bi bi-clock-history text-warning me-1"></i>
                    Available Time Slots for {reservationDate}
                  </label>
                  {checkingAvailability && (
                    <span className="spinner-border spinner-border-sm text-warning" role="status"></span>
                  )}
                </div>

                {availabilityMessage ? (
                  <div className="alert alert-warning small py-2 px-3 rounded-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    {availabilityMessage}
                  </div>
                ) : slots.length === 0 && !checkingAvailability ? (
                  <div className="text-muted small">No available slots for the selected options.</div>
                ) : (
                  <div className="row g-2">
                    {slots.map((slot, index) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <div key={index} className="col-6 col-sm-4 col-md-3">
                          <button
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`btn w-100 py-2.5 px-1 text-center d-flex flex-column align-items-center justify-content-center rounded-3 transition ${
                              isSelected
                                ? 'btn-gold shadow-sm'
                                : slot.available
                                ? 'btn-outline-dark bg-white'
                                : 'btn-light text-muted border border-dashed opacity-50'
                            }`}
                            style={{ minHeight: '65px' }}
                          >
                            <span className="fw-bold small">{slot.startTime}</span>
                            <span style={{ fontSize: '0.7rem' }}>
                              {slot.available ? `${slot.freeTableCount} table(s) free` : slot.reason || 'Full'}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Special Requests */}
              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary">
                  <i className="bi bi-chat-left-heart text-warning me-1"></i> Special Requests (Optional)
                </label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g., Anniversary celebration, quiet booth, high chair needed..."
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  maxLength="300"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="btn btn-gold btn-lg w-100 py-3 d-flex align-items-center justify-content-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Allocating Smallest Table & Confirming...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle fs-5"></i>
                    {selectedSlot
                      ? `Confirm Reservation for ${selectedSlot.startTime} (${partySize} Guests)`
                      : 'Select an Available Time Slot to Continue'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewReservationPage;

