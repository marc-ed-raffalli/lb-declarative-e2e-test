'use strict';

const debug = require('debug')('lb-declarative-e2e-test'),
  TestSuite = require('./TestSuite'),
  TestConfig = require('./TestConfig');

class TestRunner {

  static run(app, config, testSuiteDefinition = {}) {
    if (arguments.length === 2) {
      debug('Running with default config');
      config = {};
      testSuiteDefinition = arguments[1];
    }

    config = TestConfig.make(config);

    TestSuite.generate(testSuiteDefinition, config)
      .forEach(testSuite => testSuite.run(app));
  }

}

module.exports = TestRunner;
