const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== EMAIL SETUP ====================

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

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
        name: 'Mani',
        email: 'mani@example.com',
        phone: '+91XXXXXXXXXX',
        notifyEmail: ''
      },
      {
        id: 'user2',
        name: 'Shankar',
        email: 'shankar@example.com',
        phone: '+91XXXXXXXXXX',
        notifyEmail: ''
      }
    ], null, 2));
  }
};

initializeDb();

// Data Migration for rentals (userId -> userIds, add flatName)
try {
  if (fs.existsSync(rentalDbPath)) {
    const rentals = JSON.parse(fs.readFileSync(rentalDbPath, 'utf8'));
    let modified = false;
    const migrated = rentals.map(r => {
      if (r.userId && !r.userIds) {
        r.userIds = [r.userId];
        delete r.userId;
        modified = true;
      }
      if (r.flatName === undefined) {
        r.flatName = '';
        modified = true;
      }
      return r;
    });
    if (modified) {
      fs.writeFileSync(rentalDbPath, JSON.stringify(migrated, null, 2));
    }
  }
} catch (err) {
  console.error('Migration error:', err);
}

// Migrate users: add notifyEmail if missing
try {
  if (fs.existsSync(usersDbPath)) {
    const users = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
    let modified = false;
    const migrated = users.map(u => {
      if (u.whatsappNumber !== undefined && u.notifyEmail === undefined) {
        u.notifyEmail = u.email || '';
        delete u.whatsappNumber;
        modified = true;
      } else if (u.notifyEmail === undefined) {
        u.notifyEmail = u.email || '';
        modified = true;
      }
      return u;
    });
    if (modified) {
      fs.writeFileSync(usersDbPath, JSON.stringify(migrated, null, 2));
    }
  }
} catch (err) {
  console.error('User migration error:', err);
}

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
    const { flatNumber, flatName, startDate, endDate, rentAmount, userIds } = req.body;
    
    if (!flatNumber || !startDate || !endDate || !rentAmount || !userIds || !userIds.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const rentals = readRentals();
    const newRental = {
      id: Date.now().toString(),
      flatNumber,
      flatName: flatName || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rentAmount,
      userIds,
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
    const { flatNumber, flatName, startDate, endDate, rentAmount, status, userIds, isNewAgreement } = req.body;
    const rentals = readRentals();
    const rentalIndex = rentals.findIndex(r => r.id === req.params.id);

    if (rentalIndex === -1) return res.status(404).json({ error: 'Rental not found' });

    const rental = rentals[rentalIndex];

    if (isNewAgreement) {
      rental.rentHistory.push({
        type: 'agreement',
        amount: rental.rentAmount,
        startDate: rental.startDate,
        endDate: rental.endDate,
        date: new Date(),
        note: `Agreement ended: ₹${rental.rentAmount} (${new Date(rental.startDate).toLocaleDateString()} → ${new Date(rental.endDate).toLocaleDateString()})`
      });
      rental.rentHistory.push({
        type: 'agreement',
        amount: parseFloat(rentAmount) || rental.rentAmount,
        startDate: startDate ? new Date(startDate) : rental.startDate,
        endDate: endDate ? new Date(endDate) : rental.endDate,
        date: new Date(),
        note: `New agreement started: ₹${rentAmount || rental.rentAmount} (${startDate ? new Date(startDate).toLocaleDateString() : 'same start'} → ${endDate ? new Date(endDate).toLocaleDateString() : 'same end'})`
      });
      if (rentAmount) rental.rentAmount = parseFloat(rentAmount);
      if (startDate) rental.startDate = new Date(startDate);
      if (endDate) rental.endDate = new Date(endDate);
      rental.status = 'active';
    } else {
      if (rentAmount && parseFloat(rentAmount) !== rental.rentAmount) {
        rental.rentHistory.push({
          type: 'rent_change',
          amount: parseFloat(rentAmount),
          date: new Date(),
          previousAmount: rental.rentAmount,
          note: `Rent updated from ₹${rental.rentAmount} to ₹${rentAmount}`
        });
        rental.rentAmount = parseFloat(rentAmount);
      }
      if (startDate) rental.startDate = new Date(startDate);
      if (endDate) rental.endDate = new Date(endDate);
      if (status) rental.status = status;
    }

    if (flatNumber) rental.flatNumber = flatNumber;
    if (flatName !== undefined) rental.flatName = flatName;
    if (userIds && userIds.length > 0) rental.userIds = userIds;

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

    if (!category || !amount || !userId) {
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
    const { name, email, phone, notifyEmail } = req.body;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id === req.params.id);

    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const user = users[userIndex];
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (notifyEmail !== undefined) user.notifyEmail = notifyEmail;

    users[userIndex] = user;
    writeUsers(users);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== EMAIL NOTIFICATION SERVICE ====================

const sendEmailReminder = async (rental, user) => {
  const flatStr = rental.flatName ? `${rental.flatName} - Flat ${rental.flatNumber}` : `Flat ${rental.flatNumber}`;
  const endDateStr = new Date(rental.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const rentStr = rental.rentAmount.toLocaleString('en-IN');

  console.log('\n' + '='.repeat(60));
  console.log('🔔 REMINDER NOTIFICATION');
  console.log('='.repeat(60));
  console.log(`📍 Flat: ${flatStr}`);
  console.log(`👤 User: ${user.name}`);
  console.log(`💰 Rent Amount: ₹${rentStr}`);
  console.log(`📅 Agreement Ends On: ${endDateStr}`);
  console.log(`⏱️  Time Left: 2 days`);
  console.log('');

  const notifyEmail = user.notifyEmail || user.email;

  if (!notifyEmail || notifyEmail.includes('example.com')) {
    console.log('📧 Email notification skipped: No valid email configured.');
    console.log('💡 To enable email reminders:');
    console.log('   1. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to backend/.env');
    console.log(`   2. Set notifyEmail for ${user.name} in Settings.`);
    console.log('='.repeat(60) + '\n');
    return;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 Email notification skipped: SMTP not configured in .env');
    console.log('💡 Add SMTP_USER and SMTP_PASS to backend/.env to enable emails.');
    console.log('='.repeat(60) + '\n');
    return;
  }

  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">
        <div style="background: #2c3e50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">🏠 Rental Agreement Reminder</h1>
        </div>
        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
          <p style="font-size: 18px; color: #333;">Dear <strong>${user.name}</strong>,</p>
          <p style="font-size: 16px; color: #555;">Your rental agreement is ending in <strong style="color: #e74c3c;">2 days</strong>.</p>
          
          <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2c3e50;">
            <p style="margin: 8px 0; font-size: 16px;"><strong>📍 Property:</strong> ${flatStr}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>💰 Monthly Rent:</strong> ₹${rentStr}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Agreement Ends:</strong> ${endDateStr}</p>
          </div>
          
          <p style="font-size: 16px; color: #555;">Please log in to the Rental Tracker app to review and renew your agreement if needed.</p>
          
          <p style="font-size: 14px; color: #999; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            This is an automated reminder from your Rental & Expense Tracker.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Rental Tracker" <${process.env.SMTP_USER}>`,
      to: notifyEmail,
      subject: `🔔 Rental Reminder: ${flatStr} agreement ends in 2 days`,
      html: htmlBody,
      text: `Hi ${user.name},\n\nYour rental agreement for ${flatStr} ends in 2 days on ${endDateStr}.\nCurrent rent: ₹${rentStr}\n\nPlease review and renew your agreement if necessary.`
    });

    console.log(`✅ Email reminder sent to ${user.name} at ${notifyEmail}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${notifyEmail}:`, error.message);
  }

  console.log('='.repeat(60) + '\n');
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

      if (daysUntilEnd === 2 && rental.userIds) {
        rental.userIds.forEach(uid => {
          const user = users.find(u => u.id === uid);
          if (user) {
            sendEmailReminder(rental, user);
          }
        });
      }
    });
  } catch (error) {
    console.error('Cron job error:', error);
  }
});

// Manual trigger endpoint (for testing)
app.post('/api/test-reminder/:rentalId', async (req, res) => {
  try {
    const rentals = readRentals();
    const users = readUsers();
    const rental = rentals.find(r => r.id === req.params.rentalId);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    const results = [];
    for (const uid of rental.userIds || []) {
      const user = users.find(u => u.id === uid);
      if (user) {
        await sendEmailReminder(rental, user);
        results.push({ user: user.name, email: user.notifyEmail || user.email });
      }
    }
    res.json({ message: 'Test reminder triggered', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  const transporter = createTransporter();
  res.json({
    status: 'Server is running',
    emailConfigured: !!transporter,
    smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 3)}***` : 'not set'
  });
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
  console.log('  POST /api/test-reminder/:id    - Test email reminder');
  console.log('');
  console.log(`📧 Email Notifications: ${process.env.SMTP_USER ? '✅ Configured' : '⚠️  Not configured (add SMTP_* to .env)'}`);
  console.log('⏰ Reminder Check: Every hour at :00');
  console.log('='.repeat(60) + '\n');
});
