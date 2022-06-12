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

app.post("/sessionLogin", async (req, res) => {
    const idToken = JSON.parse(req.body)["idToken"];
    const photoURL = JSON.parse(req.body)["photoURL"];
    const displayName = JSON.parse(req.body)["displayName"];
    const uid = JSON.parse(req.body)["uid"];
    const email = JSON.parse(req.body)["email"];
    const phoneNum = JSON.parse(req.body)["phoneNum"];
    const expiresIn = 1000 * 60 * 60 * 24 * 14;
    try {
        var sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    } catch (err) {
        res.status(401).send("UNAUTHORIZED REQUEST!");
        console.log("create session cookie error: " + error);
        return;
    }
    const options = { maxAge: expiresIn, httpOnly: true, secure: true };
    res.cookie("__session", sessionCookie, options);
    var createNewUser = admin.database().ref("users/" + uid);
    var updateDb = await createNewUser.set({
        photoURL: photoURL ? photoURL : "",
        displayName: displayName ? displayName : "",
        email: email ? email : "",
        phoneNum: phoneNum ? phoneNum : ""
    })
    res.redirect("/");
});

app.get("/index", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.redirect("index");
        return;
    }
    res.redirect("/");
});

app.get("/", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.render("index");
        return;
    }
    var userRec = await admin.database().ref('users').child(userSnap.uid).once('value');
    var isTomatoOn = false;
    tomatosSet = await getLastestTomato(userSnap.uid);
    var durationSec = 0;
    if (tomatosSet && isTomatoOngoing(tomatosSet[Object.keys(tomatosSet)[0]])) {
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        isTomatoOn = true;
        durationSec = Date.now() / 1000 - tomato['startTimeSec'];
    }
    res.render("dashboard", {
        disPlayName: userRec.val()['displayName'],
        profileUrl: userRec.val()['photoURL'],
        email: userRec.val()['email'],
        isTomatoOn: isTomatoOn,
        durationSec: durationSec,
    });
});

function isTomatoOngoing(tomato) {
    var nowSec = Date.now() / 1000;
    if (tomato['duration'] != undefined) {
        return false;
    }
    if (nowSec - tomato['startTimeSec'] <= 1500) {
        return true;
    }
    return false;
}

async function getLastestTomato(uid) {
    var tomatosSet = await admin.database().ref('users').child(uid).child("tomatos").limitToLast(1).once('value');
    tomatosSet = tomatosSet.val();
    return tomatosSet;
}

app.post("/startSession", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.send("something went wrong");
        return;
    }
    tomatosSet = await getLastestTomato(userSnap.uid);
    if (tomatosSet && isTomatoOngoing(tomatosSet[Object.keys(tomatosSet)[0]])) {
        res.status(500).send("something went wrong, please try again!");
    }
    else {
        var tomatosSnap = db.ref('users').child(userSnap.uid).child("tomatos");
        tomatosSnap.push({
            startTimeSec: Date.now() / 1000
        })
        res.send();
    }
});

app.post("/stopSession", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.send("something went wrong");
        return;
    }
    tomatosSet = await getLastestTomato(userSnap.uid);
    if (!tomatosSet || !isTomatoOngoing(tomatosSet[Object.keys(tomatosSet)[0]])) {
        res.status(500).send("something went wrong, please try again!");
    }
    else {
        var tomatoSnap = db.ref('users').child(userSnap.uid).child("tomatos").limitToLast(1);
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        var latestTomatoDurationSnap = db.ref('users').child(userSnap.uid).child("tomatos").child(Object.keys(tomatosSet)[0]);
        const duratioin = Date.now() / 1000 - tomato['startTimeSec']
        latestTomatoDurationSnap.update({
            duration: duratioin
        })
        res.send();
    }
});

app.post("/touchedMusicPlayBtn", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.send("something went wrong");
        return;
    }
    tomatosSet = await getLastestTomato(userSnap.uid);
    if (!tomatosSet || !isTomatoOngoing(tomatosSet[Object.keys(tomatosSet)[0]])) {
        res.send();
        return;
    }
    else {
        var tomatoSnap = db.ref('users').child(userSnap.uid).child("tomatos").limitToLast(1);
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        var latestTomatoDurationSnap = db.ref('users').child(userSnap.uid).child("tomatos").child(Object.keys(tomatosSet)[0]);
        const duratioin = Date.now() / 1000 - tomato['startTimeSec']
        latestTomatoDurationSnap.update({
            duration: duratioin
        })
        res.send();
        return;
    }
});

app.get("/logout", (req, res) => {
    res.clearCookie("__session");
    res.setHeader('Cache-control', 'private, max-age=0');
    res.redirect('/');
});

exports.functions = functions.https.onRequest(app);

exports.scheduledFunctionCrontab = functions.pubsub.schedule('0 0 * * *')
    .timeZone('America/Los_Angeles')
    .onRun((context) => {
        console.log('This will be run every day at 0:00 AM Western!');
        return null;

    });