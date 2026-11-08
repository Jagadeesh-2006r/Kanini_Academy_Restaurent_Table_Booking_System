import React from 'react';
import { Link } from 'react-router-dom';

export const AboutPage = () => {
  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center max-w-700 mx-auto mb-5">
        <span className="badge rounded-pill bg-warning text-dark px-3 py-1.5 mb-2 fw-semibold">
          About Savoria
        </span>
        <h1 className="font-serif fw-bold display-5 mb-3">Our Culinary Heritage & System Architecture</h1>
        <p className="lead text-muted">
          Blending gourmet dining hospitality with high-reliability full-stack engineering.
        </p>
      </div>

      <div className="row g-5 align-items-center mb-5">
        <div className="col-lg-6">
          <h3 className="font-serif fw-bold mb-3">Crafted for Exceptional Guest Comfort</h3>
          <p className="text-secondary">
            Founded with a passion for Mediterranean and contemporary culinary arts, Savoria Bistro operates across key city landmarks, including our Financial District Downtown Hub and Coastal Marina Seaside Bistro.
          </p>
          <p className="text-secondary">
            To ensure zero waiting times and flawless hospitality, our restaurant developed this specialized reservation portal. Guests select their exact party size and seating preference, while our proprietary seating algorithm allocates the ideal table configuration without double booking.
          </p>
          <div className="d-flex gap-3 mt-4">
            <Link to="/branches" className="btn btn-gold">
              Explore Our Branches
            </Link>
            <Link to="/reservations/new" className="btn btn-outline-dark">
              Make a Reservation
            </Link>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card custom-card p-4 bg-white shadow-sm border">
            <h5 className="fw-bold mb-3 text-dark border-bottom pb-2">
              <i className="bi bi-cpu-fill text-warning me-2"></i>
              System Architecture & College Evaluation
            </h5>

            <div className="d-flex flex-column gap-3 small">
              <div className="p-3 bg-light rounded-3 border">
                <strong className="d-block text-dark mb-1">
                  <i className="bi bi-diagram-3-fill text-primary me-2"></i> Role-Based Access Control (RBAC)
                </strong>
                Three isolated actors: <em>Customer</em> (self-service booking & PDF downloads), <em>Staff</em> (branch-specific live desk), and <em>Admin</em> (master control, analytics & branches).
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <strong className="d-block text-dark mb-1">
                  <i className="bi bi-shuffle text-success me-2"></i> Automatic Table Allocation
                </strong>
                Assigns the smallest available table where <code>capacity &ge; partySize</code>. Optimizes floor yield while preventing table wastage.
              </div>

              <div className="p-3 bg-light rounded-3 border">
                <strong className="d-block text-dark mb-1">
                  <i className="bi bi-shield-lock-fill text-danger me-2"></i> Double Booking Prevention
                </strong>
                Enforces ACID transactions via Prisma & PostgreSQL. Conflicting overlapping reservation attempts are rejected at the database level.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

