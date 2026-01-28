const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    phonePeTransactionId: { type: String },
    merchantTransactionId: { type: String },
    providerReferenceId: { type: String },
    receiptEmail: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
