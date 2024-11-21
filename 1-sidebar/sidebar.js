export default class SidebarController {
  constructor(context = 'sidebar') {
    this.context = context;
    this.buttons = {}; 
    this.initialize();
  }

  // Modify initialize to be context-sensitive
  initialize() {
    // Only set sidebar title if in sidebar context
    if (this.context === 'sidebar') {
      try {
        const titleElement = document.getElementById("sidebar-title");
        if (titleElement) {
          titleElement.textContent = chrome.runtime.getManifest().name;
        }
      } catch (error) {
        console.warn("Could not set sidebar title:", error);
      }
    }

    // Setup event listeners based on context
    if (this.context === 'sidebar') {
      document.addEventListener("DOMContentLoaded", this.setupSidebarEventListeners.bind(this));
    } else if (this.context === 'content') {
      this.setupContentScriptMessageHandlers();
    }
  }

  // Specific method for sidebar event listeners
  setupSidebarEventListeners() {
    const buttons = document.querySelectorAll(".accessibility-button");
    if (!buttons.length) {
      console.warn("No accessibility buttons found!");
      return;
    }

    // More robust button assignment
    this.buttons.tts = buttons[0];
    this.buttons.stt = buttons[1];
    this.buttons.signLanguage = buttons[2];
    this.buttons.imageCaption = buttons[3];

    this.addButtonListener(this.buttons.tts, this.handleTTS.bind(this));
    this.addButtonListener(this.buttons.stt, this.handleSTT.bind(this));
    this.addButtonListener(this.buttons.signLanguage, this.handleSignLanguage.bind(this));
    this.addButtonListener(this.buttons.imageCaption, this.handleImageCaption.bind(this));
  }

  // Method to setup message handlers for content script
  setupContentScriptMessageHandlers() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch(request.action) {
        case 'toggleTTS':
          this.handleTTS();
          break;
        case 'toggleSTT':
          this.handleSTT();
          break;
        case 'toggleSignLanguage':
          this.handleSignLanguage();
          break;
        case 'toggleImageCaption':
          this.handleImageCaption();
          break;
      }
    });
  }

  // Existing methods remain the same
  addButtonListener(button, handler) {
    if (!button) {
      console.warn("Button not found, skipping event binding.");
      return;
    }
    button.addEventListener("click", handler);
  }

  handleTTS() {
    console.log("Text-to-Speech button clicked");
    this.sendMessageToActiveTab({ action: "extractText" });
  }

  handleSTT() {
    console.log("Speech-to-Text button clicked");
    this.sendMessageToActiveTab({ action: "startSpeechRecognition" });
  }

  handleSignLanguage() {
    console.log("Sign Language Translator button clicked");
    this.sendMessageToActiveTab({ action: "translateSignLanguage" });
  }

  handleImageCaption() {
    console.log("Image Captioning button clicked");
    this.sendMessageToActiveTab({ action: "generateImageCaption" });
  }

  sendMessageToActiveTab(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Message sending error:", chrome.runtime.lastError);
            }
          });
        } catch (error) {
          console.error("Message sending exception:", error);
        }
      } else {
        console.warn("No active tab found");
      }
    });
  }
}