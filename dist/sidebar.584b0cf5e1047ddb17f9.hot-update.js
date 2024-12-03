self["webpackHotUpdatetean_mate"]("sidebar",{

/***/ "./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js":
/*!***************************************************************************!*\
  !*** ./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js ***!
  \***************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(/*! core-js-pure/stable/set-timeout */ "./node_modules/core-js-pure/stable/set-timeout.js");

/***/ }),

/***/ "./node_modules/core-js-pure/internals/environment.js":
/*!************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/environment.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

/* global Bun, Deno -- detection */
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var userAgent = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");
var classof = __webpack_require__(/*! ../internals/classof-raw */ "./node_modules/core-js-pure/internals/classof-raw.js");

var userAgentStartsWith = function (string) {
  return userAgent.slice(0, string.length) === string;
};

module.exports = (function () {
  if (userAgentStartsWith('Bun/')) return 'BUN';
  if (userAgentStartsWith('Cloudflare-Workers')) return 'CLOUDFLARE';
  if (userAgentStartsWith('Deno/')) return 'DENO';
  if (userAgentStartsWith('Node.js/')) return 'NODE';
  if (globalThis.Bun && typeof Bun.version == 'string') return 'BUN';
  if (globalThis.Deno && typeof Deno.version == 'object') return 'DENO';
  if (classof(globalThis.process) === 'process') return 'NODE';
  if (globalThis.window && globalThis.document) return 'BROWSER';
  return 'REST';
})();


/***/ }),

/***/ "./node_modules/core-js-pure/internals/schedulers-fix.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/schedulers-fix.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var apply = __webpack_require__(/*! ../internals/function-apply */ "./node_modules/core-js-pure/internals/function-apply.js");
var isCallable = __webpack_require__(/*! ../internals/is-callable */ "./node_modules/core-js-pure/internals/is-callable.js");
var ENVIRONMENT = __webpack_require__(/*! ../internals/environment */ "./node_modules/core-js-pure/internals/environment.js");
var USER_AGENT = __webpack_require__(/*! ../internals/environment-user-agent */ "./node_modules/core-js-pure/internals/environment-user-agent.js");
var arraySlice = __webpack_require__(/*! ../internals/array-slice */ "./node_modules/core-js-pure/internals/array-slice.js");
var validateArgumentsLength = __webpack_require__(/*! ../internals/validate-arguments-length */ "./node_modules/core-js-pure/internals/validate-arguments-length.js");

var Function = globalThis.Function;
// dirty IE9- and Bun 0.3.0- checks
var WRAP = /MSIE .\./.test(USER_AGENT) || ENVIRONMENT === 'BUN' && (function () {
  var version = globalThis.Bun.version.split('.');
  return version.length < 3 || version[0] === '0' && (version[1] < 3 || version[1] === '3' && version[2] === '0');
})();

// IE9- / Bun 0.3.0- setTimeout / setInterval / setImmediate additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers
// https://github.com/oven-sh/bun/issues/1633
module.exports = function (scheduler, hasTimeArg) {
  var firstParamIndex = hasTimeArg ? 2 : 1;
  return WRAP ? function (handler, timeout /* , ...arguments */) {
    var boundArgs = validateArgumentsLength(arguments.length, 1) > firstParamIndex;
    var fn = isCallable(handler) ? handler : Function(handler);
    var params = boundArgs ? arraySlice(arguments, firstParamIndex) : [];
    var callback = boundArgs ? function () {
      apply(fn, this, params);
    } : fn;
    return hasTimeArg ? scheduler(callback, timeout) : scheduler(callback);
  } : scheduler;
};


/***/ }),

/***/ "./node_modules/core-js-pure/internals/validate-arguments-length.js":
/*!**************************************************************************!*\
  !*** ./node_modules/core-js-pure/internals/validate-arguments-length.js ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";

var $TypeError = TypeError;

module.exports = function (passed, required) {
  if (passed < required) throw new $TypeError('Not enough arguments');
  return passed;
};


/***/ }),

/***/ "./node_modules/core-js-pure/modules/web.set-interval.js":
/*!***************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/web.set-interval.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var schedulersFix = __webpack_require__(/*! ../internals/schedulers-fix */ "./node_modules/core-js-pure/internals/schedulers-fix.js");

var setInterval = schedulersFix(globalThis.setInterval, true);

// Bun / IE9- setInterval additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-setinterval
$({ global: true, bind: true, forced: globalThis.setInterval !== setInterval }, {
  setInterval: setInterval
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/web.set-timeout.js":
/*!**************************************************************!*\
  !*** ./node_modules/core-js-pure/modules/web.set-timeout.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

var $ = __webpack_require__(/*! ../internals/export */ "./node_modules/core-js-pure/internals/export.js");
var globalThis = __webpack_require__(/*! ../internals/global-this */ "./node_modules/core-js-pure/internals/global-this.js");
var schedulersFix = __webpack_require__(/*! ../internals/schedulers-fix */ "./node_modules/core-js-pure/internals/schedulers-fix.js");

var setTimeout = schedulersFix(globalThis.setTimeout, true);

// Bun / IE9- setTimeout additional parameters fix
// https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-settimeout
$({ global: true, bind: true, forced: globalThis.setTimeout !== setTimeout }, {
  setTimeout: setTimeout
});


/***/ }),

/***/ "./node_modules/core-js-pure/modules/web.timers.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/modules/web.timers.js ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// TODO: Remove this module from `core-js@4` since it's split to modules listed below
__webpack_require__(/*! ../modules/web.set-interval */ "./node_modules/core-js-pure/modules/web.set-interval.js");
__webpack_require__(/*! ../modules/web.set-timeout */ "./node_modules/core-js-pure/modules/web.set-timeout.js");


/***/ }),

/***/ "./node_modules/core-js-pure/stable/set-timeout.js":
/*!*********************************************************!*\
  !*** ./node_modules/core-js-pure/stable/set-timeout.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

__webpack_require__(/*! ../modules/web.timers */ "./node_modules/core-js-pure/modules/web.timers.js");
var path = __webpack_require__(/*! ../internals/path */ "./node_modules/core-js-pure/internals/path.js");

module.exports = path.setTimeout;


/***/ }),

/***/ "./1-sidebar/sidebar.js":
/*!******************************!*\
  !*** ./1-sidebar/sidebar.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/set-timeout */ "./node_modules/@babel/runtime-corejs3/core-js-stable/set-timeout.js");
/* harmony import */ var _2_features_STT_ArtyomAssistant_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../2-features/STT/ArtyomAssistant.js */ "./2-features/STT/ArtyomAssistant.js");





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
      console.log("Speech-to-Text button clicked");
      if (!this.voiceAssistant) {
        this.voiceAssistant = new _2_features_STT_ArtyomAssistant_js__WEBPACK_IMPORTED_MODULE_4__["default"]();
      }

      // Pass 'this' to voice assistant for command execution
      var status = this.voiceAssistant.toggleListening(this);
      var message = status ? "Voice commands activated. Try saying 'text to speech' or 'next section'" : "Voice commands deactivated";

      // Use a more user-friendly notification
      this.showNotification(message);
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
    key: "showNotification",
    value: function showNotification(message) {
      var notification = document.createElement('div');
      notification.textContent = message;
      notification.style.position = 'fixed';
      notification.style.bottom = '20px';
      notification.style.right = '20px';
      notification.style.backgroundColor = 'rgba(0,0,0,0.7)';
      notification.style.color = 'white';
      notification.style.padding = '10px';
      notification.style.borderRadius = '5px';
      document.body.appendChild(notification);
      _babel_runtime_corejs3_core_js_stable_set_timeout__WEBPACK_IMPORTED_MODULE_3__(function () {
        document.body.removeChild(notification);
      }, 3000);
    }
  }]);
}();
new SidebarController();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("8d3afa8fec0aa3c15c66")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=sidebar.584b0cf5e1047ddb17f9.hot-update.js.map