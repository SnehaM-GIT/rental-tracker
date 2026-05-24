import React, { useState, useEffect } from 'react';
import RentHistory from './RentHistory';

const RentalDetails = ({ rental, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    flatNumber: rental.flatNumber,
    startDate: rental.startDate.split('T')[0],
    endDate: rental.endDate.split('T')[0],
    rentAmount: rental.rentAmount
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/rentals/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rentAmount: parseFloat(formData.rentAmount)
        })
      });

      if (response.ok) {
        setIsEditing(false);
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating rental:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Flat {rental.flatNumber} - Details</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {!isEditing ? (
          <div className="rental-detail-view">
            <div className="detail-row">
              <label>Flat Number:</label>
              <span>{rental.flatNumber}</span>
            </div>
            <div className="detail-row">
              <label>Start Date:</label>
              <span>{new Date(rental.startDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <label>End Date:</label>
              <span>{new Date(rental.endDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <label>Current Rent:</label>
              <span>₹{rental.rentAmount.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <label>Status:</label>
              <span>{rental.status}</span>
            </div>

            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                ✏️ Edit Agreement
              </button>
            </div>

            <RentHistory rentalId={rental.id} />
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="edit-form">
            <div className="form-group">
              <label>Flat Number</label>
              <input
                type="text"
                name="flatNumber"
                value={formData.flatNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Rent Amount (₹)</label>
              <input
                type="number"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                min="0"
                step="100"
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RentalDetails;
