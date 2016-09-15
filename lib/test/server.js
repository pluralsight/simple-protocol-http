'use strict';

const express = require('express');
const { safecb } = require('safe-errors');

function startServer(route) {
  return new Promise((resolve, reject) => {
    const app = express();

    let fn;
    if (route.fn) {
      fn = route.fn;
    } else {
      fn = function (req, res) {
        res.send(route.payload);
      };
    }

    app[route.method](route.path || '/', (req, res) => {
      res.set('test', 'test-header');
      fn(req, res);
    });

    let server = app.listen(3001, function (err) {
      if (err) {
        reject(err);
        return;
      } else {
        resolve();
      }
    });

    let stopServer = safecb(server.close, server);

    resolve(stopServer);
  });
}

module.exports = {
  startServer
};