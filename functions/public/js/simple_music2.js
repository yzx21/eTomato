(function (window, undefined) {

    'use strict';

    var AudioPlayer = (function () {

        // Player vars!
        var
            docTitle = document.title,
            player = document.getElementById('ap'),
            playBtn,
            playSvg,
            playSvgPath,
            prevBtn,
            nextBtn,
            volumeBtn,
            progressBar,
            preloadBar,
            curTime,
            durTime,
            trackTitle,
            audio,
            index = 0,
            playList,
            volumeBar,
            wheelVolumeValue = 0,
            volumeLength,
            repeating = false,
            seeking = false,
            seekingVol = false,
            rightClick = false,
            apActive = false,

            // settings
            settings = {
                volume: 0.75,
                changeDocTitle: false,
                confirmClose: true,
                autoPlay: false,
                buffered: true,
                notification: true,
                playList: []
            };

        function isPlaying() {
            return !audio.paused;
        }

        function init(options) {

            if (!('classList' in document.documentElement)) {
                return false;
            }

            if (apActive || player === null) {
                return 'Player already init';
            }

            settings = extend(settings, options);

            // get player elements
            playBtn = player.querySelector('.ap__controls--toggle');
            playSvg = playBtn.querySelector('.icon-play');
            playSvgPath = playSvg.querySelector('path');
            prevBtn = player.querySelector('.ap__controls--prev');
            nextBtn = player.querySelector('.ap__controls--next');
            volumeBtn = player.querySelector('.volume-btn');
            curTime = player.querySelector('.track__time--current');
            durTime = player.querySelector('.track__time--duration');
            trackTitle = player.querySelector('.track__title');
            progressBar = player.querySelector('.progress__bar');
            preloadBar = player.querySelector('.progress__preload');
            volumeBar = player.querySelector('.volume__bar');

            playList = settings.playList;

            playBtn.addEventListener('click', playToggle, false);
            volumeBtn.addEventListener('click', volumeToggle, false);

            progressBar.closest('.progress-container').addEventListener('mousedown', handlerBar, false);
            progressBar.closest('.progress-container').addEventListener('mousemove', seek, false);

            document.documentElement.addEventListener('mouseup', seekingFalse, false);

            volumeBar.closest('.volume').addEventListener('mousedown', handlerVol, false);
            volumeBar.closest('.volume').addEventListener('mousemove', setVolume);
            volumeBar.closest('.volume').addEventListener(wheel(), setVolume, false);

            prevBtn.addEventListener('click', prev, false);
            nextBtn.addEventListener('click', next, false);

            apActive = true;


            // Create audio object
            audio = new Audio();
            audio.volume = settings.volume;
            audio.preload = 'auto';

            audio.addEventListener('error', errorHandler, false);
            audio.addEventListener('timeupdate', timeUpdate, false);
            audio.addEventListener('ended', doEnd, false);

            volumeBar.style.height = audio.volume * 100 + '%';
            volumeLength = volumeBar.css('height');

            if (settings.confirmClose) {
                window.addEventListener("beforeunload", beforeUnload, false);
            }

            if (isEmptyList()) {
                return false;
            }
            audio.src = playList[index].file;
            trackTitle.innerHTML = playList[index].title;

            if (settings.autoPlay) {
                audio.play();
                playBtn.classList.add('is-playing');
                playSvgPath.setAttribute('d', playSvg.getAttribute('data-pause'));
                plLi[index].classList.add('pl-list--current');

            }
        }

        function beforeUnload(evt) {
            if (!audio.paused) {
                var message = 'Music still playing';
                evt.returnValue = message;
                return message;
            }
        }

        function errorHandler(evt) {
            if (isEmptyList()) {
                return;
            }
            var mediaError = {
                '1': 'MEDIA_ERR_ABORTED',
                '2': 'MEDIA_ERR_NETWORK',
                '3': 'MEDIA_ERR_DECODE',
                '4': 'MEDIA_ERR_SRC_NOT_SUPPORTED'
            };
            audio.pause();
            curTime.innerHTML = '--';
            durTime.innerHTML = '--';
            progressBar.style.width = 0;
            preloadBar.style.width = 0;
            playBtn.classList.remove('is-playing');
            playSvgPath.setAttribute('d', playSvg.getAttribute('data-play'));
            plLi[index] && plLi[index].classList.remove('pl-list--current');
            throw new Error('Houston we have a problem: ' + mediaError[evt.target.error.code]);
        }

        /**
         * UPDATE PL
         */
        function updatePL(addList) {
            if (!apActive) {
                return 'Player is not yet initialized';
            }
            if (!Array.isArray(addList)) {
                return;
            }
            if (addList.length === 0) {
                return;
            }

            var count = playList.length;
            var html = [];
            playList.push.apply(playList, addList);
            addList.forEach(function (item) {
                html.push(
                    tplList.replace('{count}', count++).replace('{title}', item.title)
                );
            });
            // If exist empty message
            if (plUl.querySelector('.pl-list--empty')) {
                plUl.removeChild(pl.querySelector('.pl-list--empty'));
                audio.src = playList[index].file;
                trackTitle.innerHTML = playList[index].title;
            }
            // Add song into playlist
            plUl.insertAdjacentHTML('beforeEnd', html.join(''));
            plLi = pl.querySelectorAll('li');
        }


        function listHandler(evt) {
            evt.preventDefault();

            if (evt.target.matches('.pl-list__title')) {
                var current = parseInt(evt.target.closest('.pl-list').getAttribute('data-track'), 10);
                if (index !== current) {
                    index = current;
                    play(current);
                }
                else {
                    playToggle();
                }
            }
            else {
                if (!!evt.target.closest('.pl-list__remove')) {
                    var parentEl = evt.target.closest('.pl-list');
                    var isDel = parseInt(parentEl.getAttribute('data-track'), 10);

                    playList.splice(isDel, 1);
                    parentEl.closest('.pl-ul').removeChild(parentEl);

                    plLi = pl.querySelectorAll('li');

                    [].forEach.call(plLi, function (el, i) {
                        el.setAttribute('data-track', i);
                    });

                    if (!audio.paused) {

                        if (isDel === index) {
                            play(index);
                        }

                    }
                    else {
                        if (isEmptyList()) {
                            clearAll();
                        }
                        else {
                            if (isDel === index) {
                                if (isDel > playList.length - 1) {
                                    index -= 1;
                                }
                                audio.src = playList[index].file;
                                trackTitle.innerHTML = playList[index].title;
                                progressBar.style.width = 0;
                            }
                        }
                    }
                    if (isDel < index) {
                        index--;
                    }
                }

            }
        }


        /**
         * Player methods
         */
        function play(currentIndex) {

            if (isEmptyList()) {
                return clearAll();
            }

            index = (currentIndex + playList.length) % playList.length;

            audio.src = playList[index].file;
            trackTitle.innerHTML = playList[index].title;

            // Audio play
            audio.play();

            // Toggle play button
            playBtn.classList.add('is-playing');
            playSvgPath.setAttribute('d', playSvg.getAttribute('data-pause'));

        }

        function prev() {
            play(index - 1);
        }

        function next() {
            play(index + 1);
        }

        function isEmptyList() {
            return playList.length === 0;
        }

        function clearAll() {
            audio.pause();
            audio.src = '';
            trackTitle.innerHTML = 'queue is empty';
            curTime.innerHTML = '--';
            durTime.innerHTML = '--';
            progressBar.style.width = 0;
            preloadBar.style.width = 0;
            playBtn.classList.remove('is-playing');
            playSvgPath.setAttribute('d', playSvg.getAttribute('data-play'));
            if (!plUl.querySelector('.pl-list--empty')) {
                plUl.innerHTML = '<li class="pl-list--empty">PlayList is empty</li>';
            }
        }

        function playToggle() {
            if (isEmptyList()) {
                return;
            }
            if (audio.paused) {

                audio.play();

                playBtn.classList.add('is-playing');
                playSvgPath.setAttribute('d', playSvg.getAttribute('data-pause'));
            }
            else {
                audio.pause();
                playBtn.classList.remove('is-playing');
                playSvgPath.setAttribute('d', playSvg.getAttribute('data-play'));
            }
        }

        function volumeToggle() {
            if (audio.muted) {
                if (parseInt(volumeLength, 10) === 0) {
                    volumeBar.style.height = settings.volume * 100 + '%';
                    audio.volume = settings.volume;
                }
                else {
                    volumeBar.style.height = volumeLength;
                }
                audio.muted = false;
                volumeBtn.classList.remove('has-muted');
            }
            else {
                audio.muted = true;
                volumeBar.style.height = 0;
                volumeBtn.classList.add('has-muted');
            }
        }


        function timeUpdate() {
            if (audio.adyState === 0 || seeking) return;

            var barlength = Math.round(audio.currentTime * (100 / audio.duration));
            progressBar.style.width = barlength + '%';

            var
                curMins = Math.floor(audio.currentTime / 60),
                curSecs = Math.floor(audio.currentTime - curMins * 60),
                mins = Math.floor(audio.duration / 60),
                secs = Math.floor(audio.duration - mins * 60);
            (curSecs < 10) && (curSecs = '0' + curSecs);
            (secs < 10) && (secs = '0' + secs);

            curTime.innerHTML = curMins + ':' + curSecs;
            durTime.innerHTML = mins + ':' + secs;

            if (settings.buffered) {
                var buffered = audio.buffered;
                if (buffered.length) {
                    var loaded = Math.round(100 * buffered.end(0) / audio.duration);
                    preloadBar.style.width = loaded + '%';
                }
            }
        }

        /**
         * TODO shuffle
         */
        function shuffle() {
            if (shuffle) {
                index = Math.round(Math.random() * playList.length);
            }
        }

        function doEnd() {
            if (index === playList.length - 1) {
                if (!repeating) {
                    audio.pause();
                    plActive();
                    playBtn.classList.remove('is-playing');
                    playSvgPath.setAttribute('d', playSvg.getAttribute('data-play'));
                    return;
                }
                else {
                    play(0);
                }
            }
            else {
                play(index + 1);
            }
        }

        function moveBar(evt, el, dir) {
            var value;
            if (dir === 'horizontal') {
                value = Math.round(((evt.clientX - el.offset().left) + window.pageXOffset) * 100 / el.parentNode.offsetWidth);
                el.style.width = value + '%';
                return value;
            }
            else {
                if (evt.type === wheel()) {
                    value = parseInt(volumeLength, 10);
                    var delta = evt.deltaY || evt.detail || -evt.wheelDelta;
                    value = (delta > 0) ? value - 10 : value + 10;
                }
                else {
                    var offset = (el.offset().top + el.offsetHeight) - window.pageYOffset;
                    value = Math.round((offset - evt.clientY));
                }
                if (value > 100) value = wheelVolumeValue = 100;
                if (value < 0) value = wheelVolumeValue = 0;
                volumeBar.style.height = value + '%';
                return value;
            }
        }

        function handlerBar(evt) {
            rightClick = (evt.which === 3) ? true : false;
            seeking = true;
            !rightClick && progressBar.classList.add('progress__bar--active');
            seek(evt);
        }

        function handlerVol(evt) {
            rightClick = (evt.which === 3) ? true : false;
            seekingVol = true;
            setVolume(evt);
        }

        function seek(evt) {
            evt.preventDefault();
            if (seeking && rightClick === false && audio.readyState !== 0) {
                window.value = moveBar(evt, progressBar, 'horizontal');
            }
        }

        function seekingFalse() {
            if (seeking && rightClick === false && audio.readyState !== 0) {
                audio.currentTime = audio.duration * (window.value / 100);
                progressBar.classList.remove('progress__bar--active');
            }
            seeking = false;
            seekingVol = false;
        }

        function setVolume(evt) {
            evt.preventDefault();
            volumeLength = volumeBar.css('height');
            if (seekingVol && rightClick === false || evt.type === wheel()) {
                var value = moveBar(evt, volumeBar.parentNode, 'vertical') / 100;
                if (value <= 0) {
                    audio.volume = 0;
                    audio.muted = true;
                    volumeBtn.classList.add('has-muted');
                }
                else {
                    if (audio.muted) audio.muted = false;
                    audio.volume = value;
                    volumeBtn.classList.remove('has-muted');
                }
            }
        }

        /* Destroy method. Clear All */
        function destroy() {
            if (!apActive) return;

            if (settings.confirmClose) {
                window.removeEventListener('beforeunload', beforeUnload, false);
            }

            playBtn.removeEventListener('click', playToggle, false);
            volumeBtn.removeEventListener('click', volumeToggle, false);

            progressBar.closest('.progress-container').removeEventListener('mousedown', handlerBar, false);
            progressBar.closest('.progress-container').removeEventListener('mousemove', seek, false);
            document.documentElement.removeEventListener('mouseup', seekingFalse, false);

            volumeBar.closest('.volume').removeEventListener('mousedown', handlerVol, false);
            volumeBar.closest('.volume').removeEventListener('mousemove', setVolume);
            volumeBar.closest('.volume').removeEventListener(wheel(), setVolume);
            document.documentElement.removeEventListener('mouseup', seekingFalse, false);

            prevBtn.removeEventListener('click', prev, false);
            nextBtn.removeEventListener('click', next, false);

            audio.removeEventListener('error', errorHandler, false);
            audio.removeEventListener('timeupdate', timeUpdate, false);
            audio.removeEventListener('ended', doEnd, false);

            // Playlist
            pl.removeEventListener('click', listHandler, false);
            pl.parentNode.removeChild(pl);

            audio.pause();
            apActive = false;
            index = 0;

            playBtn.classList.remove('is-playing');
            playSvgPath.setAttribute('d', playSvg.getAttribute('data-play'));
            volumeBtn.classList.remove('has-muted');

            // Remove player from the DOM if necessary
            // player.parentNode.removeChild(player);
        }


        /**
         *  Helpers
         */
        function wheel() {
            var wheel;
            if ('onwheel' in document) {
                wheel = 'wheel';
            } else if ('onmousewheel' in document) {
                wheel = 'mousewheel';
            } else {
                wheel = 'MozMousePixelScroll';
            }
            return wheel;
        }

        function extend(defaults, options) {
            for (var name in options) {
                if (defaults.hasOwnProperty(name)) {
                    defaults[name] = options[name];
                }
            }
            return defaults;
        }
        function create(el, attr) {
            var element = document.createElement(el);
            if (attr) {
                for (var name in attr) {
                    if (element[name] !== undefined) {
                        element[name] = attr[name];
                    }
                }
            }
            return element;
        }

        Element.prototype.offset = function () {
            var el = this.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            return {
                top: el.top + scrollTop,
                left: el.left + scrollLeft
            };
        };

        Element.prototype.css = function (attr) {
            if (typeof attr === 'string') {
                return getComputedStyle(this, '')[attr];
            }
            else if (typeof attr === 'object') {
                for (var name in attr) {
                    if (this.style[name] !== undefined) {
                        this.style[name] = attr[name];
                    }
                }
            }
        };

        // matches polyfill
        window.Element && function (ElementPrototype) {
            ElementPrototype.matches = ElementPrototype.matches ||
                ElementPrototype.matchesSelector ||
                ElementPrototype.webkitMatchesSelector ||
                ElementPrototype.msMatchesSelector ||
                function (selector) {
                    var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;
                    while (nodes[++i] && nodes[i] != node);
                    return !!nodes[i];
                };
        }(Element.prototype);

        // closest polyfill
        window.Element && function (ElementPrototype) {
            ElementPrototype.closest = ElementPrototype.closest ||
                function (selector) {
                    var el = this;
                    while (el.matches && !el.matches(selector)) el = el.parentNode;
                    return el.matches ? el : null;
                };
        }(Element.prototype);

        /**
         *  Public methods
         */
        return {
            init: init,
            update: updatePL,
            destroy: destroy,
            isPlaying: isPlaying,
        };

    })();

    window.AP = AudioPlayer;

})(window);

Array.prototype.shuffle = function () {
    let m = this.length, i;
    while (m) {
        i = (Math.random() * m--) >>> 0;
        [this[m], this[i]] = [this[i], this[m]]
    }
    return this;
}

// TEST: image for web notifications
var iconImage = 'https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2F_1.jpeg?alt=media&token=1bb7b4f7-f7aa-43c4-b6e7-8003fb40d8ec';

var firstSong = [{ 'icon': iconImage, 'title': 'Axero - River', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FAxero-River.mp3?alt=media&token=56c8ae59-07a8-45cb-a1ac-9dc057c18c30", },]
var shuffledSongs = [
    {
        'icon': iconImage, 'title': 'An Avenue - Tsunenori', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FAnAvenueTsunenori.mp3?alt=media&token=dfbe41cf-9a2a-4de7-add5-93c4ad59e23f",
    },
    {
        'icon': iconImage, 'title': 'Remember-7AND5', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FRemember-7AND5.mp3?alt=media&token=e02f183d-16af-4cce-86cb-c80ab29efd97",
    },
    {
        'icon': iconImage, 'title': 'Sakura Memory-Otokaze', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FSakuraMemory-Otokaze.mp3?alt=media&token=702af1f3-939b-4bd7-af8d-caddf5cae0c1",
    },
    {
        'icon': iconImage, 'title': "Take Me hand Feat - Cecile Corbel - Daishi Dance", 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FtakeMeHandFeat-CecileCorbel-DaishiDance.mp3?alt=media&token=ac9a93db-4b0e-46c8-bc4a-cb8a3230ea36",
    },
    {
        'icon': iconImage, 'title': 'You - Approaching Nivana', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FYou-ApproachingNirvana.mp3?alt=media&token=82629970-bc1b-47a2-b930-d7fc3e985564",
    },
    {
        'icon': iconImage, 'title': 'iamsleepless - A Faint Memory', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FIamSleepless-AFaintMemory.mp3?alt=media&token=4e59fcff-4a3a-469d-829b-3146ae239052",
    },
    {
        'icon': iconImage, 'title': "Tom Day - Flemington", 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FTomDay-Flemington.mp3?alt=media&token=bde4e456-b623-4726-8013-6771d4a3bfe8",
    },
    {
        'icon': iconImage, 'title': "Rameses B - Moon Light", 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FRamesesBMoonLight.mp3?alt=media&token=3c84498f-a9e2-41bd-83b9-58d4171f9a78",
    },
    {
        'icon': iconImage, 'title': 'Explosions In The Sky - Your Hand In Mine', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FExplosionsInTheSky-YourHandInMine.mp3?alt=media&token=f1c8f106-bd9b-45f1-9712-c0e85ac99e5c",
    },
    {
        'icon': iconImage, 'title': 'Various Artists - Steerner By Waves', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FVariousArtists-SteernerByWaves.mp3?alt=media&token=92492536-9e6c-468c-a9e2-4b97500e92b5",
    },
    {
        'icon': iconImage, 'title': 'Ambient - piano - meditation', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fambient-piano-meditation-7359.mp3?alt=media&token=0b4382e8-7209-4932-8fa2-9ac09508d662",
    },
    {
        'icon': iconImage, 'title': 'Echoes - of - the - forest - meditation', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fechoes-of-the-forest-meditation-4813.mp3?alt=media&token=ee166937-015b-42a2-9f15-02d0f1acde16",
    },
    {
        'icon': iconImage, 'title': 'Inner - peace- meditation', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Finner-peace-meditation-106798.mp3?alt=media&token=c1181533-113f-4987-bb7f-f68bae198535",
    },
    {
        'icon': iconImage, 'title': 'Inverness meditative ambient sound scape for learning and releaxing', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Finverness-meditative-ambient-soundscape-for-learning-and-relaxing-106810.mp3?alt=media&token=659eb09b-c2cb-4ca2-9aa2-009bf8fea76d",
    },
    {
        'icon': iconImage, 'title': 'Ocean choir meditation', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Focean-choir-meditation-8234.mp3?alt=media&token=547d5e0a-8df3-4062-83cf-86c3c9285741",
    },
    {
        'icon': iconImage, 'title': 'Marconi Union - Weightless', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2FMarconi%20Union%20-%20Weightless%20(128).mp3?alt=media&token=7eacaf96-0817-40dd-9a73-7e8f4ee790c7",
    },
    {
        'icon': iconImage, 'title': 'Nature sounds', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fnature-99499.mp3?alt=media&token=0530d83c-a15d-4d8d-bd24-394e7492c4af",
    },
    {
        'icon': iconImage, 'title': 'Peaceful garden healing light paino for meditation zen landscapes', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fpeaceful-garden-healing-light-piano-for-meditation-zen-landscapes-112199.mp3?alt=media&token=dc2529bf-c6bd-4246-848c-dfe702345991",
    },
    {
        'icon': iconImage, 'title': 'Rain forest sleep yoga meditation relaxation', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Frain-forest-sleep-yoga-meditation-relaxation-2044.mp3?alt=media&token=2aa61347-f795-448f-b900-795f4abeee29",
    },
    {
        'icon': iconImage, 'title': 'Warming sun remastered remix', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Fwarming-sun-remastered-remix-13961.mp3?alt=media&token=9e4ef65d-f4e4-4864-a8b5-b6744df3fc59",
    },
    {
        'icon': iconImage, 'title': 'Relaxing music for reflection and creativity', 'file': "https://firebasestorage.googleapis.com/v0/b/etomato-63aac.appspot.com/o/sounds%2Frelaxing-music-for-reflection-and-creativity-16102.mp3?alt=media&token=d349d35c-869f-489c-8157-8459deea229e",
    },
].shuffle();

AP.init({
    playList: firstSong.concat(shuffledSongs)

});

var start_btn = document.getElementById("SimpleStartBtn");
start_btn.addEventListener("click", function () {
    var start_btn = document.getElementById("SimpleStartBtn");
    var btnVal = start_btn.alt;
    if (btnVal == "start_a_tomato") {
        if (!AP.isPlaying()) {
            document.getElementById('play-pause-button').click();
        }
        $('#musicCollapse').collapse("hide")
    } else {
        $('#musicCollapse').collapse("show")
    }
});

export function StopMusic2() {
    if (AP.isPlaying()) {
        document.getElementById('play-pause-button').click();
    }
    $('#musicCollapse').collapse("hide")
}