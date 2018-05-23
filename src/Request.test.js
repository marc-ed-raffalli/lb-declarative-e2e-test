'use strict';

const expect = require('chai').expect,
  sinon = require('sinon'),
  request = require('supertest');

const Request = require('./Request'),
  TestConfig = require('./TestConfig');

describe('Request', () => {

  let req, def, config;

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

  describe('getSuperTest', () => {

    it('returns supertest', () => {
      expect(Request.getSuperTest()).to.equal(request);
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

  describe('getUrl', () => {

    it('returns url value', () => {
      expect(Request.getUrl('url')).to.equal('url');
    });

    it('returns url callback value', () => {
      expect(Request.getUrl(() => 'url')).to.equal('url');
    });

  });

  describe('getAuth', () => {

    it('returns auth value', () => {
      expect(Request.getAuth('authValue')).to.equal('authValue');
    });

    it('returns auth callback value', () => {
      expect(Request.getAuth(() => 'authValue')).to.equal('authValue');
    });

  });

  describe('applyHeaders', () => {

    it('returns request when headers is undefined', () => {
      expect(Request.applyHeaders('req', undefined)).to.equal('req');
    });

    it('calls request.set(key, value) for each header', () => {
      const req = {
          // allows chained calls
          set: sinon.stub().callsFake(() => req)
        },
        headers = {
          foo: 123,
          bar: 456
        };

      Request.applyHeaders(req, headers);

      expect(req.set.calledTwice).to.be.true;
      expect(req.set.firstCall.calledWithExactly('foo', 123)).to.be.true;
      expect(req.set.secondCall.calledWithExactly('bar', 456)).to.be.true;
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

  describe('process', () => {

    const authArr = [
      'tokenStub',
      {foo: 'bar'}
    ];

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

    describe('auth as value', () => {

      testAnonymous();
      testObjectString('tokenStub');
      testArray(authArr);

    });

    describe('auth as callback', () => {

      testAnonymous(() => undefined);
      testObjectString(() => 'tokenStub', 'tokenStub');
      testArray(() => authArr, authArr);

    });

    function testAnonymous(auth) {
      it('calls processRequest for anonymous request', () => {
        def.auth = auth;
        return Request.process('app', def, config)
          .then(() => {
            expect(Request.processRequest.calledOnce).to.be.true;
            expect(Request.processRequest.calledWithMatch('app', {...def, auth: undefined}, config)).to.be.true;

            expect(Request.processAuthenticatedRequest.called).to.be.false;
          });
      });
    }

    function testObjectString(auth, value = auth) {
      it('calls processAuthenticatedRequest when definition.auth is object/string', () => {
        def = {...def, auth};

        return Request.process('app', def, config)
          .then(() => {
            expect(Request.processAuthenticatedRequest.calledOnce).to.be.true;
            expect(Request.processAuthenticatedRequest.calledWithMatch('app', {
              ...def,
              auth: value
            }, config)).to.be.true;

            expect(Request.processRequest.called).to.be.false;
          });
      });
    }

    function testArray(auth, values = auth) {
      it('calls processAuthenticatedRequest multiple times when definition.auth is array', () => {
        def = {...def, auth};

        return Request.process('app', def, config)
          .then(() => {
            expect(Request.processAuthenticatedRequest.calledTwice).to.be.true;
            expect(Request.processAuthenticatedRequest.firstCall.calledWithExactly('app', {
              ...def,
              auth: values[0]
            }, config)).to.be.true;
            expect(Request.processAuthenticatedRequest.secondCall.calledWithExactly('app', {
              ...def,
              auth: values[1]
            }, config)).to.be.true;
          });
      });
    }

  });

  describe('processAuthenticatedRequest', () => {

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

  describe('processRequest', () => {

    let reqStub;

    beforeEach(() => {
      reqStub = {
        test: sinon.spy()
      };
      config = {config: 123};
      def = {};

      sinon.stub(Request, 'make').returns(reqStub);
    });

    afterEach(() => {
      Request.make.restore();
    });

    it('calls make and request.test()', () => {
      Request.processRequest('app', def, config);

      expect(Request.make.calledOnce).to.be.true;
      expect(reqStub.test.calledOnce).to.be.true;
    });

    it('merges headers', () => {
      def = {
        url: 'some/url/',
        headers: {foo: 123}
      };
      config = new TestConfig({
        headers: {bar: 456}
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        headers: {foo: 123, bar: 456}
      })).to.be.true;
    });

    it('request headers take priority over global config headers', () => {
      def = {
        url: 'some/url/',
        headers: {foo: 123}
      };
      config = new TestConfig({
        headers: {foo: 456, bar: 789}
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        headers: {foo: 123, bar: 789}
      })).to.be.true;
    });

    it('prepend baseUrl', () => {
      def = {
        url: 'some/url/'
      };
      config = new TestConfig({
        baseUrl: 'root/version/'
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'root/version/some/url/'
      })).to.be.true;
    });

    it('merges expect.headers', () => {
      def = {
        url: 'some/url/',
        expect: {
          headers: {foo: 123},
          preserved: 'value'
        }
      };
      config = new TestConfig({
        expect: {
          headers: {bar: 456}
        }
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        expect: {
          headers: {foo: 123, bar: 456},
          preserved: 'value'
        }
      })).to.be.true;
    });

    it('provides def.error when defined', () => {
      def = {
        url: 'some/url/',
        error: 'def error callback'
      };
      config = new TestConfig({
        error: 'config error'
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        error: 'def error callback'
      })).to.be.true;
    });

    it('merges config.error over undefined expect.error', () => {
      def = {
        url: 'some/url/'
      };
      config = new TestConfig({
        error: 'error callback'
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        error: 'error callback'
      })).to.be.true;
    });

    it('merges config.expect.headers over undefined expect.headers', () => {
      def = {
        url: 'some/url/'
      };
      config = new TestConfig({
        expect: {
          headers: {foo: 123},
          preserved: 'value'
        }
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        expect: {
          headers: {foo: 123},
          preserved: 'value'
        }
      })).to.be.true;
    });

    it('request expect.headers take priority over global config expect.headers', () => {
      def = {
        url: 'some/url/',
        expect: {
          headers: {foo: 123}
        }
      };
      config = new TestConfig({
        expect: {
          headers: {foo: 456, bar: 789}
        }
      });

      Request.processRequest('app', def, config);

      expect(Request.make.calledWithExactly('app', {
        url: 'some/url/',
        expect: {
          headers: {foo: 123, bar: 789}
        }
      })).to.be.true;
    });

  });

  describe('make', () => {

    beforeEach(() => {
      sinon.stub(Request, 'buildRequest').returns('reqStub');
    });

    afterEach(() => {
      Request.buildRequest.restore();
    });

    it('returns instance of Request', () => {
      expect(Request.make('app', {})).to.be.instanceOf(Request);
    });

  });

  describe('sendAuth', () => {

    let superTestStub,
      requestStub,
      responseStub;

    beforeEach(() => {
      requestStub = {
        post: sinon.stub().callsFake(() => requestStub),
        send: sinon.stub().callsFake(() => requestStub),
        set: sinon.stub()
          .onFirstCall().callsFake(() => requestStub)
          // Supertest resolves when request fails
          .onSecondCall().callsFake(() => Promise.resolve(responseStub))
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
      responseStub = {body: {id: 'tokenStub'}};

      const config = {auth: {url: 'users/login'}},
        auth = {foo: 'bar'};

      return Request.sendAuth('app', auth, config)
        .then(tokenId => {
          expect(tokenId).to.equal('tokenStub');

          expect(Request.getSuperTest.calledOnce).to.be.true;
          expect(superTestStub.calledWithExactly('app')).to.be.true;
        });
    });

    it('sends post request to users/login and throws when request fails', () => {
      responseStub = {body: {error: 'Error'}};

      const config = {auth: {url: 'users/login'}},
        auth = {foo: 'bar'};

      return Request.sendAuth('app', auth, config)
        .then(() => {
          throw 'Test should throw';
        })
        .catch(err => {
          expect(err).to.equal(responseStub.body.error);

          expect(Request.getSuperTest.calledOnce).to.be.true;
          expect(superTestStub.calledWithExactly('app')).to.be.true;
        });
    });

  });

  describe('test', () => {

    let requestStub;

    beforeEach(() => {
      requestStub = {catch: sinon.stub()};
      sinon.stub(Request.prototype, '_expect').returns(requestStub);
      sinon.stub(Request.prototype, '_onTestError');
      sinon.stub(Request, 'buildRequest').returns(requestStub);
    });

    afterEach(() => {
      Request.prototype._expect.restore();
      Request.prototype._onTestError.restore();
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

      expect(req._expect.calledTwice).to.be.true;
      expect(req._expect.calledWithExactly('value')).to.be.true;
    });

    it('calls expect with body value', () => {
      req = new Request('app', {
        expect: {foo: 'bar'}
      });
      req.test();

      expect(req._expect.calledTwice).to.be.true;
      expect(req._expect.calledWithExactly({foo: 'bar'})).to.be.true;
    });

    it('calls expect with def.expect.body', () => {
      req = new Request('app', {
        expect: {
          body: {foo: 'bar'}
        }
      });
      req.test();

      expect(req._expect.calledTwice).to.be.true;
      expect(req._expect.calledWithExactly({foo: 'bar'})).to.be.true;
    });

    it('calls expect with def.expect.body()', () => {
      req = new Request('app', {
        expect: {
          body: () => ({foo: 'bar'})
        }
      });
      req.test();

      expect(req._expect.calledTwice).to.be.true;
      expect(req._expect.calledWithExactly({foo: 'bar'})).to.be.true;
    });

    it('calls expect with def.expect.headers', () => {
      req = new Request('app', {
        expect: {
          headers: {
            foo: 1,
            bar: 2
          }
        }
      });
      req.test();

      expect(req._expect.calledThrice).to.be.true;
      expect(req._expect.calledWithExactly('foo', 1)).to.be.true;
      expect(req._expect.calledWithExactly('bar', 2)).to.be.true;
    });

    it('calls expect(status) with headers.status or Status-Code', () => {
      req = new Request('app', {
        expect: {
          headers: {
            'Status-Code': 456,
            // short alias
            status: 123
          }
        }
      });
      req.test();

      expect(req._expect.calledWithExactly(123)).to.be.true;
      expect(req._expect.calledWithExactly(456)).to.be.true;
    });

    it('calls expect with headers and body', () => {
      req = new Request('app', {
        expect: {
          headers: {foo: 1},
          body: {bar: 2}
        }
      });
      req.test();

      expect(req._expect.calledThrice).to.be.true;
      expect(req._expect.calledWithExactly('foo', 1)).to.be.true;
      expect(req._expect.calledWithExactly({bar: 2})).to.be.true;
    });

    it('registers _onTestError as catch', () => {
      req = new Request('app', {expect: {}});
      req.test();

      expect(req.request.catch.calledOnce).to.be.true;
      expect(req._onTestError.called).to.be.false;

      req.request.catch.firstCall.args[0]('some err');

      expect(req._onTestError.calledOnce).to.be.true;
      expect(req._onTestError.calledWithExactly('some err')).to.be.true;
    });

    it('registers _response on first expect call', () => {
      req = new Request('app', {expect: {}});

      req.test();

      expect(req._response).to.be.undefined;
      req._expect.firstCall.args[0]('resp');

      expect(req._response).to.equal('resp');
    });

  });

  describe('_onTestError', () => {

    beforeEach(() => {
      sinon.stub(Request, 'buildRequest').returns('reqStub');
    });

    afterEach(() => {
      Request.buildRequest.restore();
    });

    it('calls definition.error when provided', () => {
      def = {error: sinon.spy()};
      req = new Request('app', def);
      req._response = 'resp';

      req._onTestError('err');

      expect(def.error.calledOnce).to.be.true;
      expect(def.error.calledWithExactly({
        error: 'err',
        response: 'resp'
      })).to.be.true;
    });

    it('does not throw when definition.error is not provided', () => {
      def = {};
      req = new Request('app', def);
      req._response = 'resp';

      req._onTestError('err');
    });

  });

  describe('_expect', () => {

    let requestStub;

    beforeEach(() => {
      requestStub = {expect: sinon.stub().returns('res')};
      sinon.stub(Request, 'buildRequest').returns(requestStub);
    });

    afterEach(() => {
      Request.buildRequest.restore();
    });

    it('calls request.expect', () => {
      req = new Request('app', {});

      req._expect(1, 2, 3);

      expect(requestStub.expect.calledOnce).to.be.true;
      expect(requestStub.expect.calledWithExactly(1, 2, 3)).to.be.true;
    });

    it('sets request.expect() value to this._request', () => {
      req = new Request('app', {});

      req._expect(1, 2, 3);

      expect(req.request).to.equal('res');
    });

  });

});
