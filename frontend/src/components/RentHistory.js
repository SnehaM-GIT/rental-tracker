import React, { useState, useEffect } from 'react';

const RentHistory = ({ rentalId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [rentalId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/rentals/${rentalId}/history`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching rent history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading history...</div>;
  // Only show if there's more than the initial entry
  if (history.length <= 1) return null;

  const getEntryIcon = (entry) => {
    if (entry.type === 'agreement' && entry.note?.startsWith('Agreement ended')) return '🔴';
    if (entry.type === 'agreement' && entry.note?.startsWith('New agreement'))    return '🟢';
    if (entry.type === 'rent_change') return '💰';
    return '📝';
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="rent-history-section">
      <h3>📈 Agreement &amp; Rent History</h3>
      <div className="history-timeline">
        {[...history].reverse().map((entry, index) => (
          <div
            key={index}
            className="history-entry"
            style={{
              borderLeft: `4px solid ${entry.type === 'agreement' ? '#1a3c5e' : '#7f8fa4'}`
            }}
          >
            <div className="history-date">
              <span style={{ marginRight: 6 }}>{getEntryIcon(entry)}</span>
              <span>{fmtDate(entry.date)}</span>
            </div>
            <div className="history-amount">
              ₹{entry.amount?.toLocaleString('en-IN')}
            </div>
            {entry.startDate && entry.endDate && (
              <div className="history-change">
                {fmtDate(entry.startDate)} → {fmtDate(entry.endDate)}
              </div>
            )}
            {entry.previousAmount && (
              <div className="history-change">
                (was ₹{entry.previousAmount.toLocaleString('en-IN')})
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
