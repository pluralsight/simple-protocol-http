const co = require('co')
const deep = require('assert').deepEqual
const { post, get, put, remove } = require('./simple').options
const { startServer } = require('./test/server')
const defaultJsonHeader = 'application/json;charset=UTF-8'
const apiUrl = 'http://localhost:3001'

describe('simple protocol', () => {
  let config = [
    {
      method: 'get',
      fn: get,
      supportsPayloads: false
    },
    {
      method: 'post',
      fn: post,
      supportsPayloads: true
    },
    {
      method: 'put',
      fn: put,
      supportsPayloads: true
    },
    {
      method: 'delete',
      fn: remove,
      supportsPayloads: false
    }
  ]

  config.forEach(({fn, method, supportsPayloads}) => {
    const makeRequest = () => {
      let options = {
        headers: {
          'content-type': defaultJsonHeader,
          test: 'test-request-header'
        }
      }

      let body = {
        foo: 'bar'
      }

      let args = [options, apiUrl]

      if (supportsPayloads) {
        args.push(body)
      }

      return fn.apply(null, args)
    }

    const validateRequest = (getRequestData) => {
      let { body, headers } = getRequestData()
      if (supportsPayloads) {
        deep(body, {
          foo: 'bar'
        })
      }
      deep(headers['content-type'], defaultJsonHeader)
      deep(headers['test'], 'test-request-header')
    }

    function validateHeaders (result) {
      deep(result.meta.headers.test, 'test-header')
    }

    function validateResult (actual, expected) {
      deep(actual, expected)
    }

    describe(method, () => {
      it(`should normalize http response to simple protocol`, co.wrap(function * () {
        let { getRequestData } = yield startServer({
          method,
          payload: {
            message: 'hi'
          }
        })

        let result = yield makeRequest()

        validateRequest(getRequestData)

        validateHeaders(result)

        validateResult(result, {
          success: true,
          payload: {
            message: 'hi'
          },
          meta: {
            status: 200,
            statusText: 'OK',
            headers: result.meta.headers
          }
        })
      }))

      it(`should set payload as text body if it is not JSON`, co.wrap(function * () {
        let { getRequestData } = yield startServer({
          method,
          payload: 'hi'
        })

        let result = yield makeRequest()

        validateRequest(getRequestData)

        validateHeaders(result)

        validateResult(result, {
          success: true,
          payload: 'hi',
          meta: {
            status: 200,
            statusText: 'OK',
            headers: result.meta.headers
          }
        })
      }))

      it(`should normalize 204 "No Content" response to simple protocol`, co.wrap(function * () {
        let { getRequestData } = yield startServer({
          method,
          fn: function (req, res) {
            res.status(204)
            res.end()
          }
        })

        let result = yield makeRequest()

        validateRequest(getRequestData)

        validateHeaders(result)

        validateResult(result, {
          success: true,
          payload: {},
          meta: {
            status: 204,
            statusText: 'No Content',
            headers: result.meta.headers
          }
        })
      }))

      it(`should handle http error`, co.wrap(function * () {
        let { getRequestData } = yield startServer({
          method,
          fn: function (req, res) {
            res.status(500)
            res.send({
              message: 'something bad happened'
            })
          }
        })

        let result = yield makeRequest()

        validateRequest(getRequestData)

        validateHeaders(result)

        validateResult(result, {
          success: false,
          error: {
            message: 'something bad happened'
          },
          meta: {
            status: 500,
            statusText: 'Internal Server Error',
            headers: result.meta.headers
          }
        })
      }))

      it(`should handle successful simple protocol response`, co.wrap(function * () {
        let { getRequestData } = yield startServer({
          method,
          payload: {
            success: true,
            payload: {
              message: 'hi'
            }
          }
        })

        let result = yield makeRequest()

        validateRequest(getRequestData)

        validateHeaders(result)

        validateResult(result, {
          success: true,
          payload: {
            message: 'hi'
          },
          meta: {
            status: 200,
            statusText: 'OK',
            headers: result.meta.headers
          }
        })
      }))

      it(`should handle simple protocol error response`, co.wrap(function * () {
        let { getRequestData } = yield startServer({
          method,
          payload: {
            success: false,
            error: {
              message: 'this is bad'
            }
          }
        })

        let result = yield makeRequest()

        validateRequest(getRequestData)

        validateHeaders(result)

        validateResult(result, {
          success: false,
          error: {
            message: 'this is bad'
          },
          meta: {
            status: 200,
            statusText: 'OK',
            headers: result.meta.headers
          }
        })
      }))
    })
  })

  it('should handle fetch error', co.wrap(function * () {
    let result = yield post({}, 'http://doesnotexist.nope', {})
    deep(result.success, false)
    deep(result.error.name, 'FetchError')
    deep(result.meta, {})
  }))
})
