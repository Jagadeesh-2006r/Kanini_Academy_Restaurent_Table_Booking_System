import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (role) => {
    // If user was trying to access a specific page before login redirect there
    const destination = location.state?.from?.pathname;
    if (destination) {
      navigate(destination, { replace: true });
      return;
    }

    // Otherwise navigate to role-specific dashboard
    if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
    else if (role === 'STAFF') navigate('/staff/dashboard', { replace: true });
    else navigate('/customer/dashboard', { replace: true });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loggedUser = await login(email, password);
      redirectAfterLogin(loggedUser.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Demo auto-fill helper for jury / presentation
  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSubmitting(true);

    try {
      const loggedUser = await login(demoEmail, demoPassword);
      redirectAfterLogin(loggedUser.role);
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5 my-auto">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-5">
          <div className="card custom-card p-4 p-md-5 border-0 shadow">
            <div className="text-center mb-4">
              <div className="d-inline-flex p-3 rounded-circle bg-warning bg-opacity-10 text-warning mb-3">
                <i className="bi bi-shield-lock fs-1"></i>
              </div>
              <h2 className="font-serif fw-bold mb-1">Welcome Back</h2>
              <p className="text-muted small">Access your reservations, branch desk, or admin controls</p>
            </div>

            {error && (
              <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-4" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2 fs-6"></i>
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-envelope text-muted"></i>
                  </span>
                  <input
                    type="email"
                    className="form-control border-start-0"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between">
                  <label className="form-label small fw-semibold text-secondary">Password</label>
                </div>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-key text-muted"></i>
                  </span>
                  <input
                    type="password"
                    className="form-control border-start-0"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold w-100 py-2.5 mb-3 d-flex align-items-center justify-content-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right"></i> Sign In to Account
                  </>
                )}
              </button>

              <div className="text-center small text-muted">
                Don't have an account yet?{' '}
                <Link to="/register" className="text-decoration-none fw-semibold text-warning">
                  Create customer account
                </Link>
              </div>
            </form>

            {/* Quick Demo Login Section for College Presentation */}
            <div className="mt-4 pt-3 border-top">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.05rem' }}>
                  <i className="bi bi-lightning-charge-fill text-warning me-1"></i> Quick Demo Logins (College Jury)
                </span>
                <span className="badge bg-light text-secondary border" style={{ fontSize: '0.65rem' }}>1-Click Auth</span>
              </div>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin@restaurant.com', 'Admin@123')}
                  className="btn btn-sm btn-outline-danger text-start d-flex justify-content-between align-items-center py-1.5"
                  disabled={submitting}
                >
                  <span><i className="bi bi-person-badge-fill me-2"></i><strong>Admin</strong> (admin@restaurant.com)</span>
                  <i className="bi bi-chevron-right small"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('staff.downtown@restaurant.com', 'Staff@123')}
                  className="btn btn-sm btn-outline-info text-start d-flex justify-content-between align-items-center py-1.5 text-dark"
                  disabled={submitting}
                >
                  <span><i className="bi bi-person-workspace me-2"></i><strong>Downtown Staff</strong></span>
                  <i className="bi bi-chevron-right small"></i>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('customer@example.com', 'Customer@123')}
                  className="btn btn-sm btn-outline-warning text-start d-flex justify-content-between align-items-center py-1.5 text-dark"
                  disabled={submitting}
                >
                  <span><i className="bi bi-person-heart me-2"></i><strong>Customer</strong> (Alice Johnson)</span>
                  <i className="bi bi-chevron-right small"></i>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

