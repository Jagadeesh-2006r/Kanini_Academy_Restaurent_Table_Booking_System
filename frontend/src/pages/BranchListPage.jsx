import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export const BranchListPage = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('ALL');

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async (search = '') => {
    setLoading(true);
    try {
      const url = search ? `/branches?search=${encodeURIComponent(search)}` : '/branches';
      const res = await api.get(url);
      setBranches(res.data.data);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchBranches(val);
  };

  const filteredBranches = branches.filter((b) => {
    if (areaFilter === 'INDOOR') return b.indoorCount > 0;
    if (areaFilter === 'OUTDOOR') return b.outdoorCount > 0;
    return true;
  });

  return (
    <div className="container py-5">
      {/* Title & Filter Header */}
      <div className="row align-items-center g-3 mb-4">
        <div className="col-md-6">
          <h2 className="font-serif fw-bold mb-1">Restaurant Branches</h2>
          <p className="text-muted small mb-0">Browse our dining locations, opening hours, and table arrangements</p>
        </div>

        <div className="col-md-6 d-flex flex-column flex-sm-row gap-2">
          {/* Search Box */}
          <div className="input-group">
            <span className="input-group-text bg-white">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by location or name..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* Area Filter */}
          <select
            className="form-select w-auto"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          >
            <option value="ALL">All Seating</option>
            <option value="INDOOR">Indoor Seating</option>
            <option value="OUTDOOR">Outdoor Seating</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading branches...</span>
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="card custom-card p-5 text-center my-4">
          <i className="bi bi-geo-alt-fill text-muted fs-1 mb-3"></i>
          <h5>No branches found matching your search.</h5>
          <p className="text-muted small">Try modifying your search terms or clearing the area filter.</p>
          <button onClick={() => { setSearchTerm(''); setAreaFilter('ALL'); fetchBranches(''); }} className="btn btn-outline-gold btn-sm mx-auto">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="row g-4">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="col-lg-6">
              <div className="card custom-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success fw-semibold px-2.5 py-1">
                      <i className="bi bi-clock me-1"></i> {branch.openingTime} - {branch.closingTime}
                    </span>
                    <span className="badge bg-light text-secondary border">
                      {branch.slotLength} min slots
                    </span>
                  </div>

                  <h4 className="font-serif fw-bold mb-2 text-dark">{branch.branchName}</h4>
                  <p className="text-muted small mb-3">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i> {branch.address}
                  </p>

                  <div className="row g-2 mb-3">
                    <div className="col-sm-6">
                      <div className="p-2 border rounded bg-light small d-flex align-items-center gap-2">
                        <i className="bi bi-house-door-fill text-primary"></i>
                        <div>
                          <strong>{branch.indoorCount}</strong> Indoor Tables
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="p-2 border rounded bg-light small d-flex align-items-center gap-2">
                        <i className="bi bi-sun-fill text-warning"></i>
                        <div>
                          <strong>{branch.outdoorCount}</strong> Outdoor Tables
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 pt-3 border-top">
                  <Link
                    to={`/reservations/new?branchId=${branch.id}`}
                    className="btn btn-gold flex-grow-1 text-center"
                  >
                    <i className="bi bi-calendar2-plus me-1"></i> Book Table
                  </Link>
                  <Link
                    to={`/branches/${branch.id}`}
                    className="btn btn-outline-secondary px-3"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchListPage;
