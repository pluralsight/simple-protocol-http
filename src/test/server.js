const express = require('express')
const { safecb } = require('safe-errors')
const bodyParser = require('body-parser')

let stopServer
let requestPayload

function startServer (route) {
  if (!stopServer) {
    stopServer = () => Promise.resolve()
  }

  return stopServer().then(() => {
    return new Promise((resolve, reject) => {
      const app = express()
      app.use(bodyParser.json())

      let fn
      if (route.fn) {
        fn = route.fn
      } else {
        fn = function (req, res) {
          res.send(route.payload)
        }
      }

      app[route.method](route.path || '/', (req, res) => {
        res.set('test', 'test-header')
        requestPayload = {
          headers: req.headers,
          body: req.body
        }
        fn(req, res)
      })

      function getRequestData () {
        return requestPayload
      }

      let server = app.listen(3001, function (err) {
        if (err) {
          reject(err)
        } else {
          stopServer = safecb(server.close, server)
          resolve({
            stopServer,
            getRequestData
          })
        }
      })
    })
  })
}

module.exports = {
  startServer
}
