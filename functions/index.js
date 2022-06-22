const express = require('express');
const session = require('express-session')
var moment = require('moment');
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
const { user } = require('firebase-functions/v1/auth');

const admin_user_id = ["a0EwM29GJnNUN5yGys7XU3CTv9q2", "80F3IL4sgqZrfudzNLHusBLIJwc2"]

const tomatoSessionLength = 1500;
const coolDownLength = 300;

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
    var updateDb = await createNewUser.update({
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
    var isMusicPlaying = false;
    var tomatosSet = await getLastestTomato(userSnap.uid);
    var durationSec = 0;
    var remainingRestTimeSec = 0;
    var tomatos = [];
    var lastestTmt = undefined;
    var cdDismissable = false;
    if (tomatosSet) {
        lastestTmt = tomatosSet[Object.keys(tomatosSet)[0]];
    }
    if (lastestTmt && isTomatoOngoing(lastestTmt)) {
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        isTomatoOn = true;
        durationSec = Date.now() / 1000 - tomato['startTimeSec'];
        isMusicPlaying = (tomato['isMusicPlaying'] === 'true');
    }
    if (lastestTmt && !isTomatoOngoing(lastestTmt)) {
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        remainingRestTimeSec = getRemainingRestTime(tomatosSet[Object.keys(tomatosSet)[0]]);
        cdDismissable = (tomato['duration'] != undefined);
    }
    var nowDate = getDayMonthYear(Date.now() / 1000 - (userRec.val()["timeOffset"] || 0) * 60);
    var todayTmt = []
    if (tomatosSet) {
        var tmpTmts = await getAllTomatos(userSnap.uid);
        tmpTmts.forEach(function (tmt) {
            if (Object.keys(tomatosSet)[0] == tmt.key) {
                return;
            }
            if (isTomatoOngoing(tmt.val())) {
                return;
            }
            var duration = tmt.val()["duration"];
            var type = tmt.val()["notes"] ? tmt.val()["notes"]["tomatoType"] : undefined;
            var notes = tmt.val()["notes"] ? tmt.val()["notes"]["notes"] : undefined;

            tomatos.push({
                startTimeSec: tmt.val()["startTimeSec"],
                duration: duration,
                type: type,
                timeOffset: tmt.val()["timeOffset"],
                notes: notes
            })

            var tmtDurationMins = duration ? (duration / 60).toFixed(1) + " mins" : "25 mins"
            var tmtDate = getDayMonthYear(parseInt(tmt.val()["startTimeSec"]) - parseInt(tmt.val()["timeOffset"] * 60))
            if (tmtDate.toString() === nowDate.toString()) {
                todayTmt.push({
                    duration: tmtDurationMins,
                    type: type || "No type",
                });
            }
        })
    }
    var todos = []
    for (let todo in userRec.val()['todos']) {
        todos.push({
            uid: todo,
            inputvalue: userRec.val()['todos'][todo]['inputValue'],
            status: userRec.val()['todos'][todo]['status']
        })
    }
    res.render("dashboard", {
        disPlayName: userRec.val()['displayName'],
        profileUrl: userRec.val()['photoURL'],
        email: userRec.val()['email'],
        isTomatoOn: isTomatoOn,
        durationSec: durationSec,
        isMusicPlaying, isMusicPlaying,
        remainingRestTimeSec: remainingRestTimeSec,
        tomatoSessionLength: tomatoSessionLength,
        coolDownLength: coolDownLength,
        tomatos: tomatos.reverse(),
        moment: moment,
        todayTmt: todayTmt.reverse(),
        cdDismissable: cdDismissable,
        todos: todos,
    });
});

function getDayMonthYear(seconds) {
    var nowDate = moment.unix(seconds);
    var nowDay = nowDate.format("D");
    var nowMonth = nowDate.format("M");
    var nowYear = nowDate.format("YYYY");
    return [nowDay, nowMonth, nowYear]
}

function isTomatoOngoing(tomato) {
    var nowSec = Date.now() / 1000;
    if (tomato['duration'] != undefined) {
        return false;
    }
    if (nowSec - tomato['startTimeSec'] <= tomatoSessionLength) {
        return true;
    }
    return false;
}

function getRemainingRestTime(tomato) {
    var nowSec = Date.now() / 1000;
    if (tomato['duration'] != undefined) {
        return nowSec - (tomato['startTimeSec'] + tomato['duration']) <= coolDownLength ?
            nowSec - (tomato['startTimeSec'] + tomato['duration']) : 0;
    }
    if (nowSec - tomato['startTimeSec'] > 2) {
        return nowSec - tomato['startTimeSec'] <= coolDownLength ? nowSec - tomato['startTimeSec'] : 0;
    }
    return 0;
}

async function getLastestTomato(uid) {
    var tomatosSet = await admin.database().ref('users').child(uid).child("tomatos").limitToLast(1).once('value');
    tomatosSet = tomatosSet.val();
    return tomatosSet;
}

async function getAllTomatos(uid) {
    return admin.database().ref('users').child(uid).child("tomatos").once('value');
}

async function getLatestNote(userRec, latestTmtSnap) {
    var newDiv = '<div class="noteCard"> <img id="noteAvatar" src="' + userRec.val()['photoURL'] + '" width="40px" height="40px" alt="Avatar"> <label id="noteLable">Me</label> <label id="noteTime">' +
        moment.unix(parseInt(latestTmtSnap.val()['startTimeSec']) - parseInt(latestTmtSnap.val()['timeOffset']) * 60).local().format("lll")
        + '</label>';
    if (latestTmtSnap.val()['notes'] && latestTmtSnap.val()['notes']['tomatoType'] !== undefined) {
        newDiv += '<label id="noteType">' + latestTmtSnap.val()['notes']['tomatoType'] + '</label>'
    } else {
        newDiv += '<label id="noteType">No type</label>'
    }

    if (latestTmtSnap.val()['duration'] !== undefined) {
        newDiv += '<img id="noteStatus" src="./public/image/green_tomato.png" width="40px" height="40px" alt="Avatar" data-bs-toggle="tooltip" data-bs-placement="bottom" title data-bs-original-title="' + (latestTmtSnap.val()["duration"] / 60).toFixed(1) + ' mins" aria-label="' + (latestTmtSnap.val()["duration"] / 60).toFixed(1) + ' mins"/> <br> <div id="noteText">'
    } else {
        newDiv += '<img id="noteStatus" src="./public/image/tomato.png" width="40px" height="40px" alt="Avatar" data-bs-toggle="tooltip" data-bs-placement="bottom" title data-bs-original-title="25 mins"  aria-label="25 mins" /> <br> <div id="noteText">'
    }

    if (latestTmtSnap.val()['notes'] && latestTmtSnap.val()["notes"]["notes"] !== "<p><br></p>") {
        newDiv += latestTmtSnap.val()['notes']['notes'];
    } else {

        newDiv += '<p class="nothing">Nothing was noted in this session.</p>';
    }
    newDiv += '</div>  <img id="noteLikeBtn" src="./public/image/liked.png"><label id="likeCnt">0</label></div>'
    return newDiv;
}


async function getLatestTodayTmt(latestTmtSnap) {
    latestTmtSnap = latestTmtSnap.val()
    var newDiv = '<div class="col-3"> <img id="todayTmtImgId" '
    if (latestTmtSnap['duration']) {
        newDiv += 'src = "./public/image/green_tomato.png"'
    } else {
        newDiv += 'src = "./public/image/tomato.png"'
    }
    newDiv += 'width = "40px" height = "40px" alt = "Avatar" data-bs-toggle="tooltip" data-bs-placement="bottom" '
    if (latestTmtSnap['notes'] && latestTmtSnap['notes']['tomatoType']) {
        if (latestTmtSnap['duration']) {
            newDiv += 'title = "' + latestTmtSnap['notes']['tomatoType'] + ": " + (latestTmtSnap['duration'] / 60).toFixed(1) + ' mins" /> </div>'
        } else {
            newDiv += 'title = "' + latestTmtSnap['notes']['tomatoType'] + ": " + '25 mins" /> </div>'
        }
    } else {
        if (latestTmtSnap['duration']) {
            newDiv += 'title = "No type: ' + (latestTmtSnap['duration'] / 60).toFixed(1) + ' mins" /> </div>'
        } else {
            newDiv += 'title = "No type: 25 mins" /> </div>'
        }
    }
    return newDiv;
}

app.post("/sendTimeOffset", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const timeOffset = req.body["timeOffset"] || 0;
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.send("something went wrong");
        return;
    }
    db.ref('users').child(userSnap.uid).update({ timeOffset: timeOffset })
    res.send();
    return;
})

app.post("/startSession", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const timeOffset = req.body["timeOffset"] || 0;
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.send("something went wrong");
        return;
    }
    var tomatosSet = await getLastestTomato(userSnap.uid);
    if (tomatosSet && isTomatoOngoing(tomatosSet[Object.keys(tomatosSet)[0]])) {
        res.status(500).send("something went wrong, please try again!");
    }
    else {
        var tomatosSnap = db.ref('users').child(userSnap.uid).child("tomatos");
        tomatosSnap.push({
            startTimeSec: Date.now() / 1000,
            timeOffset: timeOffset,
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
    var tomatosSet = await getLastestTomato(userSnap.uid);
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
    const isMusicPlaying = req.body["isMusicPlaying"] || false;
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.send("something went wrong");
        return;
    }
    var tomatosSet = await getLastestTomato(userSnap.uid);
    if (!tomatosSet || !isTomatoOngoing(tomatosSet[Object.keys(tomatosSet)[0]])) {
        res.send();
        return;
    }
    else {
        var latestTomatoDurationSnap = db.ref('users').child(userSnap.uid).child("tomatos").child(Object.keys(tomatosSet)[0]);
        latestTomatoDurationSnap.update({
            isMusicPlaying: isMusicPlaying
        })
        res.send();
        return;
    }
});

app.post("/deleteTodo", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const todoId = req.body["todoId"] || '';
    console.log(todoId)
    if (todoId === '') {
        res.status(401).send("something went wrong");
        return;
    }
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var todo = db.ref('users').child(userSnap.uid).child("todos");
    if (!todo.child(todoId)) {
        res.status(401).send("something went wrong");
        return;
    }
    todo.child(todoId).remove();
    res.send(todoId);
})

app.post("/addTodo", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const inputValue = req.body["inputValue"] || '';
    if (inputValue === '') {
        res.status(401).send("something went wrong");
        return;
    }
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var todo = db.ref('users').child(userSnap.uid).child("todos");
    var newNoteSnap = await todo.push({ noteDate: Date.now() / 1000, inputValue: inputValue })
    res.send(newNoteSnap.key);
})

app.post("/toogleTodo", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const todoId = req.body["todoId"] || '';
    if (todoId === '') {
        res.status(401).send("something went wrong");
        return;
    }
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var todo = db.ref('users').child(userSnap.uid).child("todos");
    var todo = db.ref('users').child(userSnap.uid).child("todos");
    if (!todo.child(todoId)) {
        res.status(401).send("something went wrong");
        return;
    }
    var statusSnap = todo.child(todoId);
    var statusValue = await statusSnap.child("status").once('value');
    if (!statusValue.val() || statusValue.val() == '0') {
        statusSnap.update({ "status": "1" })
        res.send('1');
    } else {
        statusSnap.update({ "status": "0" })
        res.send('0');
    }
})

app.post("/saveNotes", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const checkedValue = req.body["checkedValue"];
    const tomatoType = req.body["tomatoType"];
    const notes = req.body["notes"];
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var userRec = await admin.database().ref('users').child(userSnap.uid).once('value');
    var tomatosSet = await getLastestTomato(userSnap.uid);
    if (!tomatosSet) {
        res.status(401).send("doesn't look like you have a pending tomato without a notes, please refresh and try again.");
        return;
    }
    else {
        var latestTomato = db.ref('users').child(userSnap.uid).child("tomatos").child(Object.keys(tomatosSet)[0]);
        await latestTomato.child("notes").update({
            // checkedValue: checkedValue,
            tomatoType, tomatoType,
            notes, notes,
            date: Date.now() / 1000,
        })

        var latestTmtSnap = await latestTomato.once('value')
        var newNoteDiv = await getLatestNote(userRec, latestTmtSnap);
        var newTodayTmt = await getLatestTodayTmt(latestTmtSnap);
        console.log(newTodayTmt)
        res.send({ newNoteDiv: newNoteDiv, newTodayTmt: newTodayTmt });
        return;
    }
})

app.post("/feedback", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const checkValue = req.body["checkedValue"];
    const comments = req.body["comments"];
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    await db.ref('feedback').push({
        uid: userSnap.uid,
        checkValue: checkValue,
        comments: comments,
        date: Date.now() / 1000,
    })
    res.send();
})

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