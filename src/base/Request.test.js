'use strict';

const expect = require('chai').expect,
  sinon = require('sinon');

const Request = require('./Request');

describe('Request', () => {

  let req;

  describe('constructor', () => {

    beforeEach(() => {
      sinon.stub(Request, 'buildRequest').returns('requestStub');
    });

    afterEach(() => {
      Request.buildRequest.restore();
    });

    it('sets definition', () => {
      req = new Request('app', 'def');

      expect(req.definition).to.equal('def');
    });

    it('sets request', () => {
      req = new Request('app', 'def');

      expect(Request.buildRequest.calledWithExactly('app', 'def')).to.be.true;
      expect(req.request).to.equal('requestStub');
    });

  });

  describe('buildRequest', () => {

    let superTestStub,
      requestGetStub;

    beforeEach(() => {
      requestGetStub = sinon.stub().returns('reqStub');
      superTestStub = sinon.stub().returns({get: requestGetStub});

      sinon.stub(Request, 'getSuperTest').returns(superTestStub);
      sinon.stub(Request, 'getUrl').returns('urlStub');
      sinon.stub(Request, 'applyHeaders').returns('applyHeadersResStub');
      sinon.stub(Request, 'applyBody').returns('applyBodyResStub');
    });

    afterEach(() => {
      Request.getSuperTest.restore();
      Request.getUrl.restore();
      Request.applyHeaders.restore();
      Request.applyBody.restore();
    });

    it('sets request app, verb, url', () => {
      const def = {
        url: 'someUrl',
        verb: 'get'
      };

      Request.buildRequest('app', def);
      expect(Request.getSuperTest.calledOnce).to.be.true;

      expect(Request.getUrl.calledOnce).to.be.true;
      expect(Request.getUrl.calledWithExactly(def.url)).to.be.true;

      expect(superTestStub.calledOnce).to.be.true;
      expect(superTestStub.calledWithExactly('app')).to.be.true;

      expect(requestGetStub.calledOnce).to.be.true;
      expect(requestGetStub.calledWithExactly('urlStub')).to.be.true;
    });

    it('returns chain result of headers body', () => {
      const def = {
          url: 'someUrl',
          verb: 'get',
          headers: 'headers',
          body: 'body'
        },
        request = Request.buildRequest('app', def);

      expect(Request.applyHeaders.calledOnce).to.be.true;
      expect(Request.applyHeaders.calledWithExactly('reqStub', def.headers)).to.be.true;

      expect(Request.applyBody.calledOnce).to.be.true;
      expect(Request.applyBody.calledWithExactly('applyHeadersResStub', def.body)).to.be.true;

      expect(request).to.equal('applyBodyResStub');
    });

  });

  describe('applyBody', () => {

    it('returns request when body is undefined', () => {
      expect(Request.applyBody('req', undefined)).to.equal('req');
    });

    it('calls request.send(body)', () => {
      const req = {
          send: sinon.spy()
        },
        body = 'bodyStub';

      Request.applyBody(req, body);

      expect(req.send.calledOnce).to.be.true;
      expect(req.send.calledWithExactly(body)).to.be.true;
    });

    it('calls request.send(body()) when body is a function', () => {
      const req = {
          send: sinon.spy()
        },
        body = () => 'bodyStub';

      Request.applyBody(req, body);

      expect(req.send.calledOnce).to.be.true;
      expect(req.send.calledWithExactly('bodyStub')).to.be.true;
    });

  });

  describe('process', function () {

    let def, config;

    beforeEach(() => {
      def = {
        url: 'http://127.0.0.1/some/url',
        foo: 'bar'
      };
      config = {config: 123};

      sinon.stub(Request, 'processRequest').resolves();
      sinon.stub(Request, 'processAuthenticatedRequest').resolves();
    });

    afterEach(() => {
      Request.processRequest.restore();
      Request.processAuthenticatedRequest.restore();
    });

    it('calls processRequest for anonymous request', () => {
      return Request.process('app', def, config)
        .then(() => {
          expect(Request.processRequest.calledOnce).to.be.true;
          expect(Request.processRequest.calledWithExactly('app', def, config)).to.be.true;

          expect(Request.processAuthenticatedRequest.called).to.be.false;
        });
    });

    it('calls processAuthenticatedRequest when definition.auth is object/string', () => {
      def = {
        ...def,
        auth: 'tokenStub'
      };

      return Request.process('app', def, config)
        .then(() => {
          expect(Request.processAuthenticatedRequest.calledOnce).to.be.true;
          expect(Request.processAuthenticatedRequest.calledWithExactly('app', def, config)).to.be.true;

          expect(Request.processRequest.called).to.be.false;
        });
    });

    it('calls processAuthenticatedRequest multiple times when definition.auth is array', () => {
      def = {
        ...def,
        auth: [
          'tokenStub',
          {foo: 'bar'}
        ]
      };

      return Request.process('app', def, config)
        .then(() => {
          expect(Request.processAuthenticatedRequest.calledTwice).to.be.true;
          expect(Request.processAuthenticatedRequest.firstCall.calledWithExactly('app', {
            ...def,
            auth: def.auth[0]
          }, config)).to.be.true;
          expect(Request.processAuthenticatedRequest.secondCall.calledWithExactly('app', {
            ...def,
            auth: def.auth[1]
          }, config)).to.be.true;
        });
    });

  });

  describe('processAuthenticatedRequest', () => {

    let def, config;

    beforeEach(() => {
      def = {
        url: '/some/url',
        foo: 'bar'
      };
      config = {config: 123};

      sinon.stub(Request, 'sendAuth').resolves('tokenStub');
      sinon.stub(Request, 'processRequest').resolves();
    });

    afterEach(() => {
      Request.sendAuth.restore();
      Request.processRequest.restore();
    });

    it('calls processRequest with headers.Authorization: tokenId', () => {
      def = {
        ...def,
        headers: {headerFoo: 'bar'},
        auth: 'foo'
      };

      return Request.processAuthenticatedRequest('app', def, config)
        .then(() => {
          expect(Request.sendAuth.calledOnce).to.be.true;
          expect(Request.sendAuth.calledWithExactly('app', def.auth, config)).to.be.true;

          expect(Request.processRequest.calledOnce).to.be.true;
          expect(Request.processRequest.calledWithExactly('app', {
            ...def,
            headers: {
              ...def.headers,
              Authorization: 'tokenStub'
            }
          }, config)).to.be.true;
        });
    });

  });

  describe('sendAuth', () => {

    let superTestStub,
      requestStub;

    beforeEach(() => {
      requestStub = {
        post: sinon.stub().callsFake(() => requestStub),
        send: sinon.stub().callsFake(() => requestStub),
        set: sinon.stub().callsFake(() => requestStub),
        then: sinon.stub().resolves('tokenStub')
      };
      superTestStub = sinon.stub().returns(requestStub);

      sinon.stub(Request, 'getSuperTest').returns(superTestStub);
    });

    afterEach(() => {
      Request.getSuperTest.restore();
    });

    it('resolves immediately when auth is a string', () => {
      const res = Request.sendAuth('app', 'auth', {});

      expect(res.then).to.be.a('function');
      expect(Request.getSuperTest.called).to.be.false;
    });

    it('sends post request to users/login and resolves with the tokenId', () => {
      const config = {auth: {url: 'users/login'}},
        auth = {foo: 'bar'};

      return Request.sendAuth('app', auth, config)
        .then(tokenId => {
          expect(tokenId).to.equal('tokenStub');
          expect(Request.getSuperTest.calledOnce).to.be.true;
          expect(superTestStub.calledWithExactly('app')).to.be.true;
        });
    });

  });

  describe('test', () => {

    beforeEach(() => {
      sinon.stub(Request.prototype, '_expect').returns('requestStub');
      sinon.stub(Request, 'buildRequest').returns('requestStub');
    });

    afterEach(() => {
      Request.prototype._expect.restore();
      Request.buildRequest.restore();
    });

    it('returns call to expect', () => {
      req = new Request('app', {expect: 'value'});

      expect(req.test()).to.equal(req.request);
    });

    it('calls expect with value', () => {
      req = new Request('app', {
        expect: 'value'
      });
      req.test();

      expect(req._expect.calledOnce).to.be.true;
      expect(req._expect.calledWithExactly('value')).to.be.true;
    });

    it('calls expect with body value', () => {
      req = new Request('app', {
        expect: {foo: 'bar'}
      });
      req.test();

      expect(req._expect.calledOnce).to.be.true;
      expect(req._expect.calledWithExactly({foo: 'bar'})).to.be.true;
    });

    it('calls expect with def.expect.body', () => {
      req = new Request('app', {
        expect: {
          body: {foo: 'bar'}
        }
      });
      req.test();

      expect(req._expect.calledOnce).to.be.true;
      expect(req._expect.calledWithExactly({foo: 'bar'})).to.be.true;
    });

    it('calls expect with def.expect.header', () => {
      req = new Request('app', {
        expect: {
          header: {
            foo: 1,
            bar: 2
          }
        }
      });
      req.test();

      expect(req._expect.calledTwice).to.be.true;
      expect(req._expect.calledWithExactly('foo', 1)).to.be.true;
      expect(req._expect.calledWithExactly('bar', 2)).to.be.true;
    });

    it('calls expect with header and body', () => {
      req = new Request('app', {
        expect: {
          header: {foo: 1},
          body: {bar: 2}
        }
      });
      req.test();

      expect(req._expect.calledTwice).to.be.true;
      expect(req._expect.calledWithExactly('foo', 1)).to.be.true;
      expect(req._expect.calledWithExactly({bar: 2})).to.be.true;
    });

  });

});
