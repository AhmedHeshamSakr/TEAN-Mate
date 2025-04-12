import { ACTIONS } from '../constants.js';
import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";

class ContentHandler {
  constructor() {
    this.sections = [];
    this.pastBorderStyle = "";
    this.pastBackgroundStyle = "";
    this.currentElement = null;
    this.currentLink = null;
    this.wasSpeaking = false;
    this.settings = null;

    // Initialize components
    this.highlightBox = new HighlightBox();
    this.textExtractor = new TextExtractor();
    this.speechHandler = new SpeechHandler();
    this.linkHandler = new LinkHandler();

    // Setup walker and event listeners
    this.setupWalker();
    this.initializeSettings();
    this.setupMessageHandling();
  }

  setupWalker() {
    this.walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          const tagName = node.tagName?.toLowerCase();
          return ["script", "style", "noscript"].includes(tagName) 
            ? NodeFilter.FILTER_REJECT 
            : NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );
  }

  initializeSettings() {
    chrome.storage.sync.get(['settings'], (result) => {
      this.settings = result.settings || {};
      this.highlightWhileReading = this.settings.highlightText !== false;
      this.badge = this.settings.showIconBadge !== false;
    });
  }

  setupMessageHandling() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const handleAsync = async () => {
        try {
          await this.handleMessage(request);
          sendResponse({ status: "success" });
        } catch (error) {
          console.error("Content handler failed:", error);
          sendResponse({ status: "error", message: error.message });
        }
      };
  
      // Explicitly list actions requiring async response
      const asyncActions = new Set([
        ACTIONS.EXTRACT_TEXT,
        ACTIONS.SKIP_NEXT,
        ACTIONS.SKIP_PREVIOUS,
        ACTIONS.TOGGLE_READING,
        "requestAccessLink",
        "resumeTTS"
      ]);
  
      if (asyncActions.has(request.action)) {
        handleAsync();
        return true; // Keep channel open
      }
      
      // Synchronous actions
      this.handleMessage(request);
    });
  }

  handleMessage(request) {
    // Skip if not a valid action or currently speaking when not allowed
    if (!Object.values(ACTIONS).includes(request.action) || 
        (this.speechHandler.isSpeaking && request.action !== ACTIONS.TOGGLE_READING)) {
      return;
    }

    switch(request.action) {
      case ACTIONS.EXTRACT_TEXT:
        this.currentElement = null;
        this.speakCurrentSection();
        this.updateBadge("TTS");
        break;

      case ACTIONS.SKIP_NEXT:
        this.speechHandler.stop();
        this.clearCurrentHighlights();
        this.currentElement = null;
        this.speakCurrentSection();
        break;

      case ACTIONS.SKIP_PREVIOUS:
        this.speechHandler.stop();
        this.clearCurrentHighlights();
        this.textExtractor.clearProcessedElements();
        this.currentElement = this.prevElement();
        this.speakCurrentSection();
        break;

      case ACTIONS.TOGGLE_READING:
        if (this.speechHandler.isSpeaking) {
          this.speechHandler.stop();
          this.clearCurrentHighlights();
          this.updateBadge("");
        } else {
          this.speakCurrentSection();
          this.updateBadge("TTS");
        }
        break;

      case ACTIONS.ACCESS_LINK:
        this.handleAccessLink(request.url);
        break;

      case "requestAccessLink":
        const selectedLink = this.currentLink || document.querySelector("a.special-access")?.href;
        if (selectedLink) {
          chrome.runtime.sendMessage({
            action: ACTIONS.ACCESS_LINK,
            url: selectedLink
          });
        }
        break;

      case "performSearch":
        window.open(`https://www.google.com/search?q=${encodeURIComponent(request.query)}`, '_blank');
        break;

      case "pauseTTS":
        this.speechHandler.stop();
        this.clearCurrentHighlights();
        this.updateBadge("");
        break;

      case "resumeTTS":
        if (this.wasSpeaking) {
          this.clearCurrentHighlights();
          this.speakCurrentSection();
          this.updateBadge("TTS");
        }
        break;
    }
  }

  // Helper methods
  clearCurrentHighlights() {
    if (this.currentElement?.elementsToReturn && this.highlightWhileReading) {
      this.currentElement.elementsToReturn.forEach(el => 
        this.highlightBox.removeHighlight(el)
      );
    }
  }

  updateBadge(text = "") {
    if (!this.badge) return;
    chrome.runtime.sendMessage({
      action: "updateBadge",
      isActive: !!text,
      text
    });
  }

  handleAccessLink(url) {
    if (!url && this.currentLink) {
      url = this.currentLink.href;
    }
    if (url) {
      this.clearCurrentHighlights();
      this.speechHandler.stop();
      this.linkHandler.accessLink(url);
    }
  }

  // Existing DOM traversal and speech methods remain unchanged
  getNextElement() { /* ... */ }
  prevElement() { /* ... */ }
  speakCurrentSection() { /* ... */ }
  isElementVisible(element) { /* ... */ }
}

new ContentHandler();