'use strict';

const expect = require('chai').expect;

const TestConfig = require('./TestConfig');

describe('TestConfig', () => {

  describe('constructor', () => {

    it('sets config', () => {
      expect(new TestConfig('foo').config).to.equal('foo');
    });

  });

  describe('baseUrl', () => {

    it('returns config.headers', () => {
      expect(new TestConfig({baseUrl: 'base/url/v1'}).baseUrl).to.equal('base/url/v1');
    });

  });

  describe('headers', () => {

    it('returns config.headers', () => {
      expect(new TestConfig({headers: 'foo'}).headers).to.equal('foo');
    });

  });

  describe('auth', () => {

    it('returns config.auth', () => {
      expect(new TestConfig({auth: {url: 'foo'}}).auth).to.deep.equal({url: 'foo'});
    });

    it('returns default auth config', () => {
      expect(new TestConfig().auth).to.deep.equal({url: '/api/users/login'});
    });

  });

  describe('make', () => {

    it('returns instance of TestConfig', () => {
      const tConf = TestConfig.make('config');

      expect(tConf).to.be.instanceOf(TestConfig);
      expect(tConf.config).to.equal('config');
    });

  });

});
