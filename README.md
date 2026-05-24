# 🏠 Rental & Expense Tracker

A simple yet powerful personal application to track rental agreements and monthly expenses for your properties.

## ✨ Features

### Rental Management
- ✅ Add rental agreements with flat number, start date, end date, and rent amount
- 📊 Track rent history with updates over time
- 📋 View all active rental agreements
- 🔔 Receive reminders 2 days before agreement ends
- ✏️ Edit and update agreements

### Expense Tracking
- 💰 Log monthly expenses by category (Maid, Repairs, Utilities, Maintenance, Other)
- 📝 Add descriptions and dates to expenses
- 📈 View expense history and monthly summaries
- 🗑️ Delete expenses

### Multi-User Support
- 👥 Support for 2+ users
- 🔐 Each user sees only their own rentals and expenses
- ⚙️ User profile management with WhatsApp and email settings

### Smart Notifications
- 📱 WhatsApp reminders 2 days before agreement end date
- 📅 Google Calendar integration (setup ready)
- 📧 Email notifications

### Dashboard
- 📊 Quick statistics overview
- 🔔 Upcoming reminders display
- 💰 Monthly expense summary

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm start
```

Server runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Application runs on `http://localhost:3000`

## 🔧 API Endpoints

### Rentals
- `GET /api/rentals` - Get all rentals
- `GET /api/rentals/:id` - Get rental details
- `POST /api/rentals` - Create new rental
- `PUT /api/rentals/:id` - Update rental
- `GET /api/rentals/:id/history` - Get rent history

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/flat/:flatNumber` - Get flat expenses
- `POST /api/expenses` - Create expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary/:flatNumber` - Monthly summary

### Users
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user settings

## 📱 Convert to Mobile App

This app is built with React and can easily be converted to React Native for iOS/Android:

1. **Web**: React + Express (Current)
2. **Mobile**: React Native + Node.js backend (Easy migration)

The API and business logic remain the same!

## 🔐 Setup Notifications

### WhatsApp (Twilio)
1. Sign up at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token
3. Add to `.env` file

### Google Calendar
1. Get Google Calendar API credentials
2. Add to `.env` file
3. User emails will sync calendar events

## 📊 Database

Uses JSON files for simple local storage. For production, migrate to:
- MongoDB
- PostgreSQL
- Firebase

## 🎨 Customization

- Modify categories in `ExpenseTracker.js`
- Change reminder timing in `server.js` cron schedule
- Update UI colors in `App.css`

## 📝 License

MIT License - Feel free to use for personal projects

## 🤝 Support

For issues or feature requests, please create an issue in the repository.

---

Built with ❤️ for managing rentals effortlessly