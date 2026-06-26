const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");
const CashRegister = require('../models/cashRegister');

// Get current state of the cash drawer
router.get("", checkAuth, (req, res, next) => {
  CashRegister.findOne().then(register => {
    if (!register) {
      // Return a default if somehow not initialized
      const defaultReg = new CashRegister();
      return defaultReg.save().then(saved => {
        res.status(200).json({
          message: "Default cash register initialized and retrieved",
          register: saved
        });
      });
    }
    res.status(200).json({
      message: "Register retrieved successfully",
      register: register
    });
  }).catch(err => {
    res.status(500).json({ message: "Failed to retrieve register", error: err });
  });
});

// Adjust the cash drawer note counts manually (manager override/float reset)
router.put("/adjust", checkAuth, (req, res, next) => {
  CashRegister.findOne().then(register => {
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

    register.totalAmount = (
      register.notes200 * 200 +
      register.notes100 * 100 +
      register.notes50 * 50 +
      register.notes20 * 20 +
      register.notes10 * 10 +
      register.notes5 * 5 +
      register.notes1 * 1
    );
    register.lastUpdated = new Date();

    register.save().then(saved => {
      res.status(200).json({
        message: "Register adjusted successfully",
        register: saved
      });
    });
  }).catch(err => {
    res.status(500).json({ message: "Failed to adjust register", error: err });
  });
});

module.exports = router;
