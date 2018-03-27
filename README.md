# lb-declarative-e2e-test

[![Build Status](https://travis-ci.org/marc-ed-raffalli/lb-declarative-e2e-test.svg?branch=master)](https://travis-ci.org/marc-ed-raffalli/lb-declarative-e2e-test)
[![Coverage Status](https://coveralls.io/repos/github/marc-ed-raffalli/lb-declarative-e2e-test/badge.svg?branch=master)](https://coveralls.io/github/marc-ed-raffalli/lb-declarative-e2e-test?branch=master)
[![NPM version](https://img.shields.io/npm/v/lb-declarative-e2e-test.svg)](https://www.npmjs.com/package/lb-declarative-e2e-test)

`lb-declarative-e2e-test` allows to write tests for [Loopback.io][loopback] in a object definition style.

```js
{
  name: 'admin CAN create',
  verb: 'post',
  auth: usersCredentials.admin,
  body: {some: 'value'},
  url: '/some/url/',
  expect: 200
}
```

It combines and exposes API from [Mocha][mocha] and [supertest][supertest].  
The test generation logic has been moved to [`declarative-test-structure-generator`][testGen].

## Motivations

The main motivation was to reduce the boilerplate code for every e2e tests.

In the case of a simple GET request, the test is very concise.
However, as soon as the request requires authentication, a first post request is required.

In the past, I abstracted this logic in separate functions and the complexity increased. 
Today I hope `lb-declarative-e2e-test` will help reduce the boilerplate code of many developers. 

## Feedback

Please share your feedback as I based the API out of the needs for my current LB project + nice to have.

## Usage

### Installation

```bash
npm install --save-dev lb-declarative-e2e-test

# or
npm i -D lb-declarative-e2e-test
```

### Basics

```js
const lbe2e = require('lb-declarative-e2e-test');

const server = require('../server');

lbe2e(server, {
  'Read access': {
    tests: [
      {
        name: 'unauthenticated CANNOT read',
        verb: 'get',
        url: '/some/url/',
        expect: 401
      },
      {
        name: 'admin CAN read data',
        verb: 'get',
        auth: {email: 'admin@test.server.com', password: 'test.admin'},
        url: '/some/url/',
        expect: 200
      }
    ]
  }
});
```

This code defines a test suite `Read access` and two test cases 
- `unauthenticated CANNOT read`  
  Sends an anonymous `GET` request and tests the response status is `401` 
- `admin CAN read data`  
  Sends a first requests to the default login endpoint to authenticate the user.
  Then sends an authenticated `GET` request and tests the response status is `200` 

From here, read the [test suite definition](#test-suite-definition) and the [test definition](#test-definition).

### Definitions

#### Test suite definition

It extends the definition from 
[`declarative-test-structure-generator` => test-suite-definition][testGen#testSuiteDefinition], accepts the following:

```
{
  skip:       {boolean}
  only:       {boolean}
  before:     {function|Array[function]}
  beforeEach: {function|Array[function]}
  after:      {function|Array[function]}
  afterEach:  {function|Array[function]}
  tests:      {Array[TestDefinition]|Object<string, TestSuiteDefinition>}
}
```

See the [extended definition][testGen#testSuiteDefinition] for more details.

#### Test definition

It extends the definition from 
[`declarative-test-structure-generator` => test-definition][testGen#testDefinition], accepts the following:

```
{
  name:       {string}
  skip:       {boolean}
  only:       {boolean}
  auth:       {string|Object|Array[string|Object]}
  headers:    {Object}
  body:       {function|*}
  expect:     {Object|*}
}
```

The `headers` is an `Object` mapping the key-value pairs. 
The pairs are merged over the headers in the [global config](#global-config-definition)

The `auth` should be used for authenticated requests.
The following types are supported:
- `string`: provides the tokenId to use for the request.
  It is used directly on the `Authorization` header and the request is sent without prior login. 
- `Object`: provides the credentials to use for the request (the Object provided is sent as is)
- `Array[string|Object]`: A combination of the above. 

See the [extended definition][testGen#testDefinition] for more details.

##### Expect

- The value `{*}` is passed directly to `supertest.expect()`  
  The value provided can be used to test: 
  - [HTTP status code](https://github.com/visionmedia/supertest#expectstatus-fn) 
  - [body](https://github.com/visionmedia/supertest#expectbody-fn) 
  - response with a custom [test function](https://github.com/visionmedia/supertest#expectfunctionres-).
  ```js
  {
    expect: 200
  }
  {
    expect: {foo: 'bar'}
  }
  {
    expect: response=>{ /* test response */ }
  }
  ```

- Combine multiple tests in one.  
  Each key-value pairs in `expect.headers` and `expect.body` are passed to `supertest.expect()`
  ```js
  {
    expect: {
      headers:{
        status: 200,
        'Content-Type': /json/
      },
      body: {
        foo: 'bar'
      }     
    }
  }
  ```  
  **Note:** `status` and `Status-Code` are passed without the key to `supertest.expect(value)`

- Lazy evaluation for `expect.body`.  
  Only evaluates the value when performing the test
  ```js
  {
    expect: {
      body: () => ({foo: 'bar'})     
    }
  }
  ```

#### Global config definition

All the config below are optional, see how to [specify a global config object](#specify-a-global-config-object).

```js
{
  baseUrl: 'base/url/v1',
  headers: {
    'Accept': 'application/json',
    'Accept-Language': 'en-US'
  },
  auth: {
    url: '/CustomUserModel/login/'
  },
  expect: {
    headers: {
      'content-encoding': 'gzip',
      'x-frame-options': 'DENY'
    }
  }
}
```

The `baseUrl` is prepended to the test `url`.

The `headers` is merged with the `headers` defined in the [test definition](#test-definition).
The test definition `headers` takes precedence over the global config `headers`.

The `auth.url` configures the login endpoint for the authenticated requests, defaults to `/api/users/login`. 

**IMPORTANT:** `auth.url` should be specified when the LB app extends the built-in `User` model.

The `expect.headers` is merged with the `expect.headers` defined in the [test definition](#test-definition).
The test definition `expect.headers` takes precedence over the global config `expect.headers`.

## Advanced usage

### Test suites definition structure

See [`declarative-test-structure-generator` => Test suites definition structure][testGen#testSuiteDefinitionStructure]

### Specify a global config object
 
`lbe2e` accepts 2 or 3 arguments:

```js
lbe2e(server, testsSuite);

// or
lbe2e(server, testConfig, testsSuite);
```

### Test hooks

It is possible to run one or many function at different phase of the test.  
See [`declarative-test-structure-generator` => Test hooks][testGen#hooks]

**TIP:** Use the hook feature when you need to set some test data before the tests.  
See [Mocha: Asynchronous hooks](https://mochajs.org/#asynchronous-hooks)

### Run only / skip

See [`declarative-test-structure-generator` => Run only / skip][testGen#runOnlySkip]

### Testing same request with multiple users

It is possible to test the same request with a batch of users.

```js
{
  auth: [
    'user-a-token-id',
    {username: 'user-b', password: 'user-b-pass'},
    {email: 'user-c@app.com', password: 'user-c-pass'}
  ]
}
```

See the `auth` in the [test definition](#test-definition).

**TIP:** It is a convenient way to test negative cases for ACL.

### View the test logging data

`lb-declarative-e2e-test` uses [debug][debug] to log information during the tests.

You can view these logs by setting the `DEBUG` env variable to `lb-declarative-e2e-test`.

```bash
DEBUG=lb-declarative-e2e-test npm test
```


[testGen](../declarative-test-structure-generator)
[testGen#testSuiteDefinition](../declarative-test-structure-generator#test-suite-definition)
[testGen#testDefinition](../declarative-test-structure-generator#test-definition)
[testGen#testSuiteDefinitionStructure](../declarative-test-structure-generator#test-suites-definition-structure)
[testGen#hooks](../declarative-test-structure-generator#test-hooks)
[testGen#runOnlySkip](../declarative-test-structure-generator#run-only--skip)

[debug]: https://www.npmjs.com/package/debug
[loopback]: https://loopback.io/
[mocha]: https://mochajs.org/
[supertest]: https://github.com/visionmedia/supertest
