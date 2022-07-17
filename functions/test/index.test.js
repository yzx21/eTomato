const server = require('../index');
const supertest = require('supertest');
const { expect } = require('chai');
const { async } = require('@firebase/util');
const requestWithSupertest = supertest(server);

var todoId;

var setCookie = "__session=eyJhbGciOiJSUzI1NiIsImtpZCI6InRCME0yQSJ9.eyJpc3MiOiJodHRwczovL3Nlc3Npb24uZmlyZWJhc2UuZ29vZ2xlLmNvbS9ldG9tYXRvLTYzYWFjIiwibmFtZSI6Illpemh1byBYaWUiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EtL0FGZFp1Y3JPaGp4ZEJoUDVDSGNQN0hlNF9zaGVKdC1rOF9VRWZXcUhWell6XHUwMDNkczk2LWMiLCJhdWQiOiJldG9tYXRvLTYzYWFjIiwiYXV0aF90aW1lIjoxNjU3NzQ5OTE5LCJ1c2VyX2lkIjoibm9xWHY4YlVrQWc5NWk4QWxxeEZJTm93RE1HMyIsInN1YiI6Im5vcVh2OGJVa0FnOTVpOEFscXhGSU5vd0RNRzMiLCJpYXQiOjE2NTc3NDk5MjEsImV4cCI6MTY1ODk1OTUyMSwiZW1haWwiOiJ5aXpodW85MEBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJnb29nbGUuY29tIjpbIjExNjgzNjk5NjI5Nzg0NjMzODM3MCJdLCJlbWFpbCI6WyJ5aXpodW85MEBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.fi3rXjxEO_0f_bW-nSLNhPBZrvJb-_-wBsi5CxJ1YAdQvTh53KEWykUFUm_ZrPLAjFDTvKuZiLOHdOw_Mk4LZdS0OStT3ev6nCQu9UAzin4feEENzc9SupuycM4_6J0sAIGlRTdjcsL8rAa4Hwl0htGr23cvLH3eWnkOBo9rhR910d9wl38SD2bT_dEGkqT4hPtrCNSFUrgfZJalnzkgdpRsCnPdch-CMZmWybtNuFXDoSI-88z1fvjaJLovccHwsFyxGgwiYKzLdp2GjNqOfCKqggb46vU1L6vthoT4Jy6xplvmUh2zB60CdsSi0OhM3j4r8H-RBByq-yfKo2X0CA"

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
        expect(res.redirect).equal(true);
        expect(res.type).to.contain('text/plain');
    });

});

describe('Logout', () => {

    it('POST /stopSession should fail when not logged in', async () => {
        const res = await requestWithSupertest.post('/stopSession');
        expect(res.status).equal(500);
        expect(res.type).to.contain('text/html');
    });

});

describe('Add todo', () => {
    it('POST /addTodo should fail with 401 without valid user session and empty value', async () => {

        const res = await requestWithSupertest
            .post("/addTodo")
            .send("test");
        expect(res.status).equal(401);
    });

    it('POST /addTodo should fail with valid user session but empty value', async () => {

        const res = await requestWithSupertest
            .post("/addTodo")
            .set("Cookie", [setCookie]).send({ "inputValue": "" });

        // const res = await requestWithSupertest.post('/addTodo');
        expect(res.status).equal(401);
    });


    it('POST /addTodo should pass with valid user session and non-empty value', async () => {

        const res = await requestWithSupertest
            .post("/addTodo")
            .set("Cookie", [setCookie])
            .send({ "inputValue": "test" });
        expect(res.status).equal(200);
        todoId = res.text
    });
});


describe('Toggle todo', () => {
    it('POST /toggleTodo should fail with 401 without valid user session and empty todoId', async () => {

        const res = await requestWithSupertest
            .post("/toggleTodo")
            .send("");
        expect(res.status).equal(401);
    });

    it('POST /toggleTodo should fail with valid user session but empty todoId', async () => {

        const res = await requestWithSupertest
            .post("/toggleTodo")
            .set("Cookie", [setCookie])
            .send("");

        // const res = await requestWithSupertest.post('/addTodo');
        expect(res.status).equal(401);
    });


    it('POST /toggleTodo should fail with valid user session and illegal todoId', async () => {

        const res = await requestWithSupertest
            .post("/toggleTodo")
            .set("Cookie", [setCookie])
            .send("");
        expect(res.status).equal(401);
    });


    it('POST /toggleTodo should pass with valid user session and valid todoId', async () => {
        const res = await requestWithSupertest
            .post("/toggleTodo")
            .set("Cookie", [setCookie])
            .send({ "todoId": todoId });
        expect(res.status).equal(200);
    });
});


describe('Delete todo', () => {
    it('POST /deleteTodo should fail with 401 without valid user session and empty value', async () => {

        const res = await requestWithSupertest
            .post("/deleteTodo")
            .send("test");
        expect(res.status).equal(401);
    });

    it('POST /deleteTodo should fail with valid user session but empty todoId', async () => {

        const res = await requestWithSupertest
            .post("/deleteTodo")
            .set("cookies.__session", [setCookie])
            .send("test");

        // const res = await requestWithSupertest.post('/addTodo');
        expect(res.status).equal(401);
    });


    it('POST /deleteTodo should pass with valid user session and non-empty todoId', async () => {

        const res = await requestWithSupertest
            .post("/deleteTodo")
            .set("Cookie", [setCookie])
            .send({ "todoId": todoId });
        expect(res.status).equal(200);
    });
});



describe('Send time offset', () => {
    it('POST /sendTimeOffset should fail without user session', async () => {
        const res = await requestWithSupertest.post("/sendTimeOffset");
        expect(res.status).equal(401);
    })

    it('POST /sendTimeOffset should pass with user session', async () => {
        const res = await requestWithSupertest
            .post("/sendTimeOffset")
            .set("Cookie", [setCookie]);
        expect(res.status).equal(200);
    })
})


describe('Start session', () => {

    it('Clear the session if any', async () => {
        await requestWithSupertest.post("/stopSession")
            .set("Cookie", [setCookie]);
    })

    it('POST /startSession should fail without user session', async () => {
        const res = await requestWithSupertest.post("/startSession");
        expect(res.status).equal(401);
    })

    it('POST /startSession should pass with user session', async () => {
        const res = await requestWithSupertest
            .post("/startSession")
            .set("Cookie", [setCookie]);
        expect(res.status).equal(200);
    })
})


describe('Stop session', () => {

    it('Setup the session, this is to trigger a fail stop session', async () => {
        const res = await requestWithSupertest.post("/stopSession")
            .set("Cookie", [setCookie]);
    })

    it('POST /stopSession Stop the session should fail if there is not a session', async () => {
        const res = await requestWithSupertest.post("/stopSession")
            .set("Cookie", [setCookie]);
        expect(res.status).equal(500);
    })

    it('POST /stopSession should fail without user session', async () => {
        const res = await requestWithSupertest.post("/stopSession");
        expect(res.status).equal(500);
    })

    it('Setup the session, this is to trigger a pass stop session', async () => {
        const res = await requestWithSupertest
            .post("/startSession")
            .set("Cookie", [setCookie]);
    })

    it('POST /stopSession should pass with user session', async () => {
        const res = await requestWithSupertest
            .post("/stopSession")
            .set("Cookie", [setCookie]);
        expect(res.status).equal(200);
    })
})

describe('Touch play button', () => {

    it('POST /touchedMusicPlayBtn without a session should fail', async () => {
        const res = await requestWithSupertest.post("/touchedMusicPlayBtn")
        expect(res.status).equal(401);
    })

    it('POST /touchedMusicPlayBtn without an ongoing session should fail', async () => {
        const res = await requestWithSupertest
            .post("/touchedMusicPlayBtn")
            .set("Cookie", [setCookie]);
        expect(res.status).equal(401);
    })


    it('Setup a valid session.', async () => {
        const res = await requestWithSupertest
            .post("/startSession")
            .set("Cookie", [setCookie]);
    })

    it('POST /touchedMusicPlayBtn with valid session and an ongoing session should path', async () => {
        const res = await requestWithSupertest
            .post("/touchedMusicPlayBtn")
            .set("Cookie", [setCookie]);
        expect(res.status).equal(200);
    })

    it('Recover the session status', async () => {
        const res = await requestWithSupertest
            .post("/stopSession")
            .set("Cookie", [setCookie]);
    })

})


describe('Save notes', () => {

    it('POST /saveNotes without a session should fail', async () => {
        const res = await requestWithSupertest.post("/saveNotes")
        expect(res.status).equal(401);
    })

    it('Setup a valid session.', async () => {
        const res = await requestWithSupertest
            .post("/startSession")
            .set("Cookie", [setCookie]);
    })

    it('POST /saveNotes with valid session and an ongoing session should path', async () => {
        const res = await requestWithSupertest
            .post("/saveNotes")
            .set("Cookie", [setCookie])
            .send({ "tomatoType": "test_type", "notes": "test_notes" });
        expect(res.status).equal(200);
    })

    it('Recover the session status', async () => {
        const res = await requestWithSupertest
            .post("/stopSession")
            .set("Cookie", [setCookie]);
    })
})

// describe('Edit notes', () => {

//     it('POST /editNoteSave without a session should fail', async () => {
//         const res = await requestWithSupertest.post("/editNoteSave")
//         expect(res.status).equal(401);
//     })

//     it('Setup to start a valid session ', async () => {
//         const res = await requestWithSupertest
//             .post("/startSession")
//             .set("Cookie", [setCookie]);
//         expect(res.status).equal(200);
//     })
//     const tmtId = req.body["tmtId"];
//     const tmtType = req.body["tmtType"];
//     const noteText = req.body["noteText"];

//     it('Setup a valid session.', async () => {
//         const res = await requestWithSupertest
//             .post("/startSession")
//             .set("Cookie", [setCookie]);
//     })

//     it('POST /editNoteSave with valid session and an ongoing session should path', async () => {
//         const res = await requestWithSupertest
//             .post("/saveNotes")
//             .set("Cookie", [setCookie])
//             .send({ "tomatoType": "test_type", "notes": "test_notes" });
//         expect(res.status).equal(200);
//     })

//     it('Recover the session status', async () => {
//         const res = await requestWithSupertest
//             .post("/stopSession")
//             .set("Cookie", [setCookie]);
//     })
// })