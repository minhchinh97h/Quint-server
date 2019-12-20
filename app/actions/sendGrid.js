const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const _sendVerificationEmail = (email, uuid, token) => {
  let link = `${process.env.SERVER_URL}auth?action=verify&id=${uuid}&token=${token}`;
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
};

module.exports = {
  _sendVerificationEmail
};
