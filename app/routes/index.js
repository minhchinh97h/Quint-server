const router = require("express").Router();

const auth = require("./auth");
const users = require("./users");
const pushNotifications = require("./pushNotifications");
router.use("/auth", auth);
router.use("/users", users);
router.use("/notifications", pushNotifications);
router.get("/", (req, res) => {
  res.send("This is a response.");
});

module.exports = router;
