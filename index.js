'use strict';

const TestRunner = require('./src/TestRunner');

module.exports = (app, config, testSuiteDefinition) => {
  new TestRunner(config)
    .run(app, testSuiteDefinition);
};
