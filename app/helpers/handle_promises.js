exports._handlePromise = promise => {
  return promise
    .then(response => [response, undefined])
    .catch(error => [undefined, error]);
};

exports._handlePromiseAll = promises => {
  return Promise.all(promises)
    .then(responses => [responses, undefined])
    .catch(error => [undefined, error]);
};
