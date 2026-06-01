const mongoose = require('mongoose');

const rentHistorySchema = new mongoose.Schema({
  type: { type: String, default: 'agreement' },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  startDate: Date,
  endDate: Date,
  previousAmount: Number,
  note: String
}, { _id: false });

const rentalSchema = new mongoose.Schema({
  flatNumber: { type: String, required: true },
  flatName: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  rentAmount: { type: Number, required: true },
  advanceAmount: { type: Number, default: 0 },
  userIds: [{ type: String, required: true }],
  rentHistory: [rentHistorySchema],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true,   // adds createdAt + updatedAt automatically
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

module.exports = mongoose.model('Rental', rentalSchema);
