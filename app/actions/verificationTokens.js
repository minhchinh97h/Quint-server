const firebase_admin = require("firebase-admin");

const collection = firebase_admin.firestore().collection("verificationTokens");

const _setVerificationToken = (uuid, token) => {
  return collection.doc(uuid).set({
    token,
    uuid,
    createdAt: Date.now()
  });
};

const _getVerificationToken = uuid => {
  return collection.doc(uuid).get();
};

module.exports = {
  _setVerificationToken,
  _getVerificationToken
};
