const express = require("express");
const router = express.Router();
const checkAuth = require("../middleware/check-auth");

const Sales = require('../models/sales');

const CashRegister = require('../models/cashRegister');

router.post("", async (req,res,next)=>{
  try {
    const sales = new Sales({
      drugName: req.body.drugName,
      totalPrice: req.body.totalPrice,
      tax: req.body.tax,
      paidAmount: req.body.paidAmount,
      balance: req.body.balance
    });

    const createdSales = await sales.save();

    let changeNotes = { "200": 0, "100": 0, "50": 0, "20": 0, "10": 0, "5": 0, "1": 0 };

    // Update Cash Register drawer state if banknote breakdown was provided
    if (req.body.receivedNotes) {
      let register = await CashRegister.findOne();
      if (!register) {
        register = new CashRegister();
      }

      // 1. Add all received banknotes to the drawer
      const denoms = ['200', '100', '50', '20', '10', '5', '1'];
      denoms.forEach(denom => {
        const receivedCount = parseInt(req.body.receivedNotes[denom] || 0);
        register[`notes${denom}`] += receivedCount;
      });

      // 2. Calculate optimal change notes to give back using a smart two-pass greedy algorithm
      const balanceAmount = Math.round(parseFloat(req.body.balance || 0));
      let remainingChange = balanceAmount;

      const denomNumbers = [200, 100, 50, 20, 10, 5, 1];
      
      // Pass 1: Try to use what is actually available in the register (constrained by current counts)
      for (const d of denomNumbers) {
        if (remainingChange >= d) {
          const maxNeeded = Math.floor(remainingChange / d);
          const maxAvailable = Math.max(0, register[`notes${d}`] || 0);
          const actualTake = Math.min(maxNeeded, maxAvailable);

          if (actualTake > 0) {
            register[`notes${d}`] -= actualTake;
            changeNotes[d.toString()] = actualTake;
            remainingChange -= actualTake * d;
          }
        }
      }

      // Pass 2: For any remaining change, try to use the highest possible banknotes (borrow/go negative)
      if (remainingChange > 0) {
        for (const d of denomNumbers) {
          if (remainingChange >= d) {
            const take = Math.floor(remainingChange / d);
            register[`notes${d}`] -= take;
            changeNotes[d.toString()] = (changeNotes[d.toString()] || 0) + take;
            remainingChange -= take * d;
          }
        }
      }

      // 4. Update the total register amount float
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

      await register.save();
    }

    res.status(201).json({
      message: 'Sales Added Successfully',
      salesId: createdSales._id,
      changeNotes: changeNotes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/getSalesChartInfo",(req,res,next)=>{
  Sales.aggregate([
    { "$project": {
      "totalPrice": 1,
      "month": { "$month": "$dateTime" }
    }},
    { "$group": {
      "_id": "$month",
      "total": { "$sum": { $toDouble: "$totalPrice" }}
    }}
  ])
  .then(documents=>{
    res.status(200).json({
      message : 'sales chart details obtained successfully',
      sales :documents
    });
  })
  .catch(err => {
    res.status(500).json({ error: err.message });
  });
});

  router.get("",(req,res,next)=>{
    Sales.find().then(documents=>{
      res.status(200).json({
        message : 'sales added sucessfully',
        sales :documents
      });
    });
  });

  module.exports = router;
