const HELPERS = require("../../helpers");
const ACTIONS = require("../../actions");

const _validateReceiptData = async (req, res, next) => {
    const {receipt_data} = req.body

    let sending_data = {}

    sending_data["receipt-data"] = receipt_data
    sending_data["password"] = process.env.IOS_APP_SHARE_SECRET
    sending_data["exclude-old-transactions"] = true

    const [send_receipt_data_response, send_receipt_data_error] = await HELPERS.promise._handlePromise(ACTIONS.validateReceiptData._sendReceivedReceiptData(sending_data))

    if(send_receipt_data_error){
        res.send(send_receipt_data_error)
        return
    }
    console.log(send_receipt_data_response)
    res.send(send_receipt_data_response)
}

module.exports = [_validateReceiptData]