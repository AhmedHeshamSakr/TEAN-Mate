import { initializeVoices } from "../2-features/TTS/initializeVoices.js";

class BackgroundHandler {
  constructor() {
    // Define keyboard shortcut commands and their corresponding actions
    this.commands = {
      "skip-next": "skipToNext",
      "skip-previous": "skipToPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink",
      "toggle-stt": "toggleSTT",
      "startSLcapture": "startSLcapture", 
    };
    this.initialize();
  }

  initialize() {
    // Set up all event listeners
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.action.onClicked.addListener(this.onActionClicked.bind(this));
    chrome.commands.onCommand.addListener(this.onCommand.bind(this));
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    
    // Initialize TTS voices when the background script starts
    this.initializeVoices();
  }

  async initializeVoices() {
    try {
      const voices = await initializeVoices();
      await chrome.storage.local.set({ voices });
      console.log("Voices initialized:", voices);
    } catch (error) {
      console.error("Failed to initialize voices:", error);
    }
  }

  async onInstalled() {
    try {
      // Initialize extension state
      await chrome.storage.local.set({ sidebarOpened: false });
      console.log("Extension installed and state initialized");
    } catch (error) {
      console.error("Error during installation:", error);
    }
  }

  onActionClicked(tab) {
    // Open the sidebar directly when the extension icon is clicked
    // Note: This should not be nested inside another listener
    chrome.sidePanel.open({ windowId: tab.windowId });
  }

  onCommand(command) {
    const action = this.commands[command];
    if (action) {
      this.sendMessageToActiveTab({ action });
    } else {
      console.warn(`Unknown command: ${command}`);
    }
  }

  onMessage(request, sender, sendResponse) {
    if (request.action === "getVoices") {
      // Handle voice retrieval request
      chrome.storage.local.get("voices", (result) => {
        sendResponse({ voices: result.voices });
      });
      return true; // Required for async response
    }
  }

  async sendMessageToActiveTab(message) {
    try {
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });
      
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, message);
      } else {
        console.warn("No active tab found");
      }
    } catch (error) {
      console.error("Error sending message to tab:", error);
    }
  }
}

// Initialize the background handler
new BackgroundHandler();