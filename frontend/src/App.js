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
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    fetchUsers();

    // PWA install prompt
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
      if (data.length > 0) {
        setCurrentUser(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
    }
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'rentals',   label: '📋 Rentals'   },
    { id: 'expenses',  label: '💰 Expenses'  },
    { id: 'settings',  label: '⚙️ Settings'  },
  ];

  return (
    <div className="app-container">

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="pwa-install-banner">
          <span>📱 Add this app to your home screen for easy access!</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleInstall}>Install App</button>
            <button
              onClick={() => setShowInstallBanner(false)}
              style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1>🏠 Rental &amp; Expense Tracker</h1>
          <div className="user-selector">
            <label htmlFor="user-select">Viewing as:</label>
            <select
              id="user-select"
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

      {/* Navigation */}
      <nav className="tab-navigation" aria-label="Main navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="app-main" id="main-content">
        {activeTab === 'dashboard' && (
          <Dashboard currentUser={currentUser} users={users} />
        )}
        {activeTab === 'rentals' && (
          <div className="rentals-section">
            <RentalForm currentUser={currentUser} users={users} onSuccess={fetchUsers} />
            <RentalList currentUser={currentUser} users={users} />
          </div>
        )}
        {activeTab === 'expenses' && (
          <ExpenseTracker currentUser={currentUser} users={users} />
        )}
        {activeTab === 'settings' && (
          <UserSettings userId={currentUser} onUpdate={fetchUsers} />
        )}
      </main>
    </div>
  );
}

export default App;
