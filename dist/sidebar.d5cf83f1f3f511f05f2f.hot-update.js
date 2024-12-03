"use strict";
self["webpackHotUpdatetean_mate"]("sidebar",{

/***/ "./1-sidebar/sidebar.js":
/*!******************************!*\
  !*** ./1-sidebar/sidebar.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
/* harmony import */ var _2_features_STT_ArtyomAssistant_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../2-features/STT/ArtyomAssistant.js */ "./2-features/STT/ArtyomAssistant.js");





// Update the SidebarController
var SidebarController = /*#__PURE__*/function () {
  function SidebarController() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, SidebarController);
    this.buttons = {};
    this.artyomAssistant = new _2_features_STT_ArtyomAssistant_js__WEBPACK_IMPORTED_MODULE_3__["default"](this); // Pass SidebarController instance to ArtyomAssistant
    this.initialize();
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(SidebarController, [{
    key: "initialize",
    value: function initialize() {
      var _context;
      var sidebarTitle = document.getElementById("sidebar-title");
      if (sidebarTitle) {
        sidebarTitle.textContent = chrome.runtime.getManifest().name;
      }
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
      console.log("Speech-to-Text button clicked");
      this.artyomAssistant.toggleListening();
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
  }, {
    key: "triggerButtonAction",
    value: function triggerButtonAction(action) {
      switch (action) {
        case "tts":
          this.handleTTS();
          break;
        case "stt":
          this.handleSTT();
          break;
        case "signLanguage":
          this.handleSignLanguage();
          break;
        case "imageCaption":
          this.handleImageCaption();
          break;
        default:
          console.warn("Unknown action: ".concat(action));
      }
    }
  }]);
}(); // Instantiate SidebarController
var sidebarController = new SidebarController();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (sidebarController);

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("5b1449812b3a36a3b654")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.d5cf83f1f3f511f05f2f.hot-update.js.map