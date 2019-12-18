const axios = require("axios")

const _sendReceivedReceiptData =  (data) => {
    return axios({
        method: "post",
        data
    })
}

module.exports = {
    _sendReceivedReceiptData
}