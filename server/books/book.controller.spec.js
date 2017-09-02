const expect = require('chai').expect;
const httpMocks = require('node-mocks-http');
const td = require('testdouble');
const responses = require('../responses');
const Book = require('../models').book;
const controller = require('./book.controller');

describe('Books controller', () => {
  afterEach(() => {
    td.reset();
  });
  describe('When getting a list of books', () => {
    it('Should return ok', () => {
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      const all = td.replace(Book, 'all');
      td.when(all()).thenResolve({});

      const ok = td.replace(responses, 'ok');

      return controller.list(req, res).then(() => {
        td.verify(ok(res));
      });
    });

    describe('And the call fails', () => {
      it('Should call server error', () => {
        const all = td.replace(Book, 'all');
        td.when(all()).thenReject('err');

        const err = td.replace(responses, 'serverError');

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        return controller.list(req, res).then(() => {
          td.verify(err(res, 'err'));
        });
      });
    });
  });


  const fakeById = (id, obj) => {
    const findById = td.replace(Book, 'findById');
    const returnObject = obj === null || obj ?
      obj :
      {
        name: 'test',
        id: 1
      };

    td.when(findById(id || 1))
      .thenResolve(returnObject);
  };

  describe('When getting a specific item', () => {
    afterEach(() => {
      td.reset();
    });

    it('Should return a status code 200', () => {
      fakeById();
      const req = httpMocks.createRequest({
        params: {
          id: 1
        }
      });

      const res = httpMocks.createResponse();

      return controller.getById(req, res).then(() => {
        return expect(res.statusCode).to.eql(200);
      });
    });

    it('Should send the account back', () => {
      fakeById();
      const req = httpMocks.createRequest({
        params: {
          id: 1
        }
      });

      const res = httpMocks.createResponse();

      return controller.getById(req, res).then(() => {
        expect(res._getData()).to.eql({
          id: 1,
          name: 'test'
        });
      });
    });

    describe('When the call fails', () => {
      it('Should set status to 500', () => {
        const findById = td.replace(Book, 'findById');
        td.when(findById(1))
          .thenReject({});

        const req = httpMocks.createRequest({
          params: {
            id: 1
          }
        });

        const res = httpMocks.createResponse();

        return controller.getById(req, res).then(() => {
          return expect(res.statusCode).to.eql(500);
        });
      });

      it('Should send the error back', () => {
        const findById = td.replace(Book, 'findById');
        td.when(findById(1))
          .thenReject('test');

        const req = httpMocks.createRequest({
          params: {
            id: 1
          }
        });

        const res = httpMocks.createResponse();

        return controller.getById(req, res).then(() => {
          expect(res._getData()).to.eql('test');
        });
      });
    });
  });

  const fakeDestroy = () => {
    const destroy = td.replace(Book, 'destroy');
    td.when(destroy()).thenResolve({});

    fakeById(1, {
      destroy
    });
  };

  describe('When deleting an item', () => {
    it('Should set the status of 204', () => {
      fakeDestroy();

      const req = httpMocks.createRequest({
        params: {
          id: 1
        }
      });

      const res = httpMocks.createResponse();

      return controller.deleteById(req, res).then(() =>{
        return expect(res.statusCode).to.eql(204);
      });
    });

    it('Should send an empty result', () => {
      fakeDestroy();

      const req = httpMocks.createRequest({
        params: {
          id: 1
        }
      });

      const res = httpMocks.createResponse();

      return controller.deleteById(req, res).then(() =>{
        expect(res._getData()).to.eql('');
      });
    });

    describe('And the account does not exit', () => {
      it('Should return a 204', () => {
        fakeById(1, null);

        const req = httpMocks.createRequest({
          params: {
            id: 1
          }
        });

        const res = httpMocks.createResponse();

        return controller.deleteById(req, res).then(() => {
          return expect(res.statusCode).to.eql(204);
        });

      });
    });
  });

  describe('When updating an object', () => {
    it('Should return a 200', () => {
      const update = td.replace(Book, 'update');
      td.when(update({
        name: 'test'
      })).thenResolve({
        id: 1,
        name: 'test'
      });

      fakeById(1, {
        id: 1,
        update: update
      });

      const req = httpMocks.createRequest({
        params: {
          id: 1
        }, body: {
          name: 'test'
        }
      });

      const res = httpMocks.createResponse();

      return controller.updateById(req, res).then(() => {
        return expect(res.statusCode).to.eql(200);
      });
    });
  });

  const fakeCreate = () => {
    const create = td.replace(Book, 'create');
    td.when(create({
      name: 'New Book'
    })).thenResolve({
      dataValues: {
        id: 1,
        name: 'New Book'
      }
    });
  };

  describe('When creating an object', () => {
    it('Should set status 200', () => {
      fakeCreate();

      const req = httpMocks.createRequest({
        body: {
          name: 'New Book'
        }
      });

      const res = httpMocks.createResponse();

      return controller.create(req, res).then(() => {
        return expect(res.statusCode).to.eql(200);
      });
    });

    it('Should include a link to itself in the respose', () => {
      fakeCreate();

      const req = httpMocks.createRequest({
        body: {
          name: 'New Book'
        },
        originalUrl: 'accounts',
        protocol: 'http',
      });

      req.get = () => {
        return 'localhost:3000';
      };

      const res = httpMocks.createResponse();

      return controller.create(req, res).then(() => {
        expect(res._getData()).to.eql({
          dataValues: {
            id: 1,
            name: 'New Book',
            links: [{
              rel: 'self',
              href: 'http://localhost:3000/accounts/1'
            }]
          }
        });
      });
    });

    describe('And the call failed', () => {
      it('Should return 500', () => {
        const create = td.replace(Book, 'create');
        td.when(create({
          name: 'New Book'
        })).thenReject({});

        const req = httpMocks.createRequest({
          body: {
            name: 'New Book'
          }
        });

        const res = httpMocks.createResponse();

        return controller.create(req, res).then(() => {
          expect(res.statusCode).to.eql(500);
        });
      });
    });
  });
});