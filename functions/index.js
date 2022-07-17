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
    res.redirect("./");
});

app.get("/index", async (req, res) => {
    var db = admin.database();
    const sessionCookie = req.cookies.__session || "";
    var userSnap;
    try {
        userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        var allPubNotes = await db.ref('publicNotes').once('value');
        var pubNotes = [];
        for (let key in allPubNotes.val()) {
            var pubnote = allPubNotes.val()[key]
            var notePath = pubnote['notesPath']
            var userPath = pubnote['userPath']
            var note = await db.ref(notePath).once('value');
            var author = await db.ref(userPath).once('value');
            var profile = author.val()['photoURL'];
            var name = author.val()['displayName'];
            var timeOffset = author.val()['timeOffset'];

            var tmt = await db.ref(notePath.split('/notes')[0]).once('value');
            var tid = tmt.key;
            var date = note.val()['date'];
            var type = note.val()['tomatoType'];
            var notes = note.val()['notes'];
            var likeCnt = note.val()['likeCnt'] ? note.val()['likeCnt'] : '0'
            var hasLiked = false;

            pubNotes.push({
                tid: tid,
                profile: profile,
                name: name,
                date: date,
                timeOffset: timeOffset,
                type: type,
                notes: notes,
                likeCnt: likeCnt,
                notePath, notePath,
                hasLiked, hasLiked,
            })
        }

        res.render("index", {
            pubNotes: pubNotes.reverse(),
            moment: moment,
        });
        return;
    }
    res.redirect("./");
});

app.get("/", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.redirect("./index");
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
    var pendingNote = {}
    var pendingNote = undefined;
    var pendingNoteType = undefined;
    var db = admin.database();

    if (tomatosSet) {
        lastestTmt = tomatosSet[Object.keys(tomatosSet)[0]];
    }
    if (lastestTmt && isTomatoOngoing(lastestTmt)) {
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        isTomatoOn = true;
        durationSec = Date.now() / 1000 - tomato['startTimeSec'];
        isMusicPlaying = (tomato['isMusicPlaying'] === 'true');
        pendingNoteType = tomato['notes'] ? tomato['notes']['tomatoType'] : undefined;
        pendingNote = tomato['notes'] ? tomato['notes']['notes'] : undefined;
    }
    if (lastestTmt && !isTomatoOngoing(lastestTmt)) {
        var tomato = tomatosSet[Object.keys(tomatosSet)[0]];
        remainingRestTimeSec = getRemainingRestTime(tomatosSet[Object.keys(tomatosSet)[0]]);
        cdDismissable = (tomato['duration'] != undefined);
    }
    var nowDate = getDayMonthYear(Date.now() / 1000 - (userRec.val()["timeOffset"] || 0) * 60);
    var todayTmt = [];
    var statsDays = []; // [['Mar 1', {'t1': '25'}], ['Mar 2', {'t1': '25'}]]
    if (tomatosSet) {
        var tmpTmts = await getAllTomatos(userSnap.uid);
        tmpTmts.forEach(function (tmt) {
            if (isTomatoOngoing(tmt.val())) {
                return;
            }
            var duration = tmt.val()["duration"];
            var type = tmt.val()["notes"] ? tmt.val()["notes"]["tomatoType"] : undefined;
            var notes = tmt.val()["notes"] ? tmt.val()["notes"]["notes"] : undefined;

            if (type || notes) {
                tomatos.push({
                    startTimeSec: tmt.val()["startTimeSec"],
                    duration: duration,
                    type: type,
                    timeOffset: tmt.val()["timeOffset"],
                    pubPath: tmt.val()['notes']["pubPath"],
                    notes: notes,
                    tid: tmt.key,
                    likeCnt: tmt.val()['notes'] ? (tmt.val()['notes']['likeCnt'] ? tmt.val()['notes']['likeCnt'] : "0") : "0",
                })
            }
            var tmtDurationMins = duration ? (duration / 60).toFixed(1) + " mins" : "25 mins"
            var tmtDate = getDayMonthYear(parseInt(tmt.val()["startTimeSec"]) - parseInt(tmt.val()["timeOffset"] * 60))
            if (tmtDate.toString() === nowDate.toString()) {
                todayTmt.push({
                    duration: tmtDurationMins,
                    type: type || "No type",
                });
            } else {
                var statDate = moment.unix(parseInt(tmt.val()['startTimeSec']) - parseInt(tmt.val()['timeOffset']) * 60).local().format("LL")
                if (statsDays.length == 0 || statsDays[statsDays.length - 1][0] != statDate) {
                    statsDays.push([statDate, {}]);
                }
                if (!duration) {
                    duration = 1500;
                }
                if (!type) {
                    type = "Others";
                }
                var dur = statsDays[statsDays.length - 1][1][type];
                if (!dur) {
                    dur = 0;
                }
                dur += duration;
                statsDays[statsDays.length - 1][1][type] = dur;
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

    var allPubNotes = await db.ref('publicNotes').once('value');
    var pubNotes = [];

    var likedNotesKv = await db.ref('users').child(userSnap.uid).child('likedNotes').once('value');
    var likedNodes = [];
    if (likedNotesKv.val()) {
        likedNodes = Object.values(likedNotesKv.val());
    }

    for (let key in allPubNotes.val()) {
        var pubnote = allPubNotes.val()[key]
        var notePath = pubnote['notesPath']
        var userPath = pubnote['userPath']
        var note = await db.ref(notePath).once('value');
        var author = await db.ref(userPath).once('value');
        var profile = author.val()['photoURL'];
        var name = author.val()['displayName'];
        var timeOffset = author.val()['timeOffset'];

        var tmt = await db.ref(notePath.split('/notes')[0]).once('value');
        var tid = tmt.key;
        var date = note.val()['date'];
        var type = note.val()['tomatoType'];
        var notes = note.val()['notes'];
        var likeCnt = note.val()['likeCnt'] ? note.val()['likeCnt'] : '0'
        var hasLiked = false;

        if (likedNodes.includes(notePath)) {
            hasLiked = true;
        }

        pubNotes.push({
            tid: tid,
            profile: profile,
            name: name,
            date: date,
            timeOffset: timeOffset,
            type: type,
            notes: notes,
            likeCnt: likeCnt,
            notePath, notePath,
            hasLiked, hasLiked,
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
        todos: todos.reverse(),
        pendingNote: pendingNote,
        pendingNoteType: pendingNoteType,
        pubNotes: pubNotes.reverse(),
        statsDays: statsDays.reverse(),
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
    var newDiv = "<div class='noteCard' id='" + latestTmtSnap.key + "_card' data-nid='" + latestTmtSnap.key + "'>"
    newDiv += "<img id='noteAvatar' src='" + userRec.val()['photoURL'] + "' width='40px' height='40px' alt='Avatar' />"
    newDiv += "<label id = 'noteLable'> Me</label>"
    newDiv += "<label id = 'noteTime'>" + moment.unix(parseInt(latestTmtSnap.val()["startTimeSec"]) - parseInt(latestTmtSnap.val()["timeOffset"]) * 60).format('lll') + "</label>"
    if (latestTmtSnap.val()['duration']) {
        newDiv += "<img id='noteStatus' src='./public/image/green_tomato.png' width='40px' height='40px' alt='Avatar' data-bs-toggle='tooltip' data-bs-placement='bottom' title = '" + (latestTmtSnap['duration'] / 60).toFixed(1) + " mins' />"
    } else {
        newDiv += "<img id='noteStatus' src='./public/image/tomato.png' width='40px' height='40px' alt='Avatar' data-bs-toggle='tooltip' data-bs-placement='bottom' title = '25 mins' />"
    }
    newDiv += "<br> <div class='row' id='typeSec'>"
    if (latestTmtSnap.val()['notes'] && latestTmtSnap.val()['notes']['tomatoType']) {
        newDiv += "<label class='noteType' id='" + latestTmtSnap.key + "_notetype'>" + latestTmtSnap.val()['notes']["tomatoType"] + "</label>"
    } else {
        newDiv += "<label class='noteType' id='" + latestTmtSnap.key + "_notetype'> No type</label>"
    }
    newDiv += "</div>"
    newDiv += "<div id='noteText'>"
    if (latestTmtSnap.val()['notes'] && latestTmtSnap.val()['notes']['notes'] !== "<p><br></p>") {
        newDiv += "<div class='notehis' id='" + latestTmtSnap.key + "_notetext'>" + latestTmtSnap.val()["notes"]["notes"] + "</div >"
    } else {
        newDiv += "<p id='" + latestTmtSnap.key + "_notetext' class='nothing'> Nothing was noted in this session.</p>"
    }
    newDiv += "</div>"
    if (latestTmtSnap.val()['notes']['pubPath']) {
        newDiv += "<img class='pubpriImg' id='" + latestTmtSnap.key + "_status' src='./public/image/public.png' width='18px' height = '18px' data-bs-toggle='tooltip' data-bs-placement='bottom' title = 'This is a public notes.' data-ispub='1' />"
    } else {
        newDiv += "<img class='pubpriImg' id='" + latestTmtSnap.key + "_status' src='./public/image/private.png' width = '18px' height = '18px' data-bs-toggle='tooltip' data-bs-placement='bottom' title = 'This is a private note, no one can view.' data-ispub='0' />"
    }
    newDiv += "<img id='noteLikeBtn' src='./public/image/liked.png' data-bs-toggle='tooltip' data-bs-placement='bottom' title='Edit -> publish to collect likes' />"
    if (latestTmtSnap.val()['notes']['likeCnt']) {
        newDiv += "<label id = 'likeCnt'>" + latestTmtSnap.val()['notes']['likeCnt'] + "</label>"
    } else {
        newDiv += "<label id = 'likeCnt'>" + 0 + "</label>"
    }
    newDiv += "<span onclick = 'EditNote(this.id)' id= " + latestTmtSnap.key + "_btn' class='editBtn'> Edit</span >"
    newDiv += "</div>"
    return newDiv;
}

async function getPubedNote(userRec, latestTmtSnap) {
    var db = admin.database();
    var newDiv = "<div class='noteCard' id='" + latestTmtSnap.key + "_pubcard' data-nid='" + latestTmtSnap.key + "'>"
    newDiv += "<img id='noteAvatar' src='" + userRec.val()['photoURL'] + "' width='40px' height='40px' alt='Avatar'>"
    newDiv += "<label id='noteLable'>" + userRec.val()['displayName'] + "</label>"
    newDiv += "<label id='noteTime'>" + moment.unix(parseInt(latestTmtSnap.val()["startTimeSec"]) - parseInt(latestTmtSnap.val()["timeOffset"]) * 60).format('lll') + "</label>"
    newDiv += "<br><div class='row' id = 'typeSec'>"
    newDiv += "<label class='noteType' id='" + latestTmtSnap.key + "_pubNotetype'>" + latestTmtSnap.val()['notes']["tomatoType"] + "</label>"
    newDiv += "</div>"
    newDiv += "<div id='noteText'>"
    newDiv += "<div class='notehis' id='" + latestTmtSnap.key + "_pubNotetext'>" + latestTmtSnap.val()['notes']["notes"] + "</div>"
    newDiv += "</div>"

    var likedNotesKv = await db.ref('users').child(userRec.key).child('likedNotes').once('value');
    var likedNodes = [];
    if (likedNotesKv.val()) {
        likedNodes = Object.values(likedNotesKv.val());
    }
    var notePath = "users/" + userRec.key + "/tomatos/" + latestTmtSnap.key + "/notes";
    var hasLiked = false;
    if (likedNodes.includes(notePath)) {
        hasLiked = true;
    }

    if (hasLiked) {
        newDiv += "<img class='pubNoteLikeBtn' id='" + notePath + "_likebtn' src = './public/image/already_liked.png'/> "
    } else {
        newDiv += "<img class='pubNoteLikeBtn' id='" + notePath + "_likebtn' src = './public/image/liked.png' onclick = 'LikeNote(this.id)' style = 'cursor:pointer;'/> "
    }

    if (latestTmtSnap.val()['notes']['likeCnt']) {
        newDiv += "<label class = 'pubNoteLikeCnt' id='" + notePath + "_likebtnLabel' style='pointer-events: none;'>" + latestTmtSnap.val()['notes']['likeCnt'] + "</label>"
    } else {
        newDiv += "<label class = 'pubNoteLikeCnt' id='" + notePath + "_likebtnLabel' style='pointer-events: none;'>" + 0 + "</label>"
    }
    newDiv += "</div>"
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
        res.status(401).send("something went wrong");
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
        res.status(500).send("something went wrong");
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
        res.send("" + duratioin);
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
        res.status(401).send("something went wrong: 1");
        return;
    }
    var db = admin.database();
    try {
        var userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong: 2");
        return;
    }
    var todo = db.ref('users').child(userSnap.uid).child("todos");
    var newNoteSnap = await todo.push({ noteDate: Date.now() / 1000, inputValue: inputValue })
    res.status(200).send(newNoteSnap.key);
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

app.post("/editNoteSave", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const tmtId = req.body["tmtId"];
    const tmtType = req.body["tmtType"];
    const noteText = req.body["noteText"];
    var db = admin.database();
    var userSnap;
    try {
        userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var userTmtRec = db.ref('users').child(userSnap.uid).child('tomatos');
    var tmtValue = await userTmtRec.once('value');
    if (!tmtValue.hasChild(tmtId)) {
        res.status(401).send("something went wrong");
        return;
    }
    await userTmtRec.child(tmtId).child('notes').update({
        notes: noteText,
        tomatoType: tmtType,
    })
    res.status(200).send();
})

app.post("/publishNotes", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const tmtId = req.body["tmtId"];
    var db = admin.database();
    var userSnap;
    try {
        userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var userTmtRec = db.ref('users').child(userSnap.uid).child('tomatos');
    var tmtValue = await userTmtRec.once('value');
    if (!tmtValue.hasChild(tmtId)) {
        res.status(401).send("something went wrong");
        return;
    }
    var thisNote = await userTmtRec.child(tmtId).child('notes').once('value');
    if (thisNote.val()['pubPath']) {
        var pubPath = (await userTmtRec.child(tmtId).child('notes').child('pubPath').once('value')).val();
        db.ref("publicNotes").child(pubPath).remove();
        userTmtRec.child(tmtId).child('notes').child('pubPath').remove();
        res.status(200).send({ status: "0", tmtId: tmtId });
    } else {
        var notesPath = "users/" + userSnap.uid + "/tomatos/" + tmtId + "/notes";
        var userPath = "users/" + userSnap.uid;
        var newPub = db.ref("publicNotes").push({
            userPath: userPath,
            notesPath: notesPath
        });
        userTmtRec.child(tmtId).child('notes').update({ pubPath: newPub.key })
        var userRec = await db.ref('users').child(userSnap.uid).once('value');
        var tmtSnap = await userTmtRec.child(tmtId).once('value');
        var newNoteDiv = await getPubedNote(userRec, tmtSnap);
        res.status(200).send({ status: "1", newPub: newNoteDiv });
    }

})

app.post("/likeNote", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const notePath = req.body["notePath"];
    var db = admin.database();
    var userSnap;
    try {
        userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var uid = userSnap.uid;
    var likedNotesKv = await db.ref('users').child(uid).child('likedNotes').once('value');
    var likedNodes = [];
    if (likedNotesKv.val()) {
        likedNodes = Object.values(likedNotesKv.val());
    }
    if (likedNodes.includes(notePath)) {
        res.status(401).send("something went wrong");
        return;
    }
    await db.ref('users').child(uid).child('likedNotes').push(notePath);
    var likeCnt = (await db.ref(notePath).child('likeCnt').once('value')).val();
    if (likeCnt) {
        await db.ref(notePath)
            .child('likeCnt')
            .set(admin.database.ServerValue.increment(1));
    } else {
        await db.ref(notePath).child('likeCnt').set(1);
    }
    var noteInfo = (await db.ref(notePath).once('value')).val();
    var likeCnt = noteInfo['likeCnt'];
    var userPath = notePath.split('/tomatos/')[0];
    var authorInfo = (await db.ref(userPath).once('value')).val();
    var avatarUrl = authorInfo['photoURL'];
    var timeOffset = authorInfo['timeOffset'];
    var datetxt = moment.unix(parseInt(noteInfo['date']) - parseInt(timeOffset * 60)).format('lll');
    sendLikedEmail(avatarUrl, datetxt, noteInfo['tomatoType'], noteInfo['notes'], authorInfo['email']);
    res.send(likeCnt.toString());
    return;
})

app.post("/deleteNote", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const tmtId = req.body["tmtId"];
    var db = admin.database();
    var userSnap;
    try {
        userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
    } catch (err) {
        res.status(401).send("something went wrong");
        return;
    }
    var userTmtRec = db.ref('users').child(userSnap.uid).child('tomatos');
    var tmtValue = await userTmtRec.once('value');
    if (!tmtValue.hasChild(tmtId)) {
        res.status(401).send("something went wrong");
        return;
    }
    if ((await userTmtRec.child(tmtId).child('notes').once('value')).val()['pubPath']) {
        res.status(401).send("something went wrong");
        return;
    }
    await userTmtRec.child(tmtId).child('notes').remove()
    res.status(200).send();
})

app.post("/saveNotes", async (req, res) => {
    const sessionCookie = req.cookies.__session || "";
    const checkedValue = req.body["checkedValue"];
    const tomatoType = req.body["tomatoType"];
    const notes = req.body["notes"];
    var db = admin.database();
    var userSnap;
    try {
        userSnap = await admin.auth().verifySessionCookie(sessionCookie, true);
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
    res.redirect('./');
});

function sendLikedEmail(avatarUrl, noteDate, noteType, noteContent, email) {
    fs.readFile('./views/email.html', 'utf8', function (err, html) {
        if (err) {
            throw err;
        }
        html = html
            .replace("{AvatarUrl}", avatarUrl)
            .replace('{NoteDate}', noteDate)
            .replace('{NoteType}', noteType)
            .replace('{NoteContent}', noteContent);
        admin.firestore().collection('email').add({
            to: '["' + email + '"]',
            message: {
                subject: 'Your note has new likes!',
                html: html,
            },
        })
    });
}

exports.functions = functions.https.onRequest(app);

// Uncomment to do the unit tests
// module.exports = app;