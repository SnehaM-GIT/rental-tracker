import React, { useState, useEffect } from 'react';

const RentHistory = ({ rentalId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [rentalId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/rentals/${rentalId}/history`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching rent history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading history...</div>;
  if (history.length <= 1) return null; // Don't show if only the initial entry

  const getEntryIcon = (entry) => {
    if (entry.type === 'agreement' && entry.note?.startsWith('Agreement ended')) return '🔴';
    if (entry.type === 'agreement' && entry.note?.startsWith('New agreement')) return '🟢';
    if (entry.type === 'rent_change') return '💰';
    return '📝';
  };

  return (
    <div className="rent-history-section">
      <h3>📈 Agreement & Rent History</h3>
      <div className="history-timeline">
        {[...history].reverse().map((entry, index) => (
          <div key={index} className="history-entry" style={{
            borderLeft: entry.type === 'agreement' ? '3px solid #3498db' : '3px solid #95a5a6',
            paddingLeft: '12px',
            marginBottom: '12px'
          }}>
            <div className="history-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{getEntryIcon(entry)}</span>
              <span>{new Date(entry.date).toLocaleDateString()}</span>
            </div>
            <div className="history-amount">
              ₹{entry.amount?.toLocaleString()}
            </div>
            {entry.startDate && entry.endDate && (
              <div style={{ fontSize: '0.85em', color: '#7f8c8d' }}>
                {new Date(entry.startDate).toLocaleDateString()} → {new Date(entry.endDate).toLocaleDateString()}
              </div>
            )}
            {entry.previousAmount && (
              <div className="history-change">
                (from ₹{entry.previousAmount.toLocaleString()})
              </div>
            )}
            {entry.note && (
              <div className="history-note">{entry.note}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RentHistory;
