'use strict';

const debug = require('debug')('lb-declarative-e2e-test'),
  request = require('supertest'),
  callbackOrValue = o => typeof o === 'function' ? o() : o;

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
    return callbackOrValue(url);
  }

  static getAuth(auth) {
    return callbackOrValue(auth);
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
    const auth = Request.getAuth(definition.auth);
    definition = {...definition, auth};

    if (!auth) {
      debug('No auth defined');
      return Request.processRequest(app, definition, config);
    }

    if (Array.isArray(auth)) {
      debug(`Auth defined with ${auth.length} users`);
      return Promise.all(
        auth.map(auth =>
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

    if (definition.error || config.error) {
      definition.error = definition.error || config.error;
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

    this._expect(res => this._response = res)
      .catch(err => this._onTestError(err));

    if (typeof expected !== 'object' || (body === undefined && headers === undefined)) {
      debug('Testing response with provided expect value');
      return this._expect(expected);
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

  _onTestError(err) {
    debug('Test failed with error:', err);

    if (!this.definition.error) {
      debug('Provide an "error" callback in the definition or global config to access all info');
      return;
    }

    this.definition.error({
      error: err,
      response: this._response
    });
  }

  _expect() {
    this._request = this.request.expect.apply(this.request, arguments);
    return this.request;
  }

}

module.exports = Request;
