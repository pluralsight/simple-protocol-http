const co = require('co')
const deep = require('assert').deepEqual
const { post, get, put, remove, fetch } = require('./remote')
const { startServer } = require('./test/server')

const testPost = post(fetch, {}, 'http://localhost:3001')
const testPut = put(fetch, {}, 'http://localhost:3001')
const testGet = () => get(fetch, {}, 'http://localhost:3001')
const testRemove = () => remove(fetch, {}, 'http://localhost:3001')

describe('remote', () => {
  let stopServer
  afterEach(() => stopServer())

  function validateTestHeader (result) {
    deep(result.meta.headers.test, 'test-header')
  }

  let config = [
    {
      method: 'get',
      fn: testGet
    },
    {
      method: 'post',
      fn: testPost
    },
    {
      method: 'put',
      fn: testPut
    },
    {
      method: 'delete',
      fn: testRemove
    }
  ]

  config.forEach(({fn, method}) => {
    describe(method, () => {
      it(`should make ${method} request to endpoint and normalize response`, co.wrap(function * () {
        stopServer = yield startServer({
          method,
          payload: {
            message: 'hi'
          }
        })

        let result = yield fn({})

        validateTestHeader(result)
        deep(result, {
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

      it(`should make ${method} request to endpoint and normalize response with text body`, co.wrap(function * () {
        stopServer = yield startServer({
          method,
          payload: 'hi'
        })

        let result = yield fn({})

        validateTestHeader(result)
        deep(result, {
          success: true,
          payload: 'hi',
          meta: {
            status: 200,
            statusText: 'OK',
            headers: result.meta.headers
          }
        })
      }))

      it(`should make ${method} request to endpoint and normalize 204 no content response`, co.wrap(function * () {
        stopServer = yield startServer({
          method,
          fn: function (req, res) {
            res.status(204)
            res.end()
          }
        })

        let result = yield fn({})

        validateTestHeader(result)
        deep(result, {
          success: true,
          payload: {},
          meta: {
            status: 204,
            statusText: 'No Content',
            headers: result.meta.headers
          }
        })
      }))

      it(`should make ${method} request to endpoint and handle http error`, co.wrap(function * () {
        stopServer = yield startServer({
          method,
          fn: function (req, res) {
            res.status(500)
            res.send({
              message: 'something bad happened'
            })
          }
        })

        let result = yield fn({})

        validateTestHeader(result)
        deep(result, {
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

      it(`should make ${method} request to endpoint and handle successful protocol response`, co.wrap(function * () {
        stopServer = yield startServer({
          method,
          payload: {
            success: true,
            payload: {
              message: 'hi'
            }
          }
        })

        let result = yield fn({})

        validateTestHeader(result)
        deep(result, {
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

      it(`should make ${method} request to endpoint and handle unsuccessful protocol response`, co.wrap(function * () {
        stopServer = yield startServer({
          method,
          payload: {
            success: false,
            error: {
              message: 'this is bad'
            }
          }
        })

        let result = yield fn({})

        validateTestHeader(result)
        deep(result, {
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
})
