const mongoose = require('mongoose');

const cashRegisterSchema = mongoose.Schema({
  notes200: { type: Number, default: 10 }, // 2000 EGP
  notes100: { type: Number, default: 20 }, // 2000 EGP
  notes50: { type: Number, default: 20 },  // 1000 EGP
  notes20: { type: Number, default: 25 },  // 500 EGP
  notes10: { type: Number, default: 30 },  // 300 EGP
  notes5: { type: Number, default: 30 },   // 150 EGP
  notes1: { type: Number, default: 50 },   // 50 EGP
  totalAmount: { type: Number, default: 6000 },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CashRegister', cashRegisterSchema);
