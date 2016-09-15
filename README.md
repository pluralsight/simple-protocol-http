# Simple Protocol Http

This module normalizes http responses using Simple Protocol.  The http response body is parsed as JSON by default but gracefully falls back to text if the response body is not valid JSON.

## What is simple protocol?

Simple protocol is *simple*:  
1) Never intentionally throw exceptions.  
2) Return an object like this for a success:
```
{
  success: true,
  payload: {
    // the main value, i.e. the http response body
  }
}
```
3) Return an object like this for an error:
```
{
  success: false,
  error: {
    // error details or object
  }
}
```
That's it!  Both success and error cases are handled the same way and can follow the same code path.

## Installation
```
npm i --save simple-protocol-http
```

## Function Variations for Convenience

This module exposes a few function variations with lesser-used arguments pre-curried in.

The whole enchilada, i.e. full referential transparency:
```
const { get, post, put, remove} = require('simple-protocol-http').full

Function Signatures

get(fetch, fetchOptions, url)
post(fetch, fetchOptions, url, payload)
put(fetch, fetchOptions, url, payload)
remove(fetch, fetchOptions, url)

```

With fetch pre-curried in:

```
const { get, post, put, remove} = require('simple-protocol-http').options

Function Signatures

get(fetchOptions, url)
post(fetchOptions, url, payload)
put(fetchOptions, url, payload)
remove(fetchOptions, url)

```

With fetch and fetch options pre-curried in.  This is what I like to use for most things:

```
const { get, post, put, remove} = require('simple-protocol-http')

Function Signatures

get(url)
post(url, payload)
put(url, payload)
remove(url)

```

## Example Using Standard Restful Endpoints

### For successful / non-200-range responses
```
const { get } = require('simple-protocol-http')
let result = await get('http://www.example.com/api')
```
If the server returns this with a 200 status code:
```
{
  value: 'foo'
}
```
The value of result is:
```
{
  success: true,
  payload: {
    value: 'foo'
  },
  meta: {
    status: 200,
    statusText: 'OK',
    headers: {...}
  }
}
```

### For error / non-200-range responses:
```
const { get } = require('simple-protocol-http')
let result = await get('http://www.example.com/api')
```
If the server returns this with a 400 status code:
```
{
  type: 'ValidationError',
  message: 'Some field is invalid'
}
```
The value of result is:
```
{
  success: false,
  error: {
    type: 'ValidationError',
    message: 'Some field is invalid'
  },
  meta: {
    status: 400,
    statusText: 'Bad Request',
    headers: {...}
  }
}
```

## Example Using Simple Protocol Endpoints

### For Success Responses:
```
const { get } = require('simple-protocol-http')
let result = await get('http://www.example.com/api')
```
If the server returns this:
```
{
  success: true,
  payload: {
    foo: 'bar'
  }
}
```
This module will return this:
```
{
  success: true,
  payload: {
    foo: 'bar'
  },
  meta: {
    status: 200,
    statusText: 'OK',
    headers: {...}
  }
}
```

### For Unsuccessful Responses:
```
const { get } = require('simple-protocol-http')
let result = await get('http://www.example.com/api')
```
If the server returns this:
```
{
  success: false,
  error: {
    message: 'You posted something invalid'
  }
}
```
This module will return this:
```
{
  success: false,
  error: {
    message: 'You posted something invalid'
  },
  meta: {
    status: 200,
    statusText: 'OK',
    headers: {...}
  }
}
```
