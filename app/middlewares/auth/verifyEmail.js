const HELPERS = require("../../helpers");
const ACTIONS = require("../../actions");
const path = require("path");
const firebase_admin = require("firebase-admin");

const _processEmailVerificationMDW = async (req, res, next) => {
  const { id, token } = req.query;

  // If there are id and token
  if (id && token) {
    // Check if the account is verified
    let [
      get_user_db_response,
      get_user_db_error
    ] = await HELPERS.promise._handlePromise(ACTIONS.users._getUser(id));

    if (get_user_db_error) {
      res.send(get_user_db_error);
      return;
    }

    // If the account is verified, send back verified link
    if (get_user_db_response.data().emailVerified) {
      res.sendFile(
        path.join(__dirname, "../../public/html/verification-page/index.html")
      );
      return;
    }

    // Check if the token is expired
    let [
      get_verification_token_response,
      get_verification_token_error
    ] = await HELPERS.promise._handlePromise(
      ACTIONS.verificationTokens._getVerificationToken(id)
    );

    if (get_verification_token_error) {
      res.send(get_verification_token_error);
      return;
    }

    let stored_token = get_verification_token_response.data().token,
      stored_uuid = get_verification_token_response.data().uuid;

    // Check if the token and id are correct
    if (stored_token === token && stored_uuid === id) {
      let token_created_at = get_verification_token_response.data().createdAt,
        now = Date.now(),
        expire_time = 24 * 60 * 60 * 1000; // 24 hours
      // expire_time = 5 * 1000; // 5 seconds

      // If the token is still valid
      if (now - token_created_at < expire_time) {
        // 1 month of beta testing, in this time, users who register new accounts will have access to Premium content.
        let start_beta_testing_timestamp = new Date(2019, 11, 31).getTime(),
          end_beta_testing_timestamp = new Date(2020, 0, 31).getTime();

        // Check if the used_referral_code is valid
        let used_referral_code = get_user_db_response.data()
            .usedReferralCodeData.value,
          referral_code = get_user_db_response.data().referralCode;

        // If the used referral code is valid
        if (used_referral_code.length === 6) {
          let [
            get_referral_code_response,
            get_referral_code_error
          ] = await HELPERS.promise._handlePromise(
            ACTIONS.referralCodes._getReferralCode(used_referral_code)
          );

          if (get_referral_code_error) {
            res.send(get_referral_code_error);
            return;
          }

          if (get_referral_code_response.data()) {
            // get the refer's uuid to update
            let refer_uuid = get_referral_code_response.data().uuid;

            // If the refer's uuid is valid, we will grant the refer and referred 30 days premium
            if (refer_uuid.length > 0) {
              // We have to check if the expiry timestamp of the refer is past date or not
              let [
                get_refer_user_response,
                get_refer_user_error
              ] = await HELPERS.promise._handlePromise(
                ACTIONS.users._getUser(refer_uuid)
              );

              if (get_refer_user_error) {
                res.send(get_refer_user_error);
                return;
              }

              let refer_expiry_timestamp = get_refer_user_response.data()
                  .expiryTimestamp,
                update_refer_data = {
                  uuid: refer_uuid,
                  "package.plan": "premium"
                };

              let extra_time = 30 * 24 * 60 * 60 * 1000,
                timestamp = Date.now(),
                referred_expiry_timestamp = timestamp + extra_time;

              // If refer's expiry timestamp is past date, we take current timestamp as base
              if (refer_expiry_timestamp < Date.now()) {
                update_refer_data["expiryTimestamp"] = Date.now() + extra_time;
              }
              // If not, we take the expiry timestamp as base
              else {
                update_refer_data[
                  "expiryTimestamp"
                ] = firebase_admin.firestore.FieldValue.increment(extra_time);
              }

              let promises = [
                // Update refer's user data
                ACTIONS.users._updateUser(update_refer_data),
                // Update refer's referral code data
                ACTIONS.referralCodes._updateReferralCodeHistoryArray({
                  referral_code: used_referral_code,
                  timestamp,
                  uuid: refer_uuid
                }),
                // Update referred's user data
                ACTIONS.users._updateUser({
                  uuid: id,
                  emailVerified: true,
                  usedReferralCodeData: {
                    value: used_referral_code,
                    referUuid: refer_uuid,
                    createdAt: timestamp
                  },
                  expiryTimestamp: referred_expiry_timestamp,
                  package: {
                    billed: false,
                    plan: "premium",
                    renewalTimestamp: timestamp
                  }
                }),
                // Create a new document for referred's referral code data (override if exists)
                ACTIONS.referralCodes._setReferralCode({
                  uuid: id,
                  referral_code: referral_code,
                  history: [],
                  createdAt: timestamp
                }),

                // Update user in Auth
                ACTIONS.auth._updateUserAuth(id, { emailVerified: true })
              ];

              let [
                promises_response,
                promises_error
              ] = await HELPERS.promise._handlePromiseAll(promises);

              if (promises_error) {
                res.send(promises_error);
                return;
              }
            }

            // If the refer's uuid is not valid, we will not grant the referred nor the refer
            else {
              let timestamp = Date.now();

              let promises = [
                // Update user in Auth
                ACTIONS.auth._updateUserAuth(id, { emailVerified: true }),
                // Update referred's user data
                ACTIONS.users._updateUser({
                  uuid: id,
                  emailVerified: true,
                  expiryTimestamp:
                    Date.now() >= start_beta_testing_timestamp &&
                    Date.now() <= end_beta_testing_timestamp
                      ? end_beta_testing_timestamp
                      : timestamp,
                  "package.plan":
                    Date.now() >= start_beta_testing_timestamp &&
                    Date.now() <= end_beta_testing_timestamp
                      ? "premium"
                      : "free",
                  "package.renewalTimestamp": timestamp
                }),
                // Update referred's referral code data
                ACTIONS.referralCodes._setReferralCode({
                  uuid: id,
                  referral_code
                })
              ];

              let [
                promises_response,
                promises_error
              ] = await HELPERS.promise._handlePromiseAll(promises);

              if (promises_error) {
                res.send(promises_error);
                return;
              }
            }
          }
          // If there is no referral code data, we will not grant the referred nor the refer.
          else {
            let timestamp = Date.now();
            let promises = [
              // Update user in Auth
              ACTIONS.auth._updateUserAuth(id, { emailVerified: true }),
              // Update referred's user data
              ACTIONS.users._updateUser({
                uuid: id,
                emailVerified: true,
                expiryTimestamp:
                  Date.now() >= start_beta_testing_timestamp &&
                  Date.now() <= end_beta_testing_timestamp
                    ? end_beta_testing_timestamp
                    : timestamp,
                "package.plan":
                  Date.now() >= start_beta_testing_timestamp &&
                  Date.now() <= end_beta_testing_timestamp
                    ? "premium"
                    : "free",
                "package.renewalTimestamp": timestamp
              }),
              // Update referred's referral code data
              ACTIONS.referralCodes._setReferralCode({
                uuid: id,
                referral_code
              })
            ];

            let [
              promises_response,
              promises_error
            ] = await HELPERS.promise._handlePromiseAll(promises);

            if (promises_error) {
              res.send(promises_error);
              return;
            }
          }
        }

        // If the referral code is not valid, we will not grant the referred nor the refer
        else {
          let timestamp = Date.now();
          let promises = [
            // Update user in Auth
            ACTIONS.auth._updateUserAuth(id, { emailVerified: true }),
            // Update referred's user data
            ACTIONS.users._updateUser({
              uuid: id,
              emailVerified: true,
              expiryTimestamp:
                Date.now() >= start_beta_testing_timestamp &&
                Date.now() <= end_beta_testing_timestamp
                  ? end_beta_testing_timestamp
                  : timestamp,
              "package.plan":
                Date.now() >= start_beta_testing_timestamp &&
                Date.now() <= end_beta_testing_timestamp
                  ? "premium"
                  : "free",
              "package.renewalTimestamp": timestamp
            }),
            // Update referred's referral code data
            ACTIONS.referralCodes._setReferralCode({
              uuid: id,
              referral_code
            })
          ];

          let [
            promises_response,
            promises_error
          ] = await HELPERS.promise._handlePromiseAll(promises);

          if (promises_error) {
            res.send(promises_error);
            return;
          }
        }

        // If everything works, send back verified email link
        res.sendFile(
          path.join(__dirname, "../../public/html/verification-page/index.html")
        );
      }

      // If the token is expired, send back the expiried link
      else {
        res.sendFile(
          path.join(
            __dirname,
            "../../public/html/expired-verification-page/index.html"
          )
        );
      }
    }

    // If not, maybe the token has been expired
    else {
      res.sendFile(
        path.join(
          __dirname,
          "../../public/html/expired-verification-page/index.html"
        )
      );
    }
  } else {
    res.status(400).send("Bad Request");
  }
};

module.exports = [_processEmailVerificationMDW];
