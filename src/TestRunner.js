'use strict';

const TestSuite = require('./TestSuite'),
  TestConfig = require('./TestConfig');

class TestRunner {

  constructor(config) {
    this.config = new TestConfig(config);
  }

  run(app, testSuiteDefinition = {}) {
    TestSuite.generate(testSuiteDefinition, this.config)
      .forEach(testSuite => testSuite.run(app));
  }

}

module.exports = TestRunner;
