import React, { useState, useEffect } from 'react';
import RentalDetails from './RentalDetails';

const RentalList = ({ currentUser, users }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);

  useEffect(() => {
    fetchRentals();
  }, [currentUser]);

  const fetchRentals = async () => {
    try {
      const response = await fetch('/api/rentals');
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
    if (daysUntilEnd < 0)   return { label: 'Expired',       color: '#b72b2b' };
    if (daysUntilEnd <= 7)  return { label: '⚠️ Ending Soon', color: '#e67e22' };
    return                         { label: '✅ Active',       color: '#1e7e44' };
  };

  if (loading) return <div className="loading">⏳ Loading rentals...</div>;
  if (rentals.length === 0) return (
    <div className="empty-state">
      🏠 No rental agreements found.<br />
      <span style={{ fontSize: '0.9em' }}>Add one using the form above.</span>
    </div>
  );

  return (
    <div className="rental-list-container">
      <h2>Your Rental Agreements</h2>

      <div className="rental-grid">
        {rentals.map(rental => {
          const daysUntilEnd = getDaysUntilEnd(rental.endDate);
          const status = getStatus(daysUntilEnd);

          return (
            <div
              key={rental.id}
              className="rental-card"
              onClick={() => setSelectedRental(rental)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedRental(rental)}
              aria-label={`View details for ${rental.flatName || ''} Flat ${rental.flatNumber}`}
            >
              <div className="card-header">
                <h3>{rental.flatName ? `${rental.flatName}` : `Flat ${rental.flatNumber}`}</h3>
                <span className="status-badge" style={{ backgroundColor: status.color }}>
                  {status.label}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span>🏢 Flat No.</span>
                  <strong>{rental.flatNumber}</strong>
                </div>
                <div className="info-row">
                  <span>💰 Monthly Rent</span>
                  <strong>₹{rental.rentAmount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="info-row">
                  <span>📅 Period</span>
                  <strong style={{ fontSize: '0.85em' }}>
                    {new Date(rental.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    {' → '}
                    {new Date(rental.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </strong>
                </div>
                <div className="info-row">
                  <span>⏱️ Days Left</span>
                  <strong style={{ color: status.color }}>
                    {daysUntilEnd < 0 ? 'Expired' : `${daysUntilEnd} days`}
                  </strong>
                </div>
              </div>

              <div className="card-footer">
                <button
                  className="btn-secondary"
                  onClick={(e) => { e.stopPropagation(); setSelectedRental(rental); }}
                >
                  📄 View Details
                </button>
              </div>
            </div>
          );
        })}
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
