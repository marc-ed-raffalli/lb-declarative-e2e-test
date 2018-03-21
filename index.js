'use strict';

const TestRunner = require('./src/TestRunner');

module.exports = (app, config, testSuiteDefinition) => {
  TestRunner.run(app, config, testSuiteDefinition);
};
