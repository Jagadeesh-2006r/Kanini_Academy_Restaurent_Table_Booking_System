import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const ManageStaffPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    branchId: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [staffRes, branchRes] = await Promise.all([
        api.get('/staff'),
        api.get('/branches'),
      ]);
      setStaffList(staffRes.data.data);
      setBranches(branchRes.data.data);
      if (branchRes.data.data.length > 0) {
        setFormData(prev => ({ ...prev, branchId: String(branchRes.data.data[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.post('/staff', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        branchId: parseInt(formData.branchId, 10),
      });

      setFeedback({ type: 'success', message: 'Staff account created successfully!' });
      setModalOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        branchId: branches[0]?.id ? String(branches[0].id) : '',
      });
      const refreshRes = await api.get('/staff');
      setStaffList(refreshRes.data.data);
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to create staff account.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-uppercase px-2.5 py-1 mb-1">
            Personnel Management
          </span>
          <h2 className="font-serif fw-bold mb-1">Manage Restaurant Staff</h2>
          <p className="text-muted small mb-0">Create staff credentials and link personnel to specific restaurant branches</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button onClick={() => setModalOpen(true)} className="btn btn-gold btn-sm d-flex align-items-center gap-2">
            <i className="bi bi-person-plus-fill"></i> Add Staff Member
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show small py-2 px-3 rounded-3 mb-4`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close small p-2" onClick={() => setFeedback({ type: '', message: '' })}></button>
        </div>
      )}

      <div className="card custom-card border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading personnel...</span>
            </div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-people text-muted fs-1 mb-2"></i>
            <p className="text-muted">No staff accounts registered yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Staff Member</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>Assigned Branch</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-circle bg-light border text-secondary">
                          <i className="bi bi-person-badge"></i>
                        </div>
                        <div>
                          <strong className="text-dark d-block">{s.name}</strong>
                          <span className="badge bg-info text-dark" style={{ fontSize: '0.65rem' }}>STAFF</span>
                        </div>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>
                      <span className="badge bg-dark">
                        <i className="bi bi-shop me-1 text-warning"></i>
                        {s.branch?.branchName || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.active ? 'bg-success' : 'bg-secondary'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title font-serif fw-bold">
                  Create New Staff Account
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Staff Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Jim Halpert"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="staff@restaurant.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+1 555-0155"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Temporary Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Assign to Branch</label>
                    <select
                      className="form-select"
                      value={formData.branchId}
                      onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                      required
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.branchName} ({b.address.split(',')[0]})
                        </option>
                      ))}
                    </select>
                    <div className="form-text small">Staff will only have access to view and manage bookings for this branch.</div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold btn-sm" disabled={saving}>
                    {saving ? 'Creating Account...' : 'Create Staff Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaffPage;
