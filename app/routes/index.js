const router = require("express").Router();

const auth = require("./auth");
const users = require("./users");
const pushNotifications = require("./pushNotifications");
const payments = require("./payments")
router.use("/auth", auth);
router.use("/users", users);
router.use("/notifications", pushNotifications);
router.use("/payments", payments)
router.get("/", (req, res) => {
  res.send("This is a response.");
});

module.exports = router;
