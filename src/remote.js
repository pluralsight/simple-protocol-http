const fetch = require('isomorphic-fetch')
const { curry, merge, keys } = require('ramda')
const { safep } = require('safe-errors')

function remove (fetch, fetchOptions, url) {
  let defaultOptions = {
    method: 'DELETE',
    credentials: 'include'
  }

  let options = merge(defaultOptions, fetchOptions)

  return safep(fetch)(url, options)
    .then(handleFetchResponse)
}

function put (fetch, fetchOptions, url, data) {
  let defaultOptions = {
    method: 'PUT',
    credentials: 'include',
    body: JSON.stringify(data || {}),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  }

  let options = merge(defaultOptions, fetchOptions)

  return safep(fetch)(url, options)
    .then(handleFetchResponse)
}

function get (fetch, fetchOptions, url) {
  let defaultOptions = {
    method: 'GET',
    credentials: 'include'
  }

  let options = merge(defaultOptions, fetchOptions)

  return safep(fetch)(url, options)
    .then(handleFetchResponse)
}

function post (fetch, fetchOptions, url, data) {
  let defaultOptions = {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(data || {}),
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  }

  let options = merge(defaultOptions, fetchOptions)

  return safep(fetch)(url, options)
    .then(handleFetchResponse)
}

function handleFetchResponse (result) {
  let httpResponse = result.payload

  if (isProtocol(result) && notSuccessful(result)) {
    return merge(result, {
      meta: getResponseMeta(httpResponse)
    })
  }

  if (!httpResponse.ok) {
    return respondForHttpError(httpResponse)
  } else {
    return parseHttpResponseBody(httpResponse)
      .then(normalizeToProtocol(httpResponse))
  }
}

function parseHttpResponseBody (res) {
  return res.text().then((body) => {
    try {
      return JSON.parse(body)
    } catch (e) {
      //  instead of an empty string,
      //  pass back an empty object
      return body || {}
    }
  })
}

const normalizeToProtocol = curry((httpResponse, payload) => {
  if (isProtocol(payload)) {
    return merge(payload, {
      meta: getResponseMeta(httpResponse)
    })
  } else {
    return {
      success: true,
      payload,
      meta: getResponseMeta(httpResponse)
    }
  }
})

function respondForHttpError (httpResponse) {
  return parseHttpResponseBody(httpResponse)
  .then((body) => {
    return {
      success: false,
      error: body,
      meta: getResponseMeta(httpResponse)
    }
  }).then(normalizeToProtocol(httpResponse))
}

function getResponseMeta (httpResponse) {
  return {
    status: httpResponse.status,
    statusText: httpResponse.statusText,
    headers: parseHeaders(httpResponse)
  }
}

function isProtocol (p) {
  if (p.success === true && p.payload) {
    return true
  }

  if (p.success === false && p.error) {
    return true
  }

  return false
}

function notSuccessful (result) {
  return result.success === false
}

function parseHeaders (httpResponse) {
  let headersRaw = httpResponse.headers._headers
  return keys(headersRaw).reduce((p, c) => {
    p[c] = headersRaw[c].join('')
    return p
  }, {})
}

module.exports = {
  post: curry(post),
  get: curry(get),
  remove: curry(remove),
  put: curry(put),
  fetch
}
