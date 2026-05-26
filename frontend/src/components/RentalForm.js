import React, { useState } from 'react';

const RentalForm = ({ currentUser, users, onSuccess }) => {
  const [formData, setFormData] = useState({
    flatName: '',
    flatNumber: '',
    startDate: '',
    endDate: '',
    rentAmount: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([currentUser]);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rentAmount: parseFloat(formData.rentAmount),
          userIds: selectedUsers.length > 0 ? selectedUsers : [currentUser]
        })
      });

      if (response.ok) {
        setMessage('✅ Rental agreement added successfully!');
        setFormData({ flatName: '', flatNumber: '', startDate: '', endDate: '', rentAmount: '' });
        setSelectedUsers([currentUser]);
        onSuccess();
        setTimeout(() => setMessage(''), 4000);
      } else {
        const err = await response.json();
        setMessage(`❌ Error: ${err.error || 'Could not add rental.'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Add New Rental Agreement</h2>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rental-form">
        <div className="form-group">
          <label htmlFor="rf-flat-name">Property Name</label>
          <input
            id="rf-flat-name"
            type="text"
            name="flatName"
            value={formData.flatName}
            onChange={handleChange}
            placeholder="e.g. Sunrise Apartments"
          />
        </div>

        <div className="form-group">
          <label htmlFor="rf-flat-number">Flat / Unit Number *</label>
          <input
            id="rf-flat-number"
            type="text"
            name="flatNumber"
            value={formData.flatNumber}
            onChange={handleChange}
            placeholder="e.g. 101, Block A"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rf-start-date">Agreement Start Date *</label>
            <input
              id="rf-start-date"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rf-end-date">Agreement End Date *</label>
            <input
              id="rf-end-date"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="rf-rent-amount">Monthly Rent Amount (₹) *</label>
          <input
            id="rf-rent-amount"
            type="number"
            name="rentAmount"
            value={formData.rentAmount}
            onChange={handleChange}
            placeholder="e.g. 10000"
            min="0"
            step="100"
            required
          />
        </div>

        <div className="form-group">
          <label>Linked To (Select owners)</label>
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

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '⏳ Adding...' : '➕ Add Rental Agreement'}
        </button>
      </form>
    </div>
  );
};

export default RentalForm;
