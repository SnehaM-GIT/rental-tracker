import React, { useState, useEffect } from 'react';
import RentalDetails from './RentalDetails';
import API_BASE from '../utils/api';

const RentalList = ({ currentUser, users }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRentals();
  }, [currentUser]);

  const fetchRentals = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/rentals`);
      const data = await response.json();
      const userRentals = data.filter(r => r.userIds && r.userIds.includes(currentUser));
      setRentals(userRentals);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilEnd = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    return Math.floor((end - today) / (1000 * 60 * 60 * 24));
  };

  const getStatus = (daysUntilEnd) => {
    if (daysUntilEnd < 0)  return { label: 'Expired',      color: '#b72b2b', bg: '#fde8e8' };
    if (daysUntilEnd <= 7) return { label: '⚠️ Ending Soon', color: '#b45309', bg: '#fef3c7' };
    return                        { label: '✅ Active',      color: '#1e7e44', bg: '#e8f5ee' };
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit'
  });

  if (loading) return <div className="loading">⏳ Loading rentals...</div>;
  if (rentals.length === 0) return (
    <div className="empty-state">
      🏠 No rental agreements found.<br />
      <span style={{ fontSize: '0.9em' }}>Add one using the form above.</span>
    </div>
  );

  return (
    <div className="rental-list-container">
      {/* Dashboard Rentals View */}
      <h2>🏠 Your Active Flats</h2>

      <div className="rental-table-wrapper">
        <table className="rental-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Property</th>
              <th>Flat No.</th>
              <th>Monthly Rent</th>
              <th> Advance</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Days Left</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="styled-tbody">
            {rentals.map((rental, idx) => {
              const daysUntilEnd = getDaysUntilEnd(rental.endDate);
              const status = getStatus(daysUntilEnd);
              return (
                <tr
                  key={rental.id}
                  onClick={() => setSelectedRental(rental)}
                  className="rental-table-row"
                >
                  <td className="col-index">{index + 1}</td>
                  <td className="col-name">
                    {rental.flatName || '—'}
                  </td>
                  <td className="col-flat">
                    <strong>{rental.flatNumber}</strong>
                  </td>
                  <td className="col-rent">
                    ₹{rental.rentAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="col-date">{fmtDate(rental.startDate)}</td>
                  <td className="col-date">{fmtDate(rental.endDate)}</td>
                  <td className="col-days" style={{ color: status.color, fontWeight: 700 }}>
                    {daysUntilEnd < 0 ? 'Expired' : `${daysUntilEnd}d`}
                  </td>
                  <td className="col-status">
                    <span className="status-pill" style={{ color: status.color, background: status.bg }}>
                      {status.label}
                    </span>
                  </td>
                  <td className="col-action">
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '14px', minHeight: '36px' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedRental(rental); }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedRental && (
        <RentalDetails
          rental={selectedRental}
          users={users}
          onClose={() => setSelectedRental(null)}
          onUpdate={fetchRentals}
        />
      )}
    </div>
  );
};

export default RentalList;