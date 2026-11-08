import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSubmitting(true);

    try {
      await updateProfile(formData);
      setSuccessMsg('Profile updated successfully!');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <h2 className="font-serif fw-bold mb-1">My Account Profile</h2>
              <p className="text-muted small mb-0">Manage your personal credentials and contact information</p>
            </div>
            <span className={`badge ${user?.role === 'ADMIN' ? 'bg-danger' : user?.role === 'STAFF' ? 'bg-info text-dark' : 'bg-warning text-dark'} text-uppercase px-3 py-2 fs-6`}>
              {user?.role} ACCOUNT
            </span>
          </div>

          {successMsg && (
            <div className="alert alert-success d-flex align-items-center py-2 px-3 small rounded-3 mb-4" role="alert">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div>{successMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-4" role="alert">
              <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
              <div>{errorMsg}</div>
            </div>
          )}

          <div className="row g-4">
            {/* Profile Overview Card */}
            <div className="col-md-5">
              <div className="card custom-card p-4 text-center">
                <div className="d-inline-flex p-3 rounded-circle bg-light text-secondary mx-auto mb-3 border">
                  <i className="bi bi-person-fill fs-1 text-warning"></i>
                </div>
                <h4 className="fw-bold mb-1">{user?.name}</h4>
                <p className="text-muted small mb-3">{user?.email}</p>

                <div className="list-group list-group-flush text-start small border-top pt-2">
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Role:</span>
                    <strong>{user?.role}</strong>
                  </div>
                  {user?.branch && (
                    <div className="list-group-item d-flex justify-content-between px-0">
                      <span className="text-muted">Assigned Branch:</span>
                      <strong>{user.branch.branchName}</strong>
                    </div>
                  )}
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Contact Phone:</span>
                    <strong>{user?.phone}</strong>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0">
                    <span className="text-muted">Account Status:</span>
                    <span className="badge bg-success">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="col-md-7">
              <div className="card custom-card p-4">
                <h5 className="fw-bold mb-3 border-bottom pb-2">
                  <i className="bi bi-pencil-square text-warning me-2"></i>
                  Edit Personal Details
                </h5>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Email Address</label>
                    <input
                      type="email"
                      className="form-control bg-light"
                      value={user?.email || ''}
                      disabled
                      title="Email address cannot be changed directly"
                    />
                    <div className="form-text small">Your registered login email address is permanent.</div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                    />
                    <div className="form-text small">Used for SMS and table arrival notifications.</div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-gold px-4 py-2 d-flex align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2-all"></i> Save Changes
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
