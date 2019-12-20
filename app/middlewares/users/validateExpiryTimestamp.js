const HELPERS = require("../../helpers");
const ACTIONS = require("../../actions");

const _validateExpiryTimestamp = async (req, res, next) => {
    const {uuid} = req.body

    let [get_user_response, get_user_error] = await HELPERS.promise._handlePromise(ACTIONS.users._getUser(uuid))

    if(get_user_error){
        res.send(get_user_error)
        return
    }

    let expiry_timestamp = get_user_response.data().expiryTimestamp

    // If expiry timestamp is past date, meaning the account is no longer a premium account
    if(expiry_timestamp < Date.now()){
        // Update user document
        let update_data = {
            uuid,
            "package.plan": "free"
        }
        let [update_user_response, update_user_error] = await HELPERS.promise._handlePromise(ACTIONS.users._updateUser(update_data))

        if(update_user_error){
            res.send(update_user_error)
            return
        }

        res.status(200).send("Change to free plan.")
        return
    }

    res.status(200).send("OK")
    return
}

module.exports = [_validateExpiryTimestamp]