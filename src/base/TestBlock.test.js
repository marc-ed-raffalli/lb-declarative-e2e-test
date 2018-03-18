'use strict';

const expect = require('chai').expect,
  sinon = require('sinon');

const TestBlock = require('./TestBlock');

describe('TestBlock', () => {

  let testBlock;

  describe('constructor', () => {

    it('sets `skip`', () => {
      testBlock = new TestBlock({skip: true});

      expect(testBlock.skip).to.be.true;
    });

    it('sets `only`', () => {
      testBlock = new TestBlock({only: true});

      expect(testBlock.only).to.be.true;
    });

  });

  describe('methods', () => {

    describe('run', () => {

      let testSpy,
        testOnlySpy,
        testSkipSpy,
        appStub,
        testSuitBodyStub;

      beforeEach(() => {
        testSpy = sinon.spy();
        testOnlySpy = sinon.spy();
        testSkipSpy = sinon.spy();

        testSpy.only = testOnlySpy;
        testSpy.skip = testSkipSpy;

        sinon.stub(TestBlock.prototype, 'getRunTestBlock').returns(testSpy);
        sinon.stub(TestBlock.prototype, 'getRunOnlyTestBlock').returns(testOnlySpy);
        sinon.stub(TestBlock.prototype, 'getSkipTestBlock').returns(testSkipSpy);

        appStub = 'appStub';
        testSuitBodyStub = 'testSuitBodyStub';
        sinon.stub(TestBlock.prototype, '_getBody').returns(testSuitBodyStub);
      });

      afterEach(() => {
        TestBlock.prototype.getRunTestBlock.restore();
        TestBlock.prototype.getRunOnlyTestBlock.restore();
        TestBlock.prototype.getSkipTestBlock.restore();
        TestBlock.prototype._getBody.restore();
      });

      it('calls getRunTestBlock', () => {
        testBlock = new TestBlock({name: 'foo'});
        testBlock.run(appStub);

        expect(testSpy.calledOnce).to.be.true;
        expect(testSpy.calledWith('foo', testSuitBodyStub)).to.be.true;
        expect(testBlock._getBody.calledWithExactly(appStub));

        expect(testOnlySpy.called).to.be.false;
        expect(testSkipSpy.called).to.be.false;
      });

      it('calls getSkipTestBlock', () => {
        testBlock = new TestBlock({name: 'foo', skip: true});
        testBlock.run(appStub);

        expect(testSkipSpy.calledOnce).to.be.true;
        expect(testSkipSpy.calledWith('foo', testSuitBodyStub)).to.be.true;
        expect(testBlock._getBody.calledWithExactly(appStub));

        expect(testSpy.called).to.be.false;
        expect(testOnlySpy.called).to.be.false;
      });

      it('calls getRunOnlyTestBlock', () => {
        testBlock = new TestBlock({name: 'foo', only: true});
        testBlock.run(appStub);

        expect(testOnlySpy.calledOnce).to.be.true;
        expect(testOnlySpy.calledWith('foo', testSuitBodyStub)).to.be.true;
        expect(testBlock._getBody.calledWithExactly(appStub));

        expect(testSpy.called).to.be.false;
        expect(testSkipSpy.called).to.be.false;
      });

    });

  });

});
