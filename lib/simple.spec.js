'use strict';

var co = require('co');
var deep = require('assert').deepEqual;

var _require$options = require('./simple').options;

var post = _require$options.post;
var get = _require$options.get;
var put = _require$options.put;
var remove = _require$options.remove;

var _require = require('./test/server');

var startServer = _require.startServer;

var defaultJsonHeader = 'application/json;charset=UTF-8';
var apiUrl = 'http://localhost:3001';

describe('simple protocol', function () {
  var config = [{
    method: 'get',
    fn: get,
    supportsPayloads: false
  }, {
    method: 'post',
    fn: post,
    supportsPayloads: true
  }, {
    method: 'put',
    fn: put,
    supportsPayloads: true
  }, {
    method: 'delete',
    fn: remove,
    supportsPayloads: false
  }];

  config.forEach(function (_ref) {
    var fn = _ref.fn;
    var method = _ref.method;
    var supportsPayloads = _ref.supportsPayloads;

    var makeRequest = function makeRequest() {
      var options = {
        headers: {
          'content-type': defaultJsonHeader,
          test: 'test-request-header'
        }
      };

      var body = {
        foo: 'bar'
      };

      var args = [options, apiUrl];

      if (supportsPayloads) {
        args.push(body);
      }

      return fn.apply(null, args);
    };

    var validateRequest = function validateRequest(getRequestData) {
      var _getRequestData = getRequestData();

      var body = _getRequestData.body;
      var headers = _getRequestData.headers;

      if (supportsPayloads) {
        deep(body, {
          foo: 'bar'
        });
      }
      deep(headers['content-type'], defaultJsonHeader);
      deep(headers['test'], 'test-request-header');
    };

    function validateHeaders(result) {
      deep(result.meta.headers.test, 'test-header');
    }

    function validateResult(actual, expected) {
      deep(actual, expected);
    }

    describe(method, function () {
      it('should normalize http response to simple protocol', co.wrap(regeneratorRuntime.mark(function _callee() {
        var _ref2, getRequestData, result;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return startServer({
                  method: method,
                  payload: {
                    message: 'hi'
                  }
                });

              case 2:
                _ref2 = _context.sent;
                getRequestData = _ref2.getRequestData;
                _context.next = 6;
                return makeRequest();

              case 6:
                result = _context.sent;

                validateRequest(getRequestData);

                validateHeaders(result);

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
                });

              case 10:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      })));

      it('should set payload as text body if it is not JSON', co.wrap(regeneratorRuntime.mark(function _callee2() {
        var _ref3, getRequestData, result;

        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return startServer({
                  method: method,
                  payload: 'hi'
                });

              case 2:
                _ref3 = _context2.sent;
                getRequestData = _ref3.getRequestData;
                _context2.next = 6;
                return makeRequest();

              case 6:
                result = _context2.sent;

                validateRequest(getRequestData);

                validateHeaders(result);

                validateResult(result, {
                  success: true,
                  payload: 'hi',
                  meta: {
                    status: 200,
                    statusText: 'OK',
                    headers: result.meta.headers
                  }
                });

              case 10:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      })));

      it('should normalize 204 "No Content" response to simple protocol', co.wrap(regeneratorRuntime.mark(function _callee3() {
        var _ref4, getRequestData, result;

        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return startServer({
                  method: method,
                  fn: function fn(req, res) {
                    res.status(204);
                    res.end();
                  }
                });

              case 2:
                _ref4 = _context3.sent;
                getRequestData = _ref4.getRequestData;
                _context3.next = 6;
                return makeRequest();

              case 6:
                result = _context3.sent;

                validateRequest(getRequestData);

                validateHeaders(result);

                validateResult(result, {
                  success: true,
                  payload: {},
                  meta: {
                    status: 204,
                    statusText: 'No Content',
                    headers: result.meta.headers
                  }
                });

              case 10:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      })));

      it('should handle http error', co.wrap(regeneratorRuntime.mark(function _callee4() {
        var _ref5, getRequestData, result;

        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return startServer({
                  method: method,
                  fn: function fn(req, res) {
                    res.status(500);
                    res.send({
                      message: 'something bad happened'
                    });
                  }
                });

              case 2:
                _ref5 = _context4.sent;
                getRequestData = _ref5.getRequestData;
                _context4.next = 6;
                return makeRequest();

              case 6:
                result = _context4.sent;

                validateRequest(getRequestData);

                validateHeaders(result);

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
                });

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      })));

      it('should handle successful simple protocol response', co.wrap(regeneratorRuntime.mark(function _callee5() {
        var _ref6, getRequestData, result;

        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.next = 2;
                return startServer({
                  method: method,
                  payload: {
                    success: true,
                    payload: {
                      message: 'hi'
                    }
                  }
                });

              case 2:
                _ref6 = _context5.sent;
                getRequestData = _ref6.getRequestData;
                _context5.next = 6;
                return makeRequest();

              case 6:
                result = _context5.sent;

                validateRequest(getRequestData);

                validateHeaders(result);

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
                });

              case 10:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      })));

      it('should handle simple protocol error response', co.wrap(regeneratorRuntime.mark(function _callee6() {
        var _ref7, getRequestData, result;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return startServer({
                  method: method,
                  payload: {
                    success: false,
                    error: {
                      message: 'this is bad'
                    }
                  }
                });

              case 2:
                _ref7 = _context6.sent;
                getRequestData = _ref7.getRequestData;
                _context6.next = 6;
                return makeRequest();

              case 6:
                result = _context6.sent;

                validateRequest(getRequestData);

                validateHeaders(result);

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
                });

              case 10:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      })));
    });
  });

  it('should handle fetch error', co.wrap(regeneratorRuntime.mark(function _callee7() {
    var result;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return post({}, 'http://doesnotexist.nope', {});

          case 2:
            result = _context7.sent;

            deep(result.success, false);
            deep(result.error.name, 'FetchError');
            deep(result.meta, {});

          case 6:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  })));
});