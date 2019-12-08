const router = require("express").Router();
const crypto_random_string = require("crypto-random-string");
const path = require("path");

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
  _getUserAuth,
  _getUserAuthByEmail,
  _createReferralCodeDatabase,
  _deleteReferralCodeDatabaseWithUuid,
  _getUsedReferralCode
} = require("../actions/auth");

const {
  _handlePromiseAll,
  _handlePromise
} = require("../helpers/handle_promises");

// Sign in, Sign up
router.post("/", async (req, res) => {
  let { action } = req.query,
    { body } = req;

  if (action === "signin") {
  } else if (action === "signup") {
    /* SIGN UP PROCESS */
    const { email, password, used_referral_code } = body;

    let _check_if_email_ok = _validateEmail(email),
      _check_if_password_ok = _validatePassword(password);

    if (_check_if_email_ok && _check_if_password_ok) {
      // We check if the user exists in userpool. if not, we will create one.
      // (only create if the emailVerified property is false)
      let [
        get_user_auth_by_email_response,
        get_user_auth_by_email_error
      ] = await _handlePromise(_getUserAuthByEmail(email));

      let new_user_uuid;

      // If the user doens't exist, create one.
      if (!get_user_auth_by_email_response) {
        // We create the user data in the Firebase's authentication userpool
        let [
          create_user_record_response,
          create_user_record_error
        ] = await _handlePromise(_createUserAuth(email, password));

        // Handle error
        if (create_user_record_error) {
          res.send(create_user_record_error);
          return;
        }

        new_user_uuid = create_user_record_response.uid;
      }
      // If the user exists, check if its emailVerified property is false.
      else {
        // If true, we send back error the email exists.
        if (get_user_auth_by_email_response.emailVerified) {
          res.status(409).json({ msg: "email already exists." });
          return;
        }

        // If false, we continue
        else {
          new_user_uuid = get_user_auth_by_email_response.uid;
        }
      }

      // Create a new verification token for verifying user's email
      let token = crypto_random_string({ length: 10, type: "url-safe" });

      let promises = [
        // We set the newly created token to the database, linked with user's email
        _setVerificationTokenBelongedToUser(
          new_user_uuid,
          token,
          email,
          used_referral_code
        ).catch(err => {
          res.send(err);
          return;
        }),
        // Send the verification email to user's mailbox, with the link including query string of email and token
        _sendVerificationEmail(email, new_user_uuid, token).catch(err => {
          res.send(err);
          return;
        })
      ];

      let [promise_all_responses, promise_all_error] = await _handlePromiseAll(
        promises
      );

      if (promise_all_error) {
        res.send(promise_all_error);
        return;
      }

      // If everything works out
      res.status(200).send({
        msg: "Verification mail sent",
        uuid: new_user_uuid,
        createdAt: Date.now()
      });
    }

    // If email or password is invalid, send 400 - bad request.
    else {
      res.status(400).send("Invalid email or password.");
    }

    return;
  }
  /* END OF SIGN UP PROCESS */

  res.status(400).json("Bad Request");
});

router.get("/", async (req, res) => {
  /* VERIFYING EMAIL PROCESS */
  // Query string: ?email=test@domain.com&id=wyr2938o&token=yuqiweoha-dsafj213 for verifying email request
  let { email, id, token } = req.query;

  // If the request handles the verfication of registering email.
  if (email && id && token) {
    let [
      get_verification_token_response,
      get_verification_token_error
    ] = await _handlePromise(_getVerificationTokenBelongedToUser(id));

    if (get_verification_token_error) {
      res.send(get_verification_token_error);
      return;
    }

    // Check if the token is latest
    if (get_verification_token_response.data()) {
      if (
        token === get_verification_token_response.data().value &&
        email === get_verification_token_response.data().email
      ) {
        // Retrieve the used referral code of the new account
        let used_referral_code = get_verification_token_response.data()
          .usedReferralCode;

        // Check if the used referral code exists in db
        let [
          get_used_referral_code_response,
          get_used_referral_code_error
        ] = await _handlePromise(_getUsedReferralCode(used_referral_code));

        let used_referral_code_bound_uuid = "";

        // If it exists, we get the bound uuid to add into user db.
        // A valid referral benefit will be granted only the user has 2 match properties: boundUuid and value of usedReferralCodeData
        if (get_used_referral_code_response) {
          if (get_used_referral_code_response.data()) {
            used_referral_code_bound_uuid = get_used_referral_code_response.data()
              .uuid;
          }
        }

        let token_created_at = get_verification_token_response.data().createdAt,
          now = Date.now(),
          expire_time = 24 * 60 * 60 * 1000; // 24 hours
        // expire_time = 5 * 1000; // 5 seconds

        // If the token is not expired, server verifies the account
        if (now - token_created_at < expire_time) {
          //Server generates a new referral code for user
          let referral_code = crypto_random_string({
            length: 6,
            characters:
              "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          });

          let promises = [
            // Server add generated referral code to db
            _createReferralCodeDatabase(id, referral_code).catch(err => {
              res.send(err);
              return;
            }),
            // Deletes the verfication token's data as it is no-need
            _deleteVerificationTokenBelongedToUser(id).catch(err => {
              // To do when catch err
            }),
            // Updates status of user in userpool (verfied email)
            _updateVerifiedUserAuth(id).catch(err => {
              res.send(err);
              return;
            }),
            // Create user document in users collection
            _createUserDatabase(
              id,
              email,
              referral_code,
              used_referral_code,
              used_referral_code_bound_uuid
            ).catch(err => {
              res.send(err);
              return;
            })
          ];

          let [
            promise_all_responses,
            promise_all_error
          ] = await _handlePromiseAll(promises);

          if (promise_all_error) {
            res.send(promise_all_error);
            return;
          }

          // If everything works fine, we send the link saying verified.
          res.sendFile(
            path.join(__dirname, "../public/html/verification-page/index.html")
          );
        }

        // If the token is expired, server will send a notified page that says the link is expired.
        else {
          let promises = [
            // Server deletes the verfication token in db as the email has been verified
            _deleteVerificationTokenBelongedToUser(id).catch(err => {
              // To do when catch err
            }),
            // Server will then delete the associated account, which of course has not been verified
            _deleteUserAuth(id).catch(err => {
              res.send(delete_user_auth_error);
              return;
            }),

            // Delete referral codes that are bound with uuid (Just to make sure that there are no unbound referral code)
            _deleteReferralCodeDatabaseWithUuid(id).catch(err => {
              res.send(delete_user_auth_error);
              return;
            })
          ];

          let [
            promise_all_responses,
            promise_all_error
          ] = await _handlePromiseAll(promises);

          if (promise_all_error) {
            res.send(promise_all_error);
            return;
          }

          // Sending expiry-informed link.
          res.sendFile(
            path.join(
              __dirname,
              "../public/html/expired-verification-page/index.html"
            )
          );
        }
      }

      // If the token is not the latest, it means the server must have deleted the stored data of it.
      else {
        res.status(400).json({ msg: "Invalid request." });
      }
    }

    // There is 2 cases if there is no data for token in the db
    // 1. It means the token has been wiped out because of expiry, server will
    // delete associated user account in the auth's userpool.

    // 2. It means the token has been wiped out because of the verification action as
    // the account is verified successfully. Server will response a link saying your email has been verified.
    else {
      // We need to get user's data from auth's userpool to determine whether the account is verified.
      let [get_user_auth_response, get_user_auth_error] = await _handlePromise(
        _getUserAuth(id)
      );

      if (get_user_auth_error) {
        res.send(get_user_auth_error);
        return;
      }

      let email_verified = get_user_auth_response.emailVerified;

      // If the account is verified by email
      if (email_verified) {
        res.sendFile(
          path.join(__dirname, "../public/html/verification-page/index.html")
        );
      }
      // If not
      else {
        // Server will then delete the associated account if it exists, which of course has not been verified
        let [
          delete_user_auth_response,
          delete_user_auth_error
        ] = await _handlePromise(_deleteUserAuth(id));

        if (delete_user_auth_error) {
          res.send(delete_user_auth_error);
          return;
        }

        // Sending expiry-informed link.
        res.sendFile(
          path.join(
            __dirname,
            "../public/html/expired-verification-page/index.html"
          )
        );
      }
    }
    return;
  }
  /* END OF VERIFYING EMAIL PROCESS */

  // Handle other requests

  res.status(400).json("Bad Request");
});

module.exports = router;
