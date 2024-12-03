"use strict";
self["webpackHotUpdatetean_mate"]("sidebar",{

/***/ "./2-features/STT/ArtyomAssistant.js":
/*!*******************************************!*\
  !*** ./2-features/STT/ArtyomAssistant.js ***!
  \*******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ArtyomAssistant)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../node_modules/artyom.js/build/artyom.js */ "./node_modules/artyom.js/build/artyom.js");



var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_2__["default"]();
    this.isListening = false;
    this.sidebarController = null; // Reference to sidebar controller

    // Comprehensive voice commands
    this.setupCommands();
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "setupCommands",
    value: function setupCommands() {
      var _this = this;
      this.artyom.addCommands([{
        indexes: ["text to speech", "start reading"],
        action: function action() {
          console.log("Activating Text-to-Speech");
          _this.sendCommand('tts');
        }
      }, {
        indexes: ["stop reading", "pause"],
        action: function action() {
          console.log("Stopping Text-to-Speech");
          _this.sendCommand('tts'); // Assuming toggle functionality
        }
      }, {
        indexes: ["next section", "go next"],
        action: function action() {
          console.log("Moving to Next Section");
          _this.sendCommand('skipToNext');
        }
      }, {
        indexes: ["previous section", "go back"],
        action: function action() {
          console.log("Moving to Previous Section");
          _this.sendCommand('skipToPrevious');
        }
      }, {
        indexes: ["open link", "access link"],
        action: function action() {
          console.log("Accessing Current Link");
          _this.sendCommand('accessLink');
        }
      }, {
        indexes: ["sign language", "show sign language"],
        action: function action() {
          console.log("Activating Sign Language");
          _this.sendCommand('signLanguage');
        }
      }, {
        indexes: ["image caption", "describe image"],
        action: function action() {
          console.log("Activating Image Caption");
          _this.sendCommand('imageCaption');
        }
      }]);
    }

    // Method to send commands to active tab
  }, {
    key: "sendCommand",
    value: function sendCommand(buttonType) {
      if (this.sidebarController) {
        switch (buttonType) {
          case 'tts':
            this.sidebarController.handleTTS();
            break;
          case 'skipToNext':
            this.sidebarController.sendMessageToActiveTab({
              action: "skipToNext"
            });
            break;
          case 'skipToPrevious':
            this.sidebarController.sendMessageToActiveTab({
              action: "skipToPrevious"
            });
            break;
          case 'accessLink':
            this.sidebarController.sendMessageToActiveTab({
              action: "accessLink"
            });
            break;
          case 'signLanguage':
            this.sidebarController.handleSignLanguage();
            break;
          case 'imageCaption':
            this.sidebarController.handleImageCaption();
            break;
        }
      }
    }

    // Enhanced toggle listening method
  }, {
    key: "toggleListening",
    value: function toggleListening(sidebarController) {
      var _this2 = this;
      this.sidebarController = sidebarController;
      if (!this.isListening) {
        this.artyom.fatality(); // Reset previous instance
        this.artyom.initialize({
          lang: "en-US",
          // Adjust language as needed
          continuous: true,
          listen: true,
          debug: true,
          // Set to false in production
          speed: 0.8
        }).then(function () {
          console.log("Voice recognition started");
          _this2.isListening = true;

          // Optional: Provide audio feedback
          _this2.artyom.say("Voice commands activated");
        });
      } else {
        this.artyom.fatality();
        this.isListening = false;
        console.log("Voice recognition stopped");
      }
      return this.isListening;
    }
  }]);
}();


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("584b0cf5e1047ddb17f9")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.e710b0e35ad1fb84a9fe.hot-update.js.map