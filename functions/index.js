const express = require('express');
const session = require('express-session')
const fs = require('fs')
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const database = require("firebase/database");
const firebase = require("firebase/app");
const auth = require('firebase/auth');
const firestore = require("firebase/firestore");
const cookieParser = require('cookie-parser');
const app = express();
const url = require('url');
const util = require('util');
const path = require('path');
const uuid = require('uuid').v4
var XMLHttpRequest = require('xhr2');

const serviceAccount = require("./serviceAccountKey.json");
const { error } = require('firebase-functions/logger');
const { get } = require('http');
const { object } = require('firebase-functions/v1/storage');
const bodyParser = require('body-parser');
const { randomUUID } = require('crypto');
const tmp = require('tmp');
const { Timestamp } = require('firebase/firestore');
const { on } = require('events');
const { timeStamp } = require('console');

const admin_user_id = ["a0EwM29GJnNUN5yGys7XU3CTv9q2", "80F3IL4sgqZrfudzNLHusBLIJwc2"]

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://etomato-63aac-default-rtdb.firebaseio.com"
});

Array.prototype.contains = function (array) {
    return array.every(function (item) {
        return this.indexOf(item) !== -1;
    }, this);
}

const firebaseConfig = {
    apiKey: "AIzaSyBe7BVBWqB6znKy7b_UND2nUd09nnUFmEQ",
    authDomain: "etomato-63aac.firebaseapp.com",
    databaseURL: "https://etomato-63aac-default-rtdb.firebaseio.com",
    projectId: "etomato-63aac",
    storageBucket: "etomato-63aac.appspot.com",
    messagingSenderId: "144378496941",
    appId: "1:144378496941:web:dc08de13472e73f14d0324",
    measurementId: "G-7W4Q6GF7JP"
};
firebase.initializeApp(firebaseConfig);
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(express.json());
app.use("/public", express.static(__dirname + '/public'));
process.env.TZ = "America/Los Angeles"

// user sessions
app.use(session({
    secret: 'pjqp@00s9!',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));

app.post("/sessionLogin", (req, res) => {
    const id_token = JSON.parse(req.body)["idToken"];
    console.log(id_token)
    const expiresIn = 1000 * 60 * 60 * 24 * 14;
    admin.auth().createSessionCookie(id_token, { expiresIn })
        .then(
            (sessionCookie) => {
                const options = { maxAge: expiresIn, httpOnly: true, secure: true };
                res.cookie("__session", sessionCookie, options);
                res.redirect("/");
                console.log(sessionCookie)
                return;
            },
            (error) => {
                res.status(401).send("UNAUTHORIZED REQUEST!");
                console.log("create session cookie error: " + error);
            }
        )
        .catch((error) => { });
});

app.post("/login", (req, res) => {
    const pathname = url.parse(req.url).pathname;
    auth
        .signInWithEmailAndPassword(req.body.email, req.body.password)
        .then(user => {
            return;
        }).catch(error => {
            res.send("$.bootstrapGrowl(error.message, { ele: 'body', type: 'info', align: 'center', delay: 3000, offset: {from: top, amount: 20}, allow_dismiss: true, stackup_spacing: 10 });");
        });
});

app.get("/", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    console.log(sessionCookie)
    res.render("dashboard");
});

exports.functions = functions.https.onRequest(app);

exports.scheduledFunctionCrontab = functions.pubsub.schedule('0 0 * * *')
    .timeZone('America/Los_Angeles')
    .onRun((context) => {
        console.log('This will be run every day at 0:00 AM Western!');
        return null;

    });