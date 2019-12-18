const express = require("express");
const router = express.Router();
const MIDDLEWARES = require("../middlewares/index");
const path = require("path");

router.use("/static", express.static(path.join(__dirname, "../public")));

// Differentiate actions
router.post("/", (req, res, next) => {
  const { action } = req.query;
  if (action === "signup") {
    next("route");
  }
});

// Handle Sign Up
router.post(
  "/",
  (req, res, next) => {
    next();
  },
  MIDDLEWARES.auth.signUp._handeSignUpProcessMDW
);

// Differentiate actions
router.get("/", (req, res, next) => {
  const { action } = req.query;
  if (action === "verify") {
    next("route");
  }
});

router.get(
  "/",
  (req, res, next) => {
    next();
  },
  MIDDLEWARES.auth.signUp._handleVerifyEmailMDW
);

module.exports = router;
