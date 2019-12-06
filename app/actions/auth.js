const express = require("express");
const path = require("path");
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
  let link = `http://localhost:3000/auth?email=${email}&id=${uuid}&token=${token}`;
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

  let promise = sgMail.send(message);

  return _handlePromise(promise);
};

exports._getUserAuth = uuid => {
  let promise = firebase_admin.auth().getUser(uuid);

  return _handlePromise(promise);
};

exports._getUserAuthByEmail = email => {
  let promise = firebase_admin.auth().getUserByEmail(email);

  return _handlePromise(promise);
};

exports._createUserAuth = (email, password) => {
  let promise = firebase_admin.auth().createUser({
    email,
    password,
    emailVerified: false,
    disabled: false
  });

  return _handlePromise(promise);
};

exports._deleteUserAuth = uuid => {
  let promise = firebase_admin.auth().deleteUser(uuid);

  return _handlePromise(promise);
};

exports._updateVerifiedUserAuth = uuid => {
  let promise = firebase_admin.auth().updateUser(uuid, {
    emailVerified: true
  });

  return _handlePromise(promise);
};

exports._createUserDatabase = (uuid, email) => {
  let promise = firebase_admin
    .firestore()
    .collection("users")
    .doc(uuid)
    .create({
      email,
      plan: "free",
      createdAt: Date.now(),
      emailVerified: true
    });

  return _handlePromise(promise);
};

exports._setVerificationTokenBelongedToUser = (uuid, token) => {
  let promise = firebase_admin
    .firestore()
    .collection("verificationTokens")
    .doc(uuid)
    .set({
      token,
      createdAt: Date.now()
    });

  return _handlePromise(promise);
};

exports._getVerificationTokenBelongedToUser = uuid => {
  let promise = firebase_admin
    .firestore()
    .collection("verificationTokens")
    .doc(uuid)
    .get();

  return _handlePromise(promise);
};

exports._deleteVerificationTokenBelongedToUser = uuid => {
  let promise = firebase_admin
    .firestore()
    .collection("verificationTokens")
    .doc(uuid)
    .delete();

  return _handlePromise(promise);
};
