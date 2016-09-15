# Simple Protocol Http

This module normalizes http responses using a simple, predictable protocol.  The http response body is parsed as JSON by default but gracefully falls back to text if the response body is not valid JSON.

### For successful / non-200-range responses:
```
{
  success: true,
  payload: {...}, // response body
  meta: {
    status: 200,
    statusText: 'OK',
    headers: {...}
  }
}
```

### For error / non-200-range responses:
```
{
  success: false,
  error: {...}, // response body
  meta: {
    status: 400,
    statusText: 'Bad Request',
    headers: {...}
  }
}
```

## Simple Protocol
This module is compatible with simple protocol responses.

### For Success Responses:
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
