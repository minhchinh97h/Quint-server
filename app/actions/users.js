const firebase_admin = require("firebase-admin");
const collection = firebase_admin.firestore().collection("users");

const _setUser = (data, options) => {
  return collection.doc(data.uuid).set(
    //   uuid,
    //   email,
    //   fullName: user_full_name,
    //   createdAt: created_at,
    //   emailVerified: email_verified,
    //   referralCode: referral_code,
    //   usedReferralCodeData: {
    //     value: used_referral_code,
    //     referUuid: used_referral_code_bound_uuid,
    //     createdAt: created_at
    //   },
    //   expiryTimestamp: expiry_timestamp,
    //   package: {
    //     billed: false,
    //     plan,
    //     renewalTimestamp: renewal_timestamp
    //   }
    data,
    options
  );
};

const _updateUser = data => {
  return collection.doc(data.uuid).update(data);
};

const _getUser = uuid => {
  return collection.doc(uuid).get();
};

const _updateUserWithExtraTime = (uuid, extra_time) => {
  return collection.doc(uuid).update({
    expiryTimestamp: firebase_admin.firestore.FieldValue.increment(extra_time),
    "package.plan": "premium",
    "package.renewalTimestamp": firebase_admin.firestore.FieldValue.increment(
      extra_time
    )
  });
};

module.exports = {
  _setUser,
  _updateUser,
  _getUser,
  _updateUserWithExtraTime
};
