'use strict';

const expect = require('chai').expect,
  sinon = require('sinon');

const Test = require('./Test'),
  TestSuite = require('./TestSuite'),
  TestBlock = require('./base/TestBlock');

describe('TestSuite', () => {

  let testSuite;

  it('instance of TestBlock', () => {
    expect(new TestSuite()).to.be.instanceOf(TestBlock);
  });

  describe('constructor', () => {

    it('sets `tests` tests as Tests', () => {
      testSuite = new TestSuite({
        tests: [{}]
      });

      testSuite.tests.forEach(t => {
        expect(t instanceof Test).to.be.true;
      });
    });

    it('sets `tests` as nested TestSuite', () => {
      testSuite = new TestSuite({
        tests: {name: {}}
      });

      testSuite.tests.forEach(t => {
        expect(t instanceof TestSuite).to.be.true;
      });
    });

  });

  describe('Hooks Getters', () => {

    let hookFunc;

    beforeEach(() => {
      hookFunc = () => {
      };
    });

    describe('before', () => {

      it('returns [definition.before] when function', () => {
        testSuite = new TestSuite({before: hookFunc});
        expect(testSuite.before).to.deep.equal([hookFunc]);
      });

      it('returns [] when undefined', () => {
        testSuite = new TestSuite();
        expect(testSuite.before).to.deep.equal([]);
      });

      it('returns definition.before array', () => {
        testSuite = new TestSuite({before: [hookFunc]});
        expect(testSuite.before).to.deep.equal([hookFunc]);
      });

    });

    describe('beforeEach', () => {

      it('returns [definition.beforeEach] when function', () => {
        testSuite = new TestSuite({beforeEach: hookFunc});
        expect(testSuite.beforeEach).to.deep.equal([hookFunc]);
      });

      it('returns [] when undefined', () => {
        testSuite = new TestSuite();
        expect(testSuite.beforeEach).to.deep.equal([]);
      });

      it('returns definition.beforeEach array', () => {
        testSuite = new TestSuite({beforeEach: [hookFunc]});
        expect(testSuite.beforeEach).to.deep.equal([hookFunc]);
      });

    });

    describe('after', () => {

      it('returns [definition.after] when function', () => {
        testSuite = new TestSuite({after: hookFunc});
        expect(testSuite.after).to.deep.equal([hookFunc]);
      });

      it('returns [] when undefined', () => {
        testSuite = new TestSuite();
        expect(testSuite.after).to.deep.equal([]);
      });

      it('returns definition.after array', () => {
        testSuite = new TestSuite({after: [hookFunc]});
        expect(testSuite.after).to.deep.equal([hookFunc]);
      });

    });

    describe('afterEach', () => {

      it('returns [definition.afterEach] when function', () => {
        testSuite = new TestSuite({afterEach: hookFunc});
        expect(testSuite.afterEach).to.deep.equal([hookFunc]);
      });

      it('returns [] when undefined', () => {
        testSuite = new TestSuite();
        expect(testSuite.afterEach).to.deep.equal([]);
      });

      it('returns definition.afterEach array', () => {
        testSuite = new TestSuite({afterEach: [hookFunc]});
        expect(testSuite.afterEach).to.deep.equal([hookFunc]);
      });

    });

  });

  describe('methods', () => {

    describe('_getBody', () => {

      beforeEach(() => {
        sinon.spy(TestSuite.prototype, '_runHooks');
        sinon.spy(TestSuite.prototype, '_runTests');
      });

      afterEach(() => {
        TestSuite.prototype._runHooks.restore();
        TestSuite.prototype._runTests.restore();
      });

      it('run body on call', () => {
        testSuite = new TestSuite();

        const body = testSuite._getBody('appStub');

        expect(testSuite._runHooks.called).to.be.false;
        expect(testSuite._runTests.called).to.be.false;

        body();

        expect(testSuite._runHooks.calledOnce).to.be.true;
        expect(testSuite._runTests.calledOnce).to.be.true;
        expect(testSuite._runTests.calledWithExactly('appStub')).to.be.true;
      });

    });

    describe('_runHooks', () => {

      let hookSpies;

      beforeEach(() => {
        hookSpies = {
          before: sinon.spy(),
          beforeEach: sinon.spy(),
          after: sinon.spy(),
          afterEach: sinon.spy()
        };

        sinon.stub(TestBlock, 'getTestLib').returns(hookSpies);
      });

      afterEach(() => {
        TestBlock.getTestLib.restore();
      });

      function testHook(hookName) {
        it(`runs hook ${hookName}`, () => {

          const hookStubs = [
            'hook-1',
            'hook-2'
          ];

          testSuite = new TestSuite({[hookName]: hookStubs});
          testSuite._runHooks();

          expect(hookSpies[hookName].callCount).to.equal(hookStubs.length);

          hookStubs.forEach(stub => {
            expect(hookSpies[hookName].calledWith(stub)).to.be.true;
          });
        });
      }

      testHook('before');
      testHook('beforeEach');
      testHook('after');
      testHook('afterEach');

    });

    describe('_runTests', () => {

      let testStubs;

      beforeEach(() => {
        // allows generating stubs in the test
        sinon.stub(Test, 'generate').callsFake(() => testStubs);
      });

      afterEach(() => {
        Test.generate.restore();
      });

      it('calls run() on all registered tests', () => {
        testStubs = [
          {run: sinon.spy()},
          {run: sinon.spy()}
        ];

        testSuite = new TestSuite({tests: testStubs});
        testSuite._runTests('appStub');

        testStubs.forEach(test => {
          expect(test.run.calledOnce).to.be.true;
          expect(test.run.calledWithExactly('appStub')).to.be.true;
        });

      });

    });

    describe('getRunTestBlock', () => {

      it('returns mocha.describe', () => {
        expect(new TestSuite().getRunTestBlock()).to.equal(describe);
      });

    });

    describe('getRunOnlyTestBlock', () => {

      it('returns mocha.describe.only', () => {
        expect(new TestSuite().getRunOnlyTestBlock()).to.equal(describe.only);
      });

    });

    describe('getSkipTestBlock', () => {

      it('returns mocha.describe.skip', () => {
        expect(new TestSuite().getSkipTestBlock()).to.equal(describe.skip);
      });

    });

  });

});
