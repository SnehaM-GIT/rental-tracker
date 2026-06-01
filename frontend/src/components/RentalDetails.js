import React, { useState } from 'react';
import RentHistory from './RentHistory';
import API_BASE from '../utils/api';

const RentalDetails = ({ rental, users, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isNewAgreement, setIsNewAgreement] = useState(false);
  const [formData, setFormData] = useState({
    flatName: rental.flatName || '',
    flatNumber: rental.flatNumber,
    startDate: rental.startDate ? rental.startDate.split('T')[0] : '',
    endDate: rental.endDate ? rental.endDate.split('T')[0] : '',
    rentAmount: rental.rentAmount
  });
  const [selectedUsers, setSelectedUsers] = useState(rental.userIds || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const startNewAgreement = () => {
    setIsNewAgreement(true);
    setIsEditing(true);
    setFormData(prev => ({ ...prev, startDate: '', endDate: '' }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/rentals/${rental.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rentAmount: parseFloat(formData.rentAmount),
          userIds: selectedUsers,
          isNewAgreement
        })
      });

      if (response.ok) {
        setIsEditing(false);
        setIsNewAgreement(false);
        onUpdate();
        onClose();
      } else {
        setMessage('❌ Could not save changes. Please try again.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsNewAgreement(false);
    // Reset form back to original values
    setFormData({
      flatName: rental.flatName || '',
      flatNumber: rental.flatNumber,
      startDate: rental.startDate ? rental.startDate.split('T')[0] : '',
      endDate: rental.endDate ? rental.endDate.split('T')[0] : '',
      rentAmount: rental.rentAmount
    });
    setMessage('');
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>

        {/* Modal Header */}
        <div className="modal-header">
          <h2>
            {rental.flatName ? `${rental.flatName}` : `Flat ${rental.flatNumber}`}
          </h2>
          <button className="close-btn" onClick={onClose} aria-label="Close details">✕</button>
        </div>

        {/* View Mode */}
        {!isEditing ? (
          <div className="rental-detail-view">
            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {rental.flatName && (
              <div className="detail-row">
                <label>Property Name</label>
                <span>{rental.flatName}</span>
              </div>
            )}
            <div className="detail-row">
              <label>Flat Number</label>
              <span>{rental.flatNumber}</span>
            </div>
            <div className="detail-row">
              <label>Owners / Collaborators</label>
              <span>
                {users && rental.userIds
                  ? rental.userIds.map(id => users.find(u => u.id === id)?.name || id).join(', ')
                  : 'None'}
              </span>
            </div>
            <div className="detail-row">
              <label>Start Date</label>
              <span>{fmtDate(rental.startDate)}</span>
            </div>
            <div className="detail-row">
              <label>End Date</label>
              <span>{fmtDate(rental.endDate)}</span>
            </div>
            <div className="detail-row">
              <label>Monthly Rent</label>
              <span>₹{rental.rentAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="detail-row">
              <label>Status</label>
              <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{rental.status}</span>
            </div>
            <div className="detail-row">
  <label>Advance Amount</label>
  <span>{rental.advanceAmount ? `₹${rental.advanceAmount.toLocaleString('en-IN')}` : 'Not recorded'}</span>
</div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setIsEditing(true)}>
                ✏️ Edit Agreement
              </button>
              <button
                className="btn-primary"
                style={{ background: '#1e7e44', width: 'auto', flex: 1 }}
                onClick={startNewAgreement}
              >
                📝 Start New Agreement
              </button>
            </div>

            <RentHistory rentalId={rental.id} />
          </div>

        ) : (
          /* Edit Mode */
          <form onSubmit={handleUpdate} className="edit-form">
            {message && (
              <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                {message}
              </div>
            )}

            {isNewAgreement && (
              <div className="message success">
                📝 Starting a new agreement — the previous agreement will be saved in history.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="rd-flat-name">Property Name</label>
              <input
                id="rd-flat-name"
                type="text"
                name="flatName"
                value={formData.flatName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="rd-flat-number">Flat Number</label>
              <input
                id="rd-flat-number"
                type="text"
                name="flatNumber"
                value={formData.flatNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rd-start-date">
                  {isNewAgreement ? 'New Start Date *' : 'Start Date'}
                </label>
                <input
                  id="rd-start-date"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required={isNewAgreement}
                />
              </div>
              <div className="form-group">
                <label htmlFor="rd-end-date">
                  {isNewAgreement ? 'New End Date *' : 'End Date'}
                </label>
                <input
                  id="rd-end-date"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required={isNewAgreement}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="rd-rent-amount">
                {isNewAgreement ? 'New Rent Amount (₹) *' : 'Rent Amount (₹)'}
              </label>
              <input
                id="rd-rent-amount"
                type="number"
                name="rentAmount"
                value={formData.rentAmount}
                onChange={handleChange}
                min="0"
                step="1"
                required={isNewAgreement}
              />
            </div>

            <div className="form-group">
              <label>Owners / Collaborators</label>
              <div className="checkbox-group">
                {users && users.map(user => (
                  <label key={user.id}>
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
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelEdit}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: 'auto', flex: 1 }}
              >
                {loading
                  ? '⏳ Saving...'
                  : isNewAgreement ? '📝 Save New Agreement' : '💾 Save Changes'
                }
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RentalDetails;
