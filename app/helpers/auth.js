const _validateEmail = email => {
  let regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(String(email).toLowerCase());
};

// Password must contain at least 6 characters, including 1 number and 1 uppercase
const _validatePassword = password => {
  let regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/;
  return regex.test(String(password));
};

// Referral code must have 6 characters
const _validateReferralCode = referral_code => {
  return referral_code.length <= 6;
};

module.exports = {
  _validateEmail,
  _validatePassword,
  _validateReferralCode
};
