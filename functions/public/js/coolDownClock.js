import { StopMusic } from "./music.js"

$(document).ready(function () {
    var prefs = {
        element: ".circlebarCD"
    };
    $('.circlebarCD').each(function () {
        prefs.element = $(this);
        new Circlebar(prefs);
    });
});

var timer;
var startTime;
var textFilter;
var value;
var maxValue;
var text;
var resetCDClock;

function Circlebar(prefs) {
    this.element = $(prefs.element);
    this.element.append('<div class="spinner-holder-one animate-0-25-a"><div class="spinner-holder-two animate-0-25-b"><div class="cd-spinner" style=""></div></div></div><div class="spinner-holder-one animate-25-50-a"><div class="spinner-holder-two animate-25-50-b"><div class="cd-spinner"></div></div></div><div class="spinner-holder-one animate-50-75-a"><div class="spinner-holder-two animate-50-75-b"><div class="cd-spinner"></div></div></div><div class="spinner-holder-one animate-75-100-a"><div class="spinner-holder-two animate-75-100-b"><div class="cd-spinner"></div></div></div>');
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
        that.element.find(".cd-spinner").css("border-width", that.dialWidth + "px");
        that.element.css({ "width": that.size, "height": that.size });
        that.element.find(".loader-bg .cd-text")
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
            StopCDTimer();
            var audio = new Audio("https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FCD_Completed.mp3?alt=media&token=7a520622-c205-4820-b76f-31390509ac31");
            audio.play();
            $('#coolDownModal').modal("hide");
        }
    };
    textFilter = function () {
        var percentage = 0,
            date = 0,
            text = that.element.find(".cd-text");
        if (that.type == "timer") {
            if (timer === undefined) {
                startTime = Date.now();
                timer = setInterval(function () {
                    if (value <= maxValue) {
                        value = parseInt((Date.now() - startTime) / 1000);
                        percentage = (value * 100) / maxValue;
                        that.renderProgress(percentage);
                        text[0].dataset.value = value;
                        date = new Date(null);
                        date.setSeconds(maxValue - value); // specify value for seconds here
                        text.html(date.toISOString().substr(14, 5));
                    } else {
                        clearInterval(timer);
                        timer = undefined;
                        startTime = undefined;
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
    }

    this.continueOnReloadPage = function () {
        var start_btn = document.getElementById("startBtn");
        var btnVal = start_btn.alt;
        if (btnVal == "stop_a_tomato") {
            var percentage = 0,
                date = 0,
                text = that.element.find(".cd-text");
            if (that.type == "timer") {
                if (timer === undefined) {
                    startTime = Date.now() - value * 1000;
                    timer = setInterval(function () {
                        if (value < maxValue) {
                            value = parseInt((Date.now() - startTime) / 1000);
                            percentage = (value * 100) / maxValue;
                            that.renderProgress(percentage);
                            text[0].dataset.value = value;
                            date = new Date(null);
                            date.setSeconds(maxValue - value); // specify value for seconds here
                            text.html(date.toISOString().substr(14, 5));
                        } else {
                            clearInterval(timer);
                            timer = undefined;
                            startTime = undefined;
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

    resetCDClock = function (val) {
        text = that.element.find(".cd-text");
        value = val;
        var angle = 90;
        that.element.find(".animate-0-25-b").css("transform", "rotate(" + angle + "deg)");
        that.element.find(".animate-25-50-b").css("transform", "rotate(" + angle + "deg)");
        that.element.find(".animate-50-75-b").css("transform", "rotate(" + angle + "deg)");
        that.element.find(".animate-75-100-b").css("transform", "rotate(" + angle + "deg)");
        text[0].dataset.value = value;
        text.html("05:00");
    }
}

function StopCDTimer() {
    clearInterval(timer);
    timer = undefined
}

window.StartCoolDown = function () {
    textFilter();
}

window.ResetCDClock = function (value) {
    resetCDClock(value);
}