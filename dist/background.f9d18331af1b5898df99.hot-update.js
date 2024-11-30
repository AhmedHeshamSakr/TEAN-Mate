"use strict";
self["webpackHotUpdatetean_mate"]("background",{

/***/ "./3-background/background.js":
/*!************************************!*\
  !*** ./3-background/background.js ***!
  \************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/asyncToGenerator */ "./node_modules/@babel/runtime-corejs3/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/regenerator */ "./node_modules/@babel/runtime-corejs3/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
/* harmony import */ var _2_features_TTS_initializeVoices_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../2-features/TTS/initializeVoices.js */ "./2-features/TTS/initializeVoices.js");
/* harmony import */ var _2_features_STT_ArtyomHandller_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../2-features/STT/ArtyomHandller.js */ "./2-features/STT/ArtyomHandller.js");







var BackgroundHandler = /*#__PURE__*/function () {
  function BackgroundHandler() {
    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, BackgroundHandler);
    this.commands = {
      "skip-next": "skipToNext",
      "skip-previous": "skipToPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink",
      "start-stt": "startSpeechRecognition",
      // New command
      "stop-stt": "stopSpeechRecognition" // New command
    };
    this.initialize();
    this.artyomAssistant = new _2_features_STT_ArtyomHandller_js__WEBPACK_IMPORTED_MODULE_6__["default"](); // Initialize ArtyomAssistant
  }
  return (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(BackgroundHandler, [{
    key: "initialize",
    value: function initialize() {
      var _context, _context2, _context3, _context4;
      chrome.runtime.onInstalled.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context = this.onInstalled).call(_context, this));
      chrome.action.onClicked.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context2 = this.onActionClicked).call(_context2, this));
      chrome.commands.onCommand.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context3 = this.onCommand).call(_context3, this));
      chrome.runtime.onMessage.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context4 = this.onMessage).call(_context4, this));

      // Initialize the TTS voices
      this.initializeVoices();
    }
  }, {
    key: "initializeVoiceCommands",
    value: function initializeVoiceCommands() {
      var _this = this;
      this.artyomAssistant.addCommand("toggle listening", function () {
        return _this.artyomAssistant.toggleListening();
      });
      this.artyomAssistant.startListening();
    }
  }, {
    key: "initializeVoices",
    value: function () {
      var _initializeVoices2 = (0,_babel_runtime_corejs3_helpers_asyncToGenerator__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_3__.mark(function _callee() {
        var voices;
        return _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_3__.wrap(function _callee$(_context5) {
          while (1) switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return (0,_2_features_TTS_initializeVoices_js__WEBPACK_IMPORTED_MODULE_5__.initializeVoices)();
            case 3:
              voices = _context5.sent;
              chrome.storage.local.set({
                voices: voices
              });
              console.log("Voices initialized:", voices);
              _context5.next = 11;
              break;
            case 8:
              _context5.prev = 8;
              _context5.t0 = _context5["catch"](0);
              console.error("Failed to initialize voices:", _context5.t0);
            case 11:
            case "end":
              return _context5.stop();
          }
        }, _callee, null, [[0, 8]]);
      }));
      function initializeVoices() {
        return _initializeVoices2.apply(this, arguments);
      }
      return initializeVoices;
    }()
  }, {
    key: "onInstalled",
    value: function onInstalled() {
      // Placeholder for installation logic, if needed in the future
      console.log("Extension installed");
    }
  }, {
    key: "onActionClicked",
    value: function onActionClicked() {
      // Placeholder for action click logic, if needed in the future
      console.log("Action icon clicked");
    }
  }, {
    key: "onCommand",
    value: function onCommand(command) {
      var action = this.commands[command];
      if (action) {
        this.sendMessageToActiveTab({
          action: action
        });
      } else {
        console.warn("Unknown command: ".concat(command));
      }
    }
  }, {
    key: "onMessage",
    value: function onMessage(request, sender, sendResponse) {
      if (request.action === "getVoices") {
        chrome.storage.local.get("voices", function (result) {
          sendResponse({
            voices: result.voices
          });
        });
        return true;
      }
    }
  }, {
    key: "sendMessageToActiveTab",
    value: function sendMessageToActiveTab(message) {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, message);
        } else {
          console.warn("No active tab found");
        }
      });
    }
  }]);
}(); // Instantiate the BackgroundHandler
new BackgroundHandler();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("dec659fc14339b0473d9")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=background.f9d18331af1b5898df99.hot-update.js.map