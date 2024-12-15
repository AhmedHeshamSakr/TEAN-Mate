self["webpackHotUpdatetean_mate"]("sidebar",{

/***/ "./node_modules/artyom.js/build/artyom.js":
/*!************************************************!*\
  !*** ./node_modules/artyom.js/build/artyom.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _default)
/* harmony export */ });

/**
 * Artyom.js is a voice control, speech recognition and speech synthesis JavaScript library.
 *
 * @requires {webkitSpeechRecognition && speechSynthesis}
 * @license MIT
 * @version 1.0.6
 * @copyright 2017 Our Code World (www.ourcodeworld.com) All Rights Reserved.
 * @author Carlos Delgado (https://github.com/sdkcarlos) and Sema García (https://github.com/semagarcia)
 * @see https://sdkcarlos.github.io/sites/artyom.html
 * @see http://docs.ourcodeworld.com/projects/artyom-js
 */
Object.defineProperty(__webpack_exports__, "__esModule", ({ value: true }));
/// <reference path="artyom.d.ts" />
// Remove "export default " keywords if willing to build with `npm run artyom-build-window`
var Artyom = (function () {
    // Triggered at the declaration of 
    class Artyom {
        constructor() {
            this.ArtyomCommands = [];
            this.ArtyomVoicesIdentifiers = {
                // German
                "de-DE": ["Google Deutsch", "de-DE", "de_DE"],
                // Spanish
                "es-ES": ["Google español", "es-ES", "es_ES", "es-MX", "es_MX"],
                // Italian
                "it-IT": ["Google italiano", "it-IT", "it_IT"],
                // Japanese
                "jp-JP": ["Google 日本人", "ja-JP", "ja_JP"],
                // English USA
                "en-US": ["Google US English", "en-US", "en_US"],
                // English UK
                "en-GB": ["Google UK English Male", "Google UK English Female", "en-GB", "en_GB"],
                // Brazilian Portuguese
                "pt-BR": ["Google português do Brasil", "pt-PT", "pt-BR", "pt_PT", "pt_BR"],
                // Portugal Portuguese
                // Note: in desktop, there's no voice for portugal Portuguese
                "pt-PT": ["Google português do Brasil", "pt-PT", "pt_PT"],
                // Russian
                "ru-RU": ["Google русский", "ru-RU", "ru_RU"],
                // Dutch (holland)
                "nl-NL": ["Google Nederlands", "nl-NL", "nl_NL"],
                // French
                "fr-FR": ["Google français", "fr-FR", "fr_FR"],
                // Polish
                "pl-PL": ["Google polski", "pl-PL", "pl_PL"],
                // Indonesian
                "id-ID": ["Google Bahasa Indonesia", "id-ID", "id_ID"],
                // Hindi
                "hi-IN": ["Google हिन्दी", "hi-IN", "hi_IN"],
                // Mandarin Chinese
                "zh-CN": ["Google 普通话（中国大陆）", "zh-CN", "zh_CN"],
                // Cantonese Chinese
                "zh-HK": ["Google 粤語（香港）", "zh-HK", "zh_HK"],
                // Native voice
                "native": ["native"]
            };
            // Important: retrieve the voices of the browser as soon as possible.
            // Normally, the execution of speechSynthesis.getVoices will return at the first time an empty array.
            if (window.hasOwnProperty('speechSynthesis')) {
                speechSynthesis.getVoices();
            }
            else {
                console.error("Artyom.js can't speak without the Speech Synthesis API.");
            }
            // This instance of webkitSpeechRecognition is the one used by Artyom.
            if (window.hasOwnProperty('webkitSpeechRecognition')) {
                this.ArtyomWebkitSpeechRecognition = new window.webkitSpeechRecognition();
            }
            else {
                console.error("Artyom.js can't recognize voice without the Speech Recognition API.");
            }
            this.ArtyomProperties = {
                lang: 'en-GB',
                recognizing: false,
                continuous: false,
                speed: 1,
                volume: 1,
                listen: false,
                mode: "normal",
                debug: false,
                helpers: {
                    redirectRecognizedTextOutput: null,
                    remoteProcessorHandler: null,
                    lastSay: null,
                    fatalityPromiseCallback: null
                },
                executionKeyword: null,
                obeyKeyword: null,
                speaking: false,
                obeying: true,
                soundex: false,
                name: null
            };
            this.ArtyomGarbageCollection = [];
            this.ArtyomFlags = {
                restartRecognition: false
            };
            this.ArtyomGlobalEvents = {
                ERROR: "ERROR",
                SPEECH_SYNTHESIS_START: "SPEECH_SYNTHESIS_START",
                SPEECH_SYNTHESIS_END: "SPEECH_SYNTHESIS_END",
                TEXT_RECOGNIZED: "TEXT_RECOGNIZED",
                COMMAND_RECOGNITION_START: "COMMAND_RECOGNITION_START",
                COMMAND_RECOGNITION_END: "COMMAND_RECOGNITION_END",
                COMMAND_MATCHED: "COMMAND_MATCHED",
                NOT_COMMAND_MATCHED: "NOT_COMMAND_MATCHED"
            };
            this.Device = {
                isMobile: false,
                isChrome: true
            };
            if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i)) {
                this.Device.isMobile = true;
            }
            if (navigator.userAgent.indexOf("Chrome") == -1) {
                this.Device.isChrome = false;
            }
            /**
             * The default voice of Artyom in the Desktop. In mobile, you will need to initialize (or force the language)
             * with a language code in order to find an available voice in the device, otherwise it will use the native voice.
             */
            this.ArtyomVoice = {
                default: false,
                lang: "en-GB",
                localService: false,
                name: "Google UK English Male",
                voiceURI: "Google UK English Male"
            };
        }
        /**
             * Add dinamically commands to artyom using
             * You can even add commands while artyom is active.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/addcommands
             * @since 0.6
             * @param {Object | Array[Objects]} param
             * @returns {undefined}
             */
        addCommands(param) {
            var _this = this;
            var processCommand = function (command) {
                if (command.hasOwnProperty("indexes")) {
                    _this.ArtyomCommands.push(command);
                }
                else {
                    console.error("The given command doesn't provide any index to execute.");
                }
            };
            if (param instanceof Array) {
                for (var i = 0; i < param.length; i++) {
                    processCommand(param[i]);
                }
            }
            else {
                processCommand(param);
            }
            return true;
        }
        /**
             * The SpeechSynthesisUtterance objects are stored in the artyom_garbage_collector variable
             * to prevent the wrong behaviour of artyom.say.
             * Use this method to clear all spoken SpeechSynthesisUtterance unused objects.
             *
             * @returns {Array<any>}
             */
        clearGarbageCollection() {
            return this.ArtyomGarbageCollection = [];
        }
        /**
             * Displays a message in the console if the artyom propery DEBUG is set to true.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/debug
             * @returns {undefined}
             */
        debug(message, type) {
            var preMessage = "[v" + this.getVersion() + "] Artyom.js";
            if (this.ArtyomProperties.debug === true) {
                switch (type) {
                    case "error":
                        console.log("%c" + preMessage + ":%c " + message, 'background: #C12127; color: black;', 'color:black;');
                        break;
                    case "warn":
                        console.warn(message);
                        break;
                    case "info":
                        console.log("%c" + preMessage + ":%c " + message, 'background: #4285F4; color: #FFFFFF', 'color:black;');
                        break;
                    default:
                        console.log("%c" + preMessage + ":%c " + message, 'background: #005454; color: #BFF8F8', 'color:black;');
                        break;
                }
            }
        }
        /**
             * Artyom have it's own diagnostics.
             * Run this function in order to detect why artyom is not initialized.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/detecterrors
             * @param {type} callback
             * @returns {}
             */
        detectErrors() {
            var _this = this;
            if ((window.location.protocol) == "file:") {
                var message = "Error: running Artyom directly from a file. The APIs require a different communication protocol like HTTP or HTTPS";
                console.error(message);
                return {
                    code: "artyom_error_localfile",
                    message: message
                };
            }
            if (!_this.Device.isChrome) {
                var message = "Error: the Speech Recognition and Speech Synthesis APIs require the Google Chrome Browser to work.";
                console.error(message);
                return {
                    code: "artyom_error_browser_unsupported",
                    message: message
                };
            }
            if (window.location.protocol != "https:") {
                console.warn("Warning: artyom is being executed using the '" + window.location.protocol + "' protocol. The continuous mode requires a secure protocol (HTTPS)");
            }
            return false;
        }
        /**
             * Removes all the added commands of artyom.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/emptycommands
             * @since 0.6
             * @returns {Array}
             */
        emptyCommands() {
            return this.ArtyomCommands = [];
        }
        /**
             * Returns an object with data of the matched element
             *
             * @private
             * @param {string} comando
             * @returns {MatchedCommand}
             */
        execute(voz) {
            var _this = this;
            if (!voz) {
                console.warn("Internal error: Execution of empty command");
                return;
            }
            // If artyom was initialized with a name, verify that the name begins with it to allow the execution of commands.
            if (_this.ArtyomProperties.name) {
                if (voz.indexOf(_this.ArtyomProperties.name) != 0) {
                    _this.debug("Artyom requires with a name \"" + _this.ArtyomProperties.name + "\" but the name wasn't spoken.", "warn");
                    return;
                }
                // Remove name from voice command
                voz = voz.substr(_this.ArtyomProperties.name.length);
            }
            _this.debug(">> " + voz);
            /** @3
             * Artyom needs time to think that
             */
            for (var i = 0; i < _this.ArtyomCommands.length; i++) {
                var instruction = _this.ArtyomCommands[i];
                var opciones = instruction.indexes;
                var encontrado = -1;
                var wildy = "";
                for (var c = 0; c < opciones.length; c++) {
                    var opcion = opciones[c];
                    if (!instruction.smart) {
                        continue; //Jump if is not smart command
                    }
                    // Process RegExp
                    if (opcion instanceof RegExp) {
                        // If RegExp matches 
                        if (opcion.test(voz)) {
                            _this.debug(">> REGEX " + opcion.toString() + " MATCHED AGAINST " + voz + " WITH INDEX " + c + " IN COMMAND ", "info");
                            encontrado = parseInt(c.toString());
                        }
                        // Otherwise just wildcards
                    }
                    else {
                        if (opcion.indexOf("*") != -1) {
                            ///LOGIC HERE
                            var grupo = opcion.split("*");
                            if (grupo.length > 2) {
                                console.warn("Artyom found a smart command with " + (grupo.length - 1) + " wildcards. Artyom only support 1 wildcard for each command. Sorry");
                                continue;
                            }
                            //START SMART COMMAND
                            var before = grupo[0];
                            var later = grupo[1];
                            // Wildcard in the end
                            if ((later == "") || (later == " ")) {
                                if ((voz.indexOf(before) != -1) || ((voz.toLowerCase()).indexOf(before.toLowerCase()) != -1)) {
                                    wildy = voz.replace(before, '');
                                    wildy = (wildy.toLowerCase()).replace(before.toLowerCase(), '');
                                    encontrado = parseInt(c.toString());
                                }
                            }
                            else {
                                if ((voz.indexOf(before) != -1) || ((voz.toLowerCase()).indexOf(before.toLowerCase()) != -1)) {
                                    if ((voz.indexOf(later) != -1) || ((voz.toLowerCase()).indexOf(later.toLowerCase()) != -1)) {
                                        wildy = voz.replace(before, '').replace(later, '');
                                        wildy = (wildy.toLowerCase()).replace(before.toLowerCase(), '').replace(later.toLowerCase(), '');
                                        wildy = (wildy.toLowerCase()).replace(later.toLowerCase(), '');
                                        encontrado = parseInt(c.toString());
                                    }
                                }
                            }
                        }
                        else {
                            console.warn("Founded command marked as SMART but have no wildcard in the indexes, remove the SMART for prevent extensive memory consuming or add the wildcard *");
                        }
                    }
                    if ((encontrado >= 0)) {
                        encontrado = parseInt(c.toString());
                        break;
                    }
                }
                if (encontrado >= 0) {
                    _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_MATCHED);
                    var response = {
                        index: encontrado,
                        instruction: instruction,
                        wildcard: {
                            item: wildy,
                            full: voz
                        }
                    };
                    return response;
                }
            } //End @3




            /** @1
             * Search for IDENTICAL matches in the commands if nothing matches
             * start with a index match in commands
             */
            for (var i = 0; i < _this.ArtyomCommands.length; i++) {
                var instruction = _this.ArtyomCommands[i];
                var opciones = instruction.indexes;
                var encontrado = -1;
                /**
                 * Execution of match with identical commands
                 */
                for (var c = 0; c < opciones.length; c++) {
                    var opcion = opciones[c];
                    if (instruction.smart) {
                        continue; //Jump wildcard commands
                    }
                    if ((voz === opcion)) {
                        _this.debug(">> MATCHED FULL EXACT OPTION " + opcion + " AGAINST " + voz + " WITH INDEX " + c + " IN COMMAND ", "info");
                        encontrado = parseInt(c.toString());
                        break;
                    }
                    else if ((voz.toLowerCase() === opcion.toLowerCase())) {
                        _this.debug(">> MATCHED OPTION CHANGING ALL TO LOWERCASE " + opcion + " AGAINST " + voz + " WITH INDEX " + c + " IN COMMAND ", "info");
                        encontrado = parseInt(c.toString());
                        break;
                    }
                }
                if (encontrado >= 0) {
                    _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_MATCHED);
                    var response = {
                        index: encontrado,
                        instruction: instruction
                    };
                    return response;
                }
            } //End @1





            /**
             * Step 3 Commands recognition.
             * If the command is not smart, and any of the commands match exactly then try to find
             * a command in all the quote.
             */
            for (var i = 0; i < _this.ArtyomCommands.length; i++) {
                var instruction = _this.ArtyomCommands[i];
                var opciones = instruction.indexes;
                var encontrado = -1;
                /**
                 * Execution of match with index
                 */
                for (var c = 0; c < opciones.length; c++) {
                    if (instruction.smart) {
                        continue; //Jump wildcard commands
                    }
                    var opcion = opciones[c];
                    if ((voz.indexOf(opcion) >= 0)) {
                        _this.debug(">> MATCHED INDEX EXACT OPTION " + opcion + " AGAINST " + voz + " WITH INDEX " + c + " IN COMMAND ", "info");
                        encontrado = parseInt(c.toString());
                        break;
                    }
                    else if (((voz.toLowerCase()).indexOf(opcion.toLowerCase()) >= 0)) {
                        _this.debug(">> MATCHED INDEX OPTION CHANGING ALL TO LOWERCASE " + opcion + " AGAINST " + voz + " WITH INDEX " + c + " IN COMMAND ", "info");
                        encontrado = parseInt(c.toString());
                        break;
                    }
                }
                if (encontrado >= 0) {
                    _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_MATCHED);
                    var response = {
                        index: encontrado,
                        instruction: instruction
                    };
                    return response;
                }
            } //End Step 3









            /**
             * If the soundex options is enabled, proceed to process the commands in case that any of the previous
             * ways of processing (exact, lowercase and command in quote) didn't match anything.
             * Based on the soundex algorithm match a command if the spoken text is similar to any of the artyom commands.
             * Example :
             * If you have a command with "Open Wallmart" and "Open Willmar" is recognized, the open wallmart command will be triggered.
             * soundex("Open Wallmart") == soundex("Open Willmar") <= true
             *
             */
            if (_this.ArtyomProperties.soundex) {
                for (var i = 0; i < _this.ArtyomCommands.length; i++) {
                    var instruction = _this.ArtyomCommands[i];
                    var opciones = instruction.indexes;
                    var encontrado = -1;
                    for (var c = 0; c < opciones.length; c++) {
                        var opcion = opciones[c];
                        if (instruction.smart) {
                            continue; //Jump wildcard commands
                        }
                        if (_this.soundex(voz) == _this.soundex(opcion)) {
                            _this.debug(">> Matched Soundex command '" + opcion + "' AGAINST '" + voz + "' with index " + c, "info");
                            encontrado = parseInt(c.toString());
                            _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_MATCHED);
                            var response = {
                                index: encontrado,
                                instruction: instruction
                            };
                            return response;
                        }
                    }
                }
            }
            _this.debug("Event reached : " + _this.ArtyomGlobalEvents.NOT_COMMAND_MATCHED);
            _this.triggerEvent(_this.ArtyomGlobalEvents.NOT_COMMAND_MATCHED);
            return;
        }
        /**
             * Force artyom to stop listen even if is in continuos mode.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/fatality
             * @returns {Boolean}
             */
        fatality() {
            var _this = this;
            //fatalityPromiseCallback
            return new Promise(function (resolve, reject) {
                // Expose the fatality promise callback to the helpers object of Artyom.
                // The promise isn't resolved here itself but in the onend callback of
                // the speechRecognition instance of artyom
                _this.ArtyomProperties.helpers.fatalityPromiseCallback = resolve;
                try {
                    // If config is continuous mode, deactivate anyway.
                    _this.ArtyomFlags.restartRecognition = false;
                    _this.ArtyomWebkitSpeechRecognition.stop();
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        /**
             * Returns an array with all the available commands for artyom.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/getavailablecommands
             * @readonly
             * @returns {Array}
             */
        getAvailableCommands() {
            return this.ArtyomCommands;
        }
        /**
             * Artyom can return inmediately the voices available in your browser.
             *
             * @readonly
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/getvoices
             * @returns {Array}
             */
        getVoices() {
            return window.speechSynthesis.getVoices();
        }
        /**
             * Verify if the browser supports speechSynthesis.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/speechsupported
             * @returns {Boolean}
             */
        speechSupported() {
            return 'speechSynthesis' in window;
        }
        /**
             * Verify if the browser supports webkitSpeechRecognition.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/recognizingsupported
             * @returns {Boolean}
             */
        recognizingSupported() {
            return 'webkitSpeechRecognition' in window;
        }
        /**
             * Stops the actual and pendings messages that artyom have to say.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/shutup
             * @returns {undefined}
             */
        shutUp() {
            if ('speechSynthesis' in window) {
                do {
                    window.speechSynthesis.cancel();
                } while (window.speechSynthesis.pending === true);
            }
            this.ArtyomProperties.speaking = false;
            this.clearGarbageCollection();
        }
        /**
             * Returns an object with the actual properties of artyom.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/getproperties
             * @returns {object}
             */
        getProperties() {
            return this.ArtyomProperties;
        }
        /**
             * Returns the code language of artyom according to initialize function.
             * if initialize not used returns english GB.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/getlanguage
             * @returns {String}
             */
        getLanguage() {
            return this.ArtyomProperties.lang;
        }
        /**
             * Retrieves the used version of Artyom.js
             *
             * @returns {String}
             */
        getVersion() {
            return '1.0.6';
        }
        /**
             * Artyom awaits for orders when this function
             * is executed.
             *
             * If artyom gets a first parameter the instance will be stopped.
             *
             * @private
             * @returns {undefined}
             */
        hey(resolve, reject) {
            var start_timestamp;
            var artyom_is_allowed;
            var _this = this;
            /**
             * On mobile devices the recognized text is always thrown twice.
             * By setting the following configuration, fixes the issue
             */
            if (this.Device.isMobile) {
                this.ArtyomWebkitSpeechRecognition.continuous = false;
                this.ArtyomWebkitSpeechRecognition.interimResults = false;
                this.ArtyomWebkitSpeechRecognition.maxAlternatives = 1;
            }
            else {
                this.ArtyomWebkitSpeechRecognition.continuous = true;
                this.ArtyomWebkitSpeechRecognition.interimResults = true;
            }
            this.ArtyomWebkitSpeechRecognition.lang = this.ArtyomProperties.lang;
            this.ArtyomWebkitSpeechRecognition.onstart = function () {
                _this.debug("Event reached : " + _this.ArtyomGlobalEvents.COMMAND_RECOGNITION_START);
                _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_RECOGNITION_START);
                _this.ArtyomProperties.recognizing = true;
                artyom_is_allowed = true;
                resolve();
            };
            /**
             * Handle all artyom posible exceptions
             *
             * @param {type} event
             * @returns {undefined}
             */
            this.ArtyomWebkitSpeechRecognition.onerror = function (event) {
                // Reject promise on initialization
                reject(event.error);
                // Dispath error globally (artyom.when)
                _this.triggerEvent(_this.ArtyomGlobalEvents.ERROR, {
                    code: event.error
                });
                if (event.error == 'audio-capture') {
                    artyom_is_allowed = false;
                }
                if (event.error == 'not-allowed') {
                    artyom_is_allowed = false;
                    if (event.timeStamp - start_timestamp < 100) {
                        _this.triggerEvent(_this.ArtyomGlobalEvents.ERROR, {
                            code: "info-blocked",
                            message: "Artyom needs the permision of the microphone, is blocked."
                        });
                    }
                    else {
                        _this.triggerEvent(_this.ArtyomGlobalEvents.ERROR, {
                            code: "info-denied",
                            message: "Artyom needs the permision of the microphone, is denied"
                        });
                    }
                }
            };
            /**
             * Check if continuous mode is active and restart the recognition.
             * Throw events too.
             *
             * @returns {undefined}
             */
            _this.ArtyomWebkitSpeechRecognition.onend = function () {
                if (_this.ArtyomFlags.restartRecognition === true) {
                    if (artyom_is_allowed === true) {
                        _this.ArtyomWebkitSpeechRecognition.start();
                        _this.debug("Continuous mode enabled, restarting", "info");
                    }
                    else {
                        console.error("Verify the microphone and check for the table of errors in sdkcarlos.github.io/sites/artyom.html to solve your problem. If you want to give your user a message when an error appears add an artyom listener");
                    }
                    _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_RECOGNITION_END, {
                        code: "continuous_mode_enabled",
                        message: "OnEnd event reached with continuous mode"
                    });
                }
                else {
                    // If the fatality promise callback was set, invoke it
                    if (_this.ArtyomProperties.helpers.fatalityPromiseCallback) {
                        // As the speech recognition doesn't finish really, wait 500ms
                        // to trigger the real fatality callback
                        setTimeout(function () {
                            _this.ArtyomProperties.helpers.fatalityPromiseCallback();
                        }, 500);
                        _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_RECOGNITION_END, {
                            code: "continuous_mode_disabled",
                            message: "OnEnd event reached without continuous mode"
                        });
                    }
                }
                _this.ArtyomProperties.recognizing = false;
            };
            /**
             * Declare the processor dinamycally according to the mode of artyom
             * to increase the performance.
             *
             * @type {Function}
             * @return
             */
            var onResultProcessor;
            // Process the recognition in normal mode
            if (_this.ArtyomProperties.mode == "normal") {
                onResultProcessor = function (event) {
                    if (!_this.ArtyomCommands.length) {
                        _this.debug("No commands to process in normal mode.");
                        return;
                    }
                    var cantidadResultados = event.results.length;
                    _this.triggerEvent(_this.ArtyomGlobalEvents.TEXT_RECOGNIZED);
                    for (var i = event.resultIndex; i < cantidadResultados; ++i) {
                        var identificated = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            var comando = _this.execute(identificated.trim());
                            // Redirect the output of the text if necessary
                            if (typeof (_this.ArtyomProperties.helpers.redirectRecognizedTextOutput) === "function") {
                                _this.ArtyomProperties.helpers.redirectRecognizedTextOutput(identificated, true);
                            }
                            if ((comando) && (_this.ArtyomProperties.recognizing == true)) {
                                _this.debug("<< Executing Matching Recognition in normal mode >>", "info");
                                _this.ArtyomWebkitSpeechRecognition.stop();
                                _this.ArtyomProperties.recognizing = false;
                                // Execute the command if smart
                                if (comando.wildcard) {
                                    comando.instruction.action(comando.index, comando.wildcard.item, comando.wildcard.full);
                                    // Execute a normal command
                                }
                                else {
                                    comando.instruction.action(comando.index);
                                }
                                break;
                            }
                        }
                        else {
                            // Redirect output when necesary
                            if (typeof (_this.ArtyomProperties.helpers.redirectRecognizedTextOutput) === "function") {
                                _this.ArtyomProperties.helpers.redirectRecognizedTextOutput(identificated, false);
                            }
                            if (typeof (_this.ArtyomProperties.executionKeyword) === "string") {
                                if (identificated.indexOf(_this.ArtyomProperties.executionKeyword) != -1) {
                                    var comando = _this.execute(identificated.replace(_this.ArtyomProperties.executionKeyword, '').trim());
                                    if ((comando) && (_this.ArtyomProperties.recognizing == true)) {
                                        _this.debug("<< Executing command ordered by ExecutionKeyword >>", 'info');
                                        _this.ArtyomWebkitSpeechRecognition.stop();
                                        _this.ArtyomProperties.recognizing = false;
                                        //Executing Command Action
                                        if (comando.wildcard) {
                                            comando.instruction.action(comando.index, comando.wildcard.item, comando.wildcard.full);
                                        }
                                        else {
                                            comando.instruction.action(comando.index);
                                        }
                                        break;
                                    }
                                }
                            }
                            _this.debug("Normal mode : " + identificated);
                        }
                    }
                };
            }
            // Process the recognition in quick mode
            if (_this.ArtyomProperties.mode == "quick") {
                onResultProcessor = function (event) {
                    if (!_this.ArtyomCommands.length) {
                        _this.debug("No commands to process.");
                        return;
                    }
                    var cantidadResultados = event.results.length;
                    _this.triggerEvent(_this.ArtyomGlobalEvents.TEXT_RECOGNIZED);
                    for (var i = event.resultIndex; i < cantidadResultados; ++i) {
                        var identificated = event.results[i][0].transcript;
                        if (!event.results[i].isFinal) {
                            var comando = _this.execute(identificated.trim());
                            //Redirect output when necesary
                            if (typeof (_this.ArtyomProperties.helpers.redirectRecognizedTextOutput) === "function") {
                                _this.ArtyomProperties.helpers.redirectRecognizedTextOutput(identificated, true);
                            }
                            if ((comando) && (_this.ArtyomProperties.recognizing == true)) {
                                _this.debug("<< Executing Matching Recognition in quick mode >>", "info");
                                _this.ArtyomWebkitSpeechRecognition.stop();
                                _this.ArtyomProperties.recognizing = false;
                                //Executing Command Action
                                if (comando.wildcard) {
                                    comando.instruction.action(comando.index, comando.wildcard.item);
                                }
                                else {
                                    comando.instruction.action(comando.index);
                                }
                                break;
                            }
                        }
                        else {
                            var comando = _this.execute(identificated.trim());
                            //Redirect output when necesary
                            if (typeof (_this.ArtyomProperties.helpers.redirectRecognizedTextOutput) === "function") {
                                _this.ArtyomProperties.helpers.redirectRecognizedTextOutput(identificated, false);
                            }
                            if ((comando) && (_this.ArtyomProperties.recognizing == true)) {
                                _this.debug("<< Executing Matching Recognition in quick mode >>", "info");
                                _this.ArtyomWebkitSpeechRecognition.stop();
                                _this.ArtyomProperties.recognizing = false;
                                //Executing Command Action
                                if (comando.wildcard) {
                                    comando.instruction.action(comando.index, comando.wildcard.item);
                                }
                                else {
                                    comando.instruction.action(comando.index);
                                }
                                break;
                            }
                        }
                        _this.debug("Quick mode : " + identificated);
                    }
                };
            }
            // Process the recognition in remote mode
            if (_this.ArtyomProperties.mode == "remote") {
                onResultProcessor = function (event) {
                    var cantidadResultados = event.results.length;
                    _this.triggerEvent(_this.ArtyomGlobalEvents.TEXT_RECOGNIZED);
                    if (typeof (_this.ArtyomProperties.helpers.remoteProcessorHandler) !== "function") {
                        return _this.debug("The remoteProcessorService is undefined.", "warn");
                    }
                    for (var i = event.resultIndex; i < cantidadResultados; ++i) {
                        var identificated = event.results[i][0].transcript;
                        _this.ArtyomProperties.helpers.remoteProcessorHandler({
                            text: identificated,
                            isFinal: event.results[i].isFinal
                        });
                    }
                };
            }
            /**
             * Process the recognition event with the previously
             * declared processor function.
             *
             * @param {type} event
             * @returns {undefined}
             */
            _this.ArtyomWebkitSpeechRecognition.onresult = function (event) {
                if (_this.ArtyomProperties.obeying) {
                    onResultProcessor(event);
                }
                else {
                    // Handle obeyKeyword if exists and artyom is not obeying
                    if (!_this.ArtyomProperties.obeyKeyword) {
                        return;
                    }
                    var temporal = "";
                    var interim = "";
                    for (var i = 0; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            temporal += event.results[i][0].transcript;
                        }
                        else {
                            interim += event.results[i][0].transcript;
                        }
                    }
                    _this.debug("Artyom is not obeying", "warn");
                    // If the obeyKeyword is found in the recognized text
                    // enable command recognition again
                    if (((interim).indexOf(_this.ArtyomProperties.obeyKeyword) > -1) || (temporal).indexOf(_this.ArtyomProperties.obeyKeyword) > -1) {
                        _this.ArtyomProperties.obeying = true;
                    }
                }
            };
            if (_this.ArtyomProperties.recognizing) {
                _this.ArtyomWebkitSpeechRecognition.stop();
                _this.debug("Event reached : " + _this.ArtyomGlobalEvents.COMMAND_RECOGNITION_END);
                _this.triggerEvent(_this.ArtyomGlobalEvents.COMMAND_RECOGNITION_END);
            }
            else {
                try {
                    _this.ArtyomWebkitSpeechRecognition.start();
                }
                catch (e) {
                    _this.triggerEvent(_this.ArtyomGlobalEvents.ERROR, {
                        code: "recognition_overlap",
                        message: "A webkitSpeechRecognition instance has been started while there's already running. Is recommendable to restart the Browser"
                    });
                }
            }
        }
        /**
             * Set up artyom for the application.
             *
             * This function will set the default language used by artyom
             * or notice the user if artyom is not supported in the actual
             * browser
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/initialize
             * @param {Object} config
             * @returns {Boolean}
             */
        initialize(config) {
            var _this = this;
            if (typeof (config) !== "object") {
                return Promise.reject("You must give the configuration for start artyom properly.");
            }
            if (config.hasOwnProperty("lang")) {
                _this.ArtyomVoice = _this.getVoice(config.lang);
                _this.ArtyomProperties.lang = config.lang;
            }
            if (config.hasOwnProperty("continuous")) {
                if (config.continuous) {
                    this.ArtyomProperties.continuous = true;
                    this.ArtyomFlags.restartRecognition = true;
                }
                else {
                    this.ArtyomProperties.continuous = false;
                    this.ArtyomFlags.restartRecognition = false;
                }
            }
            if (config.hasOwnProperty("speed")) {
                this.ArtyomProperties.speed = config.speed;
            }
            if (config.hasOwnProperty("soundex")) {
                this.ArtyomProperties.soundex = config.soundex;
            }
            if (config.hasOwnProperty("executionKeyword")) {
                this.ArtyomProperties.executionKeyword = config.executionKeyword;
            }
            if (config.hasOwnProperty("obeyKeyword")) {
                this.ArtyomProperties.obeyKeyword = config.obeyKeyword;
            }
            if (config.hasOwnProperty("volume")) {
                this.ArtyomProperties.volume = config.volume;
            }
            if (config.hasOwnProperty("listen")) {
                this.ArtyomProperties.listen = config.listen;
            }
            if (config.hasOwnProperty("name")) {
                this.ArtyomProperties.name = config.name;
            }
            if (config.hasOwnProperty("debug")) {
                this.ArtyomProperties.debug = config.debug;
            }
            else {
                console.warn("The initialization doesn't provide how the debug mode should be handled. Is recommendable to set this value either to true or false.");
            }
            if (config.mode) {
                this.ArtyomProperties.mode = config.mode;
            }
            if (this.ArtyomProperties.listen === true) {
                return new Promise(function (resolve, reject) {
                    _this.hey(resolve, reject);
                });
            }
            return Promise.resolve(true);
        }
        /**
             * Add commands like an artisan. If you use artyom for simple tasks
             * then probably you don't like to write a lot to achieve it.
             *
             * Use the artisan syntax to write less, but with the same accuracy.
             *
             * @disclaimer Not a promise-based implementation, just syntax.
             * @returns {Boolean}
             */
        on(indexes, smart) {
            var _this = this;
            return {
                then: function (action) {
                    var command = {
                        indexes: indexes,
                        action: action
                    };
                    if (smart) {
                        command.smart = true;
                    }
                    _this.addCommands(command);
                }
            };
        }
        /**
             * Generates an artyom event with the designed name
             *
             * @param {type} name
             * @returns {undefined}
             */
        triggerEvent(name, param) {
            var event = new CustomEvent(name, {
                'detail': param
            });
            document.dispatchEvent(event);
            return event;
        }
        /**
             * Repeats the last sentence that artyom said.
             * Useful in noisy environments.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/repeatlastsay
             * @param {Boolean} returnObject If set to true, an object with the text and the timestamp when was executed will be returned.
             * @returns {Object}
             */
        repeatLastSay(returnObject) {
            var last = this.ArtyomProperties.helpers.lastSay;
            if (returnObject) {
                return last;
            }
            else {
                if (last != null) {
                    this.say(last.text);
                }
            }
        }
        /**
             * Create a listener when an artyom action is called.
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/when
             * @param {type} event
             * @param {type} action
             * @returns {undefined}
             */
        when(event, action) {
            return document.addEventListener(event, function (e) {
                action(e["detail"]);
            }, false);
        }
        /**
             * Process the recognized text if artyom is active in remote mode.
             *
             * @returns {Boolean}
             */
        remoteProcessorService(action) {
            this.ArtyomProperties.helpers.remoteProcessorHandler = action;
            return true;
        }
        /**
             * Verify if there's a voice available for a language using its language code identifier.
             *
             * @return {Boolean}
             */
        voiceAvailable(languageCode) {
            return typeof (this.getVoice(languageCode)) !== "undefined";
        }
        /**
             * A boolean to check if artyom is obeying commands or not.
             *
             * @returns {Boolean}
             */
        isObeying() {
            return this.ArtyomProperties.obeying;
        }
        /**
             * Allow artyom to obey commands again.
             *
             * @returns {Boolean}
             */
        obey() {
            return this.ArtyomProperties.obeying = true;
        }
        /**
             * Pause the processing of commands. Artyom still listening in the background and it can be resumed after a couple of seconds.
             *
             * @returns {Boolean}
             */
        dontObey() {
            return this.ArtyomProperties.obeying = false;
        }
        /**
             * This function returns a boolean according to the speechSynthesis status
             * if artyom is speaking, will return true.
             *
             * Note: This is not a feature of speechSynthesis, therefore this value hangs on
             * the fiability of the onStart and onEnd events of the speechSynthesis
             *
             * @since 0.9.3
             * @summary Returns true if speechSynthesis is active
             * @returns {Boolean}
             */
        isSpeaking() {
            return this.ArtyomProperties.speaking;
        }
        /**
             * This function returns a boolean according to the SpeechRecognition status
             * if artyom is listening, will return true.
             *
             * Note: This is not a feature of SpeechRecognition, therefore this value hangs on
             * the fiability of the onStart and onEnd events of the SpeechRecognition
             *
             * @since 0.9.3
             * @summary Returns true if SpeechRecognition is active
             * @returns {Boolean}
             */
        isRecognizing() {
            return this.ArtyomProperties.recognizing;
        }
        /**
             * This function will return the webkitSpeechRecognition object used by artyom
             * retrieve it only to debug on it or get some values, do not make changes directly
             *
             * @readonly
             * @since 0.9.2
             * @summary Retrieve the native webkitSpeechRecognition object
             * @returns {Object webkitSpeechRecognition}
             */
        getNativeApi() {
            return this.ArtyomWebkitSpeechRecognition;
        }
        /**
             * Returns the SpeechSynthesisUtterance garbageobjects.
             *
             * @returns {Array}
             */
        getGarbageCollection() {
            return this.ArtyomGarbageCollection;
        }
        /**
             *  Retrieve a single voice of the browser by it's language code.
             *  It will return the first voice available for the language on every device.
             *
             * @param languageCode
             */
        getVoice(languageCode) {
            var voiceIdentifiersArray = this.ArtyomVoicesIdentifiers[languageCode];
            if (!voiceIdentifiersArray) {
                console.warn("The providen language " + languageCode + " isn't available, using English Great britain as default");
                voiceIdentifiersArray = this.ArtyomVoicesIdentifiers["en-GB"];
            }
            var voice = undefined;
            var voices = speechSynthesis.getVoices();
            var voicesLength = voiceIdentifiersArray.length;
            var _loop_1 = function (i) {
                var foundVoice = voices.filter(function (voice) {
                    return ((voice.name == voiceIdentifiersArray[i]) || (voice.lang == voiceIdentifiersArray[i]));
                })[0];
                if (foundVoice) {
                    voice = foundVoice;
                    return "break";
                }
            };
            for (var i = 0; i < voicesLength; i++) {
                var state_1 = _loop_1(i);
                if (state_1 === "break")
                    break;
            }
            return voice;
        }
        /**
             * Artyom provide an easy way to create a
             * dictation for your user.
             *
             * Just create an instance and start and stop when you want
             *
             * @returns Object | newDictation
             */
        newDictation(settings) {
            var _this = this;
            if (!_this.recognizingSupported()) {
                console.error("SpeechRecognition is not supported in this browser");
                return false;
            }
            var dictado = new window.webkitSpeechRecognition();
            dictado.continuous = true;
            dictado.interimResults = true;
            dictado.lang = _this.ArtyomProperties.lang;
            dictado.onresult = function (event) {
                var temporal = "";
                var interim = "";
                for (var i = 0; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        temporal += event.results[i][0].transcript;
                    }
                    else {
                        interim += event.results[i][0].transcript;
                    }
                }
                if (settings.onResult) {
                    settings.onResult(interim, temporal);
                }
            };
            return new function () {
                var dictation = dictado;
                var flagStartCallback = true;
                var flagRestart = false;
                this.onError = null;
                this.start = function () {
                    if (settings.continuous === true) {
                        flagRestart = true;
                    }
                    dictation.onstart = function () {
                        if (typeof (settings.onStart) === "function") {
                            if (flagStartCallback === true) {
                                settings.onStart();
                            }
                        }
                    };
                    dictation.onend = function () {
                        if (flagRestart === true) {
                            flagStartCallback = false;
                            dictation.start();
                        }
                        else {
                            flagStartCallback = true;
                            if (typeof (settings.onEnd) === "function") {
                                settings.onEnd();
                            }
                        }
                    };
                    dictation.start();
                };
                this.stop = function () {
                    flagRestart = false;
                    dictation.stop();
                };
                if (typeof (settings.onError) === "function") {
                    dictation.onerror = settings.onError;
                }
            };
        }
        /**
             * A voice prompt will be executed.
             *
             * @param {type} config
             * @returns {undefined}
             */
        newPrompt(config) {
            if (typeof (config) !== "object") {
                console.error("Expected the prompt configuration.");
            }
            var copyActualCommands = Object.assign([], this.ArtyomCommands);
            var _this = this;
            this.emptyCommands();
            var promptCommand = {
                description: "Setting the artyom commands only for the prompt. The commands will be restored after the prompt finishes",
                indexes: config.options,
                action: function (i, wildcard) {
                    _this.ArtyomCommands = copyActualCommands;
                    var toExe = config.onMatch(i, wildcard);
                    if (typeof (toExe) !== "function") {
                        console.error("onMatch function expects a returning function to be executed");
                        return;
                    }
                    toExe();
                }
            };
            if (config.smart) {
                promptCommand.smart = true;
            }
            this.addCommands(promptCommand);
            if (typeof (config.beforePrompt) !== "undefined") {
                config.beforePrompt();
            }
            var callbacks = {
                onStart: function () {
                    if (typeof (config.onStartPrompt) !== "undefined") {
                        config.onStartPrompt();
                    }
                },
                onEnd: function () {
                    if (typeof (config.onEndPrompt) !== "undefined") {
                        config.onEndPrompt();
                    }
                }
            };
            this.say(config.question, callbacks);
        }
        /**
             * Says a random quote and returns it's object
             *
             * @param {type} data
             * @returns {object}
             */
        sayRandom(data) {
            if (data instanceof Array) {
                var index = Math.floor(Math.random() * data.length);
                this.say(data[index]);
                return {
                    text: data[index],
                    index: index
                };
            }
            else {
                console.error("Random quotes must be in an array !");
                return null;
            }
        }
        /**
             * Shortcut method to enable the artyom debug on the fly.
             *
             * @returns {Array}
             */
        setDebug(status) {
            if (status) {
                return this.ArtyomProperties.debug = true;
            }
            else {
                return this.ArtyomProperties.debug = false;
            }
        }
        /**
             * Simulate a voice command via JS
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/simulateinstruction
             * @param {type} sentence
             * @returns {undefined}
             */
        simulateInstruction(sentence) {
            var _this = this;
            if ((!sentence) || (typeof (sentence) !== "string")) {
                console.warn("Cannot execute a non string command");
                return false;
            }
            var foundCommand = _this.execute(sentence); //Command founded object
            if (typeof (foundCommand) === "object") {
                if (foundCommand.instruction) {
                    if (foundCommand.instruction.smart) {
                        _this.debug('Smart command matches with simulation, executing', "info");
                        foundCommand.instruction.action(foundCommand.index, foundCommand.wildcard.item, foundCommand.wildcard.full);
                    }
                    else {
                        _this.debug('Command matches with simulation, executing', "info");
                        foundCommand.instruction.action(foundCommand.index); //Execute Normal command
                    }
                    return true;
                }
            }
            else {
                console.warn("No command founded trying with " + sentence);
                return false;
            }
        }
        /**
             * Javascript implementation of the soundex algorithm.
             * @see https://gist.github.com/shawndumas/1262659
             * @returns {String}
             */
        soundex(s) {
            var a = s.toLowerCase().split('');
            var f = a.shift();
            var r = '';
            var codes = { a: "", e: "", i: "", o: "", u: "", b: 1, f: 1, p: 1, v: 1, c: 2, g: 2, j: 2, k: 2, q: 2, s: 2, x: 2, z: 2, d: 3, t: 3, l: 4, m: 5, n: 5, r: 6 };
            r = f + a
                .map(function (v, i, a) {
                    return codes[v];
                })
                .filter(function (v, i, a) {
                    return ((i === 0) ? v !== codes[f] : v !== a[i - 1]);
                })
                .join('');
            return (r + '000').slice(0, 4).toUpperCase();
        }
        /**
             * Splits a string into an array of strings with a limited size (chunk_length).
             *
             * @param {String} input text to split into chunks
             * @param {Integer} chunk_length limit of characters in every chunk
             */
        splitStringByChunks(input, chunk_length) {
            input = input || "";
            chunk_length = chunk_length || 100;
            var curr = chunk_length;
            var prev = 0;
            var output = [];
            while (input[curr]) {
                if (input[curr++] == ' ') {
                    output.push(input.substring(prev, curr));
                    prev = curr;
                    curr += chunk_length;
                }
            }
            output.push(input.substr(prev));
            return output;
        }
        /**
             * Allows to retrieve the recognized spoken text of artyom
             * and do something with it everytime something is recognized
             *
             * @param {String} action
             * @returns {Boolean}
             */
        redirectRecognizedTextOutput(action) {
            if (typeof (action) != "function") {
                console.warn("Expected function to handle the recognized text ...");
                return false;
            }
            this.ArtyomProperties.helpers.redirectRecognizedTextOutput = action;
            return true;
        }
        /**
             * Restarts artyom with the initial configuration.
             *
             * @param configuration
             */
        restart() {
            var _this = this;
            var _copyInit = _this.ArtyomProperties;
            return new Promise(function (resolve, reject) {
                _this.fatality().then(function () {
                    _this.initialize(_copyInit).then(resolve, reject);
                });
            });
        }
        /**
             * Talks a text according to the given parameters.
             *
             * @private This function is only to be used internally.
             * @param {String} text Text to be spoken
             * @param {Int} actualChunk Number of chunk of the
             * @param {Int} totalChunks
             * @returns {undefined}
             */
        talk(text, actualChunk, totalChunks, callbacks) {
            var _this = this;
            var msg = new SpeechSynthesisUtterance();
            msg.text = text;
            msg.volume = this.ArtyomProperties.volume;
            msg.rate = this.ArtyomProperties.speed;
            // Select the voice according to the selected
            var availableVoice = _this.getVoice(_this.ArtyomProperties.lang);
            if (callbacks) {
                // If the language to speak has been forced, use it
                if (callbacks.hasOwnProperty("lang")) {
                    availableVoice = _this.getVoice(callbacks.lang);
                }
            }
            // If is a mobile device, provide only the language code in the lang property i.e "es_ES"
            if (this.Device.isMobile) {
                // Try to set the voice only if exists, otherwise don't use anything to use the native voice
                if (availableVoice) {
                    msg.lang = availableVoice.lang;
                }
                // If browser provide the entire object
            }
            else {
                msg.voice = availableVoice;
            }
            // If is first text chunk (onStart)
            if (actualChunk == 1) {
                msg.addEventListener('start', function () {
                    // Set artyom is talking
                    _this.ArtyomProperties.speaking = true;
                    // Trigger the onSpeechSynthesisStart event
                    _this.debug("Event reached : " + _this.ArtyomGlobalEvents.SPEECH_SYNTHESIS_START);
                    _this.triggerEvent(_this.ArtyomGlobalEvents.SPEECH_SYNTHESIS_START);
                    // Trigger the onStart callback if exists
                    if (callbacks) {
                        if (typeof (callbacks.onStart) == "function") {
                            callbacks.onStart.call(msg);
                        }
                    }
                });
            }
            // If is final text chunk (onEnd)
            if ((actualChunk) >= totalChunks) {
                msg.addEventListener('end', function () {
                    // Set artyom is talking
                    _this.ArtyomProperties.speaking = false;
                    // Trigger the onSpeechSynthesisEnd event
                    _this.debug("Event reached : " + _this.ArtyomGlobalEvents.SPEECH_SYNTHESIS_END);
                    _this.triggerEvent(_this.ArtyomGlobalEvents.SPEECH_SYNTHESIS_END);
                    // Trigger the onEnd callback if exists.
                    if (callbacks) {
                        if (typeof (callbacks.onEnd) == "function") {
                            callbacks.onEnd.call(msg);
                        }
                    }
                });
            }
            // Notice how many chunks were processed for the given text.
            this.debug((actualChunk) + " text chunk processed succesfully out of " + totalChunks);
            // Important : Save the SpeechSynthesisUtterance object in memory, otherwise it will get lost
            this.ArtyomGarbageCollection.push(msg);
            window.speechSynthesis.speak(msg);
        }
        /**
             * Process the given text into chunks and execute the private function talk
             *
             * @tutorial http://docs.ourcodeworld.com/projects/artyom-js/documentation/methods/say
             * @param {String} message Text to be spoken
             * @param {Object} callbacks
             * @returns {undefined}
             */
        say(message, callbacks) {
            var artyom_say_max_chunk_length = 115;
            var _this = this;
            var definitive = [];
            if (this.speechSupported()) {
                if (typeof (message) != 'string') {
                    return console.warn("Artyom expects a string to speak " + typeof message + " given");
                }
                if (!message.length) {
                    return console.warn("Cannot speak empty string");
                }
                // If the providen text is long, proceed to split it
                if (message.length > artyom_say_max_chunk_length) {
                    // Split the given text by pause reading characters [",",":",";",". "] to provide a natural reading feeling.
                    var naturalReading = message.split(/,|:|\. |;/);
                    naturalReading.forEach(function (chunk, index) {
                        // If the sentence is too long and could block the API, split it to prevent any errors.
                        if (chunk.length > artyom_say_max_chunk_length) {
                            // Process the providen string into strings (withing an array) of maximum aprox. 115 characters to prevent any error with the API.
                            var temp_processed = _this.splitStringByChunks(chunk, artyom_say_max_chunk_length);
                            // Add items of the processed sentence into the definitive chunk.
                            definitive.push.apply(definitive, temp_processed);
                        }
                        else {
                            // Otherwise just add the sentence to being spoken.
                            definitive.push(chunk);
                        }
                    });
                }
                else {
                    definitive.push(message);
                }
                // Clean any empty item in array
                definitive = definitive.filter(function (e) { return e; });
                // Finally proceed to talk the chunks and assign the callbacks.
                definitive.forEach(function (chunk, index) {
                    var numberOfChunk = (index + 1);
                    if (chunk) {
                        _this.talk(chunk, numberOfChunk, definitive.length, callbacks);
                    }
                });
                // Save the spoken text into the lastSay object of artyom
                _this.ArtyomProperties.helpers.lastSay = {
                    text: message,
                    date: new Date()
                };
            }
        }
    }
    ;
    ;
    return Artyom;
}());
const _default = Artyom;



/***/ }),

/***/ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/concat.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs3/core-js-stable/instance/concat.js ***!
  \*******************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! core-js-pure/stable/instance/concat */ "./node_modules/core-js-pure/stable/instance/concat.js");

/***/ }),

/***/ "./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js ***!
  \***************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! core-js-pure/stable/set-timeout */ "./node_modules/core-js-pure/stable/set-timeout.js");

/***/ }),

/***/ "./node_modules/core-js-pure/es/array/virtual/concat.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js-pure/es/array/virtual/concat.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

__webpack_require__(/*! ../../../modules/es.array.concat */ "./node_modules/core-js-pure/modules/es.array.concat.js");
var getBuiltInPrototypeMethod = __webpack_require__(/*! ../../../internals/get-built-in-prototype-method */ "./node_modules/core-js-pure/internals/get-built-in-prototype-method.js");

module.exports = getBuiltInPrototypeMethod('Array', 'concat');


/***/ }),

/***/ "./node_modules/core-js-pure/es/instance/concat.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/es/instance/concat.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var isPrototypeOf = __webpack_require__(/*! ../../internals/object-is-prototype-of */ "./node_modules/core-js-pure/internals/object-is-prototype-of.js");
var method = __webpack_require__(/*! ../array/virtual/concat */ "./node_modules/core-js-pure/es/array/virtual/concat.js");

var ArrayPrototype = Array.prototype;

module.exports = function (it) {
  var own = it.concat;
  return it === ArrayPrototype || (isPrototypeOf(ArrayPrototype, it) && own === ArrayPrototype.concat) ? method : own;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/environment.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/environment.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

/* global Bun, Deno -- detection */
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var userAgent = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");
var classof = __webpack_require__(/*! ../internals/classof-raw */ "./node_modules/core-js-pure/internals/classof-raw.js");

var userAgentStartsWith = function (string) {
  return userAgent.slice(0, string.length) === string;
};

module.exports = (function () {
  if (userAgentStartsWith('Bun/')) return 'BUN';
  if (userAgentStartsWith('Cloudflare-Workers')) return 'CLOUDFLARE';
  if (userAgentStartsWith('Deno/')) return 'DENO';
  if (userAgentStartsWith('Node.js/')) return 'NODE';
  if (globalThis.Bun && typeof Bun.version == 'string') return 'BUN';
  if (globalThis.Deno && typeof Deno.version == 'object') return 'DENO';
  if (classof(globalThis.process) === 'process') return 'NODE';
  if (globalThis.window && globalThis.document) return 'BROWSER';
  return 'REST';
})();


/***/ }),

/***/ "./node_modules/core-js-pure/internals/schedulers-fix.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/schedulers-fix.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var apply = __webpack_require__(/*! ../internals/function-apply */ "./node_modules/core-js-pure/internals/function-apply.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var ENVIRONMENT = __webpack_require__(/*! ../internals/environment */ "./node_modules/core-js-pure/internals/environment.js");
var USER_AGENT = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");
var arraySlice = __webpack_require__(/*! ../internals/array-slice */ "./node_modules/core-js-pure/internals/array-slice.js");
var validateArgumentsLength = __webpack_require__(/*! ../internals/validate-arguments-length */ "./node_modules/core-js-pure/internals/validate-arguments-length.js");

var Function = globalThis.Function;
// dirty IE9- and Bun 0.3.0- checks
var WRAP = /MSIE .\./.test(USER_AGENT) || ENVIRONMENT === 'BUN' && (function () {
  var version = globalThis.Bun.version.split('.');
  return version.length < 3 || version[0] === '0' && (version[1] < 3 || version[1] === '3' && version[2] === '0');
})();

// IE9- / Bun 0.3.0- setTimeout / setInterval / setImmediate additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
// https://github.com/oven-sh/bun/issues/1633
module.exports = function (scheduler, hasTimeArg) {
  var firstParamIndex = hasTimeArg ? 2 : 1;
  return WRAP ? function (handler, timeout /* , ...arguments */) {
    var boundArgs = validateArgumentsLength(arguments.length, 1) > firstParamIndex;
    var fn = isCallable(handler) ? handler : Function(handler);
    var params = boundArgs ? arraySlice(arguments, firstParamIndex) : [];
    var callback = boundArgs ? function () {
      apply(fn, this, params);
    } : fn;
    return hasTimeArg ? scheduler(callback, timeout) : scheduler(callback);
  } : scheduler;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/validate-arguments-length.js":
/*!**************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/validate-arguments-length.js ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";

var $TypeError = TypeError;

module.exports = function (passed, required) {
  if (passed < required) throw new $TypeError('Not enough arguments');
  return passed;
};


/***/ }),

/***/ "./node_modules/core-js-pure/modules/web.set-interval.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/web.set-interval.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var schedulersFix = __webpack_require__(/*! ../internals/schedulers-fix */ "./node_modules/core-js-pure/internals/schedulers-fix.js");

var setInterval = schedulersFix(globalThis.setInterval, true);

// Bun / IE9- setInterval additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
$({ global: true, bind: true, forced: globalThis.setInterval !== setInterval }, {
  setInterval: setInterval
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/web.set-timeout.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/web.set-timeout.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var schedulersFix = __webpack_require__(/*! ../internals/schedulers-fix */ "./node_modules/core-js-pure/internals/schedulers-fix.js");

var setTimeout = schedulersFix(globalThis.setTimeout, true);

// Bun / IE9- setTimeout additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
$({ global: true, bind: true, forced: globalThis.setTimeout !== setTimeout }, {
  setTimeout: setTimeout
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/web.timers.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/modules/web.timers.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// TODO: Remove this module from `core-js@4` since it's split to modules listed below
__webpack_require__(/*! ../modules/web.set-interval */ "./node_modules/core-js-pure/modules/web.set-interval.js");
__webpack_require__(/*! ../modules/web.set-timeout */ "./node_modules/core-js-pure/modules/web.set-timeout.js");


/***/ }),

/***/ "./node_modules/core-js-pure/stable/instance/concat.js":
/*!*************************************************************!*\
  !*** ./node_modules/core-js-pure/stable/instance/concat.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var parent = __webpack_require__(/*! ../../es/instance/concat */ "./node_modules/core-js-pure/es/instance/concat.js");

module.exports = parent;


/***/ }),

/***/ "./node_modules/core-js-pure/stable/set-timeout.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/stable/set-timeout.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

__webpack_require__(/*! ../modules/web.timers */ "./node_modules/core-js-pure/modules/web.timers.js");
var path = __webpack_require__(/*! ../internals/path */ "./node_modules/core-js-pure/internals/path.js");

module.exports = path.setTimeout;


/***/ }),

/***/ "./2-features/STT/ArtyomAssistant.js":
/*!*******************************************!*\
  !*** ./2-features/STT/ArtyomAssistant.js ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ArtyomAssistant)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/set-timeout */ "./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/concat */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/concat.js");
/* harmony import */ var _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../../../../node_modules/artyom.js/build/artyom.js */ "./node_modules/artyom.js/build/artyom.js");






var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant(sidebarController) {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_5__["default"]();
    this.sidebarController = sidebarController; // Reference to SidebarController
    this.isListening = false;
    this.setupCommands();
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "setupCommands",
    value: function setupCommands() {
      var _context,
        _this = this;
      var triggerAction = _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context = this.triggerExtensionAction).call(_context, this);
      this.artyom.addCommands([{
        indexes: ["text to speech", "start reading"],
        action: function action() {
          _this.triggerExtensionAction("tts");
        }
      }, {
        indexes: ["stop", "pause"],
        action: function action() {
          _this.triggerExtensionAction("toggle-reading");
        }
      }, {
        indexes: ["sign language", "show sign language"],
        action: function action() {
          _this.triggerExtensionAction("signLanguage");
        }
      }, {
        indexes: ["image caption", "describe image"],
        action: function action() {
          _this.triggerExtensionAction("imageCaption");
        }
      }, {
        indexes: ["next", "skip next"],
        action: function action() {
          _this.triggerExtensionAction("skip-next");
        }
      }, {
        indexes: ["back ", "skip back"],
        action: function action() {
          _this.triggerExtensionAction("skip-previous");
        }
      }, {
        indexes: ["open link", "open this link"],
        action: function action() {
          _this.triggerExtensionAction("access-link");
        }
      }, {
        indexes: ["search for *", "find *"],
        smart: true,
        action: function action(i, wildcard) {
          console.log("Voice command detected search: ".concat(wildcard));
          _this.triggerExtensionAction("search", wildcard);
        }
      }]);
      this.artyom.redirectRecognizedTextOutput(function (recognized, isFinal) {
        var recognizedTextDiv = document.getElementById("recognizedText");
        recognizedTextDiv.textContent = isFinal ? "You said: ".concat(recognized) : recognized;
      });
    }
  }, {
    key: "startListening",
    value: function startListening() {
      var _this2 = this;
      if (!this.isListening) {
        this.isListening = true;
        console.log("Artyom is now listening...");
        this.artyom.fatality();
        _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_3__(function () {
          _this2.artyom.initialize({
            lang: "en-US",
            continuous: true,
            listen: true,
            debug: true,
            speed: 1
          }).then(function () {
            console.log("Artyom is listening!");
            _this2.isListening = true;
          })["catch"](function (err) {
            console.error("Artyom initialization error:", err);
          });
        }, 250);
      }
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      if (this.isListening) {
        this.isListening = false;
        console.log("Artyom stopped listening.");
        this.artyom.fatality();
        console.log("Artyom has stopped listening.");
        this.isListening = false;
      }
    }
  }, {
    key: "toggleListening",
    value: function toggleListening() {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
      return this.isListening;
    }
  }, {
    key: "triggerExtensionAction",
    value: function triggerExtensionAction(action) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      if (this.sidebarController) {
        var _context2;
        console.log(_babel_runtime_corejs3_core_js_stable_instance_concat__WEBPACK_IMPORTED_MODULE_4__(_context2 = "Triggering action: ".concat(action, ", Query: ")).call(_context2, query));
        if (query) {
          this.sidebarController.triggerButtonAction(action, query);
        } else {
          this.sidebarController.triggerButtonAction(action);
        }
      } else {
        console.warn("SidebarController is not set.");
      }
    }
  }]);
}();


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("dce846cd5d357f6f3091")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.14d4f47ecb34a6d3cc91.hot-update.js.map