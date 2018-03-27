'use strict';

const expect = require('chai').expect,
  sinon = require('sinon'),
  TestGen = require('declarative-test-structure-generator');

const TestRunner = require('./TestRunner'),
  TestConfig = require('./TestConfig'),
  Request = require('./Request');

describe('TestRunner', () => {

  let app, def, config;

  describe('run', () => {

    let testSuiteDef, configStub;

    beforeEach(() => {
      app = 'app';
      config = {config: 123};
      def = {def: 123};
      configStub = 'configStub';
      testSuiteDef = {processedDef: 123};

      sinon.stub(TestConfig, 'make').returns(configStub);
      sinon.stub(TestRunner, 'generateTestSuiteDefinition').returns(testSuiteDef);
      sinon.stub(TestGen, 'run');
    });

    afterEach(() => {
      TestConfig.make.restore();
      TestRunner.generateTestSuiteDefinition.restore();
      TestGen.run.restore();
    });

    it('calls TestGen.run with test suite and config', () => {
      TestRunner.run(app, config, def);

      expect(TestConfig.make.calledOnce).to.be.true;
      expect(TestConfig.make.calledWithExactly(config)).to.be.true;

      expect(TestRunner.generateTestSuiteDefinition.calledOnce).to.be.true;
      expect(TestRunner.generateTestSuiteDefinition.calledWithExactly(app, def, configStub)).to.be.true;

      expect(TestGen.run.calledOnce).to.be.true;
      expect(TestGen.run.calledWithExactly(testSuiteDef)).to.be.true;
    });

    it('calls generate with test suite and default config', () => {
      TestRunner.run(app, def);

      expect(TestConfig.make.calledOnce).to.be.true;
      expect(TestConfig.make.calledWithExactly({})).to.be.true;

      expect(TestRunner.generateTestSuiteDefinition.calledOnce).to.be.true;
      expect(TestRunner.generateTestSuiteDefinition.calledWithExactly(app, def, configStub)).to.be.true;

      expect(TestGen.run.calledOnce).to.be.true;
      expect(TestGen.run.calledWithExactly(testSuiteDef)).to.be.true;
    });

  });

  describe('generateTestSuiteDefinition', () => {

    beforeEach(() => {
      app = 'app';
      config = {config: 123};
      def = {def: 123};

      sinon.spy(TestRunner, 'generateTestSuiteDefinition');
      sinon.stub(TestRunner, 'generateTestDefinition')
        .onFirstCall().returns('res-1')
        .onSecondCall().returns('res-2');
    });

    afterEach(() => {
      TestRunner.generateTestSuiteDefinition.restore();
      TestRunner.generateTestDefinition.restore();
    });

    it('calls self recursively when def.tests is object', () => {
      def = {
        foo: {
          tests: {
            baz: {
              tests: []
            }
          }
        },
        bar: {
          tests: []
        }
      };

      TestRunner.generateTestSuiteDefinition(app, def, config);

      expect(TestRunner.generateTestSuiteDefinition.callCount).to.equal(4);
      expect(TestRunner.generateTestSuiteDefinition.secondCall.calledWithExactly(app, def.bar, config));
      expect(TestRunner.generateTestSuiteDefinition.thirdCall.calledWithExactly(app, def.baz, config));
    });

    it('calls generateTestDefinition for each item in def.tests when is array', () => {
      def = [
        {foo: 123},
        {bar: 456}
      ];

      TestRunner.generateTestSuiteDefinition(app, def, config);

      expect(TestRunner.generateTestSuiteDefinition.calledOnce);

      expect(TestRunner.generateTestDefinition.calledTwice);
      expect(TestRunner.generateTestDefinition.firstCall.calledWithExactly(app, def[0], config));
      expect(TestRunner.generateTestDefinition.secondCall.calledWithExactly(app, def[1], config));
    });

    it('throws when def.tests is undefined', () => {
      expect(() => {
        TestRunner.generateTestSuiteDefinition(app, {foo: {}}, config);
      }).to.throw();
    });

  });

  describe('generateTestDefinition', () => {

    beforeEach(() => {
      app = 'app';
      config = {config: 123};
      def = {def: 123};

      sinon.stub(TestRunner, 'buildTest').returns('res');
    });

    afterEach(() => {
      TestRunner.buildTest.restore();
    });

    it('returns {...def, test: TestRunner.buildTest()}', () => {
      const testDefinition = TestRunner.generateTestDefinition(app, def, config);

      expect(testDefinition).to.deep.equal({
        ...def,
        test: 'res'
      });

      expect(TestRunner.buildTest.calledOnce).to.be.true;
      expect(TestRunner.buildTest.calledWithExactly(app, def, config)).to.be.true;
    });

  });

  describe('buildTest', () => {

    beforeEach(() => {
      app = 'app';
      config = {config: 123};
      def = {def: 123};

      sinon.stub(Request, 'process').returns('res');
    });

    afterEach(() => {
      Request.process.restore();
    });

    it('returns function calling Request.process', () => {
      const fn = TestRunner.buildTest(app, def, config);

      expect(Request.process.called).to.be.false;

      const res = fn();

      expect(Request.process.calledOnce).to.be.true;
      expect(Request.process.calledWithExactly(app, def, config)).to.be.true;
      expect(res).to.equal('res');
    });

  });

});
