const mongoose = require('mongoose');

const shiftSchema = mongoose.Schema({
  cashierEmail: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  openingFloat: { type: Number, required: true },
  openingNotes: {
    notes200: { type: Number, default: 0 },
    notes100: { type: Number, default: 0 },
    notes50: { type: Number, default: 0 },
    notes20: { type: Number, default: 0 },
    notes10: { type: Number, default: 0 },
    notes5: { type: Number, default: 0 },
    notes1: { type: Number, default: 0 }
  },
  closingFloat: { type: Number },
  closingNotes: {
    notes200: { type: Number, default: 0 },
    notes100: { type: Number, default: 0 },
    notes50: { type: Number, default: 0 },
    notes20: { type: Number, default: 0 },
    notes10: { type: Number, default: 0 },
    notes5: { type: Number, default: 0 },
    notes1: { type: Number, default: 0 }
  },
  expectedClosingFloat: { type: Number },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  salesCount: { type: Number, default: 0 },
  salesTotal: { type: Number, default: 0 }
});

module.exports = mongoose.model('Shift', shiftSchema);
