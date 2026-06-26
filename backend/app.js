const path  =require("path");
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const supplierRoutes = require('./routes/supplier');
const inventoryRoutes = require('./routes/inventory');
const userRoutes = require('./routes/user');
const salesRoutes = require('./routes/sales');
const doctorUserRoutes = require('./routes/doctorUser');
const doctorOderRoutes = require('./routes/doctorOders');
const verifiedDoctorOderRoutes = require('./routes/verifiedDoctorOder');
const pickedUpOdersRoutes = require('./routes/pickedUpOders');
const cashRegisterRoutes = require('./routes/cashRegister');
const shiftRoutes = require('./routes/shifts');



const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pharmacy';
console.log('Connecting to database at:', dbUri.replace(/\/\/([^:]+):[^@]+@/, '//***:***@'));
mongoose.connect(dbUri)
  .then(()=>{
    console.log('connected to database!');
    const CashRegister = require('./models/cashRegister');
    CashRegister.findOne().then(doc => {
      if (!doc) {
        const newRegister = new CashRegister();
        newRegister.save().then(() => console.log('Cash register seeded with default float EGP 6000!'));
      }
    });

    // Seed default Admin user if it does not exist
    const User = require('./models/user');
    const bcrypt = require('bcryptjs');
    User.findOne({ email: 'admin@pharmos.com' }).then(async user => {
      if (!user) {
        const hashedPassword = await bcrypt.hash('123', 10);
        const adminUser = new User({
          name: 'Admin User',
          contact: '1234567890',
          nic: '123456789V',
          email: 'admin@pharmos.com',
          password: hashedPassword,
          role: 'Pharmacist'
        });
        adminUser.save().then(() => console.log('Default Admin user seeded successfully with password 123!'));
      }
    });
  })
  .catch((err)=>{
    console.error('connection failed!', err);
  });

//OJx2X4IllVNl9up4


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/images" , express.static(path.join(__dirname, "images")));


app.use((req,res,next)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With ,Content-Type,Authorization ,Accept",
    "HTTP/1.1 200 OK",
    "append,delete,entries,foreach,get,has,keys,set,values,Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PATCH,DELETE,OPTIONS,PUT"
  );
  next();
});


app.use("/api/supplier",supplierRoutes);
app.use("/api/inventory",inventoryRoutes);
app.use("/api/user",userRoutes);
app.use("/api/sales",salesRoutes);
app.use("/api/doctorUser",doctorUserRoutes);
app.use("/api/doctorOder",doctorOderRoutes);
app.use("/api/verifiedDoctorOder",verifiedDoctorOderRoutes);
app.use("/api/pickedUpOders",pickedUpOdersRoutes);
app.use("/api/cash-register",cashRegisterRoutes);
app.use("/api/shifts",shiftRoutes);

module.exports = app;
