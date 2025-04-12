import { ACTIONS, MANIFEST_COMMAND } from '../constants.js';
import { initializeVoices } from "../2-features/TTS/initializeVoices.js";

class BackgroundHandler {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Set up all event listeners
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    chrome.action.onClicked.addListener(this.handleActionClick.bind(this));
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    
    // Initialize TTS voices
    this.initializeVoices();
  }

  handleInstall() {
    chrome.storage.local.set({ 
      sidebarOpened: false,
      voices: []
    });
    console.log("Extension installed and initialized");
  }

  handleActionClick(tab) {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }

  handleCommand(command) {
    // Only handles the essential manifest-registered command
    if (command === MANIFEST_COMMAND) {
      this.sendToActiveTab({ action: ACTIONS.ACCESS_LINK });
    }
  }

  handleMessage(request, sender, sendResponse) {
    // Async responses must call sendResponse() exactly once
    const handleAsync = async () => {
      try {
        switch(request.action) {
          case "getVoices":
            const voices = await new Promise(resolve => {
              chrome.storage.local.get("voices", result => resolve(result.voices));
            });
            sendResponse({ voices });
            break;
  
          default:
            if (Object.values(ACTIONS).includes(request.action)) {
              await this.sendToActiveTab(request);
            }
            break;
        }
      } catch (error) {
        console.error("Message handling failed:", error);
        sendResponse({ error: error.message });
      }
    };
  
    // Only return true for async operations
    if (request.action === "getVoices") {
      handleAsync();
      return true; // Keep channel open
    }
    
    // Synchronous responses
    switch(request.action) {
      case "updateBadge":
        this.updateBadge(request.isActive, request.text);
        break;
      case ACTIONS.ACCESS_LINK:
        if (request.url) chrome.tabs.create({ url: request.url });
        break;
    }
  }

  handleStorageChange(changes, namespace) {
    if (changes.settings?.newValue) {
      const newSettings = changes.settings.newValue;
      
      if (changes.settings.oldValue?.theme !== newSettings.theme) {
        chrome.runtime.sendMessage({
          action: "themeChanged",
          theme: newSettings.theme
        });
      }
    }
  }

  async initializeVoices() {
    try {
      const voices = await initializeVoices();
      await chrome.storage.local.set({ voices });
      console.log("Voices initialized");
    } catch (error) {
      console.error("Voice initialization failed:", error);
    }
  }

  updateBadge(isActive, text = "") {
    if (isActive) {
      chrome.action.setBadgeText({ text: text || "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  }

  async sendToActiveTab(message) {
    try {
      const [tab] = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true,
        status: 'complete'  // Only target fully loaded tabs
      });
      
      if (tab?.id) {
        // Ensure content script is injected
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.bundle.js']
          });
        } catch (injectError) {
          console.warn("Content script injection failed, retrying...", injectError);
          // Add a small delay before retrying
          await new Promise(resolve => setTimeout(resolve, 300));
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.bundle.js']
          });
        }
        
        // Verify connection before sending
        const isAlive = await this.verifyConnection(tab.id);
        if (!isAlive) {
          throw new Error("Content script not responding");
        }
        
        await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (error) {
      console.error("Message delivery failed:", error);
      // Optional: Add retry logic or error reporting here
    }
  }

  async verifyConnection(tabId) {
    try {
      const response = await chrome.tabs.sendMessage(
        tabId, 
        { action: 'ping' },
        { timeout: 1000 } // 1 second timeout
      );
      return response?.alive === true;
    } catch {
      return false;
    }
  }
}

new BackgroundHandler();