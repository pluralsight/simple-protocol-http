const co = require('co')
const deep = require('assert').deepEqual
const { post, get, put, remove, fetch } = require('./remote')
const { startServer } = require('./test/server')

const testPost = post(fetch, {}, 'http://localhost:3001')
const testPut = put(fetch, {}, 'http://localhost:3001')
const testGet = () => get(fetch, {}, 'http://localhost:3001')
const testRemove = () => remove(fetch, {}, 'http://localhost:3001')

describe('simple protocol', () => {
  let stopServer
  afterEach(() => stopServer && stopServer())

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
      it(`should normalize http response to simple protocol`, co.wrap(function * () {
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

      it(`should set payload as text body if it is not JSON`, co.wrap(function * () {
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

      it(`should normalize 204 "No Content" response to simple protocol`, co.wrap(function * () {
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

      it(`should handle http error`, co.wrap(function * () {
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

      it(`should handle successful simple protocol response`, co.wrap(function * () {
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

      it(`should handle simple protocol error response`, co.wrap(function * () {
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

  it('should handle fetch error', co.wrap(function * () {
    const testPost = post(fetch, {}, 'http://doesnotexist.nope')
    let result = yield testPost({})
    deep(result.success, false)
    deep(result.error.name, 'FetchError')
    deep(result.meta, {})
  }))
})
