import { initializeVoices } from "../2-features/TTS/initializeVoices.js";
import { ShortcutManager } from "../6-settings/shortcutManager.js";

class BackgroundHandler {
  constructor() {
    this.shortcutManager = new ShortcutManager();
    // Define keyboard shortcut commands and their corresponding actions
    this.commandActions = {
      "skip-next": "skipToNext",
      "skip-previous": "skipToPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink",
      "toggle-stt": "toggleSTT",
    };
    this.initialize().catch(console.error);
  }

  async initialize() {
    await this.shortcutManager.initialize();
    // Set up all event listeners
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.action.onClicked.addListener(this.onActionClicked.bind(this));

    chrome.commands.onCommand.addListener(this.onCommand.bind(this));
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //   this.onMessage(request, sender, sendResponse);
    // });
    // chrome.commands.onCommand.addListener((command) => {
    //   this.onCommand(command);
    // });
  
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
async broadcastShortcutsUpdate(shortcuts) {
  try {
    // 1. Send to all tabs with content scripts
    const tabs = await chrome.tabs.query({});
    await Promise.allSettled(
      tabs.map(tab => {
        // Skip special Chrome pages
        if (tab.url?.startsWith('chrome://')) return;
        
        return chrome.tabs.sendMessage(tab.id, {
          action: "shortcuts-updated",
          shortcuts
        }).catch(() => {}); // Silently ignore tabs without content scripts
      })
    );

    // 2. Send to extension pages (options/popup)
    // This will reach any extension page that's listening
    chrome.runtime.sendMessage({
      action: "shortcuts-updated",
      shortcuts
    }).catch(() => {}); // Silently ignore if no listeners
  } catch (error) {
    console.error("Broadcast failed:", error);
    // Non-fatal error - the shortcuts were still saved
  }
}
  

async handleShortcutCustomization(request, sender) {
  try {
    if (request.action === "shortcut-get-shortcuts") {
      return { shortcuts: this.shortcutManager.currentShortcuts };
    }

    if (request.action === "shortcut-update-shortcuts") {
      const success = await this.shortcutManager.saveShortcuts(request.newShortcuts);
      return { success };
    }

    if (request.action === "shortcut-reset-defaults") {
      await this.shortcutManager.resetToDefaults();
      return { success: true };
    }

    // Handle unknown actions
    return { error: `Unknown action: ${request.action}` };

  } catch (error) {
    console.error("Error handling shortcut customization:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred"
    };
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

  // onCommand(command) {
  //   const action = this.commands[command];
  //   if (action) {
  //     this.sendMessageToActiveTab({ action });
  //   } else {
  //     console.warn(`Unknown command: ${command}`);
  //   }
  // }
  // onCommand(command) {
  //   if (!this.shortcutManager?.currentShortcuts?.[command]) {
  //     console.error(`Shortcut ${command} not found. Using default behavior.`);
  //     const action = this.commandActions[command];
  //     if (action) this.sendMessageToActiveTab({ action });
  //     return;
  //   }
  //   }
  onCommand(command) {
    try {
      // 1. Check if this is a known command
      const action = this.commandActions[command];
      if (!action) {
        console.warn(`Unknown command received: ${command}`);
        return;
      }
  
      // 2. Verify we have a shortcut manager
      if (!this.shortcutManager) {
        console.error('ShortcutManager not initialized');
        this.sendMessageToActiveTab({ action }); // Fallback to default behavior
        return;
      }
  
      // 3. Check if the command exists in our shortcuts
      // (Note: This check is just for debugging - we should always have the command)
      if (!this.shortcutManager.currentShortcuts[command]) {
        console.warn(`Shortcut mapping missing for command: ${command}`);
      }
  
      // 4. Execute the action regardless of shortcut mapping
      // (The physical key combo is already handled by Chrome's commands API)
      this.sendMessageToActiveTab({ action });
      
    } catch (error) {
      console.error(`Error handling command ${command}:`, error);
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
      sendResponse({ success: true }); // <- add this
      return true;
    }
    else if (request.action.startsWith("shortcut-")) {
      // --- FIXED HERE ---
      this.handleShortcutCustomization(request, sender)
        .then(response => {
          sendResponse(response);
        })
        .catch(error => {
          console.error('Shortcut handler error:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep port open
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
