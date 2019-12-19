const error_handler_middleware = require("./errorHandlers");
const auth_middleware = require("../middlewares/auth");
const payments_middleware = require("./payments")
const users_middleware = require("./users")
module.exports = {
  error: error_handler_middleware,
  auth: auth_middleware,
  payments: payments_middleware,
  users: users_middleware
};
