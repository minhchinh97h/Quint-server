const firebase_admin = require("firebase-admin");

exports._setPushTokenDB = token => {
  firebase_admin
    .firestore()
    .collection("expoPushTokens")
    .doc(token)
    .set(
      {
        value: token,
        createdAt: Date.now()
      },
      { merge: true }
    );
};
