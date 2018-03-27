'use strict';

const debug = require('debug')('lb-declarative-e2e-test'),
  request = require('supertest');

class Request {

  constructor(app, definition = {}) {
    this.definition = definition;

    this._request = Request.buildRequest(app, definition);
  }

  get request() {
    return this._request;
  }

  get expected() {
    return this.definition.expect;
  }

  static getSuperTest() {
    return request;
  }

  static buildRequest(app, definition) {
    const url = Request.getUrl(definition.url);
    debug(`Building ${definition.verb} request for ${url}`);

    let request;
    request = Request.getSuperTest()(app)[definition.verb](url);
    request = Request.applyHeaders(request, definition.headers);
    request = Request.applyBody(request, definition.body);

    return request;
  }

  static getUrl(url) {
    return typeof url === 'function' ? url() : url;
  }

  static applyHeaders(request, headers) {
    if (!headers) {
      debug('No header defined');
      return request;
    }

    const keys = Object.keys(headers);

    debug(`Applying ${keys.length} headers: ${keys.join(', ')}`);
    keys.forEach(key => {
      request = request.set(key, headers[key]);
    });

    return request;
  }

  static applyBody(request, body) {
    if (!body) {
      debug('No body defined');
      return request;
    }

    const isFunc = typeof body === 'function';
    debug(`Applying body ${isFunc ? 'from function' : 'object'}`);
    return request.send(isFunc ? body() : body);
  }

  static process(app, definition, config) {
    const authDef = definition.auth;

    if (!authDef) {
      debug('No auth defined');
      return Request.processRequest(app, definition, config);
    }

    if (Array.isArray(definition.auth)) {
      debug(`Auth defined with ${definition.auth.length} users`);
      return Promise.all(
        definition.auth.map(auth =>
          Request.processAuthenticatedRequest(app, {
            ...definition,
            auth
          }, config))
      );
    }

    debug('Auth defined for a single user');
    return Request.processAuthenticatedRequest(app, definition, config);
  }

  static processAuthenticatedRequest(app, definition, config) {
    return Request.sendAuth(app, definition.auth, config)
      .then(tokenId => {
        return Request.processRequest(app, {
          ...definition,
          headers: {
            ...definition.headers,
            Authorization: tokenId
          }
        }, config);
      });
  }

  static processRequest(app, definition, config) {
    definition = {
      ...definition,
      url: config.baseUrl ? config.baseUrl + definition.url : definition.url
    };

    if (definition.headers || config.headers) {
      debug('Merging definition headers with global config headers');
      definition.headers = {
        ...config.headers,
        ...definition.headers
      };
    }
    else {
      debug('No header found');
    }

    const defExpect = definition.expect || {},
      configExpect = config.expect;

    if ((defExpect && defExpect.headers) || (configExpect && configExpect.headers)) {
      definition.expect = {
        ...configExpect,
        ...defExpect,
        headers: {
          ...configExpect.headers,
          ...defExpect.headers
        }
      };
    }
    else {
      debug('No expected header found');
    }

    return Request.make(app, definition).test();
  }

  static sendAuth(app, auth, config) {
    if (typeof auth === 'string') {
      debug('auth token provided, skipping login request');
      return Promise.resolve(auth);
    }

    debug(`Sending login request to ${config.auth.url} with user ${JSON.stringify(auth)}`);
    return Request.getSuperTest()(app)
      .post(config.auth.url)
      .send(auth)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .then(res => {
        if (res.body.error) {
          debug(`Login request to ${config.auth.url} with user ${JSON.stringify(auth)} failed`);
          throw res.body.error;
        }

        debug('Login request succeeded');
        return res.body.id;
      });
  }

  static make(app, definition) {
    return new Request(app, definition);
  }

  test() {
    debug('Executing tests on the response');

    const expected = this.expected,
      headers = expected.headers,
      body = expected.body;

    if (typeof expected !== 'object' || (body === undefined && headers === undefined)) {
      debug('Testing response with provided expect value');
      this._expect(expected);

      return this.request;
    }

    if (headers) {
      debug('Testing response headers');
      Object.keys(headers).forEach(key => {
        // fix for supertest not accepting expect('status', xxx)
        if (key === 'status' || key === 'Status-Code') {
          return this._expect(headers[key]);
        }

        this._expect(key, headers[key]);
      });
    }

    if (body) {
      debug('Testing response body');
      this._expect(typeof body === 'function' ? body() : body);
    }

    return this.request;
  }

  _expect() {
    this._request = this.request.expect.apply(this.request, arguments);
  }

}

module.exports = Request;
