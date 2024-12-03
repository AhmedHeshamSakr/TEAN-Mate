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
  function ArtyomAssistant(sidebarController) {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new _node_modules_artyom_js_build_artyom_js__WEBPACK_IMPORTED_MODULE_3__["default"]();
    this.sidebarController = sidebarController; // Reference to SidebarController
    this.isListening = false;
    this.setupCommands();
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "setupCommands",
    value: function setupCommands() {
      var _this = this;
      this.artyom.addCommands([{
        indexes: ["text to speech", "start reading"],
        action: function action() {
          _this.triggerExtensionAction("tts");
        }
      }, {
        indexes: ["stop", "pause"],
        action: function action() {
          _this.triggerExtensionAction("toggle-reading");
        }
      }, {
        indexes: ["sign language", "show sign language"],
        action: function action() {
          _this.triggerExtensionAction("signLanguage");
        }
      }, {
        indexes: ["image caption", "describe image"],
        action: function action() {
          _this.triggerExtensionAction("imageCaption");
        }
      }, {
        indexes: ["next", "skip next"],
        action: function action() {
          _this.triggerExtensionAction("skip-next");
        }
      }, {
        indexes: ["back ", "skip back"],
        action: function action() {
          _this.triggerExtensionAction("skip-previous");
        }
      }, {
        indexes: ["open link", "open this link"],
        action: function action() {
          _this.triggerExtensionAction("access-link");
        }
      }]);
      this.artyom.redirectRecognizedTextOutput(function (recognized, isFinal) {
        var recognizedTextDiv = document.getElementById("recognizedText");
        recognizedTextDiv.textContent = isFinal ? "You said: ".concat(recognized) : recognized;
      });
    }
  }, {
    key: "startListening",
    value: function startListening() {
      var _this2 = this;
      this.artyom.fatality();
      _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_2__(function () {
        _this2.artyom.initialize({
          lang: "en-US",
          continuous: true,
          listen: true,
          debug: true,
          speed: 1
        }).then(function () {
          console.log("Artyom is listening!");
          _this2.isListening = true;
        })["catch"](function (err) {
          console.error("Artyom initialization error:", err);
        });
      }, 250);
    }
  }, {
    key: "stopListening",
    value: function stopListening() {
      this.artyom.fatality();
      console.log("Artyom has stopped listening.");
      this.isListening = false;
    }
  }, {
    key: "toggleListening",
    value: function toggleListening() {
      if (this.isListening) {
        this.stopListening();
      } else {
        this.startListening();
      }
      return this.isListening;
    }
  }, {
    key: "triggerExtensionAction",
    value: function triggerExtensionAction(action) {
      if (this.sidebarController) {
        this.sidebarController.triggerButtonAction(action);
      } else {
        console.warn("SidebarController is not set.");
      }
    }
  }]);
}();


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("8f1727b33b30781efa9d")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.1670728f0c1ad69ba267.hot-update.js.map