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

function Circlebar(prefs) {
    this.element = $(prefs.element);
    this.element.append('<div class="spinner-holder-one animate-0-25-a"><div class="spinner-holder-two animate-0-25-b"><div class="loader-spinner" style=""></div></div></div><div class="spinner-holder-one animate-25-50-a"><div class="spinner-holder-two animate-25-50-b"><div class="loader-spinner"></div></div></div><div class="spinner-holder-one animate-50-75-a"><div class="spinner-holder-two animate-50-75-b"><div class="loader-spinner"></div></div></div><div class="spinner-holder-one animate-75-100-a"><div class="spinner-holder-two animate-75-100-b"><div class="loader-spinner"></div></div></div>');
    this.value, this.maxValue, this.counter, this.dialWidth, this.size, this.fontSize, this.fontColor, this.skin, this.triggerPercentage, this.type, this.timer;
    // var attribs = this.element.find("div")[0].parentNode.dataset;
    var attribs = this.element[0].dataset,
        that = this;
    this.initialise = function () {
        that.value = parseInt(attribs.circleStarttime) || parseInt(prefs.startTime) || 0;
        that.maxValue = parseInt(attribs.circleMaxvalue) || parseInt(prefs.maxValue) || 60;
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
            StopMusic();
            var audio = new Audio("https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fending_music.mov?alt=media&token=bf79ce38-cf06-4a12-8fc8-425677a3c62d");
            audio.play();
            audio.addEventListener("ended", function () {
                alert("Congrats, you've achieved another Tomato!")
                audio.currentTime = 0;
            });
        }
    };
    this.textFilter = function () {
        var start_btn = document.getElementById("startBtn");
        var btnVal = start_btn.alt;
        if (btnVal == "start_a_tomato") {
            var percentage = 0,
                date = 0,
                text = that.element.find(".text");
            if (that.type == "timer") {
                if (that.timer === undefined) {
                    that.timer = setInterval(function () {
                        if (that.value < that.maxValue) {
                            that.value += parseInt(that.counter / 1000);
                            percentage = (that.value * 100) / that.maxValue;
                            that.renderProgress(percentage);
                            text[0].dataset.value = that.value;
                            date = new Date(null);
                            date.setSeconds(that.value); // specify value for seconds here
                            text.html(date.toISOString().substr(14, 5));
                        } else {
                            clearInterval(that.timer);
                            that.timer = undefined
                        }
                    }, (that.counter));
                }
            }
            if (that.type == "progress") {
                function setDeceleratingTimeout(factor, times) {
                    var internalCallback = function (counter) {
                        return function () {
                            if (that.value < that.maxValue && that.value < 100) {
                                that.value += 1;
                                that.renderProgress(that.value);
                                text[0].dataset.value = that.value;
                                text.html(Math.floor(that.value) + "%");
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
                if (that.timer === undefined) {
                    that.timer = setInterval(function () {
                        if (that.value < that.maxValue) {
                            that.value += parseInt(that.counter / 1000);
                            percentage = (that.value * 100) / that.maxValue;
                            that.renderProgress(percentage);
                            text[0].dataset.value = that.value;
                            date = new Date(null);
                            date.setSeconds(that.value); // specify value for seconds here
                            text.html(date.toISOString().substr(14, 5));
                        } else {
                            clearInterval(that.timer);
                            that.timer = undefined
                        }
                    }, (that.counter));
                }
            }
            if (that.type == "progress") {
                function setDeceleratingTimeout(factor, times) {
                    var internalCallback = function (counter) {
                        return function () {
                            if (that.value < that.maxValue && that.value < 100) {
                                that.value += 1;
                                that.renderProgress(that.value);
                                text[0].dataset.value = that.value;
                                text.html(Math.floor(that.value) + "%");
                                setTimeout(internalCallback, ++counter * factor);
                            }
                        }
                    }(times, 0);
                    setTimeout(internalCallback, factor);
                };
                setDeceleratingTimeout(0.1, 100);
            }
        } else {
            clearInterval(that.timer);
            that.timer = undefined;
        }
    }

    this.setValue = function (val) {
        text = that.element.find(".text");
        that.value = val;
        that.renderProgress(that.value);
        text[0].dataset.value = that.value;
        text.html(that.value);
    }

    var start_btn = document.getElementById("startBtn");
    start_btn.addEventListener("click", this.textFilter);
    if (that.value) {
        this.continueOnReloadPage();
    }
}

export function StartProgress() {
    this.textFilter();
}
