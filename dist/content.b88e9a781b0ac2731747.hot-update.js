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









var ContentHandler = /*#__PURE__*/function () {
  function ContentHandler() {
    var _context;
    (0,_babel_runtime_corejs3_helpers_esm_classCallCheck__WEBPACK_IMPORTED_MODULE_0__["default"])(this, ContentHandler);
    this.sections = [];
    this.currentIndex = 0;
    this.pastBorderStyle = "";
    this.pastBackgroundStyle = "";
    this.highlightBox = new _2_features_TTS_HighlightBox_js__WEBPACK_IMPORTED_MODULE_5__["default"]();
    this.textExtractor = new _2_features_TTS_TextExtractor_js__WEBPACK_IMPORTED_MODULE_6__["default"]();
    this.speechHandler = new _2_features_TTS_SpeechHandler_js__WEBPACK_IMPORTED_MODULE_7__["default"]();
    this.linkHandler = new _2_features_TTS_LinkHandler_js__WEBPACK_IMPORTED_MODULE_8__["default"]();
    this.currentElement = null;
    this.elements = _babel_runtime_corejs3_core_js_stable_array_from__WEBPACK_IMPORTED_MODULE_2__(document.body.querySelectorAll('*'));
    chrome.runtime.onMessage.addListener(_babel_runtime_corejs3_core_js_stable_instance_bind__WEBPACK_IMPORTED_MODULE_3__(_context = this.handleMessage).call(_context, this));
  }
  return (0,_babel_runtime_corejs3_helpers_esm_createClass__WEBPACK_IMPORTED_MODULE_1__["default"])(ContentHandler, [{
    key: "navigateElement",
    value: function navigateElement(startIndex, direction) {
      var step = direction === "next" ? 1 : -1;
      for (var i = startIndex + step; i >= 0 && i < this.elements.length; i += step) {
        var element = this.elements[i];
        if (this.isElementVisible(element)) {
          var text = this.textExtractor.extractText(element);
          if (_babel_runtime_corejs3_core_js_stable_instance_trim__WEBPACK_IMPORTED_MODULE_4__(text).call(text)) {
            this.currentIndex = i;
            return {
              element: element,
              text: text
            };
          }
        }
      }
      return null; // No more valid elements
    }
  }, {
    key: "getNextElement",
    value: function getNextElement(startIndex) {
      return this.navigateElement(startIndex, "next");
    }
  }, {
    key: "prevElement",
    value: function prevElement(startIndex) {
      return this.navigateElement(startIndex, "previous");
    }
  }, {
    key: "speakCurrentSection",
    value: function speakCurrentSection() {
      var _this = this;
      if (!this.currentElement) {
        this.currentElement = this.getNextElement(this.currentIndex);
      }
      if (!this.currentElement) {
        console.log("No more elements to process.");
        return;
      }
      var _this$currentElement = this.currentElement,
        element = _this$currentElement.element,
        text = _this$currentElement.text;

      // Only highlight if not already highlighted
      if (this.highlightBox.currentlyHighlighted !== element) {
        this.highlightBox.removeHighlight(this.highlightBox.currentlyHighlighted);
        this.highlightBox.addHighlight(element);
      }
      this.speechHandler.speak(text, function () {
        _this.highlightBox.removeHighlight(element);
        _this.currentIndex++;
        _this.currentElement = null; // Prepare for the next element
        _this.speakCurrentSection();
      });
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(request) {
      if (request.action === "extractText") {
        this.currentIndex = 0;
        this.currentElement = null;
        this.speakCurrentSection();
      } else if (request.action === "skipToNext") {
        var _this$currentElement2;
        this.speechHandler.stop();
        this.highlightBox.removeHighlight((_this$currentElement2 = this.currentElement) === null || _this$currentElement2 === void 0 ? void 0 : _this$currentElement2.element);
        this.currentElement = this.getNextElement(this.currentIndex + 1);
        this.speakCurrentSection();
      } else if (request.action === "skipToPrevious") {
        var _this$currentElement3;
        this.speechHandler.stop();
        this.highlightBox.removeHighlight((_this$currentElement3 = this.currentElement) === null || _this$currentElement3 === void 0 ? void 0 : _this$currentElement3.element);
        this.currentElement = this.prevElement(this.currentIndex - 1);
        this.speakCurrentSection();
      } else if (request.action === "toggleReading") {
        if (this.speechHandler.isSpeaking) {
          var _this$currentElement4;
          this.speechHandler.stop();
          this.highlightBox.removeHighlight((_this$currentElement4 = this.currentElement) === null || _this$currentElement4 === void 0 ? void 0 : _this$currentElement4.element);
        } else {
          this.speakCurrentSection();
        }
      } else if (request.action === "accessLink") {
        if (this.currentElement) {
          this.linkHandler.accessLink(this.currentElement.element);
          this.speechHandler.stop();
        }
      }
    }
  }, {
    key: "isElementVisible",
    value: function isElementVisible(element) {
      var rect = element.getBoundingClientRect();
      var isInViewport = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
      var style = window.getComputedStyle(element);
      var isNotHidden = style.visibility !== "hidden" && style.display !== "none" && style.opacity !== "0";
      return isInViewport && isNotHidden;
    }
  }]);
}(); // Instantiate the content handler
new ContentHandler();

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("7ad4d210995c0f7b09d2")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=content.b88e9a781b0ac2731747.hot-update.js.map