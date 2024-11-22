class SidebarController {
  constructor() {
      this.buttons = {}; // Store button references for easy access
      this.initialize(); // Set up event listeners and initial state
  }

  // Initialize sidebar
  initialize() {
      // Set sidebar title using the extension's name
      document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;

      // Wait for DOM to load before attaching event listeners
      document.addEventListener("DOMContentLoaded", this.setupEventListeners.bind(this));
  }

  // Set up event listeners for all buttons
  setupEventListeners() {
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
  
    // Rest of the method remains the same
    this.addButtonListener(this.buttons.tts, this.handleTTS.bind(this));
    this.addButtonListener(this.buttons.stt, this.handleSTT.bind(this));
    this.addButtonListener(this.buttons.signLanguage, this.handleSignLanguage.bind(this));
    this.addButtonListener(this.buttons.imageCaption, this.handleImageCaption.bind(this));
  }
  // Add an event listener to a button, with error handling
  addButtonListener(button, handler) {
      if (!button) {
          console.warn("Button not found, skipping event binding.");
          return;
      }
      button.addEventListener("click", handler);
  }

  // Handle Text-to-Speech button click
  handleTTS() {
      console.log("Text-to-Speech button clicked");
      this.sendMessageToActiveTab({ action: "extractText" });
  }

  // Handle Speech-to-Text button click
  handleSTT() {
      console.log("Speech-to-Text button clicked");
      alert("Speech to Text activated"); // Placeholder for STT functionality
  }

  // Handle Sign Language Translator button click
  handleSignLanguage() {
      console.log("Sign Language Translator button clicked");
      alert("Sign Language Translator activated"); // Placeholder for sign language functionality
  }

  // Handle Image Captioning button click
  handleImageCaption() {
      console.log("Image Captioning button clicked");
      alert("Image Captioning activated"); // Placeholder for image captioning functionality
  }

  // Send a message to the active tab
  sendMessageToActiveTab(message) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, message);
          } else {
              console.warn("No active tab found");
          }
      });
  }
}

// Instantiate the SidebarController
new SidebarController();
