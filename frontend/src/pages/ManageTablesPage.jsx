import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

export const ManageTablesPage = () => {
  const [searchParams] = useSearchParams();
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(searchParams.get('branchId') || '');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    branchId: '',
    tableNumber: '',
    seatingArea: 'INDOOR',
    capacity: 4,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/branches')
      .then(res => {
        setBranches(res.data.data);
        if (!selectedBranchId && res.data.data.length > 0) {
          setSelectedBranchId(String(res.data.data[0].id));
        }
      })
      .catch(err => console.error('Failed to load branches:', err));
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      fetchTables(selectedBranchId);
    }
  }, [selectedBranchId]);

  const fetchTables = async (branchId) => {
    setLoading(true);
    try {
      const res = await api.get(`/tables/${branchId}`);
      setTables(res.data.data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTable(null);
    setFormData({
      branchId: selectedBranchId,
      tableNumber: '',
      seatingArea: 'INDOOR',
      capacity: 4,
    });
    setModalOpen(true);
  };

  const openEditModal = (table) => {
    setEditingTable(table);
    setFormData({
      branchId: table.branchId,
      tableNumber: table.tableNumber,
      seatingArea: table.seatingArea,
      capacity: table.capacity,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      if (editingTable) {
        await api.put(`/tables/${editingTable.id}`, {
          tableNumber: formData.tableNumber,
          seatingArea: formData.seatingArea,
          capacity: parseInt(formData.capacity, 10),
        });
        setFeedback({ type: 'success', message: 'Table updated successfully!' });
      } else {
        await api.post('/tables', {
          branchId: parseInt(formData.branchId, 10),
          tableNumber: formData.tableNumber,
          seatingArea: formData.seatingArea,
          capacity: parseInt(formData.capacity, 10),
        });
        setFeedback({ type: 'success', message: 'New table added to branch!' });
      }
      setModalOpen(false);
      fetchTables(selectedBranchId);
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to save table.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete or deactivate this table?')) return;

    try {
      const res = await api.delete(`/tables/${tableId}`);
      setFeedback({ type: 'success', message: res.data.message });
      fetchTables(selectedBranchId);
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Failed to remove table.',
      });
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
        <div>
          <span className="badge bg-danger text-uppercase px-2.5 py-1 mb-1">
            Floor Management
          </span>
          <h2 className="font-serif fw-bold mb-1">Manage Restaurant Tables</h2>
          <p className="text-muted small mb-0">Define table numbers, maximum seating capacities, and area zoning</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex gap-2">
          <button onClick={openAddModal} className="btn btn-gold btn-sm d-flex align-items-center gap-2">
            <i className="bi bi-plus-circle-fill"></i> Add New Table
          </button>
        </div>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} alert-dismissible fade show small py-2 px-3 rounded-3 mb-4`} role="alert">
          {feedback.message}
          <button type="button" className="btn-close small p-2" onClick={() => setFeedback({ type: '', message: '' })}></button>
        </div>
      )}

      {/* Branch Selector Filter */}
      <div className="card custom-card p-3 border-0 mb-4 bg-light">
        <div className="row align-items-center">
          <div className="col-md-6 d-flex align-items-center gap-3">
            <label className="fw-bold small text-dark mb-0">Select Branch:</label>
            <select
              className="form-select w-auto"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.branchName}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6 text-md-end text-muted small mt-2 mt-md-0">
            Total Tables in this branch: <strong>{tables.length}</strong>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="card custom-card border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status">
              <span className="visually-hidden">Loading tables...</span>
            </div>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-grid text-muted fs-1 mb-2"></i>
            <p className="text-muted">No tables created for this branch yet.</p>
            <button onClick={openAddModal} className="btn btn-gold btn-sm">
              Add First Table
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Table Number</th>
                  <th>Seating Zone</th>
                  <th>Maximum Capacity</th>
                  <th>Total Reservations</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.id} className={!t.active ? 'table-light text-muted' : ''}>
                    <td>
                      <span className="badge bg-dark fs-6">{t.tableNumber}</span>
                    </td>
                    <td>
                      <span className={`badge ${t.seatingArea === 'OUTDOOR' ? 'badge-outdoor' : 'badge-indoor'}`}>
                        {t.seatingArea}
                      </span>
                    </td>
                    <td>
                      <strong>{t.capacity}</strong> Guests
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border">
                        {t._count?.reservations || 0} times booked
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        <button
                          onClick={() => openEditModal(t)}
                          className="btn btn-outline-secondary btn-sm py-1 px-2"
                          title="Edit Table"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteTable(t.id)}
                          className="btn btn-outline-danger btn-sm py-1 px-2"
                          title="Delete / Deactivate"
                        >
                          <i className="bi bi-trash"></i>
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

      {/* Add / Edit Table Modal */}
      {modalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content custom-card border-0">
              <div className="modal-header border-bottom">
                <h5 className="modal-title font-serif fw-bold">
                  {editingTable ? `Edit Table ${editingTable.tableNumber}` : 'Add Table to Branch'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setModalOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {!editingTable && (
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Branch</label>
                      <select
                        className="form-select"
                        value={formData.branchId}
                        onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                        required
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.branchName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Table Identifier / Number</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. DT-06 or T-12"
                      value={formData.tableNumber}
                      onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Seating Area</label>
                      <select
                        className="form-select"
                        value={formData.seatingArea}
                        onChange={(e) => setFormData({ ...formData, seatingArea: e.target.value })}
                      >
                        <option value="INDOOR">Indoor</option>
                        <option value="OUTDOOR">Outdoor</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold">Max Guests Capacity</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="form-control"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : editingTable ? 'Update Table' : 'Add Table'}
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

export default ManageTablesPage;

