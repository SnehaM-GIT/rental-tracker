const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database file paths
const rentalDbPath = path.join(__dirname, 'database', 'rentals.json');
const expenseDbPath = path.join(__dirname, 'database', 'expenses.json');
const usersDbPath = path.join(__dirname, 'database', 'users.json');

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database files
const initializeDb = () => {
  if (!fs.existsSync(rentalDbPath)) {
    fs.writeFileSync(rentalDbPath, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(expenseDbPath)) {
    fs.writeFileSync(expenseDbPath, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(usersDbPath)) {
    fs.writeFileSync(usersDbPath, JSON.stringify([
      {
        id: 'user1',
        name: 'User 1',
        email: 'user1@example.com',
        phone: '+91XXXXXXXXXX',
        whatsappNumber: '+91XXXXXXXXXX'
      },
      {
        id: 'user2',
        name: 'User 2',
        email: 'user2@example.com',
        phone: '+91XXXXXXXXXX',
        whatsappNumber: '+91XXXXXXXXXX'
      }
    ], null, 2));
  }
};

initializeDb();

// Helper functions to read/write JSON
const readRentals = () => JSON.parse(fs.readFileSync(rentalDbPath, 'utf8'));
const writeRentals = (data) => fs.writeFileSync(rentalDbPath, JSON.stringify(data, null, 2));

const readExpenses = () => JSON.parse(fs.readFileSync(expenseDbPath, 'utf8'));
const writeExpenses = (data) => fs.writeFileSync(expenseDbPath, JSON.stringify(data, null, 2));

const readUsers = () => JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
const writeUsers = (data) => fs.writeFileSync(usersDbPath, JSON.stringify(data, null, 2));

// ==================== RENTAL ROUTES ====================

// Get all rentals
app.get('/api/rentals', (req, res) => {
  try {
    const rentals = readRentals();
    const sortedRentals = rentals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(sortedRentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rental by ID
app.get('/api/rentals/:id', (req, res) => {
  try {
    const rentals = readRentals();
    const rental = rentals.find(r => r.id === req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new rental
app.post('/api/rentals', (req, res) => {
  try {
    const { flatNumber, startDate, endDate, rentAmount, userId } = req.body;
    
    if (!flatNumber || !startDate || !endDate || !rentAmount || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rentals = readRentals();
    const newRental = {
      id: Date.now().toString(),
      flatNumber,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentAmount,
      userId,
      rentHistory: [
        {
          amount: rentAmount,
          date: new Date(),
          note: 'Initial agreement'
        }
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    rentals.push(newRental);
    writeRentals(rentals);
    res.status(201).json(newRental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update rental
app.put('/api/rentals/:id', (req, res) => {
  try {
    const { flatNumber, startDate, endDate, rentAmount, status } = req.body;
    const rentals = readRentals();
    const rentalIndex = rentals.findIndex(r => r.id === req.params.id);

    if (rentalIndex === -1) return res.status(404).json({ error: 'Rental not found' });

    const rental = rentals[rentalIndex];

    if (flatNumber) rental.flatNumber = flatNumber;
    if (startDate) rental.startDate = new Date(startDate);
    if (endDate) rental.endDate = new Date(endDate);
    if (status) rental.status = status;

    if (rentAmount && rentAmount !== rental.rentAmount) {
      rental.rentHistory.push({
        amount: rentAmount,
        date: new Date(),
        previousAmount: rental.rentAmount,
        note: `Updated from ${rental.rentAmount} to ${rentAmount}`
      });
      rental.rentAmount = rentAmount;
    }

    rental.updatedAt = new Date();
    rentals[rentalIndex] = rental;
    writeRentals(rentals);
    res.json(rental);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get rent history for a flat
app.get('/api/rentals/:id/history', (req, res) => {
  try {
    const rentals = readRentals();
    const rental = rentals.find(r => r.id === req.params.id);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json(rental.rentHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EXPENSE ROUTES ====================

// Get all expenses
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = readExpenses();
    const sortedExpenses = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(sortedExpenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses by flat
app.get('/api/expenses/flat/:flatNumber', (req, res) => {
  try {
    const expenses = readExpenses();
    const flatExpenses = expenses.filter(e => e.flatNumber === req.params.flatNumber);
    res.json(flatExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new expense
app.post('/api/expenses', (req, res) => {
  try {
    const { flatNumber, category, amount, description, userId, date } = req.body;

    if (!flatNumber || !category || !amount || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const expenses = readExpenses();
    const newExpense = {
      id: Date.now().toString(),
      flatNumber,
      category,
      amount,
      description: description || '',
      userId,
      date: date ? new Date(date) : new Date(),
      createdAt: new Date()
    };

    expenses.push(newExpense);
    writeExpenses(expenses);
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const expenses = readExpenses();
    const filteredExpenses = expenses.filter(e => e.id !== req.params.id);
    writeExpenses(filteredExpenses);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly expense summary
app.get('/api/expenses/summary/:flatNumber', (req, res) => {
  try {
    const expenses = readExpenses();
    const flatExpenses = expenses.filter(e => e.flatNumber === req.params.flatNumber);
    
    const summary = {};
    flatExpenses.forEach(exp => {
      const monthKey = new Date(exp.date).toISOString().substring(0, 7);
      if (!summary[monthKey]) {
        summary[monthKey] = { total: 0, byCategory: {} };
      }
      summary[monthKey].total += exp.amount;
      summary[monthKey].byCategory[exp.category] = (summary[monthKey].byCategory[exp.category] || 0) + exp.amount;
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== USER ROUTES ====================

// Get all users
app.get('/api/users', (req, res) => {
  try {
    const users = readUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user contact info
app.put('/api/users/:id', (req, res) => {
  try {
    const { name, email, phone, whatsappNumber } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const user = users[userIndex];
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (whatsappNumber) user.whatsappNumber = whatsappNumber;

    users[userIndex] = user;
    writeUsers(users);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== NOTIFICATION SERVICE ====================

const sendReminder = async (rental, user) => {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('🔔 REMINDER NOTIFICATION');
    console.log('='.repeat(60));
    console.log(`📍 Flat Number: ${rental.flatNumber}`);
    console.log(`👤 User: ${user.name}`);
    console.log(`💰 Rent Amount: ₹${rental.rentAmount.toLocaleString()}`);
    console.log(`📅 Agreement Ends On: ${new Date(rental.endDate).toLocaleDateString()}`);
    console.log(`⏱️  Time Left: 2 days`);
    console.log('');
    console.log('📱 Notification Channels:');
    console.log(`  ✓ WhatsApp: ${user.whatsappNumber}`);
    console.log(`  ✓ Email: ${user.email}`);
    console.log(`  ✓ Calendar: Google Calendar`);
    console.log('');
    console.log('💡 Integration Ready: Configure Twilio, Gmail, and Google Calendar API');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('Error sending reminder:', error);
  }
};

// Check for upcoming reminders every hour
cron.schedule('0 * * * *', async () => {
  console.log(`\n⏰ [${new Date().toLocaleString()}] Checking for upcoming rental reminders...`);
  try {
    const rentals = readRentals();
    const users = readUsers();

    rentals.forEach(rental => {
      const endDate = new Date(rental.endDate);
      const today = new Date();
      const daysUntilEnd = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));

      if (daysUntilEnd === 2) {
        const user = users.find(u => u.id === rental.userId);
        if (user) {
          sendReminder(rental, user);
        }
      }
    });
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Rental & Expense Tracker - Backend Server');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log('  GET  /api/rentals              - Get all rentals');
  console.log('  POST /api/rentals              - Create rental');
  console.log('  GET  /api/rentals/:id          - Get rental details');
  console.log('  PUT  /api/rentals/:id          - Update rental');
  console.log('  GET  /api/rentals/:id/history  - Get rent history');
  console.log('  GET  /api/expenses             - Get all expenses');
  console.log('  POST /api/expenses             - Create expense');
  console.log('  DEL  /api/expenses/:id         - Delete expense');
  console.log('  GET  /api/users                - Get all users');
  console.log('  PUT  /api/users/:id            - Update user');
  console.log('');
  console.log('⏰ Reminder Check: Every hour at :00');
  console.log('='.repeat(60) + '\n');
});
