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
    this.buttons = {}; // Store button references for easy access
    this.artyomAssistant = new _2_features_STT_ArtyomAssistant_js__WEBPACK_IMPORTED_MODULE_3__["default"](this); // Initialize ArtyomAssistant with SidebarController instance
    this.initialize(); // Set up event listeners and initial state
  }

  // Initialize sidebar
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(SidebarController, [{
    key: "initialize",
    value: function initialize() {
      var _context;
      // Set sidebar title using the extension's name
      document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;

      // Wait for DOM to load before attaching event listeners
      document.addEventListener("DOMContentLoaded", _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context = this.setupEventListeners).call(_context, this));
    }

    // Set up event listeners for all buttons
  }, {
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _context2, _context3, _context4, _context5;
      var buttons = document.querySelectorAll(".accessibility-button");
      if (!buttons.length) {
        console.warn("No accessibility buttons found!");
        return;
      }

      // Assign buttons dynamically and bind their handlers
      this.buttons.tts = buttons[0];
      this.buttons.stt = buttons[1];
      this.buttons.signLanguage = buttons[2];
      this.buttons.imageCaption = buttons[3];
      this.addButtonListener(this.buttons.tts, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context2 = this.handleTTS).call(_context2, this));
      this.addButtonListener(this.buttons.stt, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context3 = this.handleSTT).call(_context3, this));
      this.addButtonListener(this.buttons.signLanguage, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context4 = this.handleSignLanguage).call(_context4, this));
      this.addButtonListener(this.buttons.imageCaption, _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__(_context5 = this.handleImageCaption).call(_context5, this));
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
      this.sendMessageToActiveTab({
        action: "extractText"
      });
    }

    // Handle Speech-to-Text button click
  }, {
    key: "handleSTT",
    value: function handleSTT() {
      var _this = this;
      console.log("Speech-to-Text initialized with push-to-talk");

      // Add keyboard listeners for push-to-talk
      window.addEventListener("keydown", function (event) {
        if (event.code === "Space" && !_this.artyomAssistant.isListening) {
          console.log("Push-to-Talk: Listening activated");
          _this.artyomAssistant.startListening(); // Start STT
          _this.buttons.stt.textContent = "Listening..."; // Change button text
        }
      });
      window.addEventListener("keyup", function (event) {
        if (event.code === "Space" && _this.artyomAssistant.isListening) {
          console.log("Push-to-Talk: Listening stopped");
          _this.artyomAssistant.stopListening(); // Stop STT
          _this.buttons.stt.textContent = "Speech to Text (STT)"; // Reset button text
        }
      });
    }

    // Handle Sign Language Translator button click
  }, {
    key: "handleSignLanguage",
    value: function handleSignLanguage() {
      console.log("Sign Language Translator button clicked");
      alert("Sign Language Translator activated"); // Placeholder for sign language functionality
    }

    // Handle Image Captioning button click
  }, {
    key: "handleImageCaption",
    value: function handleImageCaption() {
      console.log("Image Captioning button clicked");
      alert("Image Captioning activated"); // Placeholder for image captioning functionality
    }

    // Send a message to the active tab
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
    key: "handleSkipNext",
    value: function handleSkipNext() {
      console.log("Skipping to next item...");
      this.sendMessageToActiveTab({
        action: "skipNext"
      });
    }
  }, {
    key: "handleSkipPrevious",
    value: function handleSkipPrevious() {
      console.log("Skipping to previous item...");
      this.sendMessageToActiveTab({
        action: "skipPrevious"
      });
    }
  }, {
    key: "handleAccessLink",
    value: function handleAccessLink() {
      console.log("Accessing link...");
      this.sendMessageToActiveTab({
        action: "accessLink"
      });
    }
  }, {
    key: "handleStopReading",
    value: function handleStopReading() {
      console.log("Reading Stoped...");
      this.sendMessageToActiveTab({
        action: "toggleReading"
      });
    }
  }, {
    key: "handleSearch",
    value: function handleSearch(query) {
      console.log("Searching for: ".concat(query));
      // Send a message to the active tab to perform the search
      this.sendMessageToActiveTab({
        action: "performSearch",
        query: query
      });
    }

    // Trigger button action programmatically
  }, {
    key: "triggerButtonAction",
    value: function triggerButtonAction(action) {
      var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      switch (action) {
        case "search":
          if (query) {
            this.handleSearch(query);
          } else {
            console.warn("Search query is missing");
          }
          break;
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
        case "skip-next":
          this.handleSkipNext();
          break;
        case "skip-previous":
          this.handleSkipPrevious();
          break;
        case "access-link":
          this.handleAccessLink();
          break;
        case "toggle-reading":
          this.handleStopReading();
          break;
        default:
          console.warn("Unknown action: ".concat(action));
      }
    }
  }]);
}(); // Instantiate the SidebarController
var sidebarController = new SidebarController();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (sidebarController);

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("95c18a204a86d57a08df")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.b89539856e2e55f94364.hot-update.js.map