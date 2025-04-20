import { initializeVoices } from "../2-features/TTS/initializeVoices.js";
import { ShortcutManager } from "../6-settings/shortcutManager.js";

class BackgroundHandler {
  constructor() {
    this.shortcutManager = new ShortcutManager();
    // Define keyboard shortcut commands and their corresponding actions
    this.commands = {
      "skip-next": "skipToNext",
      "skip-previous": "skipToPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink",
      "toggle-stt": "toggleSTT",
    };
    this.initialize();
  }

  async initialize() {
    await this.shortcutManager.initialize();
    // Set up all event listeners
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.action.onClicked.addListener(this.onActionClicked.bind(this));
    chrome.commands.onCommand.addListener(this.onCommand.bind(this));
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
  //   chrome.storage.onChanged.addListener(function(changes, namespace) {
  //     if (changes.settings && changes.settings.newValue) {
  //         const newSettings = changes.settings.newValue;
          
  //         // If theme changed, notify all extension pages
  //         if (changes.settings.oldValue && 
  //             changes.settings.oldValue.theme !== newSettings.theme) {
              
  //             // Send message to all extension pages
  //             chrome.runtime.sendMessage({
  //                 action: "themeChanged",
  //                 theme: newSettings.theme
  //             });
  //         }
  //     }
  //     if (changes.shortcuts && changes.shortcuts.newValue) {
  //       this.broadcastShortcutsUpdate(changes.shortcuts.newValue);
  //     }
  // });
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.settings && changes.settings.newValue) {
      const newSettings = changes.settings.newValue;
  
      // If theme changed, notify all extension pages
      if (changes.settings.oldValue &&
          changes.settings.oldValue.theme !== newSettings.theme) {
        chrome.runtime.sendMessage({
          action: "themeChanged",
          theme: newSettings.theme
        });
      }
    }
  
    if (changes.shortcuts && changes.shortcuts.newValue) {
      this.broadcastShortcutsUpdate(changes.shortcuts.newValue); // ✅ Works now
    }
  });
  
    
    // Initialize TTS voices when the background script starts
    this.initializeVoices();
  }

  // Broadcast shortcut updates to all active tabs
  async broadcastShortcutsUpdate(shortcuts) {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: "shortcuts-updated",
            shortcuts: shortcuts
          });
        } catch (error) {
          // Ignore errors for inactive tabs
        }
      }
    } catch (error) {
      console.error("Error broadcasting shortcut updates:", error);
    }
  }

 // Handle shortcut customization requests
 async handleShortcutCustomization(request, sender, sendResponse) {
  try {
    if (request.action === "shortcut-get-shortcuts") {
      sendResponse({ shortcuts: this.shortcutManager.shortcuts });
    } 
    else if (request.action === "shortcut-update-shortcuts") {
      const success = await this.shortcutManager.saveShortcuts(request.newShortcuts);
      sendResponse({ success });
    }
    else if (request.action === "shortcut-reset-defaults") {
      const success = await this.shortcutManager.resetToDefaults();
      sendResponse({ success });
    }
    return true; // Required for async sendResponse
  } catch (error) {
    console.error("Error handling shortcut customization:", error);
    sendResponse({ error: error.message });
    return true;
  }
}

notifyShortcutChange() {
  chrome.runtime.sendMessage({
    action: "shortcuts-updated",
    shortcuts: this.currentShortcuts
  });
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

// Ensure default shortcuts are saved if they don't exist
if (!await this.shortcutManager.loadShortcuts()) {
  await this.shortcutManager.resetToDefaults();
}

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
    else if (request.action === "updateBadge") {
      this.updateBadge(request.isActive, request.text);
    }
    else if (request.action.startsWith("shortcut-")) {
      return this.handleShortcutCustomization(request, sender, sendResponse);
    }
    return false; // For synchronous responses
  }

  updateBadge(isActive, text = "") {
    if (isActive) {
      chrome.action.setBadgeText({ text: text || "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" }); // Green color
    } else {
      chrome.action.setBadgeText({ text: "" }); // Clear the badge
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