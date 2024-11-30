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
/******/ 	__webpack_require__.h = () => ("b9838c9f879a5aa93842")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=content.65bed33ebb75edeee6f4.hot-update.js.map