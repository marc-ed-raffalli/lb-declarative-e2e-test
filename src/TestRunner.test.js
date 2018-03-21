'use strict';

const expect = require('chai').expect,
  sinon = require('sinon');

const TestRunner = require('./TestRunner'),
  TestConfig = require('./TestConfig'),
  TestSuite = require('./TestSuite');

describe('TestRunner', () => {

  describe('run', () => {

    let testStubs,
      config, def, configStub;

    beforeEach(() => {
      testStubs = [];
      config = {config: 123};
      def = {def: 123};
      configStub = 'configStub';

      sinon.stub(TestSuite, 'generate').callsFake(() => testStubs);
      sinon.stub(TestConfig, 'make').returns(configStub);
    });

    afterEach(() => {
      TestSuite.generate.restore();
      TestConfig.make.restore();
    });

    it('calls generate with test suite and config', () => {
      TestRunner.run('app', config, def);

      expect(TestSuite.generate.calledOnce).to.be.true;
      expect(TestSuite.generate.calledWithExactly(def, configStub)).to.be.true;
    });

    it('calls generate with test suite and default config', () => {
      TestRunner.run('app', def);

      expect(TestSuite.generate.calledOnce).to.be.true;
      expect(TestSuite.generate.calledWithExactly(def, configStub)).to.be.true;
    });

    it('calls run(app) on every generated test suites', () => {
      testStubs = [
        {run: sinon.spy()},
        {run: sinon.spy()}
      ];

      TestRunner.run('app', config, def);

      testStubs.forEach(stub => {
        expect(stub.run.calledOnce).to.be.true;
        expect(stub.run.calledWithExactly('app')).to.be.true;
      });
    });

  });

});
