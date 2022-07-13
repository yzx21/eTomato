const server = require('../index');
const supertest = require('supertest');
const { expect } = require('chai');
const requestWithSupertest = supertest(server);

describe('Page loadings', () => {

    it('GET /index should show landing page', async () => {
        const res = await requestWithSupertest.get('/index');
        expect(res.status).equal(200);
        expect(res.type).to.contain('text/html');
    });

});

describe('Page redirect', () => {

    it('GET / should redirect', async () => {
        const res = await requestWithSupertest.get('/');
        expect(res.status).equal(302);
        expect(res.type).to.contain('text/plain');
    });

});

describe('Logout', () => {

    it('POST /stopSession should fail when not logged in', async () => {
        const res = await requestWithSupertest.post('/stopSession');
        expect(res.status).toEqual(200);
        expect(res.type).toEqual(expect.stringContaining('text/plain'));
        expect(res.body).toEqual(expect.stringContaining('something went wrong'));
    });

});