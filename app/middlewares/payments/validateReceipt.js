const HELPERS = require("../../helpers");
const ACTIONS = require("../../actions");
const firebase_admin = require("firebase-admin");

const _validateReceiptData = async (req, res, next) => {
  const { receipt_data, uuid } = req.body;

  let sending_data = {};

  sending_data["receipt-data"] = receipt_data;
  sending_data["password"] = process.env.IOS_APP_SHARE_SECRET;
  sending_data["exclude-old-transactions"] = true;

  const [
    send_receipt_data_response,
    send_receipt_data_error
  ] = await HELPERS.promise._handlePromise(
    ACTIONS.validateReceiptData._sendReceivedReceiptData(sending_data)
  );

  if (send_receipt_data_error) {
    res.send(send_receipt_data_error);
    return;
  }

  const { status } = send_receipt_data_response.data;

  console.log(status)

  if (status === 1) {
      console.log("here status === 1")
    // update user document in DB with latest_receipt
    const {
      latest_receipt,
      latest_receipt_info
    } = send_receipt_data_response.data;
    const { expires_date_ms } = latest_receipt_info[
      latest_receipt_info.length - 1
    ];

    // Check if the subscription's expiration time is past date
    const current_ms = Date.now();
    // If past date, we don't proceed
    if (expires_date_ms < current_ms) {
      res.send("Subscription expires");
      return;
    }

    console.log("here expires_date_ms > current_ms ", expires_date_ms)

    // If it isn't past date, we add one more month into user's expiryTimestamp and update its package property
    let update_data = {
      uuid,
      expiryTimestamp: firebase_admin.firestore.FieldValue.increment(
        30 * 24 * 60 * 60 * 1000
      ),
      "package.billed": true,
      "package.plan": "premium",
      "package.renewalTimestamp": expires_date_ms
    };
    let [
      update_user_db_response,
      update_user_db_error
    ] = await HELPERS.promise._handlePromise(
      ACTIONS.users._updateUser(update_data)
    );

    if (update_user_db_error) {
      res.send(update_user_db_error);
      return;
    }

    res.status(200).send("OK");
    return;
  } else {
    res.status(500).send("Cannot process payment");
    return;
  }
};

module.exports = [_validateReceiptData];
