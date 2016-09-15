'use strict';

var fetch = require('isomorphic-fetch');

var _require = require('ramda');

var curry = _require.curry;
var merge = _require.merge;
var keys = _require.keys;

var _require2 = require('safe-errors');

var safep = _require2.safep;

var defaultHeaders = {
  'Content-Type': 'application/json;charset=UTF-8'
};

function get(fetch, fetchOptions, url) {
  var defaultOptions = {
    method: 'GET',
    credentials: 'include'
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function post(fetch, fetchOptions, url, data) {
  var defaultOptions = {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data || {}),
    headers: defaultHeaders
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function put(fetch, fetchOptions, url, data) {
  var defaultOptions = {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data || {}),
    headers: defaultHeaders
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function remove(fetch, fetchOptions, url) {
  var defaultOptions = {
    method: 'DELETE',
    credentials: 'include'
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions) {
  var options = mergeOptions(defaultOptions, fetchOptions);
  return makeRequest(fetch, url, options);
}

function mergeOptions(a, b) {
  return merge(a, b);
}

function makeRequest(fetch, url, options) {
  return safep(fetch)(url, options).then(handleFetchResponse);
}

function handleFetchResponse(result) {
  //  result should always be a simple protocol object.
  //  if fetch errors out, there is no
  //  http response and no http response meta
  if (notSuccessful(result)) {
    return merge(result, {
      meta: {}
    });
  }

  var httpResponse = result.payload;

  if (httpResponse.ok) {
    return respondForHttpSuccess(httpResponse);
  } else {
    return respondForHttpError(httpResponse);
  }
}

function respondForHttpSuccess(httpResponse) {
  return parseHttpResponseBody(httpResponse).then(normalizeToProtocol(httpResponse, true));
}

function respondForHttpError(httpResponse) {
  return parseHttpResponseBody(httpResponse).then(normalizeToProtocol(httpResponse, false));
}

function parseHttpResponseBody(res) {
  return res.text().then(safeParseJson);
}

function safeParseJson(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    //  instead of an empty string,
    //  pass back an empty object
    return s || {};
  }
}

var normalizeToProtocol = curry(function (httpResponse, success, payload) {
  if (isSimpleProtocol(payload)) {
    return addMetaToPayload(payload, httpResponse);
  } else if (success) {
    var successResult = buildSuccessResult(payload);
    return addMetaToPayload(successResult, httpResponse);
  } else {
    var errorResult = buildErrorResult(payload);
    return addMetaToPayload(errorResult, httpResponse);
  }
});

function buildSuccessResult(payload) {
  return {
    success: true,
    payload: payload
  };
}

function buildErrorResult(error) {
  return {
    success: false,
    error: error
  };
}

function addMetaToPayload(payload, httpResponse) {
  return merge(payload, {
    meta: getResponseMeta(httpResponse)
  });
}

function getResponseMeta(httpResponse) {
  return {
    status: httpResponse.status,
    statusText: httpResponse.statusText,
    headers: parseHeaders(httpResponse)
  };
}

function isSimpleProtocol(p) {
  if (p.success === true && p.payload) {
    return true;
  }

  if (p.success === false && p.error) {
    return true;
  }

  return false;
}

function notSuccessful(result) {
  return result.success === false;
}

function parseHeaders(httpResponse) {
  var headersRaw = httpResponse.headers._headers;
  return keys(headersRaw).reduce(function (p, c) {
    p[c] = headersRaw[c].join('');
    return p;
  }, {});
}

module.exports = {
  full: {
    post: curry(post),
    get: curry(get),
    remove: curry(remove),
    put: curry(put)
  },
  options: {
    post: curry(post)(fetch),
    get: curry(get)(fetch),
    remove: curry(remove)(fetch),
    put: curry(put)(fetch)
  },
  post: curry(post)(fetch, {}),
  get: curry(get)(fetch, {}),
  remove: curry(remove)(fetch, {}),
  put: curry(put)(fetch, {})
};