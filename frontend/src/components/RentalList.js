import React, { useState, useEffect } from 'react';
import RentalDetails from './RentalDetails';
import API_BASE from '../utils/api';

const RentalList = ({ currentUser, users }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);
  const [expandedFlatKeys, setExpandedFlatKeys] = useState(new Set());

  const flatGroupKey = (rental) => `${rental.flatName || 'Flat'}|${rental.flatNumber}`;

  const isExpiredRental = (rental) => {
    const end = new Date(rental.endDate);
    const today = new Date();
    return end < today;
  };

  const toggleExpired = (flatKey) => {
    setExpandedFlatKeys((prev) => {
      const next = new Set(prev);
      if (next.has(flatKey)) {
        next.delete(flatKey);
      } else {
        next.add(flatKey);
      }
      return next;
    });
  };

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
      <h2>Your Rental Agreements</h2>

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
          <tbody>
            {(() => {
              const activeRentals = rentals
                .filter(r => !isExpiredRental(r))
                .sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

              const expiredRentals = rentals.filter(isExpiredRental);
              const expiredByFlat = expiredRentals.reduce((map, rental) => {
                const key = flatGroupKey(rental);
                if (!map[key]) map[key] = [];
                map[key].push(rental);
                return map;
              }, {});

              if (activeRentals.length === 0) {
                return (
                  <tr>
                    <td colSpan="10" className="empty-state">
                      No active rental agreements found. Select an expired agreement below to view details.
                    </td>
                  </tr>
                );
              }

              return activeRentals.map((rental, index) => {
                const daysUntilEnd = getDaysUntilEnd(rental.endDate);
                const status = getStatus(daysUntilEnd);
                const key = flatGroupKey(rental);
                const expiredForFlat = expiredByFlat[key] || [];
                const isExpanded = expandedFlatKeys.has(key);

                return (
                  <React.Fragment key={rental.id}>
                    <tr
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
                      <td className="col-date">
                        {rental.advanceAmount ? `₹${rental.advanceAmount.toLocaleString('en-IN')}` : '—'}
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
                        {expiredForFlat.length > 0 && (
                          <button
                            type="button"
                            className="expired-toggle-btn"
                            onClick={(e) => { e.stopPropagation(); toggleExpired(key); }}
                            aria-expanded={isExpanded}
                            aria-controls={`expired-group-${encodeURIComponent(key)}`}
                          >
                            {isExpanded ? 'Hide history' : `${expiredForFlat.length} expired`}
                          </button>
                        )}
                        <button
                          className="btn-secondary"
                          style={{ padding: '8px 14px', fontSize: '14px', minHeight: '36px', marginTop: expiredForFlat.length > 0 ? '8px' : 0 }}
                          onClick={(e) => { e.stopPropagation(); setSelectedRental(rental); }}
                        >
                          View
                        </button>
                      </td>
                    </tr>

                    {isExpanded && expiredForFlat.length > 0 && (
                      <tr className="expired-group-row" id={`expired-group-${encodeURIComponent(key)}`}>
                        <td colSpan="10">
                          <div className="expired-group-panel">
                            <div className="expired-group-header">
                              Expired agreements for {rental.flatName ? `${rental.flatName} — ` : ''}Flat {rental.flatNumber}
                            </div>
                            <div className="expired-card-list">
                              {expiredForFlat.map((expiredRental, idx) => {
                                const expiredDays = getDaysUntilEnd(expiredRental.endDate);
                                const expiredStatus = getStatus(expiredDays);
                                return (
                                  <div
                                    key={expiredRental.id}
                                    className="expired-card"
                                    onClick={() => setSelectedRental(expiredRental)}
                                  >
                                    <div className="expired-card-info">
                                      <div><strong>Agreement {idx + 1}</strong></div>
                                      <div className="expired-card-meta">
                                        <span>{expiredRental.flatName || `Flat ${expiredRental.flatNumber}`}</span>
                                        <span>{fmtDate(expiredRental.startDate)} → {fmtDate(expiredRental.endDate)}</span>
                                      </div>
                                    </div>
                                    <div className="expired-card-meta expired-card-actions">
                                      <span className="status-pill" style={{ color: expiredStatus.color, background: expiredStatus.bg }}>
                                        {expiredStatus.label}
                                      </span>
                                      <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={(e) => { e.stopPropagation(); setSelectedRental(expiredRental); }}
                                      >
                                        View
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
            })()}
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