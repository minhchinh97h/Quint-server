'use strict'

const router = require("express").Router()
const firebase_admin = require("firebase-admin")
const crypto_random_string = require("crypto-random-string")
const path = require("path")

const {
    _validateEmail,
    _validatePassword,
    _sendVerificationEmail,
    _createUserAuth,
    _setVerificationTokenBelongedToUser,
    _getVerificationTokenBelongedToUser,
    _deleteVerificationTokenBelongedToUser,
    _createUserDatabase,
    _updateVerifiedUserAuth,
    _deleteUserAuth,
    _getUserAuth
} = require("../actions/auth")

// Sign in, Sign up
router.post("/", async(req, res) => {
    let { action } = req.query, { body } = req

    if (action === "signin") {

    }

    /* SIGN UP PROCESS */
    else if (action === "signup") {
        const { email, password } = body

        let _check_if_email_ok = _validateEmail(email),
            _check_if_password_ok = _validatePassword(password)

        if (_check_if_email_ok && _check_if_password_ok) {
            // We create the user data in the Firebase's authentication userpool
            let [create_user_record_response, create_user_record_error] = await _createUserAuth(email, password)

            // Handle error
            if (create_user_record_error) {
                res.send(create_user_record_error)
                return
            }

            let new_user_uuid = create_user_record_response.uid

            // Create a new verification token for verifying user's email
            let token = crypto_random_string({ length: 10, type: "url-safe" })

            // We set the newly created token to the database, linked with user's email
            let [set_token_to_db_response, set_token_to_db_error] = await _setVerificationTokenBelongedToUser(new_user_uuid, token)

            // Handle error
            if (set_token_to_db_error) {
                res.send(set_token_to_db_error)
                return
            }

            // Send the verification email to user's mailbox, with the link including query string of email and token
            let [send_verfication_email_response, send_verification_email_error] = await _sendVerificationEmail(email, new_user_uuid, token)

            // Handle error
            if (send_verification_email_error) {
                res.send(send_verification_email_error)
                return
            }

            // If everything works out
            res.status(200).send({ msg: "Verification mail sent" })
        }

        // If email or password is invalid, send 400 - bad request.
        else {
            res.status(400).send("Invalid email or password.")
        }

        return
    }
    /* END OF SIGN UP PROCESS */

    res.status(400).json("Bad Request")
})

router.get("/", async(req, res) => {
    /* VERIFYING EMAIL PROCESS */
    // Query string: ?email=test@domain.com&id=wyr2938o&token=yuqiweoha-dsafj213 for verifying email request
    let { email, id, token } = req.query

    // If the request handles the verfication of registering email.
    if (email && id && token) {
        let [get_verification_token_response, get_verification_token_error] = await _getVerificationTokenBelongedToUser(id)

        if (get_verification_token_error) {
            res.send(get_verification_token_error)
            return
        }

        // Check if the token is latest
        if (get_verification_token_response.data()) {
            if (token === get_verification_token_response.data().token) {
                let token_created_at = get_verification_token_response.data().createdAt,
                    now = Date.now(),
                    expire_time = 24 * 60 * 60 * 1000 // 24 hours

                // If the token is not expired, server verifies the account
                if ((now - token_created_at) < expire_time) {

                    // Server will create the user's doc into database
                    let [create_user_db_response, create_user_db_error] = await _createUserDatabase(id, email)

                    // If the server cannot create user, send back error
                    if (create_user_db_error) {
                        res.send(create_user_db_error)
                        return
                    }

                    // Server deletes the verfication token in db as the email has been verified
                    let [delete_verification_token_data_response, delete_verification_token_data_error] = await _deleteVerificationTokenBelongedToUser(id)

                    // The deletion of token could be error due to several issues, but it isn't a matter.
                    // We still send the verfied link to user and cron job will schedule a job to wipe out
                    // redundant tokens.

                    if (delete_verification_token_data_error) {
                        throw new Error(delete_verification_token_data_error)
                    }

                    let [update_verified_user_auth_response, update_verified_user_auth_error] = await _updateVerifiedUserAuth(id)

                    if (update_verified_user_auth_error) {
                        res.send(update_verified_user_auth_error)
                        return
                    }

                    // If everything works fine, we send the link saying verified.
                    res.sendFile(path.join(__dirname, "../public/html/verification-page/index.html"))
                }

                // If the token is expired, server will send a notified page that says the link is expired.
                // The account associated with the expired token has not been verified, server will delete it from
                // authentication's userpool
                else {
                    // Server deletes the verfication token in db as the email has been verified
                    let [delete_verification_token_data_response, delete_verification_token_data_error] = await _deleteVerificationTokenBelongedToUser(id)

                    if (delete_verification_token_data_error) {
                        throw new Error(delete_verification_token_data_error)
                    }

                    // Server will then delete the associated account, which of course has not been verified
                    let [delete_user_auth_response, delete_user_auth_error] = await _deleteUserAuth(id)

                    if (delete_user_auth_error) {
                        res.send(delete_user_auth_error)
                    }

                    // Sending expiry-informed link.
                    res.sendFile(path.join(__dirname, "../public/html/expired-verification-page/index.html"))
                }

            }

            // If the token is not the latest, it means the server must have deleted the stored data of it.
            else {
                res.status(400).json({ msg: "Invalid token." })
            }
        }

        // There is 2 cases if there is no data for token in the db
        // 1. It means the token has been wiped out because of expiry, server will 
        // delete associated user account in the auth's userpool.

        // 2. It means the token has been wiped out because of the verification action as
        // the account is verified successfully. Server will response a link saying your email has been verified.
        else {
            // We need to get user's data from auth's userpool to determine whether the account is verified.
            let [get_user_auth_response, get_user_auth_error] = await _getUserAuth(id)

            if (get_user_auth_error) {
                res.send(get_user_auth_error)
                return
            }

            let email_verified = get_user_auth_response.emailVerified

            // If the account is verified by email
            if (email_verified) {
                res.sendFile(path.join(__dirname, "../public/html/verification-page/index.html"))
            }
            // If not
            else {
                // Server will then delete the associated account if it exists, which of course has not been verified
                let [delete_user_auth_response, delete_user_auth_error] = await _deleteUserAuth(id)

                if (delete_user_auth_error) {
                    res.send(delete_user_auth_error)
                    return
                }

                // Sending expiry-informed link.
                res.sendFile(path.join(__dirname, "../public/html/expired-verification-page/index.html"))
            }
        }
        return
    }
    /* END OF VERIFYING EMAIL PROCESS */

    // Handle other requests

    res.status(400).json("Bad Request")
})

module.exports = router