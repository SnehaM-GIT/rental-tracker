import React, { useState, useEffect } from 'react';
import './styles/App.css';
import RentalForm from './components/RentalForm';
import RentalList from './components/RentalList';
import ExpenseTracker from './components/ExpenseTracker';
import UserSettings from './components/UserSettings';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState('user1');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🏠 Rental & Expense Tracker</h1>
          <div className="user-selector">
            <select 
              value={currentUser} 
              onChange={(e) => setCurrentUser(e.target.value)}
              className="user-dropdown"
            >
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rentals' ? 'active' : ''}`}
          onClick={() => setActiveTab('rentals')}
        >
          📋 Rentals
        </button>
        <button 
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          💰 Expenses
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} users={users} />}
        {activeTab === 'rentals' && (
          <div className="rentals-section">
            <RentalForm currentUser={currentUser} users={users} onSuccess={() => {}} />
            <RentalList currentUser={currentUser} users={users} />
          </div>
        )}
        {activeTab === 'expenses' && <ExpenseTracker currentUser={currentUser} users={users} />}
        {activeTab === 'settings' && <UserSettings userId={currentUser} onUpdate={fetchUsers} />}
      </main>
    </div>
  );
}

export default App;
