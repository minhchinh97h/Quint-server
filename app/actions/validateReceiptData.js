const axios = require("axios")

const _sendReceivedReceiptData =  (data) => {
    return axios({
        method: "post",
        url: process.env.APPLE_VERIFY_RECEIPT_ENDPOINT,
        data
    })
}

module.exports = {
    _sendReceivedReceiptData
}