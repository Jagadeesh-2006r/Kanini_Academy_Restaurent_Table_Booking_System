import React, { useState, useEffect } from 'react';
import api from '../services/api';

export const ManageBranchesPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    branchName: '',
    address: '',
    openingTime: '11:00',
    closingTime: '23:00',
    slotLength: 90,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/branches');
      setBranches(res.data.data);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData({
      branchName: '',
      address: '',
      openingTime: '11:00',
      closingTime: '23:00',
      slotLength: 90,
    });
    setModalOpen(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      branchName: branch.branchName,
      address: branch.address,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
      slotLength: branch.slotLength,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, formData);
        setFeedback({ type: 'success', message: 'Branch updated successfully!' });
      } else {
        await api.post('/branches', formData);
        setFeedback({ type: 'success', message: 'New branch created successfully!' });
      }
      setModalOpen(false);
      fetchBranches();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to save branch.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (branchId) => {
    try {
      const res = await api.patch(`/branches/${branchId}/deactivate`);
      setFeedback({ type: 'success', message: res.data.message });
      fetchBranches();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to update branch status.',
      });
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-uppercase px-2.5 py-1 mb-1">
            Admin Management
          </span>
          <h2 className="font-serif fw-bold mb-1">Manage Restaurant Branches</h2>
          <p className="text-muted small mb-0">Configure operating hours, locations, and seating parameters</p>
        </div>
        <div className="mt-3 mt-md-0">
          <button onClick={openAddModal} className="btn btn-gold btn-sm d-flex align-items-center gap-2">
            <i className="bi bi-plus-circle-fill"></i> Add New Branch
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
              <span className="visually-hidden">Loading branches...</span>
            </div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Branch Name</th>
                  <th>Location Address</th>
                  <th>Operating Hours</th>
                  <th>Slot Duration</th>
                  <th>Tables</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id} className={!b.active ? 'table-light text-muted' : ''}>
                    <td>
                      <strong className="text-dark">{b.branchName}</strong>
                    </td>
                    <td>{b.address}</td>
                    <td>
                      <span className="badge bg-light text-dark border">
                        {b.openingTime} - {b.closingTime}
                      </span>
                    </td>
                    <td>{b.slotLength} Mins</td>
                    <td>
                      <span className="badge badge-indoor me-1">{b.indoorCount} In</span>
                      <span className="badge badge-outdoor">{b.outdoorCount} Out</span>
                    </td>
                    <td>
                      <span className={`badge ${b.active ? 'bg-success' : 'bg-secondary'}`}>
                        {b.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          onClick={() => openEditModal(b)}
                          className="btn btn-outline-secondary btn-sm py-1 px-2"
                          title="Edit Branch"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(b.id)}
                          className={`btn btn-sm py-1 px-2 ${b.active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          title={b.active ? 'Deactivate Branch' : 'Activate Branch'}
                        >
                          {b.active ? <i className="bi bi-pause-circle"></i> : <i className="bi bi-play-circle"></i>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Branch Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title font-serif fw-bold">
                  {editingBranch ? 'Edit Branch' : 'Add New Restaurant Branch'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Branch Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Uptown Bistro"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Physical Address</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 742 Evergreen Terrace"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Opening Time (HH:mm)</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.openingTime}
                        onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Closing Time (HH:mm)</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.closingTime}
                        onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Slot Duration (Minutes)</label>
                    <select
                      className="form-select"
                      value={formData.slotLength}
                      onChange={(e) => setFormData({ ...formData, slotLength: parseInt(e.target.value, 10) })}
                    >
                      <option value="60">60 Minutes (1 Hour)</option>
                      <option value="90">90 Minutes (1.5 Hours - Standard)</option>
                      <option value="120">120 Minutes (2 Hours)</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
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

export default ManageBranchesPage;
