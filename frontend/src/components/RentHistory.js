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

  return (
    <div className="rent-history-section">
      <h3>📈 Rent History</h3>
      <div className="history-timeline">
        {history.map((entry, index) => (
          <div key={index} className="history-entry">
            <div className="history-date">
              {new Date(entry.date).toLocaleDateString()}
            </div>
            <div className="history-amount">
              ₹{entry.amount.toLocaleString()}
            </div>
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
