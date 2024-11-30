import { initializeVoices } from "../2-features/TTS/initializeVoices.js";
import ArtyomAssistant from "../2-features/STT/ArtyomHandller.js";

class BackgroundHandler {
  constructor() {
    this.commands = {
      "skip-next": "skipToNext",
      "skip-previous": "skipToPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink",
      "start-stt": "startSpeechRecognition", // New command
      "stop-stt": "stopSpeechRecognition",   // New command
    };

    this.artyomAssistant = ArtyomAssistant.getInstance();// Get the singleton instance of ArtyomAssistant
    this.initialize();
  }

  initialize() {
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.action.onClicked.addListener(this.onActionClicked.bind(this));
    chrome.commands.onCommand.addListener(this.onCommand.bind(this));
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));

    // Initialize the TTS voices
    this.initializeVoices();
    this.initializeVoiceCommands();
  }

  initializeVoiceCommands() {
    try {
      // Add error handling and logging
      this.artyomAssistant.addCommand("toggle listening", () => {
        try {
          this.artyomAssistant.toggleListening();
        } catch (error) {
          console.error('Error toggling listening:', error);
        }
      });
  
      // Consider checking if startListening is successful
      this.artyomAssistant.startListening()
        .catch(error => {
          console.error('Failed to start listening:', error);
          // Optionally notify user or take alternative action
        });
    } catch (error) {
      console.error('Failed to initialize voice commands:', error);
    }
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
    console.log("Extension installed");
  }

  onActionClicked() {
    // Placeholder for action click logic, if needed in the future
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
    switch(request.action) {
      case "getVoices":
        chrome.storage.local.get("voices", (result) => {
          sendResponse({ 
            voices: result.voices || [],
            status: 'success'
          });
        });
        return true; // Important for async sendResponse
      
      case "start-stt":
        this.artyomAssistant.startListening();
        sendResponse({ status: 'listening started' });
        return true;
      
      case "stop-stt":
        this.artyomAssistant.stopListening();
        sendResponse({ status: 'listening stopped' });
        return true;
      
      default:
        console.warn(`Unhandled message action: ${request.action}`);
        sendResponse({ status: 'error', message: 'Unknown action' });
        return false;
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
