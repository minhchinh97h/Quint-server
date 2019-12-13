const _handlePromise = promise => {
  return promise
    .then(response => [response, undefined])
    .catch(error => [undefined, error]);
};

const _handlePromiseAll = promises => {
  return Promise.all(promises)
    .then(responses => [responses, undefined])
    .catch(error => [undefined, error]);
};

module.exports = {
  _handlePromise,
  _handlePromiseAll
};
