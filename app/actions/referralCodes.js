const firebase_admin = require("firebase-admin");

const collection = firebase_admin.firestore().collection("referralCodes");

const _getReferralCode = used_referral_code => {
  return collection.doc(used_referral_code).get();
};

const _createReferralCode = ({ uuid, referral_code }) => {
  return collection.doc(referral_code).create({
    value: referral_code,
    createdAt: Date.now(),
    history: [],
    uuid
  });
};

const _setReferralCode = ({ uuid, referral_code }) => {
  return collection.doc(referral_code).set({
    value: referral_code,
    createdAt: Date.now(),
    history: [],
    uuid
  });
};

const _updateReferralCode = data => {
  return collection.doc(data.referral_code).update(
    // history: firebase_admin.firestore.FieldValue.arrayUnion({
    //   timestamp: used_timestamp,
    //   uuid: refer_uuid,
    //   email: refer_email
    data
  );
};

const _updateReferralCodeHistoryArray = ({
  referral_code,
  timestamp,
  uuid
}) => {
  return collection.doc(referral_code).update({
    history: firebase_admin.firestore.FieldValue.arrayUnion({
      timestamp,
      uuid
    })
  });
};

const _deleteReferralCodeWithUuid = uuid => {
  let batch = firebase_admin.firestore().batch();

  try {
    batch.delete(collection.where("uuid", "==", uuid));
  } catch (err) {
    // To do when cannot delete
  }
  return batch.commit();
};

module.exports = {
  _getReferralCode,
  _createReferralCode,
  _updateReferralCode,
  _deleteReferralCodeWithUuid,
  _updateReferralCodeHistoryArray,
  _setReferralCode
};
