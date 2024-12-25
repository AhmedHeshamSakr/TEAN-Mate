import { initializeVoices } from "../2-features/TTS/initializeVoices.js";

class BackgroundHandler {
  constructor() {
      this.commands = {
          "skip-next": "skipToNext",
          "skip-previous": "skipToPrevious",
          "toggle-reading": "toggleReading",
          "access-link": "accessLink",
          "toggle-stt": "toggleSTT",
      };

      this.initialize();
  }

  initialize() {
      chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
      chrome.action.onClicked.addListener(this.onActionClicked.bind(this));
      chrome.commands.onCommand.addListener(this.onCommand.bind(this));
      chrome.runtime.onMessage.addListener(this.onMessage.bind(this));

      // Initialize the TTS voices
      this.initializeVoices();
  }

  async initializeVoices() {
      try {
          const voices = await initializeVoices();
          chrome.storage.local.set({ voices });
          console.log("Voices initialized:", voices);
      } catch (error) {
          console.error("Failed to initialize voices:", error);
      }
  }

  onInstalled() {
      // Placeholder for installation logic, if needed in the future
      chrome.localStorage.setItem("sidebarOpened", false);
      console.log("Extension installed");
  }

  onActionClicked() {
      console.log("Action icon clicked");
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
          chrome.storage.local.get("voices", (result) => {
              sendResponse({ voices: result.voices });
          });
          return true; // Indicate async response
      }
  }

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

// Instantiate the BackgroundHandler
new BackgroundHandler();