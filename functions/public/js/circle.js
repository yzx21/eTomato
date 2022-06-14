import { StopMusic } from "./music.js"

$(document).ready(function () {
    var prefs = {
        element: ".circlebar"
    };
    $('.circlebar').each(function () {
        prefs.element = $(this);
        new Circlebar(prefs);
    });
});

var timer;
var textFilter;
var value;
var maxValue;
var text;
var resetClock;

function Circlebar(prefs) {
    this.element = $(prefs.element);
    this.element.append('<div class="spinner-holder-one animate-0-25-a"><div class="spinner-holder-two animate-0-25-b"><div class="loader-spinner" style=""></div></div></div><div class="spinner-holder-one animate-25-50-a"><div class="spinner-holder-two animate-25-50-b"><div class="loader-spinner"></div></div></div><div class="spinner-holder-one animate-50-75-a"><div class="spinner-holder-two animate-50-75-b"><div class="loader-spinner"></div></div></div><div class="spinner-holder-one animate-75-100-a"><div class="spinner-holder-two animate-75-100-b"><div class="loader-spinner"></div></div></div>');
    this.value, this.maxValue, this.counter, this.dialWidth, this.size, this.fontSize, this.fontColor, this.skin, this.triggerPercentage, this.type, this.timer;
    // var attribs = this.element.find("div")[0].parentNode.dataset;
    var attribs = this.element[0].dataset,
        that = this;
    this.initialise = function () {
        value = parseInt(attribs.circleStarttime) || parseInt(prefs.startTime) || 0;
        maxValue = parseInt(attribs.circleMaxvalue) || parseInt(prefs.maxValue) || 60;
        that.counter = parseInt(attribs.circleCounter) || parseInt(prefs.counter) || 1000;
        that.dialWidth = parseInt(attribs.circleDialwidth) || parseInt(prefs.dialWidth) || 5;
        that.size = attribs.circleSize || prefs.size || "150px";
        that.fontSize = attribs.circleFontsize || prefs.fontSize || "40px";
        that.fontColor = attribs.circleFontcolor || prefs.fontColor || "rgb(135, 206, 235)";
        that.skin = attribs.circleSkin || prefs.skin || " ";
        that.triggerPercentage = attribs.circleTriggerpercentage || prefs.triggerPercentage || false;
        that.type = attribs.circleType || prefs.type || "timer";


        that.element.addClass(that.skin).addClass('loader');
        that.element.find(".loader-bg").css("border-width", that.dialWidth + "px");
        that.element.find(".loader-spinner").css("border-width", that.dialWidth + "px");
        that.element.css({ "width": that.size, "height": that.size });
        that.element.find(".loader-bg .text")
            .css({ "font-size": that.fontSize, "color": that.fontColor });
    };
    this.initialise();
    this.renderProgress = function (progress) {
        progress = Math.floor(progress);
        var angle = 0;
        if (progress < 25) {
            angle = -90 + (progress / 100) * 360;
            that.element.find(".animate-0-25-b").css("transform", "rotate(" + angle + "deg)");
            if (that.triggerPercentage) {
                that.element.addClass('circle-loaded-0');
            }

        } else if (progress >= 25 && progress < 50) {
            angle = -90 + ((progress - 25) / 100) * 360;
            that.element.find(".animate-0-25-b").css("transform", "rotate(0deg)");
            that.element.find(".animate-25-50-b").css("transform", "rotate(" + angle + "deg)");
            if (that.triggerPercentage) {
                that.element.removeClass('circle-loaded-0').addClass('circle-loaded-25');
            }
        } else if (progress >= 50 && progress < 75) {
            angle = -90 + ((progress - 50) / 100) * 360;
            that.element.find(".animate-25-50-b, .animate-0-25-b").css("transform", "rotate(0deg)");
            that.element.find(".animate-50-75-b").css("transform", "rotate(" + angle + "deg)");
            if (that.triggerPercentage) {
                that.element.removeClass('circle-loaded-25').addClass('circle-loaded-50');
            }
        } else if (progress >= 75 && progress <= 100) {
            angle = -90 + ((progress - 75) / 100) * 360;
            that.element.find(".animate-50-75-b, .animate-25-50-b, .animate-0-25-b")
                .css("transform", "rotate(0deg)");
            that.element.find(".animate-75-100-b").css("transform", "rotate(" + angle + "deg)");
            if (that.triggerPercentage) {
                that.element.removeClass('circle-loaded-50').addClass('circle-loaded-75');
            }
        }

        if (progress == 100) {
            StopTimer();
            StopMusic();
            var audio = new Audio("https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fending_music.mov?alt=media&token=bf79ce38-cf06-4a12-8fc8-425677a3c62d");
            audio.play();
            audio.addEventListener("ended", function () {
                audio.currentTime = 0;
            });
            $('#coolDownModal').modal("show");
            StartCoolDown();
            document.getElementById("startBtn").src = "./public/image/start_tomato.png";
            document.getElementById("startBtn").alt = "start_a_tomato";
            $('#musicCollapse').collapse("hide")
            document.getElementById("publishSection").style.display = "table-row";
            document.getElementById("processNotesSec").style.display = "table-row";
        }
    };
    textFilter = function () {
        percentage = (value * 100) / maxValue;
        if (document.getElementById("processNotesSec").style.display !== "none" && percentage !== 100) {
            $("#processNotesSec").fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
            $("#publishSection").fadeOut(100).fadeIn(100).fadeOut(100).fadeIn(100);
            return;
        }
        var start_btn = document.getElementById("startBtn");
        var btnVal = start_btn.alt;
        if (btnVal == "start_a_tomato") {
            var percentage = 0,
                date = 0,
                text = that.element.find(".text");
            if (that.type == "timer") {
                if (timer === undefined) {
                    timer = setInterval(function () {
                        if (value < maxValue) {
                            value += parseInt(that.counter / 1000);
                            percentage = (value * 100) / maxValue;
                            that.renderProgress(percentage);
                            text[0].dataset.value = value;
                            date = new Date(null);
                            date.setSeconds(maxValue - value); // specify value for seconds here
                            text.html(date.toISOString().substr(14, 5));
                        } else {
                            clearInterval(timer);
                            timer = undefined
                        }
                    }, (that.counter));
                }
            }
            if (that.type == "progress") {
                function setDeceleratingTimeout(factor, times) {
                    var internalCallback = function (counter) {
                        return function () {
                            if (value < maxValue && value < 100) {
                                value += 1;
                                that.renderProgress(value);
                                text[0].dataset.value = value;
                                text.html(Math.floor(value) + "%");
                                setTimeout(internalCallback, ++counter * factor);
                            }
                        }
                    }(times, 0);
                    setTimeout(internalCallback, factor);
                };
                setDeceleratingTimeout(0.1, 100);
            }
        } else {

        }
    }

    this.continueOnReloadPage = function () {
        var start_btn = document.getElementById("startBtn");
        var btnVal = start_btn.alt;
        if (btnVal == "stop_a_tomato") {
            var percentage = 0,
                date = 0,
                text = that.element.find(".text");
            if (that.type == "timer") {
                if (timer === undefined) {
                    timer = setInterval(function () {
                        if (value < maxValue) {
                            value += parseInt(that.counter / 1000);
                            percentage = (value * 100) / maxValue;
                            that.renderProgress(percentage);
                            text[0].dataset.value = value;
                            date = new Date(null);
                            date.setSeconds(maxValue - value); // specify value for seconds here
                            text.html(date.toISOString().substr(14, 5));
                        } else {
                            clearInterval(timer);
                            timer = undefined
                        }
                    }, (that.counter));
                }
            }
            if (that.type == "progress") {
                function setDeceleratingTimeout(factor, times) {
                    var internalCallback = function (counter) {
                        return function () {
                            if (value < maxValue && value < 100) {
                                value += 1;
                                that.renderProgress(value);
                                text[0].dataset.value = value;
                                text.html(Math.floor(value) + "%");
                                setTimeout(internalCallback, ++counter * factor);
                            }
                        }
                    }(times, 0);
                    setTimeout(internalCallback, factor);
                };
                setDeceleratingTimeout(0.1, 100);
            }
        } else {
            clearInterval(timer);
            timer = undefined;
        }
    }

    resetClock = function (val) {
        text = that.element.find(".text");
        value = val;
        var angle = 90;
        that.element.find(".animate-0-25-b").css("transform", "rotate(" + angle + "deg)");
        that.element.find(".animate-25-50-b").css("transform", "rotate(" + angle + "deg)");
        that.element.find(".animate-50-75-b").css("transform", "rotate(" + angle + "deg)");
        that.element.find(".animate-75-100-b").css("transform", "rotate(" + angle + "deg)");
        text[0].dataset.value = value;
        text.html("25:00");
    }

    var start_btn = document.getElementById("startBtn");
    start_btn.addEventListener("click", textFilter);
    if (value) {
        this.continueOnReloadPage();
    }
}

function StopTimer() {
    clearInterval(timer);
    timer = undefined
}

window.StopTomato = function () {
    $.ajax({
        url: "./stopSession",
        type: "POST",
        success: function (result) {
            new Toasteur().success("Tomato stopped", 'Have a break now', () => { });
            StopTimer();
            StopMusic();

            var audio = new Audio("https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fending_music.mov?alt=media&token=bf79ce38-cf06-4a12-8fc8-425677a3c62d");
            audio.play();
            audio.addEventListener("ended", function () {
                audio.currentTime = 0;
            });
            $('#coolDownModal').modal("show");
            StartCoolDown();

            document.getElementById("startBtn").src = "./public/image/start_tomato.png";
            document.getElementById("startBtn").alt = "start_a_tomato";
            $('#musicCollapse').collapse("hide")
            document.getElementById("publishSection").style.display = "table-row";
            document.getElementById("processNotesSec").style.display = "table-row";
        },
        error: function (error) {
            new Toasteur().error(error.responseText, 'Error!', () => { });
            document.getElementById("startBtn").alt = "stop_a_tomato";
            $('#musicCollapse').collapse("show")
        },
    });
}


window.ResetClock = function (value) {
    resetClock(value);
}