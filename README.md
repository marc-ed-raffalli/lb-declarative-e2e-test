# lb-declarative-e2e-test

[![Build Status](https://travis-ci.org/marc-ed-raffalli/lb-declarative-e2e-test.svg?branch=master)](https://travis-ci.org/marc-ed-raffalli/lb-declarative-e2e-test)
[![Coverage Status](https://coveralls.io/repos/github/marc-ed-raffalli/lb-declarative-e2e-test/badge.svg?branch=master)](https://coveralls.io/github/marc-ed-raffalli/lb-declarative-e2e-test?branch=master)
[![NPM version](https://img.shields.io/npm/v/lb-declarative-e2e-test.svg)](https://www.npmjs.com/package/lb-declarative-e2e-test)

`lb-declarative-e2e-test` allows to write tests for [Loopback.io][loopback] in an object definition style.

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

It combines and exposes API from [Mocha][mocha] and [supertest][supertest] but without the boilerplate.


## Installation

```bash
npm install --save-dev lb-declarative-e2e-test

# or
npm i -D lb-declarative-e2e-test
```

## Documentation

The documentation is available on the [project's page][projectPage] 

## Issues

Please share your feedback and report the encountered issues on the [project's issues page][projectIssues].

## Demo

A demo example is available on [Github][projectDemo].


[projectPage]: https://marc-ed-raffalli.github.io/en/projects/lb-declarative-e2e-test
[projectIssues]: https://github.com/marc-ed-raffalli/lb-declarative-e2e-test/issues
[projectDemo]: https://github.com/marc-ed-raffalli/loopback-example-tests

[loopback]: https://loopback.io/
[mocha]: https://mochajs.org/
[supertest]: https://github.com/visionmedia/supertest
