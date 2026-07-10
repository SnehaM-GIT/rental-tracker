import React, { useState, useEffect, useMemo } from 'react';
import RentalDetails from './RentalDetails';
import API_BASE from '../utils/api';

const RentalList = ({ currentUser, users }) => {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState(null);
  const [historyFlat, setHistoryFlat] = useState(null);

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

  const toggleFlat = (flatNumber, e) => {
    e.stopPropagation();
    setHistoryFlat(flatNumber);
  };

  const closeHistory = () => {
    setHistoryFlat(null);
  };

  const groupedRentals = useMemo(() => {
    const groups = {};
    rentals.forEach(r => {
      if (!groups[r.flatNumber]) groups[r.flatNumber] = [];
      groups[r.flatNumber].push(r);
    });
    // Sort each group by endDate descending
    Object.keys(groups).forEach(flatNum => {
      groups[flatNum].sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    });
    return groups;
  }, [rentals]);

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
            {Object.entries(groupedRentals).map(([flatNumber, flatRentals], index) => {
              const activeRental = flatRentals[0];
              const historyRentals = flatRentals.slice(1);
              const daysUntilEnd = getDaysUntilEnd(activeRental.endDate);
              const status = getStatus(daysUntilEnd);

              return (
                <tr
                  key={flatNumber}
                  onClick={() => setSelectedRental(activeRental)}
                  className="rental-table-row active-row"
                >
                  <td className="col-index">{index + 1}</td>
                  <td className="col-name">{activeRental.flatName || '—'}</td>
                  <td className="col-flat">
                    <strong>{flatNumber}</strong>
                  </td>
                  <td className="col-rent">
                    ₹{activeRental.rentAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="col-date">{fmtDate(activeRental.startDate)}</td>
                  <td className="col-date">{fmtDate(activeRental.endDate)}</td>
                  <td className="col-days" style={{ color: status.color, fontWeight: 700 }}>
                    {daysUntilEnd < 0 ? 'Expired' : `${daysUntilEnd}d`}
                  </td>
                  <td className="col-status">
                    <span className="status-pill" style={{ color: status.color, background: status.bg }}>
                      {status.label}
                    </span>
                  </td>
                  <td className="col-action">
                    {historyRentals.length > 0 && (
                      <button
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '12px', marginRight: '8px' }}
                        onClick={(e) => toggleFlat(flatNumber, e)}
                      >
                        History ({historyRentals.length})
                      </button>
                    )}
                    <button
                      className="btn-secondary"
                      style={{ padding: '8px 14px', fontSize: '14px', minHeight: '36px' }}
                      onClick={(e) => { e.stopPropagation(); setSelectedRental(activeRental); }}
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

      {/* History Modal */}
      {historyFlat && (
        <div className="modal-overlay" onClick={closeHistory}>
          <div className="modal-content" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📜 History for Flat {historyFlat}</h2>
              <button className="close-btn" onClick={closeHistory}>✕</button>
            </div>
            <div className="rental-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="rental-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Rent</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRentals[historyFlat].slice(1).map((rental, hIndex) => {
                    const hDays = getDaysUntilEnd(rental.endDate);
                    const hStatus = getStatus(hDays);
                    return (
                      <tr key={rental.id} onClick={() => { setSelectedRental(rental); closeHistory(); }} className="rental-table-row">
                        <td>{hIndex + 1}</td>
                        <td>{fmtDate(rental.startDate)}</td>
                        <td>{fmtDate(rental.endDate)}</td>
                        <td>₹{rental.rentAmount.toLocaleString('en-IN')}</td>
                        <td>
                          <span className="status-pill" style={{ color: hStatus.color, background: hStatus.bg }}>
                            {hStatus.label}
                          </span>
                        </td>
                        <td>
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>View</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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