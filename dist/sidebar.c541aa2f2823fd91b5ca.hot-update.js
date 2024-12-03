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
Object(function webpackMissingModule() { var e = new Error("Cannot find module './ArtyomAssistant.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());




var SidebarController = /*#__PURE__*/function () {
  function SidebarController() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, SidebarController);
    this.buttons = {}; // Store button references for easy access
    this.artyomAssistant = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './ArtyomAssistant.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())(); // Initialize ArtyomAssistant
    this.initialize(); // Set up event listeners and initial state
  }

  // Initialize sidebar
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(SidebarController, [{
    key: "initialize",
    value: function initialize() {
      var _context;
      var sidebarTitle = document.getElementById("sidebar-title");
      if (sidebarTitle) {
        sidebarTitle.textContent = chrome.runtime.getManifest().name;
      } else {
        console.warn("Sidebar title element not found.");
      }
      document.addEventListener("DOMContentLoaded", _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context = this.setupEventListeners).call(_context, this));
    }

    // Set up event listeners for all buttons
  }, {
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _context2,
        _context3,
        _context4,
        _context5,
        _this = this;
      var buttons = document.querySelectorAll(".accessibility-button");
      if (!buttons.length) {
        console.warn("No accessibility buttons found!");
        return;
      }

      // Assign buttons
      this.buttons.tts = buttons[0];
      this.buttons.stt = buttons[1];
      this.buttons.signLanguage = buttons[2];
      this.buttons.imageCaption = buttons[3];

      // Attach button listeners
      this.addButtonListener(this.buttons.tts, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context2 = this.handleTTS).call(_context2, this));
      this.addButtonListener(this.buttons.stt, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context3 = this.handleSTT).call(_context3, this));
      this.addButtonListener(this.buttons.signLanguage, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context4 = this.handleSignLanguage).call(_context4, this));
      this.addButtonListener(this.buttons.imageCaption, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context5 = this.handleImageCaption).call(_context5, this));

      // Add STT toggle listener for Artyom
      if (this.buttons.stt) {
        this.buttons.stt.addEventListener("click", function () {
          var isListening = _this.artyomAssistant.toggleListening();
          console.log("STT listening: ".concat(isListening));
        });
      }
    }

    // Add an event listener to a button, with error handling
  }, {
    key: "addButtonListener",
    value: function addButtonListener(button, handler) {
      if (!button) {
        console.warn("Button not found, skipping event binding.");
        return;
      }
      button.addEventListener("click", handler);
    }

    // Handle Text-to-Speech button click
  }, {
    key: "handleTTS",
    value: function handleTTS() {
      console.log("Text-to-Speech button clicked");
      this.artyomAssistant.triggerExtensionAction("tts");
    }

    // Handle Speech-to-Text button click (Handled via Artyom)
  }, {
    key: "handleSTT",
    value: function handleSTT() {
      console.log("Speech-to-Text button clicked");
      this.artyomAssistant.toggleListening(); // Starts or stops listening
    }

    // Handle Sign Language Translator button click
  }, {
    key: "handleSignLanguage",
    value: function handleSignLanguage() {
      console.log("Sign Language Translator button clicked");
      this.artyomAssistant.triggerExtensionAction("signLanguage");
    }

    // Handle Image Captioning button click
  }, {
    key: "handleImageCaption",
    value: function handleImageCaption() {
      console.log("Image Captioning button clicked");
      this.artyomAssistant.triggerExtensionAction("imageCaption");
    }
  }]);
}(); // Instantiate the SidebarController
new SidebarController();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("0d5ed762dbe250978611")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.c541aa2f2823fd91b5ca.hot-update.js.map