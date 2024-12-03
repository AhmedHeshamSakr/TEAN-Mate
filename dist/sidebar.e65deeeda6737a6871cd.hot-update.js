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
Object(function webpackMissingModule() { var e = new Error("Cannot find module './node_modules/artyom.js/build/artyom.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }());




var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new Object(function webpackMissingModule() { var e = new Error("Cannot find module './node_modules/artyom.js/build/artyom.js'"); e.code = 'MODULE_NOT_FOUND'; throw e; }())();
    this.isListening = false;
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "startListening",
    value: function startListening() {
      var _this = this;
      this.artyom.fatality(); // Reset Artyom
      _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_2__(function () {
        _this.artyom.initialize({
          lang: "en_US",
          continuous: true,
          listen: true,
          debug: true,
          speed: 1
        }).then(function () {
          console.log("Artyom is ready to listen!");
          _this.isListening = true;
        })["catch"](function (err) {
          console.error("Initialization error:", err);
          alert("Artyom initialization failed. Please check your settings.");
        });

        // Redirect recognized text output to sidebar
        _this.artyom.redirectRecognizedTextOutput(function (recognized, isFinal) {
          var recognizedTextDiv = document.getElementById("recognizedText");
          recognizedTextDiv.textContent = isFinal ? "Final recognized text: " + recognized : recognized;
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
    }
  }]);
}();


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("d6153dc8ee1466616586")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.e65deeeda6737a6871cd.hot-update.js.map