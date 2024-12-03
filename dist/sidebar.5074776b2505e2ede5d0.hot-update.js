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
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/set-timeout */ "./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js");
/* harmony import */ var _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../../../node_modules/artyom.js/build/artyom.js */ "./node_modules/artyom.js/build/artyom.js");




var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_3__["default"]();
    this.isListening = false;

    // Set up voice commands
    this.setupCommands();

    // Set up UI interactions
    this.setupUI();
  }

  // Define your voice commands
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "setupCommands",
    value: function setupCommands() {
      var _this = this;
      this.artyom.addCommands([{
        indexes: ["text to speech", "start reading"],
        action: function action() {
          _this.sendCommand("tts");
          _this.displayAction("Text-to-Speech activated!");
        }
      }, {
        indexes: ["stop reading", "pause"],
        action: function action() {
          _this.sendCommand("tts");
          _this.displayAction("Text-to-Speech stopped!");
        }
      }, {
        indexes: ["next section", "go next"],
        action: function action() {
          _this.sendCommand("skipToNext");
          _this.displayAction("Skipped to next section!");
        }
      }, {
        indexes: ["previous section", "go back"],
        action: function action() {
          _this.sendCommand("skipToPrevious");
          _this.displayAction("Went back to previous section!");
        }
      }, {
        indexes: ["open link", "access link"],
        action: function action() {
          _this.sendCommand("accessLink");
          _this.displayAction("Accessing current link!");
        }
      }, {
        indexes: ["sign language", "show sign language"],
        action: function action() {
          _this.sendCommand("signLanguage");
          _this.displayAction("Sign language activated!");
        }
      }, {
        indexes: ["image caption", "describe image"],
        action: function action() {
          _this.sendCommand("imageCaption");
          _this.displayAction("Image captioning activated!");
        }
      }]);

      // Redirect recognized text to a UI element
      this.artyom.redirectRecognizedTextOutput(function (recognized, isFinal) {
        var recognizedTextDiv = document.getElementById("recognizedText");
        if (isFinal) {
          recognizedTextDiv.textContent = "text: " + recognized;
        } else {
          recognizedTextDiv.textContent = recognized;
        }
      });
    }

    // Display action messages in a designated UI element
  }, {
    key: "displayAction",
    value: function displayAction(message) {
      var recognizedTextDiv = document.getElementById("recognizedText");
      recognizedTextDiv.textContent = message;
    }

    // Set up the UI interactions for starting/stopping listening
  }, {
    key: "setupUI",
    value: function setupUI() {
      var _this2 = this;
      var startButton = document.getElementById("start");
      startButton.addEventListener("click", function () {
        return _this2.toggleListening();
      });
    }

    // Start voice recognition
  }, {
    key: "startListening",
    value: function startListening() {
      var _this3 = this;
      this.artyom.fatality(); // Stop any previous instance
      _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_2__(function () {
        _this3.artyom.initialize({
          lang: "en-US",
          continuous: true,
          listen: true,
          debug: true,
          speed: 1
        }).then(function () {
          console.log("Artyom is ready to listen!");
          _this3.isListening = true;
          document.getElementById("stt").textContent = "Stop Listening";
        })["catch"](function (err) {
          console.error("Initialization error:", err);
          alert("Artyom initialization failed. Please check your microphone settings.");
        });
      }, 250);
    }

    // Stop voice recognition
  }, {
    key: "stopListening",
    value: function stopListening() {
      this.artyom.fatality();
      console.log("Artyom has stopped listening.");
      this.isListening = false;
      document.getElementById("stt").textContent = "Start Listening";
    }

    // Toggle between starting and stopping the assistant
  }, {
    key: "toggleListening",
    value: function toggleListening() {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
    }

    // Handle custom commands sent to the assistant
  }, {
    key: "sendCommand",
    value: function sendCommand(buttonType) {
      // Placeholder for your custom logic, replace with your actual handlers
      switch (buttonType) {
        case "tts":
          console.log("Toggle Text-to-Speech");
          break;
        case "skipToNext":
          console.log("Skip to Next Section");
          break;
        case "skipToPrevious":
          console.log("Skip to Previous Section");
          break;
        case "accessLink":
          console.log("Access Link");
          break;
        case "signLanguage":
          console.log("Activate Sign Language");
          break;
        case "imageCaption":
          console.log("Activate Image Caption");
          break;
      }
    }
  }]);
}();


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("972f12ae2c8da152f65e")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.5074776b2505e2ede5d0.hot-update.js.map