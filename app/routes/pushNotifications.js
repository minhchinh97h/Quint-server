const router = require("express").Router();
const path = require("path");
const { Expo } = require("expo-server-sdk");
const expoClient = new Expo();

const { _setPushTokenDB } = require("../actions/pushNotifications");

// Record expo push token into database for each user.
router.post("/", async (req, res) => {
  let { body } = req;

  let [
    set_push_token_db_response,
    set_push_token_db_error
  ] = await _setPushTokenDB(body.token);

  if (set_push_token_db_error) {
    res.send(set_push_token_db_error);
    return;
  }
});

module.exports = router;
