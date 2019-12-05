exports._handlePromise = (promise) => {
    return promise
        .then(response => ([response, undefined]))
        .catch(error => Promise.resolve([undefined, error]))
}

exports._handlePromiseAll = (promises) => {
    return Promise.all(promises)
        .then(responses => ([responses, undefined]))
        .catch(error => Promise.resolve([undefined, error]))
}