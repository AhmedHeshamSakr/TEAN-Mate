"use strict";
self["webpackHotUpdatetean_mate"]("background",{

/***/ "./3-background/background.js":
/*!************************************!*\
  !*** ./3-background/background.js ***!
  \************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/asyncToGenerator */ "./node_modules/@babel/runtime-corejs3/helpers/esm/asyncToGenerator.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/regenerator */ "./node_modules/@babel/runtime-corejs3/regenerator/index.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
/* harmony import */ var _2_features_TTS_initializeVoices_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../2-features/TTS/initializeVoices.js */ "./2-features/TTS/initializeVoices.js");






var AccessibilityBackgroundHandler = /*#__PURE__*/function () {
  function AccessibilityBackgroundHandler() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_1__["default"])(this, AccessibilityBackgroundHandler);
    // Define command mappings for keyboard shortcuts and actions
    this.commandMappings = {
      "skip-next": "skipNext",
      "skip-previous": "skipPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink"
    };

    // Initialize background services
    this.initialize();
  }

  // Set up event listeners and initialization processes
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_2__["default"])(AccessibilityBackgroundHandler, [{
    key: "initialize",
    value: function initialize() {
      var _context, _context2, _context3, _context4;
      chrome.runtime.onInstalled.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context = this.handleExtensionInstall).call(_context, this));
      chrome.action.onClicked.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context2 = this.handleActionClick).call(_context2, this));
      chrome.commands.onCommand.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context3 = this.handleCommand).call(_context3, this));
      chrome.runtime.onMessage.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_4__(_context4 = this.handleIncomingMessage).call(_context4, this));

      // Initialize text-to-speech voices
      this.initializeVoices();
    }

    // Asynchronously initialize available TTS voices
  }, {
    key: "initializeVoices",
    value: function () {
      var _initializeVoices2 = (0,_babel_runtime_corejs3_helpers_esm_asyncToGenerator__WEBPACK_IMPORTED_MODULE_0__["default"])(/*#__PURE__*/_babel_runtime_corejs3_regenerator__WEBPACK_IMPORTED_MODULE_3__.mark(function _callee() {
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
              console.log("Accessibility voices successfully initialized:", voices);
              _context5.next = 11;
              break;
            case 8:
              _context5.prev = 8;
              _context5.t0 = _context5["catch"](0);
              console.error("Voice initialization failed:", _context5.t0);
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
    }() // Handle extension first-time installation
  }, {
    key: "handleExtensionInstall",
    value: function handleExtensionInstall() {
      console.log("Accessibility Companion installed");
      // Potential first-time setup logic
    }

    // Handle extension icon click
  }, {
    key: "handleActionClick",
    value: function handleActionClick() {
      console.log("Accessibility Companion activated");
      // Future: Open specific accessibility panel or trigger main functionality
    }

    // Process keyboard commands and shortcuts
  }, {
    key: "handleCommand",
    value: function handleCommand(command) {
      var action = this.commandMappings[command];
      if (action) {
        this.sendMessageToActiveTab({
          action: action
        });
      } else {
        console.warn("Unrecognized accessibility command: ".concat(command));
      }
    }

    // Handle incoming messages from content scripts
  }, {
    key: "handleIncomingMessage",
    value: function handleIncomingMessage(request, sender, sendResponse) {
      if (request.action === "getVoices") {
        chrome.storage.local.get("voices", function (result) {
          sendResponse({
            voices: result.voices
          });
        });
        return true; // Indicate asynchronous response
      }
    }

    // Send message to currently active browser tab
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
          console.warn("No active tab found for accessibility action");
        }
      });
    }
  }]);
}(); // Instantiate the accessibility background handler
new AccessibilityBackgroundHandler();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("2eacb6ef85b184b7071d")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=background.877b3abed96e878bdea3.hot-update.js.map