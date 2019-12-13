const error_handler_middleware = require("./errorHandlers");

const auth_middleware = require("../middlewares/auth");

module.exports = {
  error: error_handler_middleware,
  auth: auth_middleware
};
