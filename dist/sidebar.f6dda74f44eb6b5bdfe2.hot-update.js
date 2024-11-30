"use strict";
self["webpackHotUpdatetean_mate"]("sidebar",{

/***/ "./2-features/STT/ArtyomHandller.js":
/*!******************************************!*\
  !*** ./2-features/STT/ArtyomHandller.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ ArtyomAssistant)
/* harmony export */ });
/* harmony import */ var _babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/array/is-array */ "./node_modules/@babel/runtime-corejs3/core-js-stable/array/is-array.js");
/* harmony import */ var artyom_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! artyom.js */ "./node_modules/artyom.js/build/artyom.js");



// import Artyom from "../../node_modules/artyom.js/build/artyom.js";

var ArtyomAssistant = /*#__PURE__*/function () {
  function ArtyomAssistant() {
    (0,_babel_runtime_corejs3_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ArtyomAssistant);
    this.artyom = new artyom_js__WEBPACK_IMPORTED_MODULE_3__();
    this.isListening = false;

    // Example default command
    this.artyom.addCommands({
      indexes: ["hello"],
      action: function action() {
        console.log("Hello command triggered!");
      }
    });
    console.log("ArtyomAssistant initialized with default commands.");
  }

  // Add a single or multiple voice commands
  return (0,_babel_runtime_corejs3_helpers_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ArtyomAssistant, [{
    key: "addCommand",
    value: function addCommand(command, callback) {
      try {
        if (!command || !callback) {
          throw new Error("Both command and callback must be provided.");
        }
        var commands = _babel_runtime_corejs3_core_js_stable_array_is_array__WEBPACK_IMPORTED_MODULE_2__(command) ? command : [command];
        this.artyom.addCommands({
          indexes: commands,
          action: callback
        });
        console.log("Added command(s): ".concat(commands.join(", ")));
      } catch (err) {
        console.error("Error adding command(s):", err.message);
      }
    }

    // Start listening
  }, {
    key: "startListening",
    value: function startListening() {
      var _this = this;
      if (this.isListening) {
        console.warn("Artyom is already listening. Restarting...");
        this.stopListening();
      }
      this.artyom.initialize({
        lang: "en-US",
        continuous: true,
        listen: true,
        debug: true
      }).then(function () {
        console.log("Artyom is now listening...");
        _this.isListening = true;
      })["catch"](function (err) {
        console.error("Artyom initialization failed:", err.message);
      });
    }

    // Stop listening
  }, {
    key: "stopListening",
    value: function stopListening() {
      var _this2 = this;
      if (!this.isListening) {
        console.warn("Artyom is not currently listening.");
        return;
      }
      this.artyom.fatality().then(function () {
        _this2.isListening = false;
        console.log("Artyom successfully stopped.");
      })["catch"](function (err) {
        console.error("Error stopping Artyom:", err.message);
      });
    }

    // Toggle listening state
  }, {
    key: "toggleListening",
    value: function toggleListening() {
      if (this.isListening) {
        console.log("Toggling: Stopping Artyom...");
        this.stopListening();
      } else {
        console.log("Toggling: Starting Artyom...");
        this.startListening();
      }
    }

    // Check if Artyom is listening
  }, {
    key: "isArtyomListening",
    value: function isArtyomListening() {
      return this.isListening;
    }
  }]);
}();


/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("2f56255f5e3ec9c5e511")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.f6dda74f44eb6b5bdfe2.hot-update.js.map