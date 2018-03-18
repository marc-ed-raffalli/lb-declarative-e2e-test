'use strict';

const expect = require('chai').expect,
  sinon = require('sinon');

const Test = require('./Test'),
  TestBlock = require('./base/TestBlock'),
  Request = require('./base/Request');

describe('Test', () => {

  it('instance of TestBlock', () => {
    expect(new Test()).to.be.instanceOf(TestBlock);
  });

  describe('methods', () => {

    describe('getRunTestBlock', () => {

      it('returns mocha.it', () => {
        expect(new Test().getRunTestBlock()).to.equal(it);
      });

    });

    describe('getRunOnlyTestBlock', () => {

      it('returns mocha.it.only', () => {
        expect(new Test().getRunOnlyTestBlock()).to.equal(it.only);
      });

    });

    describe('getSkipTestBlock', () => {

      it('returns mocha.it.skip', () => {
        expect(new Test().getSkipTestBlock()).to.equal(it.skip);
      });

    });

    describe('_getBody', () => {

      beforeEach(() => {
        sinon.stub(Request, 'process').returns('processResStub');
      });

      afterEach(() => {
        Request.process.restore();
      });

      it('run body on call', () => {
        const def = {def: 123},
          config = {config: 123},
          test = new Test(def, config);

        const body = test._getBody('appStub');

        expect(Request.process.called).to.be.false;

        body();

        expect(Request.process.calledOnce).to.be.true;
        expect(Request.process.calledWithExactly('appStub', def, config)).to.be.true;
      });

      it('returns value from Request.process', () => {
        // important for the mocha.it to wait for the request Promise
        expect(new Test()._getBody('app')()).to.equal('processResStub');
      });

    });

  });

});
