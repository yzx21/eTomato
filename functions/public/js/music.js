
var playerTrack = $("#player-track"),
    bgArtwork = $("#bg-artwork"),
    bgArtworkUrl,
    albumName = $("#album-name"),
    trackName = $("#track-name"),
    albumArt = $("#album-art"),
    sArea = $("#s-area"),
    seekBar = $("#seek-bar"),
    trackTime = $("#track-time"),
    insTime = $("#ins-time"),
    sHover = $("#s-hover"),
    playPauseButton = $("#play-pause-button"),
    i = playPauseButton.find("i"),
    tProgress = $("#current-time"),
    tTime = $("#track-length"),
    seekT,
    seekLoc,
    seekBarPos,
    cM,
    ctMinutes,
    ctSeconds,
    curMinutes,
    curSeconds,
    durMinutes,
    durSeconds,
    playProgress,
    bTime,
    nTime = 0,
    buffInterval = null,
    tFlag = false,
    albums = [
        "A Subtle Reflection",
        "Youth is waster on the young",
        "The Hours",
        "Forest",
        "Singing Swan",
        "Silver Rain",
        "Satellite of Love",
        "New Jade",
        "Neutra",
        "Let There Be Rain",
        "Late Arrivals",
        "Lakes",
        "They Dream By Day",
        "Dreaming Wide Awake",
        "Far Orange",
        "Between Illusions",
        "Baby Idk",
        "Avinam",
        "Alike",
        "Abstractions",
        "100 Times",
        "Dawn",
        "Me & You",
        "Electro Boy",
        "Home",
        "Proxy (Original Mix)"
    ],
    trackNames = [
        "Daniel Kaede - A Subtle Reflection",
        "Chez Remis Tellow - Youth is waster on the young",
        "Dreem - The Hours",
        "Arden Forest - Forest",
        "Aleph One - Singing Swan",
        "Silver Rain  - Emil Axelsson",
        "Brendon Moeller - Satellite of Love",
        "Dreem - New Jade",
        "CHELLE IVES - Neutra",
        "Silver Maple - Let There Be Rain",
        "Lonov - Late Arrivals",
        "Harbours & Oceans - Lakes",
        "They Dream By Day - Krotos",
        "King Sis feat. Jobii - Dreaming Wide Awake",
        "Far Orange - Copycat",
        "Rikard From - Between Illusions",
        "RAMBUTAN - Baby Idk",
        "Valante - Avinam",
        "Jones Meadow - Alike",
        "Aleph One - Abstractions",
        "Jones Meadow - 100 Times",
        "Skylike - Dawn",
        "Alex Skrindo - Me & You",
        "Kaaze - Electro Boy",
        "Jordan Schor - Home",
        "Martin Garrix - Proxy"
    ],
    albumArtworks = ["_1", "_2", "_3", "_4", "_5", "_6", "_7", "_8", "_9", "_10", "_11", "_12", "_13", "_14", "_15", "_16", "_17", "_18", "_19", "_20", "_21", "_22", "_23", "_24", "_25", "_26"],
    trackUrl = [
        "https://docs.google.com/uc?export=download&id=1GspoY9gvWMVsoclq_TRyKlNfrGyzFQNI",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_A_Subtle_Reflection_Daniel_Kaede.mp3?alt=media&token=7181f49a-232e-4fe9-b4ec-93c037e45f5f",

        "https://docs.google.com/uc?export=download&id=1zCUq2o5NCDMWkST9fGywYSc9O9cxqP2j",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Youth_Is_Wasted_On_The_Young_Chez%20Remix_Tellow.mp3?alt=media&token=a9bb679f-079f-4aa5-a71c-ec662ff9ab3c",

        "https://docs.google.com/uc?export=download&id=1oN35V9NXhQM9gG9eg0CHIJ5ONlqdQuaB",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_The_Hours_dreem.mp3?alt=media&token=287796a5-fc7e-4d99-8608-903142367c2b",

        "https://docs.google.com/uc?export=download&id=1hoMfnBpgrUCPCccOGAMbDiCYOxyeU02G",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Spirals_Arden_Forest.mp3?alt=media&token=8e58bb34-20ab-42c4-bb1f-562dba014571",

        "https://docs.google.com/uc?export=download&id=1iORRk0FiRA1CHVHuTAvAyQHPmEY3OoHL",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Singing_Swan_Aleph_One.mp3?alt=media&token=1d4dbfe3-9324-4239-94c1-4732b75ce1ff",

        "https://docs.google.com/uc?export=download&id=1vBx3ob9QLnAMQUToaZRdU0KOJWKcobAc",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Silver_Rain_Emil_Axelsson.mp3?alt=media&token=dd56bf60-2a6e-4337-bcbe-0996550a11de",

        "https://docs.google.com/uc?export=download&id=1qh8fxQFgyBBjeQCfliS5IkVO2LI317rx",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Satellite_of_Love_Brendon_Moeller.mp3?alt=media&token=d386fb0c-237d-4a76-8f89-a81ef7708c21",

        "https://docs.google.com/uc?export=download&id=1bZfO6W06Q7RUNO-uTptWEOuhrg446odF",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_New_Jade_dreem.mp3?alt=media&token=d9d062e6-ab5d-4e9e-9d0b-b5bf335abbc3",

        "https://docs.google.com/uc?export=download&id=1mK1V41WLAIQ_TT9eYinb8AtQX6lbBzXg",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Neutra_Chelle_Ives.mp3?alt=media&token=0e53349e-fda0-4640-bb1b-15d134d09781",

        "https://docs.google.com/uc?export=download&id=1IhOkhlLQnGWF-Ce7GaiurRHM_Ujp5L1q",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Let_There_Be_Rain_Silver_Maple.mp3?alt=media&token=0cb1da13-983a-49ac-967e-2c479a59eb4c",

        "https://docs.google.com/uc?export=download&id=1bspd9GVKaTMKOG5YL5Xod6dda4Lv6Xav",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Late_Arrivals_Lonov.mp3?alt=media&token=eca7b9c3-575e-471a-9f63-f56525d10838",

        "https://docs.google.com/uc?export=download&id=19hBZ49aIHXmGlm0aM8-5rlwRv2st5V8m",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Lakes_Harbours_Oceans.mp3?alt=media&token=735bfb81-3839-419b-b791-bd428f086564",

        "https://docs.google.com/uc?export=download&id=1JdDKW4AsZJn2ahvVmZ2rOU9tQG2rqxLA",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Krotos_They_Dream_By_Day.mp3?alt=media&token=4234478f-ef5c-4bea-9040-b2865b8a2310",

        "https://docs.google.com/uc?export=download&id=17klvCVAFU-k3kdFNxGFenDTHp9ihprGh",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Dreaming_Wide_Awake_King_Sis.mp3?alt=media&token=99219e27-6e23-41e8-b17e-8f6ad4477916",

        "https://docs.google.com/uc?export=download&id=1BxVAHqmW83P2hvDqLJdPKU9jH1gVXnOh",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Copycat_Far_Orange.mp3?alt=media&token=e6836423-beb8-4d4c-b5ca-05d4d4e87ecd",

        "https://docs.google.com/uc?export=download&id=1KKmZUAR-3kteW9BBcCZY2bal1kXX-D9v",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Between_Illusions_Rikard_From.mp3?alt=media&token=1adb5b2a-cb0c-4b05-bc7e-242bf904ca42",

        "https://docs.google.com/uc?export=download&id=1U5RYYoFAllCS2PiinuWMqLuHIb15xn1W",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Baby_Idk_Rambutan.mp3?alt=media&token=44417e87-5aed-4bfa-a6b0-ae7054027f7b",

        "https://docs.google.com/uc?export=download&id=1Poh6p5vb9emWe3Pljsy9eZL4iUy-tDzB",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Avinam_Valante.mp3?alt=media&token=873104dc-a06a-410a-b299-7598518812c8",

        "https://docs.google.com/uc?export=download&id=1VmGXkEQC-h1hoDSOtFMTifpHZmz1GkxE",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Alike_Jones_Meadow.mp3?alt=media&token=e496d1ab-d466-4163-b85d-bb7b48af4096",

        "https://docs.google.com/uc?export=download&id=18d17nC1-XDROFiq4Uc9ZFkWhWb5RShDw",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_Abstractions_Aleph_One.mp3?alt=media&token=284567d7-fb25-4433-bb29-4d883c6db1d2",

        "https://docs.google.com/uc?export=download&id=1zuoNWVYDzv_FCKhvflPI0ODtOAUv0FSr",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FES_100%20Times_Jones_Meadow.mp3?alt=media&token=ca0cf014-fd42-4e9c-bf15-cfd0f8f4be70",

        "https://docs.google.com/uc?export=download&id=1qXspHiQU1-bR0uwVSmFT5Nw9S8YcsoBF",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fmusic_2.mp3?alt=media&token=388127dc-bc9b-4e59-889d-c7549a5b6068",
        // "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/2.mp3",


        "https://docs.google.com/uc?export=download&id=1HWWge6UTf27qja-eBJ0Ams02IWOo002S",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2F1.mp3?alt=media&token=2169e251-432c-48a9-b313-d0928a6f8fc9",
        // "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/1.mp3",

        "https://docs.google.com/uc?export=download&id=1hRyXSYIvzAHs7L_1sTFOfzywafDf2Ed8",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2F3.mp3?alt=media&token=4490712b-97c0-47fd-a82a-b59f85883e83",
        // "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/3.mp3",

        "https://docs.google.com/uc?export=download&id=1HOAg_nIoaZgrnGbQcDE5mHpT9GdaDeSD",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2F4.mp3?alt=media&token=b137d3e7-f164-4020-b62f-f6a2cd8c99e2",
        // "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/4.mp3",

        "https://docs.google.com/uc?export=download&id=1ljjBaU4DIADKNtb8vX_9DC-kuqF3F6si",
        // "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2F5.mp3?alt=media&token=0a93b45c-6d92-4e58-96df-fa48203b66d8",
        // "https://raw.githubusercontent.com/himalayasingh/music-player-1/master/music/5.mp3"
    ],
    playPreviousTrackButton = $("#play-previous"),
    playNextTrackButton = $("#play-next"),
    currIndex = getRandomInt(26),
    audio, currAlbum, currTrackName, currArtwork;

function playPause() {
    setTimeout(function () {
        if (audio.paused) {
            playerTrack.addClass("active");
            albumArt.addClass("active");
            checkBuffering();
            i.attr("class", "fas fa-pause");
            audio.play();

            $.ajax({
                url: "./touchedMusicPlayBtn",
                type: "POST",
                dataType: "text",
                data: {
                    isMusicPlaying: true,
                }
            });
        } else {
            playerTrack.removeClass("active");
            albumArt.removeClass("active");
            clearInterval(buffInterval);
            albumArt.removeClass("buffering");
            i.attr("class", "fas fa-play");
            audio.pause();

            $.ajax({
                url: "./touchedMusicPlayBtn",
                type: "POST",
                dataType: "text",
                data: {
                    isMusicPlaying: false,
                }
            });
        }
    }, 300);
}

function showHover(event) {
    seekBarPos = sArea.offset();
    seekT = event.clientX - seekBarPos.left;
    seekLoc = audio.duration * (seekT / sArea.outerWidth());

    sHover.width(seekT);

    cM = seekLoc / 60;

    ctMinutes = Math.floor(cM);
    ctSeconds = Math.floor(seekLoc - ctMinutes * 60);

    if (ctMinutes < 0 || ctSeconds < 0) return;

    if (ctMinutes < 0 || ctSeconds < 0) return;

    if (ctMinutes < 10) ctMinutes = "0" + ctMinutes;
    if (ctSeconds < 10) ctSeconds = "0" + ctSeconds;

    if (isNaN(ctMinutes) || isNaN(ctSeconds)) insTime.text("--:--");
    else insTime.text(ctMinutes + ":" + ctSeconds);

    insTime.css({ left: seekT, "margin-left": "-21px" }).fadeIn(0);
}

function hideHover() {
    sHover.width(0);
    insTime.text("00:00").css({ left: "0px", "margin-left": "0px" }).fadeOut(0);
}

function playFromClickedPos() {
    audio.currentTime = seekLoc;
    seekBar.width(seekT);
    hideHover();
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function playNextSong() {
    currIndex = getRandomInt(26);
    var flag = 1;
    if (currIndex == albumArtworks.length) currIndex = 0;
    if (currIndex > -1 && currIndex < albumArtworks.length) {
        if (flag == 0) i.attr("class", "fa fa-play");
        else {
            albumArt.removeClass("buffering");
            i.attr("class", "fa fa-pause");
        }

        seekBar.width(0);
        trackTime.removeClass("active");
        tProgress.text("00:00");
        tTime.text("00:00");

        currAlbum = albums[currIndex];
        currTrackName = trackNames[currIndex];
        currArtwork = albumArtworks[currIndex];

        audio.src = trackUrl[currIndex];

        nTime = 0;
        bTime = new Date();
        bTime = bTime.getTime();

        if (flag != 0) {
            audio.play();
            playerTrack.addClass("active");
            albumArt.addClass("active");

            clearInterval(buffInterval);
            checkBuffering();
        }

        albumName.text(currAlbum);
        trackName.text(currTrackName);
        albumArt.find("img.active").removeClass("active");
        $("#" + currArtwork).addClass("active");

        bgArtworkUrl = $("#" + currArtwork).attr("src");

        bgArtwork.css({ "background-image": "url(" + bgArtworkUrl + ")" });
    } else {
        if (flag == 0 || flag == 1) --currIndex;
        else ++currIndex;
    }
}

function updateCurrTime() {
    nTime = new Date();
    nTime = nTime.getTime();

    if (!tFlag) {
        tFlag = true;
        trackTime.addClass("active");
    }

    curMinutes = Math.floor(audio.currentTime / 60);
    curSeconds = Math.floor(audio.currentTime - curMinutes * 60);

    durMinutes = Math.floor(audio.duration / 60);
    durSeconds = Math.floor(audio.duration - durMinutes * 60);

    playProgress = (audio.currentTime / audio.duration) * 100;

    if (curMinutes < 10) curMinutes = "0" + curMinutes;
    if (curSeconds < 10) curSeconds = "0" + curSeconds;

    if (durMinutes < 10) durMinutes = "0" + durMinutes;
    if (durSeconds < 10) durSeconds = "0" + durSeconds;

    if (isNaN(curMinutes) || isNaN(curSeconds)) tProgress.text("00:00");
    else tProgress.text(curMinutes + ":" + curSeconds);

    if (isNaN(durMinutes) || isNaN(durSeconds)) tTime.text("00:00");
    else tTime.text(durMinutes + ":" + durSeconds);

    if (
        isNaN(curMinutes) ||
        isNaN(curSeconds) ||
        isNaN(durMinutes) ||
        isNaN(durSeconds)
    )
        trackTime.removeClass("active");
    else trackTime.addClass("active");

    seekBar.width(playProgress + "%");

    if (playProgress == 100) {
        i.attr("class", "fa fa-play");
        seekBar.width(0);
        tProgress.text("00:00");
        albumArt.removeClass("buffering").removeClass("active");
        clearInterval(buffInterval);
    }
}

function checkBuffering() {
    clearInterval(buffInterval);
    buffInterval = setInterval(function () {
        if (nTime == 0 || bTime - nTime > 1000) albumArt.addClass("buffering");
        else albumArt.removeClass("buffering");

        bTime = new Date();
        bTime = bTime.getTime();
    }, 100);
}

function selectTrack(flag) {
    if (flag == 0 || flag == 1) ++currIndex;
    else --currIndex;
    if (currIndex == albumArtworks.length) currIndex = 0;
    if (currIndex > -1 && currIndex < albumArtworks.length) {
        if (flag == 0) i.attr("class", "fa fa-play");
        else {
            albumArt.removeClass("buffering");
            i.attr("class", "fa fa-pause");
        }

        seekBar.width(0);
        trackTime.removeClass("active");
        tProgress.text("00:00");
        tTime.text("00:00");

        currAlbum = albums[currIndex];
        currTrackName = trackNames[currIndex];
        currArtwork = albumArtworks[currIndex];

        audio.src = trackUrl[currIndex];

        nTime = 0;
        bTime = new Date();
        bTime = bTime.getTime();

        if (flag != 0) {
            audio.play();
            playerTrack.addClass("active");
            albumArt.addClass("active");

            clearInterval(buffInterval);
            checkBuffering();
        }

        albumName.text(currAlbum);
        trackName.text(currTrackName);
        albumArt.find("img.active").removeClass("active");
        $("#" + currArtwork).addClass("active");

        bgArtworkUrl = $("#" + currArtwork).attr("src");

        bgArtwork.css({ "background-image": "url(" + bgArtworkUrl + ")" });
    } else {
        if (flag == 0 || flag == 1) --currIndex;
        else ++currIndex;
    }
}

function initPlayer() {
    audio = new Audio();

    selectTrack(0);

    audio.loop = false;

    playPauseButton.on("click", playPause);

    sArea.mousemove(function (event) {
        showHover(event);
    });

    sArea.mouseout(hideHover);

    sArea.on("click", playFromClickedPos);

    $(audio).on("timeupdate", updateCurrTime);

    $(audio).on("ended", playNextSong);

    playPreviousTrackButton.on("click", function () {
        selectTrack(-1);
    });

    playNextTrackButton.on("click", function () {
        selectTrack(1);
    });

    var start_btn = document.getElementById("startBtn");
    start_btn.addEventListener("click", function () {
        if (document.getElementById("publishSection").style.display !== "none") {
            // $("#processNotesSec").fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
            $("#publishSection").fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
            return;
        }
        var start_btn = document.getElementById("startBtn");
        var btnVal = start_btn.alt;
        if (btnVal == "start_a_tomato") {
            if (audio.paused) {
                document.getElementById('play-pause-button').click();
                $.ajax({
                    url: "./touchedMusicPlayBtn",
                    type: "POST",
                    dataType: "text",
                    data: {
                        isMusicPlaying: true,
                    }
                });
            }
            $('#musicCollapse').collapse("hide")
        } else {
            $('#musicCollapse').collapse("show")
        }
    });
}

export function StopMusic() {
    if (audio.paused) {
        audio.currentTime = 0;
    } else {
        playPause();
    }
}

initPlayer();