const express = require("express");
const router = express.Router();
const MIDDLEWARES = require("../middlewares/index");

router.post(
  "/",
  (req, res, next) => {
    const { action } = req.query;

    if (action === "verifyReceipt") {
      next();
    } else if (action === "validateSubscription") {
      next("route");
    } else {
        res.status(400).send("Bad Request.")
    }
  },
  MIDDLEWARES.payments.validateReceiptMDW
);

router.post("/", (req, res, next) => {
    next()
}, MIDDLEWARES.payments.validateSubscriptionMDW)

module.exports = router;
