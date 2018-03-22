'use strict';

const debug = require('debug')('lb-declarative-e2e-test'),
  Test = require('./Test'),
  TestBlock = require('./base/TestBlock'),
  hooks = [
    'before', 'beforeEach',
    'after', 'afterEach'
  ],
  hookGetter = hook => {
    if (!hook) {
      return [];
    }

    return Array.isArray(hook) ? hook : [hook];
  },
  log = (ts, msg) => debug(`Test suite "${ts.name}": ${msg}`);

module.exports = class TestSuite extends TestBlock {

  constructor(definition = {}, config) {
    super(definition, config);

    this.tests = Array.isArray(this.definition.tests)
      ? Test.generate(this.definition.tests, config)
      : TestSuite.generate(this.definition.tests, config);
  }

  get before() {
    return hookGetter(this.definition.before);
  }

  get beforeEach() {
    return hookGetter(this.definition.beforeEach);
  }

  get after() {
    return hookGetter(this.definition.after);
  }

  get afterEach() {
    return hookGetter(this.definition.afterEach);
  }

  static generate(def = {}, config) {
    return Object.keys(def)
      .map(key => new TestSuite({name: key, ...def[key]}, config));
  }

  getRunTestBlock() {
    return describe;
  }

  getRunOnlyTestBlock() {
    return describe.only;
  }

  getSkipTestBlock() {
    return describe.skip;
  }

  _getBody(app) {
    return () => {
      log(this, 'started');
      this._runHooks();
      this._runTests(app);
    };
  }

  _runHooks() {
    log(this, 'defining hooks');
    const testLib = TestBlock.getTestLib();

    hooks.forEach(hookName => {
      log(this, `getting "${hookName}" hook(s)`);
      const testSuiteHooks = this[hookName];

      if (testSuiteHooks.length === 0) {
        log(this, `no "${hookName}" hook found`);
        return;
      }

      log(this, `${testSuiteHooks.length} "${hookName}" hook(s) found`);

      testSuiteHooks.forEach((hook, i) => {
        log(this, `defining "${hookName}" [${i}]`);
        testLib[hookName](hook);
      });
    });
  }

  _runTests(app) {
    this.tests.forEach(test => test.run(app));
  }

};
