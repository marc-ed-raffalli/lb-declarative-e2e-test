'use strict';

const debug = require('debug')('lb-declarative-e2e-test');

module.exports = class TestBlock {

  constructor(definition = {}, config = {}) {
    this._definition = definition;
    this._config = config;
  }

  get definition() {
    return this._definition;
  }

  get config() {
    return this._config;
  }

  get name() {
    return this._definition.name;
  }

  get skip() {
    return this._definition.skip === true;
  }

  get only() {
    return this._definition.only === true;
  }

  /**
   * Used for test stubs only.
   *
   * @return {Object}
   * @private
   */
  static getTestLib() {
    // returns global as Mocha exposes globally describe, it, etc
    return global;
  }

  getRunTestBlock() {
    throw 'must be implemented';
  }

  getRunOnlyTestBlock() {
    throw 'must be implemented';
  }

  getSkipTestBlock() {
    throw 'must be implemented';
  }

  _getBody() {
    throw 'must be implemented';
  }

  run(app) {
    debug(`Defining test block for "${this.name}"`);
    let runBlockFct = this.getRunTestBlock();

    if (this.skip) {
      debug(`"${this.name}": skip: true`);
      runBlockFct = this.getSkipTestBlock();
    }
    else if (this.only) {
      debug(`"${this.name}": only: true`);
      runBlockFct = this.getRunOnlyTestBlock();
    }

    runBlockFct(this.name, this._getBody(app));
  }

};
