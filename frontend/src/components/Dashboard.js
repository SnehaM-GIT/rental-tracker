import React, { useState, useEffect } from 'react';
import RentalList from './RentalList';

const Dashboard = ({ currentUser, users }) => {
  const [stats, setStats] = useState({
    totalRentals: 0,
    totalMonthlyRent: 0,
    activeRentals: 0,
    endingSoon: 0,
    monthlyExpenses: 0
  });
  const [upcomingReminders, setUpcomingReminders] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      const rentalsRes = await fetch('/api/rentals');
      const rentalsData = await rentalsRes.json();
      const userRentals = rentalsData.filter(r => r.userIds && r.userIds.includes(currentUser));

      const expensesRes = await fetch('/api/expenses');
      const expensesData = await expensesRes.json();
      const userFlatNumbers = userRentals.map(r => r.flatNumber);
      const userExpenses = expensesData.filter(e =>
        e.userId === currentUser || (e.flatNumber && userFlatNumbers.includes(e.flatNumber))
      );

      const currentMonth = new Date().toISOString().substring(0, 7);
      const currentMonthExpenses = userExpenses.filter(e =>
        new Date(e.date).toISOString().substring(0, 7) === currentMonth
      );

      const today = new Date();
      let endingSoonCount = 0;
      const reminders = [];

      userRentals.forEach(rental => {
        const endDate = new Date(rental.endDate);
        const daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

        if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
          endingSoonCount++;
          reminders.push({
            flatName: rental.flatName,
            flatNumber: rental.flatNumber,
            daysLeft: daysUntilEnd,
            endDate: endDate
          });
        }
      });

      setStats({
        totalRentals: userRentals.length,
        totalMonthlyRent: userRentals.reduce((sum, r) => sum + r.rentAmount, 0),
        activeRentals: userRentals.filter(r => r.status === 'active').length,
        endingSoon: endingSoonCount,
        monthlyExpenses: currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0)
      });

      setUpcomingReminders(reminders);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="dashboard-container">

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-label">Total Rentals</div>
            <div className="stat-value">{stats.totalRentals}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Active Rentals</div>
            <div className="stat-value">{stats.activeRentals}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Monthly Rent</div>
            <div className="stat-value">₹{stats.totalMonthlyRent.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">Ending Soon</div>
            <div className="stat-value">{stats.endingSoon}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">This Month Expenses</div>
            <div className="stat-value">₹{stats.monthlyExpenses.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div className="reminders-section">
          <h2>🔔 Upcoming Reminders</h2>
          <div className="reminders-list">
            {upcomingReminders.map((reminder, index) => (
              <div key={index} className="reminder-card">
                <div className="reminder-icon">📍</div>
                <div className="reminder-content">
                  <div className="reminder-flat">
                    {reminder.flatName ? `${reminder.flatName} — ` : ''}Flat {reminder.flatNumber}
                  </div>
                  <div className="reminder-days">
                    {reminder.daysLeft === 0
                      ? '🚨 Agreement ends TODAY!'
                      : `⏰ Ends in ${reminder.daysLeft} day${reminder.daysLeft > 1 ? 's' : ''}`}
                  </div>
                  <div className="reminder-date">
                    {new Date(reminder.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rentals List */}
      <div className="dashboard-rentals">
        <RentalList currentUser={currentUser} users={users} />
      </div>
    </div>
  );
};

export default Dashboard;
