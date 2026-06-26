const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Mongoose schema definition matching backend/models/inventory.js
const inventorySchema = mongoose.Schema({
  email: { type: String, require: true },
  name: { type: String, require: true },
  quantity: { type: String, require: true },
  batchId: { type: String, require: true },
  expireDate: { type: Date, require: true },
  price: { type: String, require: true }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy';
const csvPath = path.join(__dirname, 'egyptian-drugs.csv');

// Helper to parse CSV line (handles quotes and commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function run() {
  console.log('Connecting to database:', dbUri);
  await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to database successfully!');

  // Clear existing inventory
  console.log('Clearing existing inventory...');
  await Inventory.deleteMany({});

  console.log('Reading CSV file from:', csvPath);
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at: ${csvPath}`);
  }
  
  const data = fs.readFileSync(csvPath, 'utf-8');
  const lines = data.split(/\r?\n/);
  
  const headers = parseCSVLine(lines[0]);
  console.log('Headers:', headers);

  const batchSize = 1000;
  let batch = [];
  let totalInserted = 0;

  // Define dates relative to today
  const today = new Date();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length < 7) continue;

    const name = values[0]; // commercial_name_en
    const manufacturer = values[3] || 'UNKNOWN';
    const priceEGP = values[6] || '10';

    // Generate realistic stocks
    // 10% of items are out of stock (quantity = 0)
    // 20% of items are low stock (quantity <= 50)
    // 70% of items are in stock (quantity between 50 and 1500)
    let quantity = '100';
    const rand = Math.random();
    if (rand < 0.1) {
      quantity = '0';
    } else if (rand < 0.3) {
      quantity = Math.floor(Math.random() * 45 + 1).toString();
    } else {
      quantity = Math.floor(Math.random() * 1000 + 50).toString();
    }

    // Generate random batch ID
    const batchId = 'B-' + Math.floor(Math.random() * 90000 + 10000);

    // Generate expiration dates:
    // 5% expired (date in past)
    // 5% about to expire (date within next 10 days)
    // 90% future (date between 6 months and 3 years)
    let expireDate = new Date();
    const dateRand = Math.random();
    if (dateRand < 0.05) {
      // Expired: 1 to 6 months in the past
      expireDate.setMonth(today.getMonth() - Math.floor(Math.random() * 5 + 1));
    } else if (dateRand < 0.10) {
      // About to expire: 1 to 9 days in the future
      expireDate.setDate(today.getDate() + Math.floor(Math.random() * 8 + 1));
    } else {
      // Future: 6 to 36 months in the future
      expireDate.setMonth(today.getMonth() + Math.floor(Math.random() * 30 + 6));
    }

    // Clean manufacturer to form supplier email
    const cleanMan = manufacturer.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const email = cleanMan ? `order@${cleanMan}.com` : 'supplier@pharmacy.eg';

    batch.push({
      email,
      name,
      quantity,
      batchId,
      expireDate,
      price: priceEGP
    });

    if (batch.length >= batchSize) {
      await Inventory.insertMany(batch);
      totalInserted += batch.length;
      console.log(`Inserted ${totalInserted} items...`);
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await Inventory.insertMany(batch);
    totalInserted += batch.length;
    console.log(`Inserted final batch. Total items: ${totalInserted}`);
  }

  console.log('Database import completed successfully!');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error running import:', err);
  mongoose.disconnect();
});
