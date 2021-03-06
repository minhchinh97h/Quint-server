const HELPERS = require("../../helpers");
const ACTIONS = require("../../actions");

const _validateSubscription = async (req, res, next) => {
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

  if (status === 0) {
    const {
      latest_receipt,
      latest_receipt_info
    } = send_receipt_data_response.data;
    const { expires_date_ms } = latest_receipt_info[
      latest_receipt_info.length - 1
    ];

    // Check if the subscription's expiration time is past date
    const current_ms = Date.now();

    // If past date, we update user document
    if (expires_date_ms < current_ms) {

      let update_data = {
        uuid,
        "package.billed": false
      };

      let [
        update_user_response,
        update_user_error
      ] = await HELPERS.promise._handlePromise(
        ACTIONS.users._updateUser(update_data)
      );

      if (update_user_error) {
        res.send(update_user_error);
        return;
      }

      res.status(200).send("Subscription expires.");
      return;
    }


    // If it is not expired, we update the latest renewal timestamp
    let update_data = {
      uuid,
      "package.renewalTimestamp": expires_date_ms
    };

    let [
      update_user_response,
      update_user_error
    ] = await HELPERS.promise._handlePromise(
      ACTIONS.users._updateUser(update_data)
    );

    if (update_user_error) {
      res.send(update_user_error);
      return;
    }

    res.status(200).send("OK");
    return;
  } else {
    res.status(500).send("Cannot validate subscription.");
    return;
  }
};

module.exports = [_validateSubscription];
