import React, { useState, useEffect } from 'react';

const UserSettings = ({ userId, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const users = await response.json();
      const user = users.find(u => u.id === userId);
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          phone: user.phone,
          whatsappNumber: user.whatsappNumber
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('✅ Settings updated successfully!');
        onUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Error updating settings');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h2>⚙️ User Settings</h2>
      {message && <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91XXXXXXXXXX"
          />
        </div>

        <div className="form-group">
          <label>WhatsApp Number (for reminders)</label>
          <input
            type="tel"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={handleChange}
            placeholder="+91XXXXXXXXXX"
          />
        </div>

        <div className="settings-info">
          <p><strong>📱 Note:</strong> Your WhatsApp number will be used to send rental agreement reminders 2 days before the end date.</p>
          <p><strong>📅 Note:</strong> Your email can be used to add events to your Google Calendar automatically.</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default UserSettings;
