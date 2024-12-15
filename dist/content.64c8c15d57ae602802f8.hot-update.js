"use strict";
self["webpackHotUpdatetean_mate"]("content",{

/***/ "./4-content/content.js":
/*!******************************!*\
  !*** ./4-content/content.js ***!
  \******************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/classCallCheck */ "./node_modules/@babel/runtime-corejs3/helpers/esm/classCallCheck.js");
/* harmony import */ var _babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @babel/runtime-corejs3/helpers/esm/createClass */ "./node_modules/@babel/runtime-corejs3/helpers/esm/createClass.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/array/from */ "./node_modules/@babel/runtime-corejs3/core-js-stable/array/from.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/bind */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/bind.js");
/* harmony import */ var _babel_runtime_corejs3_core_js_stable_instance_trim__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @babel/runtime-corejs3/core-js-stable/instance/trim */ "./node_modules/@babel/runtime-corejs3/core-js-stable/instance/trim.js");
/* harmony import */ var _2_features_TTS_HighlightBox_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../2-features/TTS/HighlightBox.js */ "./2-features/TTS/HighlightBox.js");
/* harmony import */ var _2_features_TTS_TextExtractor_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../2-features/TTS/TextExtractor.js */ "./2-features/TTS/TextExtractor.js");
/* harmony import */ var _2_features_TTS_SpeechHandler_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../2-features/TTS/SpeechHandler.js */ "./2-features/TTS/SpeechHandler.js");
/* harmony import */ var _2_features_TTS_LinkHandler_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../2-features/TTS/LinkHandler.js */ "./2-features/TTS/LinkHandler.js");









var AccessibilityContentHandler = /*#__PURE__*/function () {
  function AccessibilityContentHandler() {
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, AccessibilityContentHandler);
    // Core state management for content navigation and speech
    this.state = {
      currentIndex: 0,
      currentElement: null
    };

    // Initialize utility classes for different accessibility features
    this.utilities = {
      highlightBox: new _2_features_TTS_HighlightBox_js__WEBPACK_IMPORTED_MODULE_5__["default"](),
      textExtractor: new _2_features_TTS_TextExtractor_js__WEBPACK_IMPORTED_MODULE_6__["default"](),
      speechHandler: new _2_features_TTS_SpeechHandler_js__WEBPACK_IMPORTED_MODULE_7__["default"](),
      linkHandler: new _2_features_TTS_LinkHandler_js__WEBPACK_IMPORTED_MODULE_8__["default"]()
    };

    // Collect all potential readable elements
    this.elements = _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_2__(document.body.querySelectorAll('*'));

    // Set up message listener for cross-component communication
    this.setupMessageListener();
  }

  // Configure message listening for accessibility actions
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(AccessibilityContentHandler, [{
    key: "setupMessageListener",
    value: function setupMessageListener() {
      var _context;
      chrome.runtime.onMessage.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_3__(_context = this.handleAccessibilityAction).call(_context, this));
    }

    // Find the next readable element
  }, {
    key: "getNextReadableElement",
    value: function getNextReadableElement(startIndex) {
      for (var i = startIndex; i < this.elements.length; i++) {
        var element = this.elements[i];
        if (this.isElementVisible(element)) {
          var text = this.utilities.textExtractor.extractText(element);
          if (_babel_runtime_corejs3_core_js_stable_instance_trim__WEBPACK_IMPORTED_MODULE_4__(text).call(text)) {
            this.state.currentIndex = i;
            return {
              element: element,
              text: text
            };
          }
        }
      }
      return null;
    }

    // Find the previous readable element
  }, {
    key: "getPreviousReadableElement",
    value: function getPreviousReadableElement(startIndex) {
      for (var i = startIndex - 1; i >= 0; i--) {
        var element = this.elements[i];
        if (this.isElementVisible(element)) {
          var text = this.utilities.textExtractor.extractText(element);
          if (_babel_runtime_corejs3_core_js_stable_instance_trim__WEBPACK_IMPORTED_MODULE_4__(text).call(text)) {
            this.state.currentIndex = i;
            return {
              element: element,
              text: text
            };
          }
        }
      }
      return null;
    }

    // Speak the current section with visual highlighting
  }, {
    key: "speakCurrentSection",
    value: function speakCurrentSection() {
      var _this = this;
      if (!this.state.currentElement) {
        this.state.currentElement = this.getNextReadableElement(this.state.currentIndex);
      }
      if (!this.state.currentElement) {
        console.log("No more content to read");
        return;
      }
      var _this$state$currentEl = this.state.currentElement,
        element = _this$state$currentEl.element,
        text = _this$state$currentEl.text;
      this.utilities.highlightBox.addHighlight(element);
      this.utilities.speechHandler.speak(text, function () {
        _this.utilities.highlightBox.removeHighlight(element);
        _this.state.currentIndex++;
        _this.state.currentElement = null;
        _this.speakCurrentSection();
      });
    }

    // Handle various accessibility actions
  }, {
    key: "handleAccessibilityAction",
    value: function handleAccessibilityAction(request) {
      var _this2 = this;
      var actionMap = {
        "extractText": function extractText() {
          _this2.state.currentIndex = 0;
          _this2.state.currentElement = null;
          _this2.speakCurrentSection();
        },
        "skipNext": function skipNext() {
          var _this2$state$currentE;
          _this2.utilities.speechHandler.stop();
          _this2.utilities.highlightBox.removeHighlight((_this2$state$currentE = _this2.state.currentElement) === null || _this2$state$currentE === void 0 ? void 0 : _this2$state$currentE.element);
          _this2.state.currentIndex++;
          _this2.state.currentElement = null;
          _this2.speakCurrentSection();
        },
        "skipPrevious": function skipPrevious() {
          var _this2$state$currentE2;
          _this2.utilities.speechHandler.stop();
          _this2.utilities.highlightBox.removeHighlight((_this2$state$currentE2 = _this2.state.currentElement) === null || _this2$state$currentE2 === void 0 ? void 0 : _this2$state$currentE2.element);
          _this2.utilities.textExtractor.clearProcessedElements();
          _this2.state.currentElement = _this2.getPreviousReadableElement(_this2.state.currentIndex);
          _this2.speakCurrentSection();
        },
        "toggleReading": function toggleReading() {
          if (_this2.utilities.speechHandler.isSpeaking) {
            var _this2$state$currentE3;
            _this2.utilities.speechHandler.stop();
            _this2.utilities.highlightBox.removeHighlight((_this2$state$currentE3 = _this2.state.currentElement) === null || _this2$state$currentE3 === void 0 ? void 0 : _this2$state$currentE3.element);
          } else {
            _this2.speakCurrentSection();
          }
        },
        "accessLink": function accessLink() {
          if (_this2.state.currentElement) {
            _this2.utilities.linkHandler.accessLink(_this2.state.currentElement.element);
            _this2.utilities.speechHandler.stop();
          }
        }
      };
      var actionHandler = actionMap[request.action];
      if (actionHandler) {
        actionHandler();
      }
    }

    // Determine if an element is visible and readable
  }, {
    key: "isElementVisible",
    value: function isElementVisible(element) {
      var rect = element.getBoundingClientRect();
      var computedStyle = window.getComputedStyle(element);
      var isInViewport = rect.top >= 0 && rect.left >= 0;
      var isNotHidden = computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none';
      return isInViewport && isNotHidden;
    }
  }]);
}(); // Instantiate the accessibility content handler
new AccessibilityContentHandler();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("877b3abed96e878bdea3")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=content.64c8c15d57ae602802f8.hot-update.js.map