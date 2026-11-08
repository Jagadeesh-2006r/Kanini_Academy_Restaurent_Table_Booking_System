import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="footer-custom pt-5 pb-3">
      <div className="container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 col-md-6">
            <h5 className="font-serif text-white mb-3 d-flex align-items-center">
              <i className="bi bi-egg-fried text-warning me-2"></i>
              SAVORIA BISTRO
            </h5>
            <p className="small text-secondary mb-3">
              Crafting unforgettable culinary journeys with authentic ingredients, master chefs, and an effortless reservation experience.
            </p>
            <div className="d-flex gap-3 text-secondary">
              <span className="badge bg-dark border border-secondary text-warning">
                <i className="bi bi-clock me-1"></i> Open 7 Days: 11:00 AM - 11:30 PM
              </span>
            </div>
          </div>

          <div className="col-lg-2 col-md-6">
            <h6 className="text-white text-uppercase fw-semibold mb-3 small letter-spacing-1">Quick Links</h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
              <li><Link to="/" className="text-secondary text-decoration-none hover-gold">Home</Link></li>
              <li><Link to="/branches" className="text-secondary text-decoration-none hover-gold">Our Branches</Link></li>
              <li><Link to="/about" className="text-secondary text-decoration-none hover-gold">About Story</Link></li>
              <li><Link to="/reservations/new" className="text-secondary text-decoration-none hover-gold">Book a Table</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="text-white text-uppercase fw-semibold mb-3 small letter-spacing-1">Our Branches</h6>
            <div className="small text-secondary d-flex flex-column gap-2">
              <div>
                <strong className="text-light">Downtown Gourmet Hub</strong>
                <p className="mb-0 text-muted">100 Main Street, Financial District</p>
              </div>
              <div>
                <strong className="text-light">Seaside Terrace Bistro</strong>
                <p className="mb-0 text-muted">450 Ocean Boulevard, Coastal Marina</p>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="text-white text-uppercase fw-semibold mb-3 small letter-spacing-1">Academic Project</h6>
            <p className="small text-secondary mb-2">
              Full-Stack College Evaluation Project developed with React.js, Node.js Express, and PostgreSQL with Prisma ORM.
            </p>
            <div className="d-flex gap-2">
              <span className="badge bg-secondary">PostgreSQL 18</span>
              <span className="badge bg-secondary">Prisma ORM</span>
              <span className="badge bg-secondary">JWT Auth</span>
            </div>
          </div>
        </div>

        <div className="border-top border-secondary pt-3 text-center small text-secondary">
          <p className="mb-0">
            &copy; {new Date().getFullYear()} Savoria Bistro Restaurant System. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
