"use strict";
self["webpackHotUpdatetean_mate"]("sidebar",{

/***/ "./1-sidebar/sidebar.js":
/*!******************************!*\
  !*** ./1-sidebar/sidebar.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
Object(function webpackMissingModule() { var e = new Error("Cannot find module '../2-features'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());



 // Adjust the path if necessary
var SidebarController = /*#__PURE__*/function () {
  function SidebarController() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, SidebarController);
    this.voiceAssistant = null; // Declare but do not initialize the assistant
    this.buttons = {}; // Store button references
    this.initialize();
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(SidebarController, [{
    key: "initialize",
    value: function initialize() {
      var _context;
      document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;
      document.addEventListener("DOMContentLoaded", _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context = this.setupEventListeners).call(_context, this));
    }
  }, {
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _context2, _context3, _context4, _context5;
      var buttons = document.querySelectorAll(".accessibility-button");
      if (!buttons.length) {
        console.warn("No accessibility buttons found!");
        return;
      }
      this.buttons.tts = buttons[0];
      this.buttons.stt = buttons[1];
      this.buttons.signLanguage = buttons[2];
      this.buttons.imageCaption = buttons[3];
      this.addButtonListener(this.buttons.tts, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context2 = this.handleTTS).call(_context2, this));
      this.addButtonListener(this.buttons.stt, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context3 = this.handleSTT).call(_context3, this));
      this.addButtonListener(this.buttons.signLanguage, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context4 = this.handleSignLanguage).call(_context4, this));
      this.addButtonListener(this.buttons.imageCaption, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context5 = this.handleImageCaption).call(_context5, this));
    }
  }, {
    key: "addButtonListener",
    value: function addButtonListener(button, handler) {
      if (!button) {
        console.warn("Button not found, skipping event binding.");
        return;
      }
      button.addEventListener("click", handler);
    }
  }, {
    key: "handleTTS",
    value: function handleTTS() {
      console.log("Text-to-Speech button clicked");
      this.sendMessageToActiveTab({
        action: "extractText"
      });
    }
  }, {
    key: "handleSTT",
    value: function handleSTT() {
      var _this = this;
      console.log("Speech-to-Text button clicked");
      if (!this.voiceAssistant) {
        // Initialize ArtyomAssistant when STT is clicked for the first time
        this.voiceAssistant = new Object(function webpackMissingModule() { var e = new Error("Cannot find module '../2-features'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();

        // Add voice commands
        this.voiceAssistant.addCommand("start reading", function () {
          return _this.handleTTS();
        });
        this.voiceAssistant.addCommand("stop reading", function () {
          console.log("Stop reading command detected");
          // Implement stopping functionality if needed
        });

        // Start listening
        this.voiceAssistant.startListening();
        alert("Speech-to-Text activated: Listening for commands.");
      } else {
        // If already initialized, toggle listening state
        this.voiceAssistant.startListening();
        alert("Speech-to-Text re-activated: Listening for commands.");
      }
    }
  }, {
    key: "handleSignLanguage",
    value: function handleSignLanguage() {
      console.log("Sign Language Translator button clicked");
      alert("Sign Language Translator activated");
    }
  }, {
    key: "handleImageCaption",
    value: function handleImageCaption() {
      console.log("Image Captioning button clicked");
      alert("Image Captioning activated");
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
}();
new SidebarController();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("a264f118eea686943a8d")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.8f102129683df272b9fa.hot-update.js.map