const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const https = require("https");

const Inventory = require('../models/inventory');
const InventoryBackup = require('../models/inventoryBackup');


router.post("", (req,res,next)=>{
  const inventory = new Inventory({
    email: req.body.email,
    name: req.body.name,
    quantity: req.body.quantity,
    batchId: req.body.batchId,
    expireDate: req.body.expireDate,
    price: req.body.price,
    barcode: req.body.barcode
  });
  inventory.save().then(createdInventory=>{
    res.status(201).json({
      message:'Inventory Added Successfully',
      inventory: {
        ...createdInventory,
        id : createdInventory._id
      }
    });
  });
});


router.put("/:id", (req,res,next)=>{
  const inventory = new Inventory({
    _id: req.body.id,
    email: req.body.email,
    name: req.body.name,
    quantity: req.body.quantity,
    batchId: req.body.batchId,
    expireDate: new Date(req.body.expireDate),
    price: req.body.price,
    barcode: req.body.barcode
  });
  console.log(inventory);
  Inventory.updateOne({_id: req.params.id}, inventory).then(result => {
    console.log(result);
    res.status(200).json({message : "Update Successful !"});
  });
});


router.put("/updateQuantity/:id",(req,res,next)=>{
  const inventory = new Inventory({
    _id: req.body.id,
    quantity: req.body.quantity


  });console.log(inventory)
  Inventory.updateOne({_id: req.params.id}, inventory).then(result => {
    console.log(result);
    res.status(200).json({message : "Update quantity Successful !"});
  });
});


router.get("",(req,res,next)=>{
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Inventory.find();
  if(pageSize && currentPage){
    postQuery
      .skip(pageSize * (currentPage-1))
      .limit(pageSize);
  }
  postQuery.then(documents=>{
    res.status(200).json({
      message : 'inventory added sucessfully',
      inventorys :documents
    });
  });
});


router.get("/outofstock",(req,res,next)=>{
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Inventory.find({ $expr: { $lte: [ { $toDouble: "$quantity" }, 1.0 ] }});
  if(pageSize && currentPage){
    postQuery
      .skip(pageSize * (currentPage-1))
      .limit(pageSize);
  }
  postQuery.then(documents=>{
    res.status(200).json({
      message : 'inventory min quanity items obtained  sucessfully',
      inventorys :documents
    });
  });
});


router.get("/abouttooutofstock",(req,res,next)=>{
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Inventory.find({$and: [
                                    { $expr: { $lte: [ { $toDouble: "$quantity" }, 500.0 ] }},
                                    { $expr: { $gte: [ { $toDouble: "$quantity" }, 1.0 ] }}
                                  ]});
  if(pageSize && currentPage){
    postQuery
      .skip(pageSize * (currentPage-1))
      .limit(pageSize);
  }
  postQuery.then(documents=>{
    res.status(200).json({
      message : 'inventory min quanity items obtained  sucessfully',
      inventorys :documents
    });
  });
});

router.get("/getExpired",(req,res,next)=>{
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  const postQuery = Inventory.find({expireDate:{$lte:new Date()}});
  if(pageSize && currentPage){
    postQuery
      .skip(pageSize * (currentPage-1))
      .limit(pageSize);
  }
  postQuery.then(documents=>{
    res.status(200).json({
      message : 'inventory added sucessfully',
      inventorys :documents
    });
  });
});

router.get("/getAboutToExpire",(req,res,next)=>{
  const pageSize = +req.query.pagesize;
  const currentPage = +req.query.page;
  var date = new Date();
  var date30 = new Date(date.getTime());
  date30.setDate(date30.getDate() + 30);

  const postQuery = Inventory.find({expireDate:{$lte:new Date(date30),$gte:new Date()}});
  if(pageSize && currentPage){
    postQuery
      .skip(pageSize * (currentPage-1))
      .limit(pageSize);
  }
  postQuery.then(documents=>{
    res.status(200).json({
      message : 'inventory added sucessfully',
      inventorys :documents
    });
  });
});


router.get("/:id",(req,res,next)=>{
  Inventory.findById(req.params.id).then(inventory =>{
    if(inventory){
      res.status(200).json(inventory);
    }else{
      res.status(200).json({message:'Inventory not found'});
    }
  });
});


router.delete("/:id", (req, res, next) => {
  Inventory.deleteOne({ _id: req.params.id }).then(result => {
    console.log(result);
    res.status(200).json({ message: 'Inventory deleted!' });
  });
});


router.post("/sendmail", (req, res) => {
  console.log("request came");
  let user = req.body;
  sendMail(user, info => {
    if (info && info.error) {
      return res.status(500).json({ message: "Failed to send email to supplier", error: info.message });
    }
    console.log(`The mail has been send 😃 and the id is ${info.messageId}`);
    res.send(info);
  });
});


async function sendMail(user, callback) {
  // reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "pharmacare.contactus@gmail.com",
      pass: "lalana1011294"
    }
  });

  let mailOptions = {
    from: '"pharmOS"<example.gmail.com>', // sender address
    to: user.email, // list of receivers
    subject: "Requesting New Drug Oder "+user.name, // Subject line
    html: `
    <head>
    <style>
      table {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }

      td, th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }

      tr:nth-child(even) {
        background-color: #dddddd;
      }
      </style>
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
      <script>

          $(function(){
            var results = [], row;
            $('#table1').find('th, td').each(function(){
                if(!this.previousElementSibling && typeof(this) != 'undefined'){ //New Row?
                    row = [];
                    results.push(row);
                }
                row.push(this.textContent || this.innerText); //Add the values (textContent is standard while innerText is not)
            });
            console.log(results);
        });

      </script>
      </head>

    <body>
    <h1>Dear Supplier </h1><br>
    <h3>Our current stock of ${user.name} has been expired</h3><br>
    <h2>So we (pharmOS Management would like to request ${user.quantityNumber} amount of units from ${user.name} )</h2><br>
    <h3>Please reply back if the this oder is verified.</h3>

    <h2>Purchase Oder </h2>

    <table id="table1">
      <tr>
        <th>Odered Drug Name</th>
        <th>Drug Quantity </th>
        <th>Requested Price per unit (EGP)</th>
      </tr>
      <tr>
        <td>${user.name}</td>
        <td>${user.quantityNumber}</td>
        <td>${user.price}</td>
      </tr>

    </table><br>

    <h3>Info* : </h3>
    <h4>If there is any issue reagrding the oder please be free to contact us or email us (pharmacare.contactus@gmail.com) 😃 </h4>
    </body>
    `
  };

  try {
    // send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);
    callback(info);
  } catch (err) {
    console.error("Nodemailer sendMail error:", err);
    callback({ error: true, message: err.message });
  }
}




router.post("/sendmailOutOfStock", (req, res) => {
  console.log("request came");
  let user = req.body;
  sendmailOutOfStock(user, info => {
    if (info && info.error) {
      return res.status(500).json({ message: "Failed to send email to supplier", error: info.message });
    }
    console.log(`The mail has been send 😃 and the id is ${info.messageId}`);
    res.send(info);
  });
});


async function sendmailOutOfStock(user, callback) {
  // reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "pharmacare.contactus@gmail.com",
      pass: "lalana1011294"
    }
  });

  let mailOptions = {
    from: '"pharmOS"<example.gmail.com>', // sender address
    to: user.email, // list of receivers
    subject: "Requesting New Drug Oder "+user.name, // Subject line
    html: `
    <head>
    <style>
      table {
        font-family: arial, sans-serif;
        border-collapse: collapse;
        width: 100%;
      }

      td, th {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }

      tr:nth-child(even) {
        background-color: #dddddd;
      }
      </style>
      <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js"></script>
      <script>

          $(function(){
            var results = [], row;
            $('#table1').find('th, td').each(function(){
                if(!this.previousElementSibling && typeof(this) != 'undefined'){ //New Row?
                    row = [];
                    results.push(row);
                }
                row.push(this.textContent || this.innerText); //Add the values (textContent is standard while innerText is not)
            });
            console.log(results);
        });

      </script>
      </head>

    <body>
    <h1>Dear Supplier </h1><br>
    <h3>Our current stock of ${user.name} has been finished/Out of stock</h3><br>
    <h2>So we (pharmOS Management would like to request ${user.quantityNumber} amount of units from ${user.name} )</h2><br>
    <h3>Please reply back if the this oder is verified.</h3>

    <h2>Purchase Oder </h2>

    <table id="table1">
      <tr>
        <th>Odered Drug Name</th>
        <th>Drug Quantity </th>
        <th>Requested Price per unit (EGP)</th>
      </tr>
      <tr>
        <td>${user.name}</td>
        <td>${user.quantityNumber}</td>
        <td>${user.price}</td>
      </tr>

    </table><br>

    <h3>Info* : </h3>
    <h4>If there is any issue reagrding the oder please be free to contact us or email us (pharmacare.contactus@gmail.com) 😃 </h4>
    </body>
    `
  };

  try {
    // send mail with defined transport object
    let info = await transporter.sendMail(mailOptions);
    callback(info);
  } catch (err) {
    console.error("Nodemailer sendmailOutOfStock error:", err);
    callback({ error: true, message: err.message });
  }
}

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

// Helper to fetch online CSV
function fetchCSVOnline() {
  return new Promise((resolve, reject) => {
    https.get('https://raw.githubusercontent.com/karem505/egyptian-drug-database/main/data/egyptian-drugs.csv', (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download online database: status code ${res.statusCode}`));
        return;
      }
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        resolve(rawData);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// 1. Check if backup exists
router.get("/check-backup/status", async (req, res) => {
  try {
    const count = await InventoryBackup.countDocuments({});
    res.status(200).json({ hasBackup: count > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Sync online database (fetching from karem505/egyptian-drug-database/main/data/egyptian-drugs.csv)
router.post("/sync-online", async (req, res) => {
  try {
    console.log("Fetching online CSV...");
    const csvData = await fetchCSVOnline();
    console.log("Successfully fetched CSV! Preparing backup...");

    // Backup current inventory to InventoryBackup
    const currentInventory = await Inventory.find({});
    await InventoryBackup.deleteMany({});
    if (currentInventory.length > 0) {
      await InventoryBackup.insertMany(currentInventory.map(item => ({
        email: item.email,
        name: item.name,
        quantity: item.quantity,
        batchId: item.batchId,
        expireDate: item.expireDate,
        price: item.price,
        barcode: item.barcode
      })));
      console.log(`Backed up ${currentInventory.length} current items.`);
    }

    // Clear active inventory
    await Inventory.deleteMany({});
    console.log("Cleared active inventory.");

    // Parse and import new drugs
    const lines = csvData.split(/\r?\n/);
    const batchSize = 1000;
    let batch = [];
    let totalInserted = 0;
    const today = new Date();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const values = parseCSVLine(line);
      if (values.length < 7) continue;

      const name = values[0]; // commercial_name_en
      const manufacturer = values[3] || 'UNKNOWN';
      const priceEGP = values[6] || '10';

      // Generate realistic quantities
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

      // Generate expiration dates
      let expireDate = new Date();
      const dateRand = Math.random();
      if (dateRand < 0.05) {
        expireDate.setMonth(today.getMonth() - Math.floor(Math.random() * 5 + 1));
      } else if (dateRand < 0.10) {
        expireDate.setDate(today.getDate() + Math.floor(Math.random() * 8 + 1));
      } else {
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
        batch = [];
      }
    }

    if (batch.length > 0) {
      await Inventory.insertMany(batch);
      totalInserted += batch.length;
    }

    console.log(`Database synchronization complete! Imported ${totalInserted} items successfully.`);
    res.status(200).json({
      message: `Database synchronization complete! Imported ${totalInserted} items successfully.`,
      inserted: totalInserted
    });
  } catch (err) {
    console.error("Sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Revert last database synchronization
router.post("/undo-sync", async (req, res) => {
  try {
    const backupCount = await InventoryBackup.countDocuments({});
    if (backupCount === 0) {
      return res.status(400).json({ message: "No sync backup available to undo." });
    }

    // Revert inventory
    await Inventory.deleteMany({});
    const backupItems = await InventoryBackup.find({});
    await Inventory.insertMany(backupItems.map(item => ({
      email: item.email,
      name: item.name,
      quantity: item.quantity,
      batchId: item.batchId,
      expireDate: item.expireDate,
      price: item.price,
      barcode: item.barcode
    })));

    // Clear backup
    await InventoryBackup.deleteMany({});
    console.log("Sync successfully undone and backup cleared.");
    res.status(200).json({ message: "Synchronization successfully undone. Previous database state has been restored." });
  } catch (err) {
    console.error("Undo sync error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
