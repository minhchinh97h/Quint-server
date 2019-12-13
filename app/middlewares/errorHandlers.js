const _catchAllErrorsHandler = (err, req, res, next) => {
  res.status(500).send({ error, err });
};

const _invalidInputsErrorHandler = (err, req, res, next) => {
  res.status(400).send({ error: "Invalid email or password" });
};

module.exports = {
  _catchAllErrorsHandler,
  _invalidInputsErrorHandler
};
