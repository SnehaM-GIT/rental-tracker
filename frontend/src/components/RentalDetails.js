import React, { useState, useEffect } from 'react';
import RentHistory from './RentHistory';

const RentalDetails = ({ rental, users, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isNewAgreement, setIsNewAgreement] = useState(false);
  const [formData, setFormData] = useState({
    flatName: rental.flatName || '',
    flatNumber: rental.flatNumber,
    startDate: rental.startDate.split('T')[0],
    endDate: rental.endDate.split('T')[0],
    rentAmount: rental.rentAmount
  });
  const [selectedUsers, setSelectedUsers] = useState(rental.userIds || []);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) return prev.filter(id => id !== userId);
      return [...prev, userId];
    });
  };

  const startNewAgreement = () => {
    setIsNewAgreement(true);
    setIsEditing(true);
    // Pre-fill with empty dates so user enters the new agreement period
    setFormData(prev => ({
      ...prev,
      startDate: '',
      endDate: '',
      rentAmount: prev.rentAmount
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
          rentAmount: parseFloat(formData.rentAmount),
          userIds: selectedUsers,
          isNewAgreement: isNewAgreement
        })
      });

      if (response.ok) {
        setIsEditing(false);
        setIsNewAgreement(false);
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
          <h2>{rental.flatName ? `${rental.flatName} - ` : ''}Flat {rental.flatNumber} Details</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {!isEditing ? (
          <div className="rental-detail-view">
            {rental.flatName && (
              <div className="detail-row">
                <label>Flat Name:</label>
                <span>{rental.flatName}</span>
              </div>
            )}
            <div className="detail-row">
              <label>Flat Number:</label>
              <span>{rental.flatNumber}</span>
            </div>
            <div className="detail-row">
              <label>Collaborators:</label>
              <span>{users && rental.userIds ? rental.userIds.map(id => users.find(u => u.id === id)?.name || id).join(', ') : 'None'}</span>
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

            <div className="modal-footer" style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                ✏️ Edit Agreement
              </button>
              <button className="btn-primary" style={{ backgroundColor: '#27ae60' }} onClick={startNewAgreement}>
                📝 Start New Agreement
              </button>
            </div>

            <RentHistory rentalId={rental.id} />
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="edit-form">
            {isNewAgreement && (
              <div className="message success" style={{ marginBottom: '15px' }}>
                📝 Starting a new agreement — the old agreement details will be saved in the history.
              </div>
            )}
            <div className="form-group">
              <label>Flat Name</label>
              <input
                type="text"
                name="flatName"
                value={formData.flatName}
                onChange={handleChange}
              />
            </div>
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
                <label>{isNewAgreement ? 'New Start Date *' : 'Start Date'}</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required={isNewAgreement}
                />
              </div>

              <div className="form-group">
                <label>{isNewAgreement ? 'New End Date *' : 'End Date'}</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required={isNewAgreement}
                />
              </div>
            </div>

            <div className="form-group">
              <label>{isNewAgreement ? 'New Rent Amount (₹) *' : 'Rent Amount (₹)'}</label>
              <input
                type="number"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                min="0"
                step="100"
                required={isNewAgreement}
              />
            </div>

            <div className="form-group">
              <label>Collaborators</label>
              <div className="checkbox-group" style={{ display: 'flex', gap: '15px' }}>
                {users && users.map(user => (
                  <label key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal' }}>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                    />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => { setIsEditing(false); setIsNewAgreement(false); }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Saving...' : (isNewAgreement ? '📝 Save New Agreement' : 'Save Changes')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RentalDetails;
