const sgMail = require("@sendgrid/mail");
const firebase_admin = require("firebase-admin");

const { _handlePromise } = require("../helpers/handle_promises");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports._validateEmail = email => {
  let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(String(email).toLowerCase());
};

// Password must contain at least 6 characters, including 1 number and 1 uppercase
exports._validatePassword = password => {
  let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/;
  return regex.test(String(password));
};

// const logo_png = require("../../public/pngs/logo.png")

exports._sendVerificationEmail = (email, uuid, token) => {
  let link = `${process.env.SERVER_URL}auth?email=${email}&id=${uuid}&token=${token}`;
  let message = {
    to: email,
    from: "quintapp@gmail.com",
    templateId: "d-5861fe691a85455196e36093a0ad8b9c",
    // subject: 'Testing email from Quint',
    // text: 'HI',
    // html: '<strong>Content goes here</strong>',
    dynamic_template_data: {
      link
    }
  };

  return sgMail.send(message);

  // return _handlePromise(promise);
};

exports._getUserAuth = uuid => {
  return firebase_admin.auth().getUser(uuid);

  // return _handlePromise(promise);
};

exports._getUserAuthByEmail = email => {
  return firebase_admin.auth().getUserByEmail(email);

  // return _handlePromise(promise);
};

exports._createUserAuth = (email, password) => {
  return firebase_admin.auth().createUser({
    email,
    password,
    emailVerified: false,
    disabled: false
  });

  // return _handlePromise(promise);
};

exports._deleteUserAuth = uuid => {
  return firebase_admin.auth().deleteUser(uuid);

  // return _handlePromise(promise);
};

exports._updateVerifiedUserAuth = uuid => {
  return firebase_admin.auth().updateUser(uuid, {
    emailVerified: true
  });

  // return _handlePromise(promise);
};

exports._createUserDatabase = (
  uuid,
  email,
  referral_code,
  used_referral_code,
  used_referral_code_bound_uuid
) => {
  let created_at = Date.now();
  return firebase_admin
    .firestore()
    .collection("users")
    .doc(uuid)
    .create({
      email,
      createdAt: created_at,
      emailVerified: true,
      referralCode: referral_code,
      usedReferralCodeData: {
        value: used_referral_code,
        boundUuid: used_referral_code_bound_uuid,
        createdAt: created_at
      },
      expiryTimestamp: created_at,
      package: {
        plan: "free",
        renewalTimestamp: created_at
      }
    });

  // return _handlePromise(promise);
};

exports._getUsedReferralCode = used_referral_code => {
  return firebase_admin
    .firestore()
    .collection("referralCodes")
    .doc(used_referral_code)
    .get();
};

exports._createReferralCodeDatabase = (uuid, referral_code) => {
  return firebase_admin
    .firestore()
    .collection("referralCodes")
    .doc(referral_code)
    .create({
      value: referral_code,
      numberOfRefs: 0,
      createdAt: Date.now(),
      history: [],
      uuid
    });

  // return _handlePromise(promise);
};

exports._deleteReferralCodeDatabaseWithUuid = uuid => {
  let batch = firebase_admin.firestore().batch();

  try {
    batch.delete(
      firebase_admin
        .firestore()
        .collection("referralCodes")
        .where("uuid", "==", uuid)
    );
  } catch (err) {
    // To do when cannot delete
  }
  return batch.commit();
};

exports._setVerificationTokenBelongedToUser = (
  uuid,
  token,
  email,
  used_referral_code
) => {
  return firebase_admin
    .firestore()
    .collection("verificationTokens")
    .doc(uuid)
    .set({
      value: token,
      email,
      uuid,
      createdAt: Date.now(),
      usedReferralCode: used_referral_code
    });

  // return _handlePromise(promise);
};

exports._getVerificationTokenBelongedToUser = uuid => {
  return firebase_admin
    .firestore()
    .collection("verificationTokens")
    .doc(uuid)
    .get();

  // return _handlePromise(promise);
};

exports._deleteVerificationTokenBelongedToUser = uuid => {
  return firebase_admin
    .firestore()
    .collection("verificationTokens")
    .doc(uuid)
    .delete();

  // return _handlePromise(promise);
};
