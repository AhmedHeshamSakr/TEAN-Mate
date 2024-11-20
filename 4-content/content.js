import HighlightHandler from "../2-features/HighlightHandler.js";
import SpeechHandler from "../2-features/SpeechHandler.js";
import TextExtractor from "../2-features/TextExtractor.js";

// Constants to match actions from background.js and sidebar.js
const ACTIONS = {
  EXTRACT_TEXT: 'extractText',
  SKIP_NEXT: 'skipToNext',
  SKIP_PREVIOUS: 'skipToPrevious',
  TOGGLE_READING: 'toggleReading',
  ACCESS_LINK: 'accessLink'
};

function ensureSidebarExists() {
  let sidebar = document.querySelector('main.sidebar-MainContainer');
  if (!sidebar) {
    sidebar = document.createElement('main');
    sidebar.classList.add('sidebar-MainContainer');
    document.body.appendChild(sidebar);
    console.log('Sidebar dynamically created');
  }
  return sidebar;
}

class ContentManager {
  constructor() {
    this.highlightHandler = new HighlightHandler();
    this.speechHandler = new SpeechHandler();
    this.setupMessageListener();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keeps sendResponse open for async handling
    });
  }

  async handleMessage(request, sender, sendResponse) {
    console.log('Received message:', request);
    try {
      switch (request.action) {
        case ACTIONS.EXTRACT_TEXT:
          console.log('Handling text extraction');
          await this.handleTextExtraction(sendResponse);
          break;
        case ACTIONS.SKIP_NEXT:
          this.handleSkipToNext();
          sendResponse({ success: true });
          break;
        case ACTIONS.SKIP_PREVIOUS:
          this.handleSkipToPrevious();
          sendResponse({ success: true });
          break;
        case ACTIONS.TOGGLE_READING:
          this.handleToggleReading();
          sendResponse({ success: true });
          break;
        case ACTIONS.ACCESS_LINK:
          this.handleAccessLink();
          sendResponse({ success: true });
          break;
        case 'toggleSidebar':
          const sidebar = ensureSidebarExists();
          const isVisible = sidebar.style.display !== 'none';
          sidebar.style.display = isVisible ? 'none' : 'block';
          sendResponse({ success: true, isVisible: !isVisible });
          break;
        default:
          console.warn(`Unknown action: ${request.action}`);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error("Error handling request:", error);
      sendResponse({ success: false, error: error.message });
    }
  }

  async handleTextExtraction(sendResponse) {
    const { textSections, elementSections } = TextExtractor.extractAllTextWithTags(document.body);

    if (textSections.length === 0) {
      console.warn("No text sections found on the page.");
      sendResponse({ success: false, error: "No text sections found." });
      return;
    }

    const sections = textSections.map((text, index) => ({
      text,
      element: elementSections[index],
    }));

    this.speechHandler.setSections(sections);
    this.speechHandler.setHighlightHandler(this.highlightHandler);
    this.speechHandler.speakCurrentSection();

    sendResponse({ success: true });
  }

  handleSkipToNext() {
    if (this.validateSections()) {
      this.speechHandler.skipToNext();
    }
  }

  handleSkipToPrevious() {
    if (this.validateSections()) {
      this.speechHandler.skipToPrevious();
    }
  }

  handleToggleReading() {
    if (this.speechHandler.isSpeaking) {
      this.speechHandler.stopSpeaking();
      return;
    }

    if (this.validateSections()) {
      this.speechHandler.speakCurrentSection();
    }
  }

  handleAccessLink() {
    const section = this.speechHandler.sections[this.speechHandler.currentIndex];

    if (section?.element.tagName.toLowerCase() === "a") {
      window.open(section.element.href, "_blank");
    } else {
      console.warn("Current section is not a valid link.");
    }
  }

  validateSections() {
    if (this.speechHandler.sections.length === 0) {
      console.warn("No sections available.");
      return false;
    }
    return true;
  }
}

// Initialize the content manager
const contentManager = new ContentManager();
