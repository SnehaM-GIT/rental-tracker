import React, { useState } from 'react';

const RentalForm = ({ currentUser, onSuccess }) => {
  const [formData, setFormData] = useState({
    flatNumber: '',
    startDate: '',
    endDate: '',
    rentAmount: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:5000/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          rentAmount: parseFloat(formData.rentAmount),
          userId: currentUser
        })
      });

      if (response.ok) {
        setMessage('✅ Rental agreement added successfully!');
        setFormData({ flatNumber: '', startDate: '', endDate: '', rentAmount: '' });
        onSuccess();
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage('❌ Error adding rental agreement');
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
      {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}
      
      <form onSubmit={handleSubmit} className="rental-form">
        <div className="form-group">
          <label>Flat Number *</label>
          <input
            type="text"
            name="flatNumber"
            value={formData.flatNumber}
            onChange={handleChange}
            placeholder="e.g., Flat 101, Block A"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Start Date *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Monthly Rent Amount (₹) *</label>
          <input
            type="number"
            name="rentAmount"
            value={formData.rentAmount}
            onChange={handleChange}
            placeholder="10000"
            min="0"
            step="100"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '⏳ Adding...' : '➕ Add Rental'}
        </button>
      </form>
    </div>
  );
};

export default RentalForm;
