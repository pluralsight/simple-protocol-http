'use strict';

const fetch = require('isomorphic-fetch');
const { curry, merge, keys } = require('ramda');
const { safep } = require('safe-errors');

const defaultHeaders = {
  'Content-Type': 'application/json;charset=UTF-8'
};

function get(fetch, fetchOptions, url) {
  let defaultOptions = {
    method: 'GET',
    credentials: 'include'
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function post(fetch, fetchOptions, url, data) {
  let defaultOptions = {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data || {}),
    headers: defaultHeaders
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function put(fetch, fetchOptions, url, data) {
  let defaultOptions = {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data || {}),
    headers: defaultHeaders
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function remove(fetch, fetchOptions, url) {
  let defaultOptions = {
    method: 'DELETE',
    credentials: 'include'
  };

  return makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions);
}

function makeRequestWithOptions(fetch, url, defaultOptions, fetchOptions) {
  let options = mergeOptions(defaultOptions, fetchOptions);
  return makeRequest(fetch, url, options);
}

function makeRequest(fetch, url, options) {
  return safep(fetch)(url, options).then(handleFetchResponse);
}

function handleFetchResponse(result) {
  //  if fetch errors out, there is no http response
  if (isSimpleProtocol(result) && notSuccessful(result)) {
    return merge(result, {
      meta: {}
    });
  }

  let httpResponse = result.payload;

  if (!httpResponse.ok) {
    return respondForHttpError(httpResponse);
  } else {
    return parseHttpResponseBody(httpResponse).then(normalizeToProtocol(httpResponse));
  }
}

function parseHttpResponseBody(res) {
  return res.text().then(body => {
    try {
      return JSON.parse(body);
    } catch (e) {
      //  instead of an empty string,
      //  pass back an empty object
      return body || {};
    }
  });
}

function mergeOptions(a, b) {
  return merge(a, b);
}

const normalizeToProtocol = curry((httpResponse, payload) => {
  if (isSimpleProtocol(payload)) {
    return addMetaToPayload(payload, httpResponse);
  } else {
    let successPayload = {
      success: true,
      payload
    };
    return addMetaToPayload(successPayload, httpResponse);
  }
});

function respondForHttpError(httpResponse) {
  return parseHttpResponseBody(httpResponse).then(body => {
    let errorPayload = {
      success: false,
      error: body
    };
    return addMetaToPayload(errorPayload, httpResponse);
  }).then(normalizeToProtocol(httpResponse));
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
  let headersRaw = httpResponse.headers._headers;
  return keys(headersRaw).reduce((p, c) => {
    p[c] = headersRaw[c].join('');
    return p;
  }, {});
}

module.exports = {
  post: curry(post),
  get: curry(get),
  remove: curry(remove),
  put: curry(put),
  fetch
};