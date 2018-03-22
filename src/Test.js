'use strict';

const debug = require('debug')('lb-declarative-e2e-test'),
  TestBlock = require('./base/TestBlock'),
  Request = require('./base/Request');

module.exports = class Test extends TestBlock {

  constructor(definition = {}, config) {
    super(definition, config);
  }

  static generate(def = {}, config) {
    return Object.keys(def)
      .map(key => new Test(def[key], config));
  }

  getRunTestBlock() {
    return TestBlock.getTestLib().it;
  }

  getRunOnlyTestBlock() {
    return TestBlock.getTestLib().it.only;
  }

  getSkipTestBlock() {
    return TestBlock.getTestLib().it.skip;
  }

  _getBody(app) {
    return () => {
      debug(`Test ${this.name}: started`);
      return Request.process(app, this.definition, this.config);
    };
  }

};
