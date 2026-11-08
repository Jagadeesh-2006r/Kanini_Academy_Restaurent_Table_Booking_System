import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const ReportsPage = () => {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/reports')
      .then(res => setReports(res.data.data))
      .catch(err => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container-fluid px-lg-5 py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-uppercase px-2.5 py-1 mb-1">
            Analytics & Business Intelligence
          </span>
          <h2 className="font-serif fw-bold mb-1">Executive Reports & System Metrics</h2>
          <p className="text-muted small mb-0">Quantitative analysis of reservation trends, floor capacity, and operational efficiency</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Compiling analytics...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Reservation Status Distribution */}
          <div className="col-lg-6">
            <div className="card custom-card p-4 border-0 shadow-sm h-100">
              <h5 className="font-serif fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-pie-chart-fill text-warning me-2"></i>
                Reservation Status Breakdown
              </h5>

              <div className="d-flex flex-column gap-3 mb-4">
                {reports?.statusDistribution?.map((item) => {
                  const pct = reports.totalVolume > 0 ? Math.round((item.count / reports.totalVolume) * 100) : 0;
                  const color = item.status === 'BOOKED' ? 'bg-success' : item.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary';
                  return (
                    <div key={item.status}>
                      <div className="d-flex justify-content-between small fw-bold mb-1">
                        <span>{item.status}</span>
                        <span>{item.count} Bookings ({pct}%)</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className={`progress-bar ${color}`} role="progressbar" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-light rounded-3 border small text-muted">
                <strong>ACID Integrity Metric:</strong> Cancelled bookings automatically release allocated tables in PostgreSQL transactions without orphan reservations.
              </div>
            </div>
          </div>

          {/* Seating Area Capacity */}
          <div className="col-lg-6">
            <div className="card custom-card p-4 border-0 shadow-sm h-100">
              <h5 className="font-serif fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-diagram-2-fill text-warning me-2"></i>
                Seating Area Distribution
              </h5>

              <div className="row g-3 mb-4">
                {reports?.seatingAreaDistribution?.map((area) => (
                  <div key={area.area} className="col-6">
                    <div className="p-3 rounded-3 border bg-light text-center">
                      <i className={`bi ${area.area === 'INDOOR' ? 'bi-house-door text-primary' : 'bi-sun text-warning'} fs-2 mb-2 d-block`}></i>
                      <h4 className="fw-bold mb-0">{area.count}</h4>
                      <span className="text-muted small">{area.area} Dining Tables</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-light rounded-3 border small text-muted">
                <strong>Table Allocation Preference:</strong> Guests can specify preferred ambiance (e.g. outdoor patio or indoor hall), and the backend filters compatible tables prior to smallest-capacity sorting.
              </div>
            </div>
          </div>

          {/* Daily Booking Activity Timeline */}
          <div className="col-12">
            <div className="card custom-card p-4 border-0 shadow-sm">
              <h5 className="font-serif fw-bold mb-3 border-bottom pb-2">
                <i className="bi bi-graph-up-arrow text-warning me-2"></i>
                Reservation Activity by Date
              </h5>

              {reports?.timeline?.length === 0 ? (
                <p className="text-muted small mb-0">No booking dates logged yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 small">
                    <thead className="table-light">
                      <tr>
                        <th>Reservation Date</th>
                        <th>Bookings Count</th>
                        <th>Relative Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.timeline.map((t) => (
                        <tr key={t.date}>
                          <td className="fw-semibold font-monospace">{t.date}</td>
                          <td>
                            <strong>{t.count}</strong> reservations
                          </td>
                          <td style={{ width: '50%' }}>
                            <div className="progress" style={{ height: '8px' }}>
                              <div
                                className="progress-bar bg-warning"
                                role="progressbar"
                                style={{ width: `${Math.min(100, t.count * 20)}%` }}
                              ></div>
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
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
