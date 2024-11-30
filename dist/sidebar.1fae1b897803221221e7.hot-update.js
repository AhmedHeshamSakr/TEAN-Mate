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

/***/ "./node_modules/@babel/runtime-corejs3/core-js-stable/promise.js":
/*!***********************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs3/core-js-stable/promise.js ***!
  \***********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! core-js-pure/stable/promise */ "./node_modules/core-js-pure/stable/promise/index.js");

/***/ }),

/***/ "./node_modules/core-js-pure/es/promise/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/core-js-pure/es/promise/index.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

__webpack_require__(/*! ../../modules/es.aggregate-error */ "./node_modules/core-js-pure/modules/es.aggregate-error.js");
__webpack_require__(/*! ../../modules/es.array.iterator */ "./node_modules/core-js-pure/modules/es.array.iterator.js");
__webpack_require__(/*! ../../modules/es.object.to-string */ "./node_modules/core-js-pure/modules/es.object.to-string.js");
__webpack_require__(/*! ../../modules/es.promise */ "./node_modules/core-js-pure/modules/es.promise.js");
__webpack_require__(/*! ../../modules/es.promise.all-settled */ "./node_modules/core-js-pure/modules/es.promise.all-settled.js");
__webpack_require__(/*! ../../modules/es.promise.any */ "./node_modules/core-js-pure/modules/es.promise.any.js");
__webpack_require__(/*! ../../modules/es.promise.try */ "./node_modules/core-js-pure/modules/es.promise.try.js");
__webpack_require__(/*! ../../modules/es.promise.with-resolvers */ "./node_modules/core-js-pure/modules/es.promise.with-resolvers.js");
__webpack_require__(/*! ../../modules/es.promise.finally */ "./node_modules/core-js-pure/modules/es.promise.finally.js");
__webpack_require__(/*! ../../modules/es.string.iterator */ "./node_modules/core-js-pure/modules/es.string.iterator.js");
var path = __webpack_require__(/*! ../../internals/path */ "./node_modules/core-js-pure/internals/path.js");

module.exports = path.Promise;


/***/ }),

/***/ "./node_modules/core-js-pure/internals/a-constructor.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/a-constructor.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var isConstructor = __webpack_require__(/*! ../internals/is-constructor */ "./node_modules/core-js-pure/internals/is-constructor.js");
var tryToString = __webpack_require__(/*! ../internals/try-to-string */ "./node_modules/core-js-pure/internals/try-to-string.js");

var $TypeError = TypeError;

// `Assert: IsConstructor(argument) is true`
module.exports = function (argument) {
  if (isConstructor(argument)) return argument;
  throw new $TypeError(tryToString(argument) + ' is not a constructor');
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/an-instance.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/an-instance.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var isPrototypeOf = __webpack_require__(/*! ../internals/object-is-prototype-of */ "./node_modules/core-js-pure/internals/object-is-prototype-of.js");

var $TypeError = TypeError;

module.exports = function (it, Prototype) {
  if (isPrototypeOf(Prototype, it)) return it;
  throw new $TypeError('Incorrect invocation');
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/check-correctness-of-iteration.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/check-correctness-of-iteration.js ***!
  \*******************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");

var ITERATOR = wellKnownSymbol('iterator');
var SAFE_CLOSING = false;

try {
  var called = 0;
  var iteratorWithReturn = {
    next: function () {
      return { done: !!called++ };
    },
    'return': function () {
      SAFE_CLOSING = true;
    }
  };
  iteratorWithReturn[ITERATOR] = function () {
    return this;
  };
  // eslint-disable-next-line es/no-array-from, no-throw-literal -- required for testing
  Array.from(iteratorWithReturn, function () { throw 2; });
} catch (error) { /* empty */ }

module.exports = function (exec, SKIP_CLOSING) {
  try {
    if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
  } catch (error) { return false; } // workaround of old WebKit + `eval` bug
  var ITERATION_SUPPORT = false;
  try {
    var object = {};
    object[ITERATOR] = function () {
      return {
        next: function () {
          return { done: ITERATION_SUPPORT = true };
        }
      };
    };
    exec(object);
  } catch (error) { /* empty */ }
  return ITERATION_SUPPORT;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/copy-constructor-properties.js":
/*!****************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/copy-constructor-properties.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var hasOwn = __webpack_require__(/*! ../internals/has-own-property */ "./node_modules/core-js-pure/internals/has-own-property.js");
var ownKeys = __webpack_require__(/*! ../internals/own-keys */ "./node_modules/core-js-pure/internals/own-keys.js");
var getOwnPropertyDescriptorModule = __webpack_require__(/*! ../internals/object-get-own-property-descriptor */ "./node_modules/core-js-pure/internals/object-get-own-property-descriptor.js");
var definePropertyModule = __webpack_require__(/*! ../internals/object-define-property */ "./node_modules/core-js-pure/internals/object-define-property.js");

module.exports = function (target, source, exceptions) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!hasOwn(target, key) && !(exceptions && hasOwn(exceptions, key))) {
      defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  }
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/environment-is-ios-pebble.js":
/*!**************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/environment-is-ios-pebble.js ***!
  \**************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var userAgent = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");

module.exports = /ipad|iphone|ipod/i.test(userAgent) && typeof Pebble != 'undefined';


/***/ }),

/***/ "./node_modules/core-js-pure/internals/environment-is-ios.js":
/*!*******************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/environment-is-ios.js ***!
  \*******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var userAgent = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");

// eslint-disable-next-line redos/no-vulnerable -- safe
module.exports = /(?:ipad|iphone|ipod).*applewebkit/i.test(userAgent);


/***/ }),

/***/ "./node_modules/core-js-pure/internals/environment-is-node.js":
/*!********************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/environment-is-node.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var ENVIRONMENT = __webpack_require__(/*! ../internals/environment */ "./node_modules/core-js-pure/internals/environment.js");

module.exports = ENVIRONMENT === 'NODE';


/***/ }),

/***/ "./node_modules/core-js-pure/internals/environment-is-webos-webkit.js":
/*!****************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/environment-is-webos-webkit.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var userAgent = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");

module.exports = /web0s(?!.*chrome)/i.test(userAgent);


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

/***/ "./node_modules/core-js-pure/internals/error-stack-clear.js":
/*!******************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/error-stack-clear.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var uncurryThis = __webpack_require__(/*! ../internals/function-uncurry-this */ "./node_modules/core-js-pure/internals/function-uncurry-this.js");

var $Error = Error;
var replace = uncurryThis(''.replace);

var TEST = (function (arg) { return String(new $Error(arg).stack); })('zxcasd');
// eslint-disable-next-line redos/no-vulnerable, sonarjs/slow-regex -- safe
var V8_OR_CHAKRA_STACK_ENTRY = /\n\s*at [^:]*:[^\n]*/;
var IS_V8_OR_CHAKRA_STACK = V8_OR_CHAKRA_STACK_ENTRY.test(TEST);

module.exports = function (stack, dropEntries) {
  if (IS_V8_OR_CHAKRA_STACK && typeof stack == 'string' && !$Error.prepareStackTrace) {
    while (dropEntries--) stack = replace(stack, V8_OR_CHAKRA_STACK_ENTRY, '');
  } return stack;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/error-stack-install.js":
/*!********************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/error-stack-install.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var createNonEnumerableProperty = __webpack_require__(/*! ../internals/create-non-enumerable-property */ "./node_modules/core-js-pure/internals/create-non-enumerable-property.js");
var clearErrorStack = __webpack_require__(/*! ../internals/error-stack-clear */ "./node_modules/core-js-pure/internals/error-stack-clear.js");
var ERROR_STACK_INSTALLABLE = __webpack_require__(/*! ../internals/error-stack-installable */ "./node_modules/core-js-pure/internals/error-stack-installable.js");

// non-standard V8
var captureStackTrace = Error.captureStackTrace;

module.exports = function (error, C, stack, dropEntries) {
  if (ERROR_STACK_INSTALLABLE) {
    if (captureStackTrace) captureStackTrace(error, C);
    else createNonEnumerableProperty(error, 'stack', clearErrorStack(stack, dropEntries));
  }
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/error-stack-installable.js":
/*!************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/error-stack-installable.js ***!
  \************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var fails = __webpack_require__(/*! ../internals/fails */ "./node_modules/core-js-pure/internals/fails.js");
var createPropertyDescriptor = __webpack_require__(/*! ../internals/create-property-descriptor */ "./node_modules/core-js-pure/internals/create-property-descriptor.js");

module.exports = !fails(function () {
  var error = new Error('a');
  if (!('stack' in error)) return true;
  // eslint-disable-next-line es/no-object-defineproperty -- safe
  Object.defineProperty(error, 'stack', createPropertyDescriptor(1, 7));
  return error.stack !== 7;
});


/***/ }),

/***/ "./node_modules/core-js-pure/internals/get-iterator-method.js":
/*!********************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/get-iterator-method.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var classof = __webpack_require__(/*! ../internals/classof */ "./node_modules/core-js-pure/internals/classof.js");
var getMethod = __webpack_require__(/*! ../internals/get-method */ "./node_modules/core-js-pure/internals/get-method.js");
var isNullOrUndefined = __webpack_require__(/*! ../internals/is-null-or-undefined */ "./node_modules/core-js-pure/internals/is-null-or-undefined.js");
var Iterators = __webpack_require__(/*! ../internals/iterators */ "./node_modules/core-js-pure/internals/iterators.js");
var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (!isNullOrUndefined(it)) return getMethod(it, ITERATOR)
    || getMethod(it, '@@iterator')
    || Iterators[classof(it)];
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/get-iterator.js":
/*!*************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/get-iterator.js ***!
  \*************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var anObject = __webpack_require__(/*! ../internals/an-object */ "./node_modules/core-js-pure/internals/an-object.js");
var tryToString = __webpack_require__(/*! ../internals/try-to-string */ "./node_modules/core-js-pure/internals/try-to-string.js");
var getIteratorMethod = __webpack_require__(/*! ../internals/get-iterator-method */ "./node_modules/core-js-pure/internals/get-iterator-method.js");

var $TypeError = TypeError;

module.exports = function (argument, usingIterator) {
  var iteratorMethod = arguments.length < 2 ? getIteratorMethod(argument) : usingIterator;
  if (aCallable(iteratorMethod)) return anObject(call(iteratorMethod, argument));
  throw new $TypeError(tryToString(argument) + ' is not iterable');
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/host-report-errors.js":
/*!*******************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/host-report-errors.js ***!
  \*******************************************************************/
/***/ ((module) => {

"use strict";

module.exports = function (a, b) {
  try {
    // eslint-disable-next-line no-console -- safe
    arguments.length === 1 ? console.error(a) : console.error(a, b);
  } catch (error) { /* empty */ }
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/install-error-cause.js":
/*!********************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/install-error-cause.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var isObject = __webpack_require__(/*! ../internals/is-object */ "./node_modules/core-js-pure/internals/is-object.js");
var createNonEnumerableProperty = __webpack_require__(/*! ../internals/create-non-enumerable-property */ "./node_modules/core-js-pure/internals/create-non-enumerable-property.js");

// `InstallErrorCause` abstract operation
// https://tc39.es/proposal-error-cause/#sec-errorobjects-install-error-cause
module.exports = function (O, options) {
  if (isObject(options) && 'cause' in options) {
    createNonEnumerableProperty(O, 'cause', options.cause);
  }
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/is-array-iterator-method.js":
/*!*************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/is-array-iterator-method.js ***!
  \*************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");
var Iterators = __webpack_require__(/*! ../internals/iterators */ "./node_modules/core-js-pure/internals/iterators.js");

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype;

// check on default Array iterator
module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/iterate.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js-pure/internals/iterate.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var bind = __webpack_require__(/*! ../internals/function-bind-context */ "./node_modules/core-js-pure/internals/function-bind-context.js");
var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var anObject = __webpack_require__(/*! ../internals/an-object */ "./node_modules/core-js-pure/internals/an-object.js");
var tryToString = __webpack_require__(/*! ../internals/try-to-string */ "./node_modules/core-js-pure/internals/try-to-string.js");
var isArrayIteratorMethod = __webpack_require__(/*! ../internals/is-array-iterator-method */ "./node_modules/core-js-pure/internals/is-array-iterator-method.js");
var lengthOfArrayLike = __webpack_require__(/*! ../internals/length-of-array-like */ "./node_modules/core-js-pure/internals/length-of-array-like.js");
var isPrototypeOf = __webpack_require__(/*! ../internals/object-is-prototype-of */ "./node_modules/core-js-pure/internals/object-is-prototype-of.js");
var getIterator = __webpack_require__(/*! ../internals/get-iterator */ "./node_modules/core-js-pure/internals/get-iterator.js");
var getIteratorMethod = __webpack_require__(/*! ../internals/get-iterator-method */ "./node_modules/core-js-pure/internals/get-iterator-method.js");
var iteratorClose = __webpack_require__(/*! ../internals/iterator-close */ "./node_modules/core-js-pure/internals/iterator-close.js");

var $TypeError = TypeError;

var Result = function (stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

var ResultPrototype = Result.prototype;

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_RECORD = !!(options && options.IS_RECORD);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function (condition) {
    if (iterator) iteratorClose(iterator, 'normal', condition);
    return new Result(true, condition);
  };

  var callFn = function (value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    } return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_RECORD) {
    iterator = iterable.iterator;
  } else if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (!iterFn) throw new $TypeError(tryToString(iterable) + ' is not iterable');
    // optimisation for array iterators
    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = lengthOfArrayLike(iterable); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && isPrototypeOf(ResultPrototype, result)) return result;
      } return new Result(false);
    }
    iterator = getIterator(iterable, iterFn);
  }

  next = IS_RECORD ? iterable.next : iterator.next;
  while (!(step = call(next, iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator, 'throw', error);
    }
    if (typeof result == 'object' && result && isPrototypeOf(ResultPrototype, result)) return result;
  } return new Result(false);
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/iterator-close.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/iterator-close.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var anObject = __webpack_require__(/*! ../internals/an-object */ "./node_modules/core-js-pure/internals/an-object.js");
var getMethod = __webpack_require__(/*! ../internals/get-method */ "./node_modules/core-js-pure/internals/get-method.js");

module.exports = function (iterator, kind, value) {
  var innerResult, innerError;
  anObject(iterator);
  try {
    innerResult = getMethod(iterator, 'return');
    if (!innerResult) {
      if (kind === 'throw') throw value;
      return value;
    }
    innerResult = call(innerResult, iterator);
  } catch (error) {
    innerError = true;
    innerResult = error;
  }
  if (kind === 'throw') throw value;
  if (innerError) throw innerResult;
  anObject(innerResult);
  return value;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/microtask.js":
/*!**********************************************************!*\
  !*** ./node_modules/core-js-pure/internals/microtask.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var safeGetBuiltIn = __webpack_require__(/*! ../internals/safe-get-built-in */ "./node_modules/core-js-pure/internals/safe-get-built-in.js");
var bind = __webpack_require__(/*! ../internals/function-bind-context */ "./node_modules/core-js-pure/internals/function-bind-context.js");
var macrotask = (__webpack_require__(/*! ../internals/task */ "./node_modules/core-js-pure/internals/task.js").set);
var Queue = __webpack_require__(/*! ../internals/queue */ "./node_modules/core-js-pure/internals/queue.js");
var IS_IOS = __webpack_require__(/*! ../internals/environment-is-ios */ "./node_modules/core-js-pure/internals/environment-is-ios.js");
var IS_IOS_PEBBLE = __webpack_require__(/*! ../internals/environment-is-ios-pebble */ "./node_modules/core-js-pure/internals/environment-is-ios-pebble.js");
var IS_WEBOS_WEBKIT = __webpack_require__(/*! ../internals/environment-is-webos-webkit */ "./node_modules/core-js-pure/internals/environment-is-webos-webkit.js");
var IS_NODE = __webpack_require__(/*! ../internals/environment-is-node */ "./node_modules/core-js-pure/internals/environment-is-node.js");

var MutationObserver = globalThis.MutationObserver || globalThis.WebKitMutationObserver;
var document = globalThis.document;
var process = globalThis.process;
var Promise = globalThis.Promise;
var microtask = safeGetBuiltIn('queueMicrotask');
var notify, toggle, node, promise, then;

// modern engines have queueMicrotask method
if (!microtask) {
  var queue = new Queue();

  var flush = function () {
    var parent, fn;
    if (IS_NODE && (parent = process.domain)) parent.exit();
    while (fn = queue.get()) try {
      fn();
    } catch (error) {
      if (queue.head) notify();
      throw error;
    }
    if (parent) parent.enter();
  };

  // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
  // also except WebOS Webkit https://github.com/zloirock/core-js/issues/898
  if (!IS_IOS && !IS_NODE && !IS_WEBOS_WEBKIT && MutationObserver && document) {
    toggle = true;
    node = document.createTextNode('');
    new MutationObserver(flush).observe(node, { characterData: true });
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (!IS_IOS_PEBBLE && Promise && Promise.resolve) {
    // Promise.resolve without an argument throws an error in LG WebOS 2
    promise = Promise.resolve(undefined);
    // workaround of WebKit ~ iOS Safari 10.1 bug
    promise.constructor = Promise;
    then = bind(promise.then, promise);
    notify = function () {
      then(flush);
    };
  // Node.js without promises
  } else if (IS_NODE) {
    notify = function () {
      process.nextTick(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessage
  // - onreadystatechange
  // - setTimeout
  } else {
    // `webpack` dev server bug on IE global methods - use bind(fn, global)
    macrotask = bind(macrotask, globalThis);
    notify = function () {
      macrotask(flush);
    };
  }

  microtask = function (fn) {
    if (!queue.head) notify();
    queue.add(fn);
  };
}

module.exports = microtask;


/***/ }),

/***/ "./node_modules/core-js-pure/internals/new-promise-capability.js":
/*!***********************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/new-promise-capability.js ***!
  \***********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");

var $TypeError = TypeError;

var PromiseCapability = function (C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw new $TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aCallable(resolve);
  this.reject = aCallable(reject);
};

// `NewPromiseCapability` abstract operation
// https://tc39.es/ecma262/#sec-newpromisecapability
module.exports.f = function (C) {
  return new PromiseCapability(C);
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/normalize-string-argument.js":
/*!**************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/normalize-string-argument.js ***!
  \**************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var toString = __webpack_require__(/*! ../internals/to-string */ "./node_modules/core-js-pure/internals/to-string.js");

module.exports = function (argument, $default) {
  return argument === undefined ? arguments.length < 2 ? '' : $default : toString(argument);
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/own-keys.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/internals/own-keys.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var getBuiltIn = __webpack_require__(/*! ../internals/get-built-in */ "./node_modules/core-js-pure/internals/get-built-in.js");
var uncurryThis = __webpack_require__(/*! ../internals/function-uncurry-this */ "./node_modules/core-js-pure/internals/function-uncurry-this.js");
var getOwnPropertyNamesModule = __webpack_require__(/*! ../internals/object-get-own-property-names */ "./node_modules/core-js-pure/internals/object-get-own-property-names.js");
var getOwnPropertySymbolsModule = __webpack_require__(/*! ../internals/object-get-own-property-symbols */ "./node_modules/core-js-pure/internals/object-get-own-property-symbols.js");
var anObject = __webpack_require__(/*! ../internals/an-object */ "./node_modules/core-js-pure/internals/an-object.js");

var concat = uncurryThis([].concat);

// all object keys, includes non-enumerable and symbols
module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? concat(keys, getOwnPropertySymbols(it)) : keys;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/perform.js":
/*!********************************************************!*\
  !*** ./node_modules/core-js-pure/internals/perform.js ***!
  \********************************************************/
/***/ ((module) => {

"use strict";

module.exports = function (exec) {
  try {
    return { error: false, value: exec() };
  } catch (error) {
    return { error: true, value: error };
  }
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/promise-constructor-detection.js":
/*!******************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/promise-constructor-detection.js ***!
  \******************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var NativePromiseConstructor = __webpack_require__(/*! ../internals/promise-native-constructor */ "./node_modules/core-js-pure/internals/promise-native-constructor.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var isForced = __webpack_require__(/*! ../internals/is-forced */ "./node_modules/core-js-pure/internals/is-forced.js");
var inspectSource = __webpack_require__(/*! ../internals/inspect-source */ "./node_modules/core-js-pure/internals/inspect-source.js");
var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");
var ENVIRONMENT = __webpack_require__(/*! ../internals/environment */ "./node_modules/core-js-pure/internals/environment.js");
var IS_PURE = __webpack_require__(/*! ../internals/is-pure */ "./node_modules/core-js-pure/internals/is-pure.js");
var V8_VERSION = __webpack_require__(/*! ../internals/environment-v8-version */ "./node_modules/core-js-pure/internals/environment-v8-version.js");

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var SPECIES = wellKnownSymbol('species');
var SUBCLASSING = false;
var NATIVE_PROMISE_REJECTION_EVENT = isCallable(globalThis.PromiseRejectionEvent);

var FORCED_PROMISE_CONSTRUCTOR = isForced('Promise', function () {
  var PROMISE_CONSTRUCTOR_SOURCE = inspectSource(NativePromiseConstructor);
  var GLOBAL_CORE_JS_PROMISE = PROMISE_CONSTRUCTOR_SOURCE !== String(NativePromiseConstructor);
  // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
  // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
  // We can't detect it synchronously, so just check versions
  if (!GLOBAL_CORE_JS_PROMISE && V8_VERSION === 66) return true;
  // We need Promise#{ catch, finally } in the pure version for preventing prototype pollution
  if (IS_PURE && !(NativePromisePrototype['catch'] && NativePromisePrototype['finally'])) return true;
  // We can't use @@species feature detection in V8 since it causes
  // deoptimization and performance degradation
  // https://github.com/zloirock/core-js/issues/679
  if (!V8_VERSION || V8_VERSION < 51 || !/native code/.test(PROMISE_CONSTRUCTOR_SOURCE)) {
    // Detect correctness of subclassing with @@species support
    var promise = new NativePromiseConstructor(function (resolve) { resolve(1); });
    var FakePromise = function (exec) {
      exec(function () { /* empty */ }, function () { /* empty */ });
    };
    var constructor = promise.constructor = {};
    constructor[SPECIES] = FakePromise;
    SUBCLASSING = promise.then(function () { /* empty */ }) instanceof FakePromise;
    if (!SUBCLASSING) return true;
  // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
  } return !GLOBAL_CORE_JS_PROMISE && (ENVIRONMENT === 'BROWSER' || ENVIRONMENT === 'DENO') && !NATIVE_PROMISE_REJECTION_EVENT;
});

module.exports = {
  CONSTRUCTOR: FORCED_PROMISE_CONSTRUCTOR,
  REJECTION_EVENT: NATIVE_PROMISE_REJECTION_EVENT,
  SUBCLASSING: SUBCLASSING
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/promise-native-constructor.js":
/*!***************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/promise-native-constructor.js ***!
  \***************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");

module.exports = globalThis.Promise;


/***/ }),

/***/ "./node_modules/core-js-pure/internals/promise-resolve.js":
/*!****************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/promise-resolve.js ***!
  \****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var anObject = __webpack_require__(/*! ../internals/an-object */ "./node_modules/core-js-pure/internals/an-object.js");
var isObject = __webpack_require__(/*! ../internals/is-object */ "./node_modules/core-js-pure/internals/is-object.js");
var newPromiseCapability = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/promise-statics-incorrect-iteration.js":
/*!************************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/promise-statics-incorrect-iteration.js ***!
  \************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var NativePromiseConstructor = __webpack_require__(/*! ../internals/promise-native-constructor */ "./node_modules/core-js-pure/internals/promise-native-constructor.js");
var checkCorrectnessOfIteration = __webpack_require__(/*! ../internals/check-correctness-of-iteration */ "./node_modules/core-js-pure/internals/check-correctness-of-iteration.js");
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(/*! ../internals/promise-constructor-detection */ "./node_modules/core-js-pure/internals/promise-constructor-detection.js").CONSTRUCTOR);

module.exports = FORCED_PROMISE_CONSTRUCTOR || !checkCorrectnessOfIteration(function (iterable) {
  NativePromiseConstructor.all(iterable).then(undefined, function () { /* empty */ });
});


/***/ }),

/***/ "./node_modules/core-js-pure/internals/queue.js":
/*!******************************************************!*\
  !*** ./node_modules/core-js-pure/internals/queue.js ***!
  \******************************************************/
/***/ ((module) => {

"use strict";

var Queue = function () {
  this.head = null;
  this.tail = null;
};

Queue.prototype = {
  add: function (item) {
    var entry = { item: item, next: null };
    var tail = this.tail;
    if (tail) tail.next = entry;
    else this.head = entry;
    this.tail = entry;
  },
  get: function () {
    var entry = this.head;
    if (entry) {
      var next = this.head = entry.next;
      if (next === null) this.tail = null;
      return entry.item;
    }
  }
};

module.exports = Queue;


/***/ }),

/***/ "./node_modules/core-js-pure/internals/safe-get-built-in.js":
/*!******************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/safe-get-built-in.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var DESCRIPTORS = __webpack_require__(/*! ../internals/descriptors */ "./node_modules/core-js-pure/internals/descriptors.js");

// eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

// Avoid NodeJS experimental warning
module.exports = function (name) {
  if (!DESCRIPTORS) return globalThis[name];
  var descriptor = getOwnPropertyDescriptor(globalThis, name);
  return descriptor && descriptor.value;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/set-species.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/set-species.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var getBuiltIn = __webpack_require__(/*! ../internals/get-built-in */ "./node_modules/core-js-pure/internals/get-built-in.js");
var defineBuiltInAccessor = __webpack_require__(/*! ../internals/define-built-in-accessor */ "./node_modules/core-js-pure/internals/define-built-in-accessor.js");
var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");
var DESCRIPTORS = __webpack_require__(/*! ../internals/descriptors */ "./node_modules/core-js-pure/internals/descriptors.js");

var SPECIES = wellKnownSymbol('species');

module.exports = function (CONSTRUCTOR_NAME) {
  var Constructor = getBuiltIn(CONSTRUCTOR_NAME);

  if (DESCRIPTORS && Constructor && !Constructor[SPECIES]) {
    defineBuiltInAccessor(Constructor, SPECIES, {
      configurable: true,
      get: function () { return this; }
    });
  }
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/species-constructor.js":
/*!********************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/species-constructor.js ***!
  \********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var anObject = __webpack_require__(/*! ../internals/an-object */ "./node_modules/core-js-pure/internals/an-object.js");
var aConstructor = __webpack_require__(/*! ../internals/a-constructor */ "./node_modules/core-js-pure/internals/a-constructor.js");
var isNullOrUndefined = __webpack_require__(/*! ../internals/is-null-or-undefined */ "./node_modules/core-js-pure/internals/is-null-or-undefined.js");
var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");

var SPECIES = wellKnownSymbol('species');

// `SpeciesConstructor` abstract operation
// https://tc39.es/ecma262/#sec-speciesconstructor
module.exports = function (O, defaultConstructor) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || isNullOrUndefined(S = anObject(C)[SPECIES]) ? defaultConstructor : aConstructor(S);
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/task.js":
/*!*****************************************************!*\
  !*** ./node_modules/core-js-pure/internals/task.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var apply = __webpack_require__(/*! ../internals/function-apply */ "./node_modules/core-js-pure/internals/function-apply.js");
var bind = __webpack_require__(/*! ../internals/function-bind-context */ "./node_modules/core-js-pure/internals/function-bind-context.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var hasOwn = __webpack_require__(/*! ../internals/has-own-property */ "./node_modules/core-js-pure/internals/has-own-property.js");
var fails = __webpack_require__(/*! ../internals/fails */ "./node_modules/core-js-pure/internals/fails.js");
var html = __webpack_require__(/*! ../internals/html */ "./node_modules/core-js-pure/internals/html.js");
var arraySlice = __webpack_require__(/*! ../internals/array-slice */ "./node_modules/core-js-pure/internals/array-slice.js");
var createElement = __webpack_require__(/*! ../internals/document-create-element */ "./node_modules/core-js-pure/internals/document-create-element.js");
var validateArgumentsLength = __webpack_require__(/*! ../internals/validate-arguments-length */ "./node_modules/core-js-pure/internals/validate-arguments-length.js");
var IS_IOS = __webpack_require__(/*! ../internals/environment-is-ios */ "./node_modules/core-js-pure/internals/environment-is-ios.js");
var IS_NODE = __webpack_require__(/*! ../internals/environment-is-node */ "./node_modules/core-js-pure/internals/environment-is-node.js");

var set = globalThis.setImmediate;
var clear = globalThis.clearImmediate;
var process = globalThis.process;
var Dispatch = globalThis.Dispatch;
var Function = globalThis.Function;
var MessageChannel = globalThis.MessageChannel;
var String = globalThis.String;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var $location, defer, channel, port;

fails(function () {
  // Deno throws a ReferenceError on `location` access without `--location` flag
  $location = globalThis.location;
});

var run = function (id) {
  if (hasOwn(queue, id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};

var runner = function (id) {
  return function () {
    run(id);
  };
};

var eventListener = function (event) {
  run(event.data);
};

var globalPostMessageDefer = function (id) {
  // old engines have not location.origin
  globalThis.postMessage(String(id), $location.protocol + '//' + $location.host);
};

// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!set || !clear) {
  set = function setImmediate(handler) {
    validateArgumentsLength(arguments.length, 1);
    var fn = isCallable(handler) ? handler : Function(handler);
    var args = arraySlice(arguments, 1);
    queue[++counter] = function () {
      apply(fn, undefined, args);
    };
    defer(counter);
    return counter;
  };
  clear = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (IS_NODE) {
    defer = function (id) {
      process.nextTick(runner(id));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(runner(id));
    };
  // Browsers with MessageChannel, includes WebWorkers
  // except iOS - https://github.com/zloirock/core-js/issues/624
  } else if (MessageChannel && !IS_IOS) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = eventListener;
    defer = bind(port.postMessage, port);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (
    globalThis.addEventListener &&
    isCallable(globalThis.postMessage) &&
    !globalThis.importScripts &&
    $location && $location.protocol !== 'file:' &&
    !fails(globalPostMessageDefer)
  ) {
    defer = globalPostMessageDefer;
    globalThis.addEventListener('message', eventListener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in createElement('script')) {
    defer = function (id) {
      html.appendChild(createElement('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(runner(id), 0);
    };
  }
}

module.exports = {
  set: set,
  clear: clear
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

/***/ "./node_modules/core-js-pure/modules/es.aggregate-error.constructor.js":
/*!*****************************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.aggregate-error.constructor.js ***!
  \*****************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var isPrototypeOf = __webpack_require__(/*! ../internals/object-is-prototype-of */ "./node_modules/core-js-pure/internals/object-is-prototype-of.js");
var getPrototypeOf = __webpack_require__(/*! ../internals/object-get-prototype-of */ "./node_modules/core-js-pure/internals/object-get-prototype-of.js");
var setPrototypeOf = __webpack_require__(/*! ../internals/object-set-prototype-of */ "./node_modules/core-js-pure/internals/object-set-prototype-of.js");
var copyConstructorProperties = __webpack_require__(/*! ../internals/copy-constructor-properties */ "./node_modules/core-js-pure/internals/copy-constructor-properties.js");
var create = __webpack_require__(/*! ../internals/object-create */ "./node_modules/core-js-pure/internals/object-create.js");
var createNonEnumerableProperty = __webpack_require__(/*! ../internals/create-non-enumerable-property */ "./node_modules/core-js-pure/internals/create-non-enumerable-property.js");
var createPropertyDescriptor = __webpack_require__(/*! ../internals/create-property-descriptor */ "./node_modules/core-js-pure/internals/create-property-descriptor.js");
var installErrorCause = __webpack_require__(/*! ../internals/install-error-cause */ "./node_modules/core-js-pure/internals/install-error-cause.js");
var installErrorStack = __webpack_require__(/*! ../internals/error-stack-install */ "./node_modules/core-js-pure/internals/error-stack-install.js");
var iterate = __webpack_require__(/*! ../internals/iterate */ "./node_modules/core-js-pure/internals/iterate.js");
var normalizeStringArgument = __webpack_require__(/*! ../internals/normalize-string-argument */ "./node_modules/core-js-pure/internals/normalize-string-argument.js");
var wellKnownSymbol = __webpack_require__(/*! ../internals/well-known-symbol */ "./node_modules/core-js-pure/internals/well-known-symbol.js");

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var $Error = Error;
var push = [].push;

var $AggregateError = function AggregateError(errors, message /* , options */) {
  var isInstance = isPrototypeOf(AggregateErrorPrototype, this);
  var that;
  if (setPrototypeOf) {
    that = setPrototypeOf(new $Error(), isInstance ? getPrototypeOf(this) : AggregateErrorPrototype);
  } else {
    that = isInstance ? this : create(AggregateErrorPrototype);
    createNonEnumerableProperty(that, TO_STRING_TAG, 'Error');
  }
  if (message !== undefined) createNonEnumerableProperty(that, 'message', normalizeStringArgument(message));
  installErrorStack(that, $AggregateError, that.stack, 1);
  if (arguments.length > 2) installErrorCause(that, arguments[2]);
  var errorsArray = [];
  iterate(errors, push, { that: errorsArray });
  createNonEnumerableProperty(that, 'errors', errorsArray);
  return that;
};

if (setPrototypeOf) setPrototypeOf($AggregateError, $Error);
else copyConstructorProperties($AggregateError, $Error, { name: true });

var AggregateErrorPrototype = $AggregateError.prototype = create($Error.prototype, {
  constructor: createPropertyDescriptor(1, $AggregateError),
  message: createPropertyDescriptor(1, ''),
  name: createPropertyDescriptor(1, 'AggregateError')
});

// `AggregateError` constructor
// https://tc39.es/ecma262/#sec-aggregate-error-constructor
$({ global: true, constructor: true, arity: 2 }, {
  AggregateError: $AggregateError
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.aggregate-error.js":
/*!*****************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.aggregate-error.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// TODO: Remove this module from `core-js@4` since it's replaced to module below
__webpack_require__(/*! ../modules/es.aggregate-error.constructor */ "./node_modules/core-js-pure/modules/es.aggregate-error.constructor.js");


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.all-settled.js":
/*!*********************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.all-settled.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");
var perform = __webpack_require__(/*! ../internals/perform */ "./node_modules/core-js-pure/internals/perform.js");
var iterate = __webpack_require__(/*! ../internals/iterate */ "./node_modules/core-js-pure/internals/iterate.js");
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(/*! ../internals/promise-statics-incorrect-iteration */ "./node_modules/core-js-pure/internals/promise-statics-incorrect-iteration.js");

// `Promise.allSettled` method
// https://tc39.es/ecma262/#sec-promise.allsettled
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  allSettled: function allSettled(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aCallable(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        remaining++;
        call(promiseResolve, C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'fulfilled', value: value };
          --remaining || resolve(values);
        }, function (error) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = { status: 'rejected', reason: error };
          --remaining || resolve(values);
        });
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.all.js":
/*!*************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.all.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");
var perform = __webpack_require__(/*! ../internals/perform */ "./node_modules/core-js-pure/internals/perform.js");
var iterate = __webpack_require__(/*! ../internals/iterate */ "./node_modules/core-js-pure/internals/iterate.js");
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(/*! ../internals/promise-statics-incorrect-iteration */ "./node_modules/core-js-pure/internals/promise-statics-incorrect-iteration.js");

// `Promise.all` method
// https://tc39.es/ecma262/#sec-promise.all
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aCallable(C.resolve);
      var values = [];
      var counter = 0;
      var remaining = 1;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyCalled = false;
        remaining++;
        call($promiseResolve, C, promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.any.js":
/*!*************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.any.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var getBuiltIn = __webpack_require__(/*! ../internals/get-built-in */ "./node_modules/core-js-pure/internals/get-built-in.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");
var perform = __webpack_require__(/*! ../internals/perform */ "./node_modules/core-js-pure/internals/perform.js");
var iterate = __webpack_require__(/*! ../internals/iterate */ "./node_modules/core-js-pure/internals/iterate.js");
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(/*! ../internals/promise-statics-incorrect-iteration */ "./node_modules/core-js-pure/internals/promise-statics-incorrect-iteration.js");

var PROMISE_ANY_ERROR = 'No one promise resolved';

// `Promise.any` method
// https://tc39.es/ecma262/#sec-promise.any
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  any: function any(iterable) {
    var C = this;
    var AggregateError = getBuiltIn('AggregateError');
    var capability = newPromiseCapabilityModule.f(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var promiseResolve = aCallable(C.resolve);
      var errors = [];
      var counter = 0;
      var remaining = 1;
      var alreadyResolved = false;
      iterate(iterable, function (promise) {
        var index = counter++;
        var alreadyRejected = false;
        remaining++;
        call(promiseResolve, C, promise).then(function (value) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyResolved = true;
          resolve(value);
        }, function (error) {
          if (alreadyRejected || alreadyResolved) return;
          alreadyRejected = true;
          errors[index] = error;
          --remaining || reject(new AggregateError(errors, PROMISE_ANY_ERROR));
        });
      });
      --remaining || reject(new AggregateError(errors, PROMISE_ANY_ERROR));
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.catch.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.catch.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var IS_PURE = __webpack_require__(/*! ../internals/is-pure */ "./node_modules/core-js-pure/internals/is-pure.js");
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(/*! ../internals/promise-constructor-detection */ "./node_modules/core-js-pure/internals/promise-constructor-detection.js").CONSTRUCTOR);
var NativePromiseConstructor = __webpack_require__(/*! ../internals/promise-native-constructor */ "./node_modules/core-js-pure/internals/promise-native-constructor.js");
var getBuiltIn = __webpack_require__(/*! ../internals/get-built-in */ "./node_modules/core-js-pure/internals/get-built-in.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var defineBuiltIn = __webpack_require__(/*! ../internals/define-built-in */ "./node_modules/core-js-pure/internals/define-built-in.js");

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;

// `Promise.prototype.catch` method
// https://tc39.es/ecma262/#sec-promise.prototype.catch
$({ target: 'Promise', proto: true, forced: FORCED_PROMISE_CONSTRUCTOR, real: true }, {
  'catch': function (onRejected) {
    return this.then(undefined, onRejected);
  }
});

// makes sure that native promise-based APIs `Promise#catch` properly works with patched `Promise#then`
if (!IS_PURE && isCallable(NativePromiseConstructor)) {
  var method = getBuiltIn('Promise').prototype['catch'];
  if (NativePromisePrototype['catch'] !== method) {
    defineBuiltIn(NativePromisePrototype, 'catch', method, { unsafe: true });
  }
}


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.constructor.js":
/*!*********************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.constructor.js ***!
  \*********************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var IS_PURE = __webpack_require__(/*! ../internals/is-pure */ "./node_modules/core-js-pure/internals/is-pure.js");
var IS_NODE = __webpack_require__(/*! ../internals/environment-is-node */ "./node_modules/core-js-pure/internals/environment-is-node.js");
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var defineBuiltIn = __webpack_require__(/*! ../internals/define-built-in */ "./node_modules/core-js-pure/internals/define-built-in.js");
var setPrototypeOf = __webpack_require__(/*! ../internals/object-set-prototype-of */ "./node_modules/core-js-pure/internals/object-set-prototype-of.js");
var setToStringTag = __webpack_require__(/*! ../internals/set-to-string-tag */ "./node_modules/core-js-pure/internals/set-to-string-tag.js");
var setSpecies = __webpack_require__(/*! ../internals/set-species */ "./node_modules/core-js-pure/internals/set-species.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var isObject = __webpack_require__(/*! ../internals/is-object */ "./node_modules/core-js-pure/internals/is-object.js");
var anInstance = __webpack_require__(/*! ../internals/an-instance */ "./node_modules/core-js-pure/internals/an-instance.js");
var speciesConstructor = __webpack_require__(/*! ../internals/species-constructor */ "./node_modules/core-js-pure/internals/species-constructor.js");
var task = (__webpack_require__(/*! ../internals/task */ "./node_modules/core-js-pure/internals/task.js").set);
var microtask = __webpack_require__(/*! ../internals/microtask */ "./node_modules/core-js-pure/internals/microtask.js");
var hostReportErrors = __webpack_require__(/*! ../internals/host-report-errors */ "./node_modules/core-js-pure/internals/host-report-errors.js");
var perform = __webpack_require__(/*! ../internals/perform */ "./node_modules/core-js-pure/internals/perform.js");
var Queue = __webpack_require__(/*! ../internals/queue */ "./node_modules/core-js-pure/internals/queue.js");
var InternalStateModule = __webpack_require__(/*! ../internals/internal-state */ "./node_modules/core-js-pure/internals/internal-state.js");
var NativePromiseConstructor = __webpack_require__(/*! ../internals/promise-native-constructor */ "./node_modules/core-js-pure/internals/promise-native-constructor.js");
var PromiseConstructorDetection = __webpack_require__(/*! ../internals/promise-constructor-detection */ "./node_modules/core-js-pure/internals/promise-constructor-detection.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");

var PROMISE = 'Promise';
var FORCED_PROMISE_CONSTRUCTOR = PromiseConstructorDetection.CONSTRUCTOR;
var NATIVE_PROMISE_REJECTION_EVENT = PromiseConstructorDetection.REJECTION_EVENT;
var NATIVE_PROMISE_SUBCLASSING = PromiseConstructorDetection.SUBCLASSING;
var getInternalPromiseState = InternalStateModule.getterFor(PROMISE);
var setInternalState = InternalStateModule.set;
var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;
var PromiseConstructor = NativePromiseConstructor;
var PromisePrototype = NativePromisePrototype;
var TypeError = globalThis.TypeError;
var document = globalThis.document;
var process = globalThis.process;
var newPromiseCapability = newPromiseCapabilityModule.f;
var newGenericPromiseCapability = newPromiseCapability;

var DISPATCH_EVENT = !!(document && document.createEvent && globalThis.dispatchEvent);
var UNHANDLED_REJECTION = 'unhandledrejection';
var REJECTION_HANDLED = 'rejectionhandled';
var PENDING = 0;
var FULFILLED = 1;
var REJECTED = 2;
var HANDLED = 1;
var UNHANDLED = 2;

var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && isCallable(then = it.then) ? then : false;
};

var callReaction = function (reaction, state) {
  var value = state.value;
  var ok = state.state === FULFILLED;
  var handler = ok ? reaction.ok : reaction.fail;
  var resolve = reaction.resolve;
  var reject = reaction.reject;
  var domain = reaction.domain;
  var result, then, exited;
  try {
    if (handler) {
      if (!ok) {
        if (state.rejection === UNHANDLED) onHandleUnhandled(state);
        state.rejection = HANDLED;
      }
      if (handler === true) result = value;
      else {
        if (domain) domain.enter();
        result = handler(value); // can throw
        if (domain) {
          domain.exit();
          exited = true;
        }
      }
      if (result === reaction.promise) {
        reject(new TypeError('Promise-chain cycle'));
      } else if (then = isThenable(result)) {
        call(then, result, resolve, reject);
      } else resolve(result);
    } else reject(value);
  } catch (error) {
    if (domain && !exited) domain.exit();
    reject(error);
  }
};

var notify = function (state, isReject) {
  if (state.notified) return;
  state.notified = true;
  microtask(function () {
    var reactions = state.reactions;
    var reaction;
    while (reaction = reactions.get()) {
      callReaction(reaction, state);
    }
    state.notified = false;
    if (isReject && !state.rejection) onUnhandled(state);
  });
};

var dispatchEvent = function (name, promise, reason) {
  var event, handler;
  if (DISPATCH_EVENT) {
    event = document.createEvent('Event');
    event.promise = promise;
    event.reason = reason;
    event.initEvent(name, false, true);
    globalThis.dispatchEvent(event);
  } else event = { promise: promise, reason: reason };
  if (!NATIVE_PROMISE_REJECTION_EVENT && (handler = globalThis['on' + name])) handler(event);
  else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
};

var onUnhandled = function (state) {
  call(task, globalThis, function () {
    var promise = state.facade;
    var value = state.value;
    var IS_UNHANDLED = isUnhandled(state);
    var result;
    if (IS_UNHANDLED) {
      result = perform(function () {
        if (IS_NODE) {
          process.emit('unhandledRejection', value, promise);
        } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      state.rejection = IS_NODE || isUnhandled(state) ? UNHANDLED : HANDLED;
      if (result.error) throw result.value;
    }
  });
};

var isUnhandled = function (state) {
  return state.rejection !== HANDLED && !state.parent;
};

var onHandleUnhandled = function (state) {
  call(task, globalThis, function () {
    var promise = state.facade;
    if (IS_NODE) {
      process.emit('rejectionHandled', promise);
    } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
  });
};

var bind = function (fn, state, unwrap) {
  return function (value) {
    fn(state, value, unwrap);
  };
};

var internalReject = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  state.value = value;
  state.state = REJECTED;
  notify(state, true);
};

var internalResolve = function (state, value, unwrap) {
  if (state.done) return;
  state.done = true;
  if (unwrap) state = unwrap;
  try {
    if (state.facade === value) throw new TypeError("Promise can't be resolved itself");
    var then = isThenable(value);
    if (then) {
      microtask(function () {
        var wrapper = { done: false };
        try {
          call(then, value,
            bind(internalResolve, wrapper, state),
            bind(internalReject, wrapper, state)
          );
        } catch (error) {
          internalReject(wrapper, error, state);
        }
      });
    } else {
      state.value = value;
      state.state = FULFILLED;
      notify(state, false);
    }
  } catch (error) {
    internalReject({ done: false }, error, state);
  }
};

// constructor polyfill
if (FORCED_PROMISE_CONSTRUCTOR) {
  // 25.4.3.1 Promise(executor)
  PromiseConstructor = function Promise(executor) {
    anInstance(this, PromisePrototype);
    aCallable(executor);
    call(Internal, this);
    var state = getInternalPromiseState(this);
    try {
      executor(bind(internalResolve, state), bind(internalReject, state));
    } catch (error) {
      internalReject(state, error);
    }
  };

  PromisePrototype = PromiseConstructor.prototype;

  // eslint-disable-next-line no-unused-vars -- required for `.length`
  Internal = function Promise(executor) {
    setInternalState(this, {
      type: PROMISE,
      done: false,
      notified: false,
      parent: false,
      reactions: new Queue(),
      rejection: false,
      state: PENDING,
      value: null
    });
  };

  // `Promise.prototype.then` method
  // https://tc39.es/ecma262/#sec-promise.prototype.then
  Internal.prototype = defineBuiltIn(PromisePrototype, 'then', function then(onFulfilled, onRejected) {
    var state = getInternalPromiseState(this);
    var reaction = newPromiseCapability(speciesConstructor(this, PromiseConstructor));
    state.parent = true;
    reaction.ok = isCallable(onFulfilled) ? onFulfilled : true;
    reaction.fail = isCallable(onRejected) && onRejected;
    reaction.domain = IS_NODE ? process.domain : undefined;
    if (state.state === PENDING) state.reactions.add(reaction);
    else microtask(function () {
      callReaction(reaction, state);
    });
    return reaction.promise;
  });

  OwnPromiseCapability = function () {
    var promise = new Internal();
    var state = getInternalPromiseState(promise);
    this.promise = promise;
    this.resolve = bind(internalResolve, state);
    this.reject = bind(internalReject, state);
  };

  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === PromiseConstructor || C === PromiseWrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };

  if (!IS_PURE && isCallable(NativePromiseConstructor) && NativePromisePrototype !== Object.prototype) {
    nativeThen = NativePromisePrototype.then;

    if (!NATIVE_PROMISE_SUBCLASSING) {
      // make `Promise#then` return a polyfilled `Promise` for native promise-based APIs
      defineBuiltIn(NativePromisePrototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          call(nativeThen, that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });
    }

    // make `.constructor === Promise` work for native promise-based APIs
    try {
      delete NativePromisePrototype.constructor;
    } catch (error) { /* empty */ }

    // make `instanceof Promise` work for native promise-based APIs
    if (setPrototypeOf) {
      setPrototypeOf(NativePromisePrototype, PromisePrototype);
    }
  }
}

// `Promise` constructor
// https://tc39.es/ecma262/#sec-promise-executor
$({ global: true, constructor: true, wrap: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  Promise: PromiseConstructor
});

setToStringTag(PromiseConstructor, PROMISE, false, true);
setSpecies(PROMISE);


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.finally.js":
/*!*****************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.finally.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var IS_PURE = __webpack_require__(/*! ../internals/is-pure */ "./node_modules/core-js-pure/internals/is-pure.js");
var NativePromiseConstructor = __webpack_require__(/*! ../internals/promise-native-constructor */ "./node_modules/core-js-pure/internals/promise-native-constructor.js");
var fails = __webpack_require__(/*! ../internals/fails */ "./node_modules/core-js-pure/internals/fails.js");
var getBuiltIn = __webpack_require__(/*! ../internals/get-built-in */ "./node_modules/core-js-pure/internals/get-built-in.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var speciesConstructor = __webpack_require__(/*! ../internals/species-constructor */ "./node_modules/core-js-pure/internals/species-constructor.js");
var promiseResolve = __webpack_require__(/*! ../internals/promise-resolve */ "./node_modules/core-js-pure/internals/promise-resolve.js");
var defineBuiltIn = __webpack_require__(/*! ../internals/define-built-in */ "./node_modules/core-js-pure/internals/define-built-in.js");

var NativePromisePrototype = NativePromiseConstructor && NativePromiseConstructor.prototype;

// Safari bug https://bugs.webkit.org/show_bug.cgi?id=200829
var NON_GENERIC = !!NativePromiseConstructor && fails(function () {
  // eslint-disable-next-line unicorn/no-thenable -- required for testing
  NativePromisePrototype['finally'].call({ then: function () { /* empty */ } }, function () { /* empty */ });
});

// `Promise.prototype.finally` method
// https://tc39.es/ecma262/#sec-promise.prototype.finally
$({ target: 'Promise', proto: true, real: true, forced: NON_GENERIC }, {
  'finally': function (onFinally) {
    var C = speciesConstructor(this, getBuiltIn('Promise'));
    var isFunction = isCallable(onFinally);
    return this.then(
      isFunction ? function (x) {
        return promiseResolve(C, onFinally()).then(function () { return x; });
      } : onFinally,
      isFunction ? function (e) {
        return promiseResolve(C, onFinally()).then(function () { throw e; });
      } : onFinally
    );
  }
});

// makes sure that native promise-based APIs `Promise#finally` properly works with patched `Promise#then`
if (!IS_PURE && isCallable(NativePromiseConstructor)) {
  var method = getBuiltIn('Promise').prototype['finally'];
  if (NativePromisePrototype['finally'] !== method) {
    defineBuiltIn(NativePromisePrototype, 'finally', method, { unsafe: true });
  }
}


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// TODO: Remove this module from `core-js@4` since it's split to modules listed below
__webpack_require__(/*! ../modules/es.promise.constructor */ "./node_modules/core-js-pure/modules/es.promise.constructor.js");
__webpack_require__(/*! ../modules/es.promise.all */ "./node_modules/core-js-pure/modules/es.promise.all.js");
__webpack_require__(/*! ../modules/es.promise.catch */ "./node_modules/core-js-pure/modules/es.promise.catch.js");
__webpack_require__(/*! ../modules/es.promise.race */ "./node_modules/core-js-pure/modules/es.promise.race.js");
__webpack_require__(/*! ../modules/es.promise.reject */ "./node_modules/core-js-pure/modules/es.promise.reject.js");
__webpack_require__(/*! ../modules/es.promise.resolve */ "./node_modules/core-js-pure/modules/es.promise.resolve.js");


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.race.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.race.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var call = __webpack_require__(/*! ../internals/function-call */ "./node_modules/core-js-pure/internals/function-call.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");
var perform = __webpack_require__(/*! ../internals/perform */ "./node_modules/core-js-pure/internals/perform.js");
var iterate = __webpack_require__(/*! ../internals/iterate */ "./node_modules/core-js-pure/internals/iterate.js");
var PROMISE_STATICS_INCORRECT_ITERATION = __webpack_require__(/*! ../internals/promise-statics-incorrect-iteration */ "./node_modules/core-js-pure/internals/promise-statics-incorrect-iteration.js");

// `Promise.race` method
// https://tc39.es/ecma262/#sec-promise.race
$({ target: 'Promise', stat: true, forced: PROMISE_STATICS_INCORRECT_ITERATION }, {
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapabilityModule.f(C);
    var reject = capability.reject;
    var result = perform(function () {
      var $promiseResolve = aCallable(C.resolve);
      iterate(iterable, function (promise) {
        call($promiseResolve, C, promise).then(capability.resolve, reject);
      });
    });
    if (result.error) reject(result.value);
    return capability.promise;
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.reject.js":
/*!****************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.reject.js ***!
  \****************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(/*! ../internals/promise-constructor-detection */ "./node_modules/core-js-pure/internals/promise-constructor-detection.js").CONSTRUCTOR);

// `Promise.reject` method
// https://tc39.es/ecma262/#sec-promise.reject
$({ target: 'Promise', stat: true, forced: FORCED_PROMISE_CONSTRUCTOR }, {
  reject: function reject(r) {
    var capability = newPromiseCapabilityModule.f(this);
    var capabilityReject = capability.reject;
    capabilityReject(r);
    return capability.promise;
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.resolve.js":
/*!*****************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.resolve.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var getBuiltIn = __webpack_require__(/*! ../internals/get-built-in */ "./node_modules/core-js-pure/internals/get-built-in.js");
var IS_PURE = __webpack_require__(/*! ../internals/is-pure */ "./node_modules/core-js-pure/internals/is-pure.js");
var NativePromiseConstructor = __webpack_require__(/*! ../internals/promise-native-constructor */ "./node_modules/core-js-pure/internals/promise-native-constructor.js");
var FORCED_PROMISE_CONSTRUCTOR = (__webpack_require__(/*! ../internals/promise-constructor-detection */ "./node_modules/core-js-pure/internals/promise-constructor-detection.js").CONSTRUCTOR);
var promiseResolve = __webpack_require__(/*! ../internals/promise-resolve */ "./node_modules/core-js-pure/internals/promise-resolve.js");

var PromiseConstructorWrapper = getBuiltIn('Promise');
var CHECK_WRAPPER = IS_PURE && !FORCED_PROMISE_CONSTRUCTOR;

// `Promise.resolve` method
// https://tc39.es/ecma262/#sec-promise.resolve
$({ target: 'Promise', stat: true, forced: IS_PURE || FORCED_PROMISE_CONSTRUCTOR }, {
  resolve: function resolve(x) {
    return promiseResolve(CHECK_WRAPPER && this === PromiseConstructorWrapper ? NativePromiseConstructor : this, x);
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.try.js":
/*!*************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.try.js ***!
  \*************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var apply = __webpack_require__(/*! ../internals/function-apply */ "./node_modules/core-js-pure/internals/function-apply.js");
var slice = __webpack_require__(/*! ../internals/array-slice */ "./node_modules/core-js-pure/internals/array-slice.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");
var aCallable = __webpack_require__(/*! ../internals/a-callable */ "./node_modules/core-js-pure/internals/a-callable.js");
var perform = __webpack_require__(/*! ../internals/perform */ "./node_modules/core-js-pure/internals/perform.js");

var Promise = globalThis.Promise;

var ACCEPT_ARGUMENTS = false;
// Avoiding the use of polyfills of the previous iteration of this proposal
// that does not accept arguments of the callback
var FORCED = !Promise || !Promise['try'] || perform(function () {
  Promise['try'](function (argument) {
    ACCEPT_ARGUMENTS = argument === 8;
  }, 8);
}).error || !ACCEPT_ARGUMENTS;

// `Promise.try` method
// https://tc39.es/ecma262/#sec-promise.try
$({ target: 'Promise', stat: true, forced: FORCED }, {
  'try': function (callbackfn /* , ...args */) {
    var args = arguments.length > 1 ? slice(arguments, 1) : [];
    var promiseCapability = newPromiseCapabilityModule.f(this);
    var result = perform(function () {
      return apply(aCallable(callbackfn), undefined, args);
    });
    (result.error ? promiseCapability.reject : promiseCapability.resolve)(result.value);
    return promiseCapability.promise;
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/es.promise.with-resolvers.js":
/*!************************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/es.promise.with-resolvers.js ***!
  \************************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var newPromiseCapabilityModule = __webpack_require__(/*! ../internals/new-promise-capability */ "./node_modules/core-js-pure/internals/new-promise-capability.js");

// `Promise.withResolvers` method
// https://tc39.es/ecma262/#sec-promise.withResolvers
$({ target: 'Promise', stat: true }, {
  withResolvers: function withResolvers() {
    var promiseCapability = newPromiseCapabilityModule.f(this);
    return {
      promise: promiseCapability.promise,
      resolve: promiseCapability.resolve,
      reject: promiseCapability.reject
    };
  }
});


/***/ }),

/***/ "./node_modules/core-js-pure/stable/promise/index.js":
/*!***********************************************************!*\
  !*** ./node_modules/core-js-pure/stable/promise/index.js ***!
  \***********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var parent = __webpack_require__(/*! ../../es/promise */ "./node_modules/core-js-pure/es/promise/index.js");
__webpack_require__(/*! ../../modules/web.dom-collections.iterator */ "./node_modules/core-js-pure/modules/web.dom-collections.iterator.js");

module.exports = parent;


/***/ }),

/***/ "./node_modules/@babel/runtime-corejs3/helpers/esm/defineProperty.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs3/helpers/esm/defineProperty.js ***!
  \***************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ _defineProperty)
/* harmony export */ });
/* harmony import */ var core_js_pure_features_object_define_property_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! core-js-pure/features/object/define-property.js */ "./node_modules/core-js-pure/full/object/define-property.js");
/* harmony import */ var _toPropertyKey_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./toPropertyKey.js */ "./node_modules/@babel/runtime-corejs3/helpers/esm/toPropertyKey.js");


function _defineProperty(e, r, t) {
  return (r = (0,_toPropertyKey_js__WEBPACK_IMPORTED_MODULE_0__["default"])(r)) in e ? core_js_pure_features_object_define_property_js__WEBPACK_IMPORTED_MODULE_1__(e, r, {
    value: t,
    enumerable: !0,
    configurable: !0,
    writable: !0
  }) : e[r] = t, e;
}


/***/ }),

/***/ "./2-features/STT/ArtyomHandller.js":
/*!******************************************!*\
  !*** ./2-features/STT/ArtyomHandller.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ArtyomAssistant)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/defineProperty */ "./node_modules/@babel/runtime-corejs3/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/promise */ "./node_modules/@babel/runtime-corejs3/core-js-stable/promise.js");
/* harmony import */ var _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../../../../node_modules/artyom.js/build/artyom.js */ "./node_modules/artyom.js/build/artyom.js");





var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    // Prevent multiple instantiations
    if (ArtyomAssistant.instance) {
      return ArtyomAssistant.instance;
    }

    // Robust initialization of Artyom with fallback and environment checks
    this.artyom = this.initializeArtyom();
    this.isListening = false;

    // Set up a default help command
    this.setupDefaultCommands();

    // Store the instance
    ArtyomAssistant.instance = this;
  }

  // Safe Artyom initialization method
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "initializeArtyom",
    value: function initializeArtyom() {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // First, try the imported Artyom
        if (typeof _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_4__["default"] === 'function') {
          return new _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_4__["default"]();
        }

        // Fallback to window.Artyom if available
        if (window.Artyom) {
          return new window.Artyom();
        }
      }

      // If no Artyom is available, log an error and return null
      console.error('Artyom speech recognition is not available in this environment.');
      return null;
    }

    // Modify existing methods to check for artyom initialization
  }, {
    key: "setupDefaultCommands",
    value: function setupDefaultCommands() {
      var _this = this;
      // Only set up commands if Artyom is initialized
      if (!this.artyom) {
        console.warn('Cannot set up default commands: Artyom not initialized');
        return;
      }
      this.artyom.addCommands({
        indexes: ["hello", "help"],
        action: function action() {
          console.log("Default command triggered!");
          // Optionally speak a response
          _this.artyom.say("How can I assist you today?");
        }
      });
      console.log("ArtyomAssistant initialized with default commands.");
    }

    // Modify startListening to handle potential Artyom absence
  }, {
    key: "startListening",
    value: function startListening() {
      var _this2 = this;
      // Check if Artyom is initialized
      if (!this.artyom) {
        console.error('Cannot start listening: Artyom not initialized');
        return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_3__.reject(new Error('Speech recognition not available'));
      }

      // Check if already listening to prevent duplicate initialization
      if (this.isListening) {
        console.warn("Speech recognition is already active.");
        return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_3__.resolve();
      }

      // Return a promise to handle async permission and initialization
      return new _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_3__(function (resolve, reject) {
        // Ensure browser environment supports necessary APIs
        if (typeof navigator === 'undefined' || !navigator.permissions) {
          reject(new Error('Browser does not support required permissions API'));
          return;
        }

        // First, check microphone permissions
        navigator.permissions.query({
          name: 'microphone'
        }).then(function (permissionStatus) {
          switch (permissionStatus.state) {
            case 'granted':
              _this2.initializeSpeechRecognition(resolve, reject);
              break;
            case 'prompt':
              _this2.requestMicrophonePermission(resolve, reject);
              break;
            case 'denied':
              _this2.handleMicrophoneDenied(reject);
              break;
          }
        })["catch"](function (error) {
          console.error('Permission check failed:', error);
          _this2.handleMicrophoneDenied(reject);
        });
      });
    }

    // Other methods remain largely the same, but add checks for this.artyom
    // For example, in stopListening:
  }, {
    key: "stopListening",
    value: function stopListening() {
      var _this3 = this;
      // Check if Artyom is initialized
      if (!this.artyom) {
        console.error('Cannot stop listening: Artyom not initialized');
        return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_3__.reject(new Error('Speech recognition not available'));
      }

      // Check if already stopped
      if (!this.isListening) {
        console.warn("Speech recognition is not currently active.");
        return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_3__.resolve();
      }
      return this.artyom.fatality().then(function () {
        _this3.isListening = false;
        console.log("Speech recognition stopped successfully");
        _this3.showSuccessNotification("Speech recognition deactivated");
      })["catch"](function (err) {
        console.error("Error stopping speech recognition:", err.message);
        _this3.showErrorNotification("Could not stop speech recognition");
      });
    }

    // Rest of the class remains the same...

    // Toggle listening state
  }, {
    key: "toggleListening",
    value: function toggleListening() {
      return this.isListening ? this.stopListening() : this.startListening();
    }

    // User notification methods (can be customized)
  }, {
    key: "showSuccessNotification",
    value: function showSuccessNotification(message) {
      // Implement your preferred notification method
      console.log("\u2705 ".concat(message));
      // Could use browser notifications, custom UI, or voice feedback
    }
  }, {
    key: "showErrorNotification",
    value: function showErrorNotification(message) {
      // Implement your preferred error notification method
      console.error("\u274C ".concat(message));
      // Could use browser notifications, custom UI, or voice feedback
    }

    // Handle microphone permission denial
  }, {
    key: "handleMicrophoneDenied",
    value: function handleMicrophoneDenied(reject) {
      var errorMessage = "\n        Microphone access is required for Speech-to-Text.\n        Please:\n        1. Check your browser settings\n        2. Ensure microphone permissions are granted\n        3. Reload the extension\n      ";
      console.error(errorMessage);
      this.showErrorNotification(errorMessage);

      // Reject the promise to signal initialization failure
      reject(new Error('Microphone access denied'));
    }

    // Getter for listening state
  }, {
    key: "isArtyomListening",
    value: function isArtyomListening() {
      return this.isListening;
    }
  }], [{
    key: "getInstance",
    value:
    // Singleton pattern ensures only one instance exists
    function getInstance() {
      if (!this.instance) {
        this.instance = new ArtyomAssistant();
      }
      return this.instance;
    }
  }]);
}();
(0,_babel_runtime_corejs3_helpers_esm_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(ArtyomAssistant, "instance", null);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("65bed33ebb75edeee6f4")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.1fae1b897803221221e7.hot-update.js.map