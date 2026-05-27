import React, { useState, useEffect } from 'react';

const ExpenseTracker = ({ currentUser, users }) => {
  const [expenses, setExpenses] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [formData, setFormData] = useState({
    flatNumber: '',
    category: 'maintenance',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filterFlat, setFilterFlat] = useState('');

// eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRentals();
    fetchExpenses();
  }, [currentUser]);

  const fetchRentals = async () => {
    try {
      const response = await fetch('/api/rentals');
      const data = await response.json();
      const userRentals = data.filter(r => r.userIds && r.userIds.includes(currentUser));
      setRentals(userRentals);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const [expRes, rentRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/rentals')
      ]);
      const expensesData = await expRes.json();
      const rentalsData = await rentRes.json();

      const userFlatNumbers = rentalsData
        .filter(r => r.userIds && r.userIds.includes(currentUser))
        .map(r => r.flatNumber);

      const userExpenses = expensesData.filter(e =>
        e.userId === currentUser || (e.flatNumber && userFlatNumbers.includes(e.flatNumber))
      );
      setExpenses(userExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          userId: currentUser
        })
      });

      if (response.ok) {
        setMessage('✅ Expense added successfully!');
        setFormData({
          flatNumber: '',
          category: 'maintenance',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchExpenses();
        setTimeout(() => setMessage(''), 4000);
      } else {
        setMessage('❌ Error adding expense. Please try again.');
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const response = await fetch(`/api/expenses/${expenseId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchExpenses();
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const categoryIcons = {
    maid:        '🧹',
    repairs:     '🔧',
    utilities:   '💡',
    maintenance: '🏠',
    other:       '📝'
  };

  const filteredExpenses = filterFlat
    ? expenses.filter(e => e.flatNumber === filterFlat)
    : expenses;

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="expense-tracker-container">

      {/* Add Expense Form */}
      <div className="expense-form-section">
        <h2>Add Expense</h2>
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exp-flat">Property</label>
              <select
                id="exp-flat"
                name="flatNumber"
                value={formData.flatNumber}
                onChange={handleChange}
              >
                <option value="">None (General Expense)</option>
                {rentals.map(rental => (
                  <option key={rental.id} value={rental.flatNumber}>
                    {rental.flatName ? `${rental.flatName} — ` : ''}Flat {rental.flatNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="exp-category">Category *</label>
              <select
                id="exp-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                <option value="maid">🧹 Maid / Cleaning</option>
                <option value="repairs">🔧 Repairs</option>
                <option value="utilities">💡 Utilities</option>
                <option value="maintenance">🏠 Maintenance</option>
                <option value="other">📝 Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exp-amount">Amount (₹) *</label>
              <input
                id="exp-amount"
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g. 500"
                min="0"
                step="50"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exp-date">Date *</label>
              <input
                id="exp-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="exp-description">Description</label>
            <input
              id="exp-description"
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Monthly cleaning, AC repair"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? '⏳ Adding...' : '➕ Add Expense'}
          </button>
        </form>
      </div>

      {/* Expense List */}
      <div className="expense-list-section">
        <h2>Expense History</h2>

        <div className="filter-section">
          <select
            id="filter-flat"
            value={filterFlat}
            onChange={(e) => setFilterFlat(e.target.value)}
            className="filter-dropdown"
          >
            <option value="">All Properties</option>
            {rentals.map(rental => (
              <option key={rental.id} value={rental.flatNumber}>
                {rental.flatName ? `${rental.flatName} — ` : ''}Flat {rental.flatNumber}
              </option>
            ))}
          </select>
          <div className="total-expenses">
            Total: <strong>₹{totalExpenses.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <div className="expense-list">
          {filteredExpenses.length === 0 ? (
            <div className="empty-state">
              📭 No expenses recorded yet.<br />
              <span style={{ fontSize: '0.9em' }}>Add your first expense above.</span>
            </div>
          ) : (
            filteredExpenses.map(expense => (
              <div key={expense.id} className="expense-item">
                <div className="expense-icon">
                  {categoryIcons[expense.category] || '📝'}
                </div>
                <div className="expense-details">
                  <div className="expense-category">{expense.category}</div>
                  {expense.description && (
                    <div className="expense-description">{expense.description}</div>
                  )}
                  <div className="expense-date">
                    {new Date(expense.date).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                    {expense.flatNumber && ` · Flat ${expense.flatNumber}`}
                  </div>
                </div>
                <div className="expense-amount">
                  ₹{expense.amount.toLocaleString('en-IN')}
                </div>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(expense.id)}
                  title="Delete this expense"
                  aria-label={`Delete expense of ₹${expense.amount}`}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseTracker;
