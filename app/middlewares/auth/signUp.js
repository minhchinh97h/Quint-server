const crypto_random_string = require("crypto-random-string");

const HELPERS = require("../../helpers");

const ACTIONS = require("../../actions");

const _validateInputs = (req, res, next) => {
  const { email, password, used_referral_code } = req.body;

  let check_email_if_valid = HELPERS.auth._validateEmail(email),
    check_password_if_valid = HELPERS.auth._validatePassword(password),
    check_referral_code_if_valid = HELPERS.auth._validateReferralCode(
      used_referral_code
    );

  if (
    check_email_if_valid &&
    check_password_if_valid &&
    check_referral_code_if_valid
  ) {
    next();
  } else {
    res.status(400).send({ error: "Invalid inputs." });
  }
};

const _processTemporarySignUp = async (req, res, next) => {
  const { email, password, used_referral_code, full_name } = req.body;

  const [
    get_user_auth_by_email_response,
    get_user_auth_by_email_error
  ] = await HELPERS.promise._handlePromise(
    ACTIONS.auth._getUserAuthByEmail(email)
  );

  let new_uuid;

  // If the user doesnt exist, we create one in userpool and one in users collection.
  if (!get_user_auth_by_email_response) {
    // Create in userpool first to retrieve uuid
    let [
      create_user_auth_response,
      create_user_auth_error
    ] = await HELPERS.promise._handlePromise(
      ACTIONS.auth._createUserAuth(email, password)
    );

    if (create_user_auth_error) {
      res.end(create_user_auth_error);
      return;
    }
    new_uuid = create_user_auth_response.uid;

    // Create user in users collection
    let [
      set_user_db_response,
      set_user_db_error
    ] = await HELPERS.promise._handlePromise(
      _setTemporaryUserInDB(new_uuid, email, full_name, used_referral_code)
    );

    if (set_user_db_error) {
      res.end(set_user_db_error);
      return;
    }
  }

  // If the user exists, meaning:
  // 1. the account exists
  // 2. the account has been registered once, but the registering hasnt succeeded
  else {
    let email_verified = get_user_auth_by_email_response.emailVerified;

    // If the account exists
    if (email_verified) {
      res.status(409).json({ error: "email already exists." });
      return;
    }
    // Else, check if there is a temporary user row in users collection
    else {
      new_uuid = get_user_auth_by_email_response.uid;

      // Create a new one, if there is an user already, it will be overwritten
      let [
        set_user_db_response,
        set_user_db_error
      ] = await HELPERS.promise._handlePromise(
        _setTemporaryUserInDB(new_uuid, email, full_name, used_referral_code)
      );

      if (set_user_db_error) {
        res.send(set_user_db_error);
        return;
      }
    }
  }

  // Create a new verification token for verifying user's email
  let token = crypto_random_string({ length: 10, type: "url-safe" });

  let [
    set_verfication_token_response,
    set_verfication_token_error
  ] = await HELPERS.promise._handlePromise(
    ACTIONS.verificationTokens._setVerificationToken(new_uuid, token)
  );

  if (set_verfication_token_error) {
    res.send(set_verfication_token_error);
    return;
  }

  let [
    send_verification_email_response,
    send_verification_email_error
  ] = await HELPERS.promise._handlePromise(
    ACTIONS.sendGrid._sendVerificationEmail(email, new_uuid, token)
  );

  if (send_verification_email_error) {
    res.send(send_verification_email_error);
    return;
  }

  res.status(200).send({
    msg: "Verification mail sent",
    uuid: new_uuid,
    createdAt: Date.now()
  });
};

function _setTemporaryUserInDB(uuid, email, full_name, used_referral_code) {
  let timestamp = Date.now(),
    account_referral_code = crypto_random_string({
      length: 6,
      characters:
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
    });
  // Schema
  let set_user_db_data = {
    uuid,
    email,
    fullName: full_name,
    createdAt: timestamp,
    emailVerified: false,
    referralCode: account_referral_code,
    usedReferralCodeData: {
      value: used_referral_code,
      referUuid: "",
      createdAt: timestamp
    },
    expiryTimestamp: timestamp,
    package: {
      billed: false,
      plan: "free",
      renewalTimestamp: timestamp
    }
  };

  return ACTIONS.users._setUser(set_user_db_data);
}

module.exports = [_validateInputs, _processTemporarySignUp];
