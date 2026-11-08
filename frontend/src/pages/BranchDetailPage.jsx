import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export const BranchDetailPage = () => {
  const { id } = useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/branches/${id}`)
      .then(res => setBranch(res.data.data))
      .catch(err => setError(err.response?.data?.message || 'Failed to load branch details.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading branch...</span>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger max-w-500 mx-auto" role="alert">
          {error || 'Branch not found.'}
        </div>
        <Link to="/branches" className="btn btn-outline-gold mt-3">
          &larr; Back to Branches
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <Link to="/branches" className="btn btn-outline-secondary btn-sm mb-4">
        &larr; All Branches
      </Link>

      <div className="row g-4">
        {/* Left Column: Branch Info & Booking Call-to-action */}
        <div className="col-lg-7">
          <div className="card custom-card p-4 p-md-5 mb-4 border-0">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <span className="badge bg-success bg-opacity-10 text-success border border-success px-3 py-1.5 fs-6">
                <i className="bi bi-clock me-1"></i> {branch.openingTime} - {branch.closingTime}
              </span>
              <span className="badge bg-light text-secondary border px-3 py-1.5">
                {branch.slotLength} Mins Slot Length
              </span>
            </div>

            <h1 className="font-serif fw-bold mb-2">{branch.branchName}</h1>
            <p className="lead text-muted mb-4">
              <i className="bi bi-geo-alt-fill text-danger me-2"></i>
              {branch.address}
            </p>

            <div className="row g-3 mb-4">
              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-muted small">Indoor Seating Area</div>
                  <h4 className="fw-bold mb-0 text-primary">
                    <i className="bi bi-house-door me-2"></i>
                    {branch.indoorCount} Tables
                  </h4>
                </div>
              </div>

              <div className="col-sm-6">
                <div className="p-3 border rounded-3 bg-light">
                  <div className="text-muted small">Outdoor Terrace Area</div>
                  <h4 className="fw-bold mb-0 text-warning">
                    <i className="bi bi-sun me-2"></i>
                    {branch.outdoorCount} Tables
                  </h4>
                </div>
              </div>
            </div>

            <div className="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-25 mb-4">
              <h6 className="fw-bold text-dark mb-1">
                <i className="bi bi-info-circle-fill text-warning me-2"></i>
                Reservation Guidelines
              </h6>
              <ul className="mb-0 small text-secondary ps-3">
                <li>Book up to 30 days in advance.</li>
                <li>Instant automatic table allocation tailored to your guest count.</li>
                <li>Free cancellation or reschedule up to 1 hour before arrival.</li>
              </ul>
            </div>

            <Link
              to={`/reservations/new?branchId=${branch.id}`}
              className="btn btn-gold btn-lg w-100 text-center py-3"
            >
              <i className="bi bi-calendar2-check-fill me-2"></i>
              Reserve a Table at {branch.branchName}
            </Link>
          </div>
        </div>

        {/* Right Column: Table Layout Overview */}
        <div className="col-lg-5">
          <div className="card custom-card p-4 border-0">
            <h5 className="fw-bold mb-3 border-bottom pb-2">
              <i className="bi bi-grid-3x3-gap-fill text-warning me-2"></i>
              Branch Table Layout & Capacities
            </h5>

            <div className="table-responsive">
              <table className="table table-hover align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Table</th>
                    <th>Area</th>
                    <th>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {branch.tables?.map((table) => (
                    <tr key={table.id}>
                      <td className="fw-semibold">
                        <i className="bi bi-square-fill text-secondary me-2 small"></i>
                        {table.tableNumber}
                      </td>
                      <td>
                        <span className={`badge ${table.seatingArea === 'OUTDOOR' ? 'badge-outdoor' : 'badge-indoor'}`}>
                          {table.seatingArea}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          Up to {table.capacity} guests
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetailPage;
