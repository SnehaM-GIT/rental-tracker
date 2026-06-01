const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  flatNumber: { type: String, default: '' },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  userId: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('Expense', expenseSchema);
