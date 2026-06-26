const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const Shift = require('../models/shift');
const CashRegister = require('../models/cashRegister');
const Sales = require('../models/sales');

// Check if user has an active open shift
router.get("/active", checkAuth, (req, res, next) => {
  Shift.findOne({ cashierEmail: req.userData.email, status: 'OPEN' })
    .then(activeShift => {
      if (!activeShift) {
        return res.status(200).json({
          message: "No active shift",
          active: false,
          shift: null
        });
      }
      res.status(200).json({
        message: "Active shift found",
        active: true,
        shift: activeShift
      });
    })
    .catch(err => {
      res.status(500).json({ message: "Error checking shift status", error: err.message });
    });
});

// Open a new shift
router.post("/open", checkAuth, async (req, res, next) => {
  try {
    // ponytail: one shift at a time, system-wide
    const activeShift = await Shift.findOne({ status: 'OPEN' });
    if (activeShift) {
      return res.status(400).json({ message: `A shift is already open (by ${activeShift.cashierEmail}). Close it first.` });
    }

    const openingFloat = (
      parseInt(req.body.notes200 || 0) * 200 +
      parseInt(req.body.notes100 || 0) * 100 +
      parseInt(req.body.notes50 || 0) * 50 +
      parseInt(req.body.notes20 || 0) * 20 +
      parseInt(req.body.notes10 || 0) * 10 +
      parseInt(req.body.notes5 || 0) * 5 +
      parseInt(req.body.notes1 || 0) * 1
    );

    const shift = new Shift({
      cashierEmail: req.userData.email,
      openingFloat: openingFloat,
      openingNotes: {
        notes200: parseInt(req.body.notes200 || 0),
        notes100: parseInt(req.body.notes100 || 0),
        notes50: parseInt(req.body.notes50 || 0),
        notes20: parseInt(req.body.notes20 || 0),
        notes10: parseInt(req.body.notes10 || 0),
        notes5: parseInt(req.body.notes5 || 0),
        notes1: parseInt(req.body.notes1 || 0)
      },
      status: 'OPEN'
    });

    const savedShift = await shift.save();

    // Sync Cash Register state to match verified opening counts
    let register = await CashRegister.findOne();
    if (!register) {
      register = new CashRegister();
    }
    register.notes200 = parseInt(req.body.notes200 || 0);
    register.notes100 = parseInt(req.body.notes100 || 0);
    register.notes50 = parseInt(req.body.notes50 || 0);
    register.notes20 = parseInt(req.body.notes20 || 0);
    register.notes10 = parseInt(req.body.notes10 || 0);
    register.notes5 = parseInt(req.body.notes5 || 0);
    register.notes1 = parseInt(req.body.notes1 || 0);
    register.totalAmount = openingFloat;
    register.lastUpdated = new Date();
    await register.save();

    res.status(201).json({
      message: "Shift opened successfully",
      shift: savedShift
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to open shift", error: err.message });
  }
});

// Close active shift
router.post("/close", checkAuth, async (req, res, next) => {
  try {
    const activeShift = await Shift.findOne({ cashierEmail: req.userData.email, status: 'OPEN' });
    if (!activeShift) {
      return res.status(400).json({ message: "No active shift found to close" });
    }

    // Retrieve sales during shift
    const sales = await Sales.find({
      dateTime: { $gte: activeShift.startTime }
    });

    let salesCount = sales.length;
    let salesTotal = 0;
    sales.forEach(s => {
      salesTotal += parseFloat(s.totalPrice || 0);
    });

    const expectedClosingFloat = activeShift.openingFloat + salesTotal;

    const closingFloat = (
      parseInt(req.body.notes200 || 0) * 200 +
      parseInt(req.body.notes100 || 0) * 100 +
      parseInt(req.body.notes50 || 0) * 50 +
      parseInt(req.body.notes20 || 0) * 20 +
      parseInt(req.body.notes10 || 0) * 10 +
      parseInt(req.body.notes5 || 0) * 5 +
      parseInt(req.body.notes1 || 0) * 1
    );

    activeShift.endTime = new Date();
    activeShift.closingFloat = closingFloat;
    activeShift.closingNotes = {
      notes200: parseInt(req.body.notes200 || 0),
      notes100: parseInt(req.body.notes100 || 0),
      notes50: parseInt(req.body.notes50 || 0),
      notes20: parseInt(req.body.notes20 || 0),
      notes10: parseInt(req.body.notes10 || 0),
      notes5: parseInt(req.body.notes5 || 0),
      notes1: parseInt(req.body.notes1 || 0)
    };
    activeShift.expectedClosingFloat = expectedClosingFloat;
    activeShift.status = 'CLOSED';
    activeShift.salesCount = salesCount;
    activeShift.salesTotal = salesTotal;

    const closedShift = await activeShift.save();

    // Sync Cash Register state to match closing notes count
    let register = await CashRegister.findOne();
    if (!register) {
      register = new CashRegister();
    }
    register.notes200 = parseInt(req.body.notes200 || 0);
    register.notes100 = parseInt(req.body.notes100 || 0);
    register.notes50 = parseInt(req.body.notes50 || 0);
    register.notes20 = parseInt(req.body.notes20 || 0);
    register.notes10 = parseInt(req.body.notes10 || 0);
    register.notes5 = parseInt(req.body.notes5 || 0);
    register.notes1 = parseInt(req.body.notes1 || 0);
    register.totalAmount = closingFloat;
    register.lastUpdated = new Date();
    await register.save();

    res.status(200).json({
      message: "Shift closed successfully",
      shift: closedShift
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to close shift", error: err.message });
  }
});

// Retrieve past shifts history
router.get("", checkAuth, (req, res, next) => {
  Shift.find().sort({ startTime: -1 })
    .then(shifts => {
      res.status(200).json({
        message: "Shifts retrieved successfully",
        shifts: shifts
      });
    })
    .catch(err => {
      res.status(500).json({ message: "Failed to retrieve shifts", error: err.message });
    });
});

module.exports = router;
