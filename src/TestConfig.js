'use strict';

module.exports = class TestConfig {

  constructor(config = {}) {
    this._config = config;
  }

  get config() {
    return this._config;
  }

  get headers() {
    return this._config.headers;
  }

  get auth() {
    return Object.assign({}, {url: '/api/users/login'}, this.config.auth);
  }

  static make(config) {
    return new TestConfig(config);
  }

};
