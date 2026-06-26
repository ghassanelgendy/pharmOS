const mongoose = require('mongoose');

const inventoryBackupSchema = mongoose.Schema({
  email: { type: String, require: true },
  name: { type: String, require: true },
  quantity: { type: String, require: true },
  batchId: { type: String, require: true },
  expireDate: { type: Date, require: true },
  price: { type: String, require: true },
  barcode: { type: String }
});

module.exports = mongoose.model('InventoryBackup', inventoryBackupSchema);
