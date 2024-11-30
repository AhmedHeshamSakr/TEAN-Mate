"use strict";
self["webpackHotUpdatetean_mate"]("background",{

/***/ "./2-features/STT/ArtyomHandller.js":
/*!******************************************!*\
  !*** ./2-features/STT/ArtyomHandller.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ArtyomAssistant: () => (/* binding */ ArtyomAssistant),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");


var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new Artyom();
    this.isListening = false;
  }

  // Add a voice command
  return (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "addCommand",
    value: function addCommand(command, callback) {
      this.artyom.addCommands({
        indexes: [command],
        action: callback
      });
    }

    // Start Artyom
  }, {
    key: "startListening",
    value: function startListening() {
      var _this = this;
      if (this.isListening) return;
      this.artyom.initialize({
        lang: "en-US",
        continuous: true,
        listen: true,
        debug: true
      }).then(function () {
        console.log("Artyom is now listening...");
        _this.isListening = true;
      })["catch"](function (err) {
        return console.error("Artyom initialization failed:", err);
      });
    }

    // Stop Artyom
  }, {
    key: "stopListening",
    value: function stopListening() {
      this.artyom.fatality();
      this.isListening = false;
      console.log("Artyom stopped listening.");
    }

    // Toggle Artyom listening
  }, {
    key: "toggleListening",
    value: function toggleListening() {
      this.isListening ? this.stopListening() : this.startListening();
    }
  }]);
}();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ArtyomAssistant);

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("ab33b025271519a081ac")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=background.3b17ad1a7db5c6276f91.hot-update.js.map