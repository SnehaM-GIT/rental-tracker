const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String },   // keep string IDs: 'user1', 'user2'
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  notifyEmail: { type: String, default: '' }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

module.exports = mongoose.model('User', userSchema);
