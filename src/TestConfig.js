'use strict';

const defaultAuth = {url: '/api/users/login'};

module.exports = class TestConfig {

  constructor(config = {}) {
    this._config = config;
  }

  get config() {
    return this._config;
  }

  get baseUrl() {
    return this._config.baseUrl;
  }

  get headers() {
    return this._config.headers;
  }

  get error() {
    return this._config.error;
  }

  get expect() {
    return this._config.expect;
  }

  get auth() {
    return {
      ...defaultAuth,
      ...this.config.auth
    };
  }

  static make(config) {
    return new TestConfig(config);
  }

};
