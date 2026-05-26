import React, { useState, useEffect } from 'react';

const UserSettings = ({ userId, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notifyEmail: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      const user = users.find(u => u.id === userId);
      if (user) {
        setFormData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          notifyEmail: user.notifyEmail || user.email || ''
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
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage('✅ Settings saved successfully!');
        onUpdate();
        setTimeout(() => setMessage(''), 4000);
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
      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-group">
          <label htmlFor="settings-name">Full Name</label>
          <input
            id="settings-name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="settings-email">Email Address</label>
          <input
            id="settings-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="settings-phone">Phone Number</label>
          <input
            id="settings-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91XXXXXXXXXX"
          />
        </div>

        <div className="form-group">
          <label htmlFor="settings-notify-email">📧 Reminder Email</label>
          <input
            id="settings-notify-email"
            type="email"
            name="notifyEmail"
            value={formData.notifyEmail}
            onChange={handleChange}
            placeholder="email where reminders will be sent"
          />
        </div>

        <div className="settings-info">
          <p>
            <strong>📧 Email Reminders:</strong> You will receive an email 2 days before any
            rental agreement ends. Make sure your Reminder Email above is correct.
          </p>
          <p>
            <strong>⚙️ Setup:</strong> The server administrator must configure SMTP settings
            in the backend <code>.env</code> file to activate email delivery.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default UserSettings;
