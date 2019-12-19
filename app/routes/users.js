const express = require("express");
const router = express.Router();
const MIDDLEWARES = require("../middlewares/index");

router.post("/", (req, res, next) => {
  const {action} = req.query

  if(action === "validateExpiryTimestamp"){
    next()
  } else{
    res.status(400).send("Bad Request.")
  }
}, MIDDLEWARES.users.validateExpiryTimestampMDW);

module.exports = router;
