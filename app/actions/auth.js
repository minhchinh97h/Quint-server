const firebase_admin = require("firebase-admin");

const _getUserAuth = uuid => {
  return firebase_admin.auth().getUser(uuid);
};

const _getUserAuthByEmail = email => {
  return firebase_admin.auth().getUserByEmail(email);
};

const _createUserAuth = (email, password) => {
  return firebase_admin.auth().createUser({
    email,
    password,
    emailVerified: false,
    disabled: false
  });
};

const _updateUserAuth = (uuid, data) => {
  return firebase_admin.auth().updateUser(uuid, data);
};

const _deleteUserAuth = uuid => {
  return firebase_admin.auth().deleteUser(uuid);
};

module.exports = {
  _getUserAuth,
  _getUserAuthByEmail,
  _createUserAuth,
  _updateUserAuth
};
