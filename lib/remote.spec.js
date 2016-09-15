'use strict';

const co = require('co');
const deep = require('assert').deepEqual;
const { post, get, put, remove, fetch } = require('./remote');
const { startServer } = require('./test/server');
const defaultJsonHeader = 'application/json;charset=UTF-8';
const apiUrl = 'http://localhost:3001';

const testPost = post(fetch);
const testPut = put(fetch);
const testGet = (options, url) => get(fetch, options, url);
const testRemove = (options, url) => remove(fetch, options, url);

describe('simple protocol', () => {
  function validateTestHeader(result) {
    deep(result.meta.headers.test, 'test-header');
  }

  let config = [{
    method: 'get',
    fn: testGet,
    supportsPayloads: false
  }, {
    method: 'post',
    fn: testPost,
    supportsPayloads: true
  }, {
    method: 'put',
    fn: testPut,
    supportsPayloads: true
  }, {
    method: 'delete',
    fn: testRemove,
    supportsPayloads: false
  }];

  config.forEach(({ fn, method, supportsPayloads }) => {
    describe(method, () => {
      it(`should normalize http response to simple protocol`, co.wrap(function* () {
        let { getRequestData } = yield startServer({
          method,
          payload: {
            message: 'hi'
          }
        });

        let result = yield fn({
          headers: {
            'content-type': defaultJsonHeader,
            test: 'test-request-header'
          }
        }, apiUrl, {
          foo: 'bar'
        });

        //  validate request
        let { body, headers } = getRequestData();
        if (supportsPayloads) {
          deep(body, {
            foo: 'bar'
          });
        }
        deep(headers['content-type'], defaultJsonHeader);
        deep(headers['test'], 'test-request-header');

        //  validate response
        validateTestHeader(result);
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
        });
      }));

      it(`should set payload as text body if it is not JSON`, co.wrap(function* () {
        let { getRequestData } = yield startServer({
          method,
          payload: 'hi'
        });

        let result = yield fn({
          headers: {
            'content-type': defaultJsonHeader,
            test: 'test-request-header'
          }
        }, apiUrl, {
          foo: 'bar'
        });

        //  validate request
        let { body, headers } = getRequestData();
        if (supportsPayloads) {
          deep(body, {
            foo: 'bar'
          });
        }
        deep(headers['content-type'], defaultJsonHeader);
        deep(headers['test'], 'test-request-header');

        //  validate response
        validateTestHeader(result);
        deep(result, {
          success: true,
          payload: 'hi',
          meta: {
            status: 200,
            statusText: 'OK',
            headers: result.meta.headers
          }
        });
      }));

      it(`should normalize 204 "No Content" response to simple protocol`, co.wrap(function* () {
        let { getRequestData } = yield startServer({
          method,
          fn: function (req, res) {
            res.status(204);
            res.end();
          }
        });

        let result = yield fn({
          headers: {
            'content-type': defaultJsonHeader,
            test: 'test-request-header'
          }
        }, apiUrl, {
          foo: 'bar'
        });

        //  validate request
        let { body, headers } = getRequestData();
        if (supportsPayloads) {
          deep(body, {
            foo: 'bar'
          });
        }
        deep(headers['content-type'], defaultJsonHeader);
        deep(headers['test'], 'test-request-header');

        //  validate response
        validateTestHeader(result);
        deep(result, {
          success: true,
          payload: {},
          meta: {
            status: 204,
            statusText: 'No Content',
            headers: result.meta.headers
          }
        });
      }));

      it(`should handle http error`, co.wrap(function* () {
        let { getRequestData } = yield startServer({
          method,
          fn: function (req, res) {
            res.status(500);
            res.send({
              message: 'something bad happened'
            });
          }
        });

        let result = yield fn({
          headers: {
            'content-type': defaultJsonHeader,
            test: 'test-request-header'
          }
        }, apiUrl, {
          foo: 'bar'
        });

        //  validate request
        let { body, headers } = getRequestData();
        if (supportsPayloads) {
          deep(body, {
            foo: 'bar'
          });
        }
        deep(headers['content-type'], defaultJsonHeader);
        deep(headers['test'], 'test-request-header');

        //  validate response
        validateTestHeader(result);
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
        });
      }));

      it(`should handle successful simple protocol response`, co.wrap(function* () {
        let { getRequestData } = yield startServer({
          method,
          payload: {
            success: true,
            payload: {
              message: 'hi'
            }
          }
        });

        let result = yield fn({
          headers: {
            'content-type': defaultJsonHeader,
            test: 'test-request-header'
          }
        }, apiUrl, {
          foo: 'bar'
        });

        //  validate request
        let { body, headers } = getRequestData();
        if (supportsPayloads) {
          deep(body, {
            foo: 'bar'
          });
        }
        deep(headers['content-type'], defaultJsonHeader);
        deep(headers['test'], 'test-request-header');

        //  validate response
        validateTestHeader(result);
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
        });
      }));

      it(`should handle simple protocol error response`, co.wrap(function* () {
        let { getRequestData } = yield startServer({
          method,
          payload: {
            success: false,
            error: {
              message: 'this is bad'
            }
          }
        });

        let result = yield fn({
          headers: {
            'content-type': defaultJsonHeader,
            test: 'test-request-header'
          }
        }, apiUrl, {
          foo: 'bar'
        });

        //  validate request
        let { body, headers } = getRequestData();
        if (supportsPayloads) {
          deep(body, {
            foo: 'bar'
          });
        }
        deep(headers['content-type'], defaultJsonHeader);
        deep(headers['test'], 'test-request-header');

        //  validate response
        validateTestHeader(result);
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
        });
      }));
    });
  });

  it('should handle fetch error', co.wrap(function* () {
    const testPost = post(fetch, {}, 'http://doesnotexist.nope');
    let result = yield testPost({});
    deep(result.success, false);
    deep(result.error.name, 'FetchError');
    deep(result.meta, {});
  }));
});