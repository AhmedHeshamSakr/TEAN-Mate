"use strict";
self["webpackHotUpdatetean_mate"]("content",{

/***/ "./2-features/STT/ArtyomHandller.js":
/*!******************************************!*\
  !*** ./2-features/STT/ArtyomHandller.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ArtyomAssistant)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/defineProperty */ "./node_modules/@babel/runtime-corejs3/helpers/esm/defineProperty.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/array/is-array */ "./node_modules/@babel/runtime-corejs3/core-js-stable/array/is-array.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/promise */ "./node_modules/@babel/runtime-corejs3/core-js-stable/promise.js");
Object(function webpackMissingModule() { var e = new Error("Cannot find module ''"); e.code = 'MODULE_NOT_FOUND'; throw e; }());






var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    // Prevent multiple instantiations
    if (ArtyomAssistant.instance) {
      return ArtyomAssistant.instance;
    }

    // Initialize core speech recognition
    this.artyom = new Object(function webpackMissingModule() { var e = new Error("Cannot find module ''"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();
    this.isListening = false;

    // Set up a default help command
    this.setupDefaultCommands();

    // Store the instance
    ArtyomAssistant.instance = this;
  }

  // Configure default voice commands
  return (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "setupDefaultCommands",
    value: function setupDefaultCommands() {
      var _this = this;
      // Add a helpful default command
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

    // Robust method for adding voice commands
  }, {
    key: "addCommand",
    value: function addCommand(command, callback) {
      var _this2 = this;
      try {
        // Ensure valid input
        if (!command || !callback) {
          throw new Error("Both command and callback must be provided.");
        }

        // Support single or multiple commands
        var commands = _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_3__(command) ? command : [command];
        this.artyom.addCommands({
          indexes: commands,
          action: function action() {
            try {
              // Wrap callback to add error handling
              callback.apply(void 0, arguments);
            } catch (callbackError) {
              console.error("Error in command callback:", callbackError);
              // Optional: Provide voice feedback about the error
              _this2.artyom.say("Sorry, there was an error processing your command.");
            }
          }
        });
        console.log("Added command(s): ".concat(commands.join(", ")));
      } catch (err) {
        console.error("Error adding command(s):", err.message);
        // Provide user feedback about command addition failure
        this.showErrorNotification("Could not add voice command");
      }
    }

    // Comprehensive microphone permission and speech recognition setup
  }, {
    key: "startListening",
    value: function startListening() {
      var _this3 = this;
      // Check if already listening to prevent duplicate initialization
      if (this.isListening) {
        console.warn("Speech recognition is already active.");
        return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_4__.resolve();
      }

      // Return a promise to handle async permission and initialization
      return new _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_4__(function (resolve, reject) {
        // First, check microphone permissions
        navigator.permissions.query({
          name: 'microphone'
        }).then(function (permissionStatus) {
          switch (permissionStatus.state) {
            case 'granted':
              _this3.initializeSpeechRecognition(resolve, reject);
              break;
            case 'prompt':
              _this3.requestMicrophonePermission(resolve, reject);
              break;
            case 'denied':
              _this3.handleMicrophoneDenied(reject);
              break;
          }
        })["catch"](function (error) {
          console.error('Permission check failed:', error);
          _this3.handleMicrophoneDenied(reject);
        });
      });
    }

    // Request microphone access explicitly
  }, {
    key: "requestMicrophonePermission",
    value: function requestMicrophonePermission(resolve, reject) {
      var _this4 = this;
      navigator.mediaDevices.getUserMedia({
        audio: true
      }).then(function () {
        return _this4.initializeSpeechRecognition(resolve, reject);
      })["catch"](function (error) {
        console.error('Microphone permission denied:', error);
        _this4.handleMicrophoneDenied(reject);
      });
    }

    // Initialize Artyom speech recognition
  }, {
    key: "initializeSpeechRecognition",
    value: function initializeSpeechRecognition(resolve, reject) {
      var _this5 = this;
      this.artyom.initialize({
        lang: "en-US",
        continuous: true,
        listen: true,
        debug: true,
        recognitionFallback: true,
        executionKeyword: null
      }).then(function () {
        _this5.isListening = true;
        console.log("Speech recognition initialized successfully");
        _this5.showSuccessNotification("Speech recognition activated");
        resolve();
      })["catch"](function (error) {
        console.error('Speech recognition initialization failed:', error);
        _this5.showErrorNotification("Could not start speech recognition");
        reject(error);
      });
    }

    // Comprehensive stop listening method
  }, {
    key: "stopListening",
    value: function stopListening() {
      var _this6 = this;
      // Check if already stopped
      if (!this.isListening) {
        console.warn("Speech recognition is not currently active.");
        return _babel_runtime_corejs3_core_js_stable_promise__WEBPACK_IMPORTED_MODULE_4__.resolve();
      }
      return this.artyom.fatality().then(function () {
        _this6.isListening = false;
        console.log("Speech recognition stopped successfully");
        _this6.showSuccessNotification("Speech recognition deactivated");
      })["catch"](function (err) {
        console.error("Error stopping speech recognition:", err.message);
        _this6.showErrorNotification("Could not stop speech recognition");
      });
    }

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
(0,_babel_runtime_corejs3_helpers_defineProperty__WEBPACK_IMPORTED_MODULE_2__["default"])(ArtyomAssistant, "instance", null);


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("7641d1dafcd0d4396a0f")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=content.b9a2757bceee80bf9dc2.hot-update.js.map