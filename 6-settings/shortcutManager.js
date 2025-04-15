class ShortcutManager {
    constructor() {
      this.defaultShortcuts = {
        "skip-next": { key: "ArrowDown", modifiers: ["alt"] },
        "skip-previous": { key: "ArrowUp", modifiers: ["alt"] },
        "toggle-reading": { key: " ", modifiers: ["alt"] },
        "access-link": { key: "Enter", modifiers: ["alt"] },
        "toggle-stt": { key: "s", modifiers: ["alt", "shift"] }
      };
      this.currentShortcuts = {};
    }
  
    async initialize() {
      await this.loadShortcuts();
      this.setupCommandListener();
    }
  
    async loadShortcuts() {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['shortcuts'], (result) => {
          this.currentShortcuts = result.shortcuts || this.defaultShortcuts;
          resolve();
        });
      });
    }
  
    async saveShortcuts(newShortcuts) {
      this.currentShortcuts = newShortcuts;
      await chrome.storage.sync.set({ shortcuts: newShortcuts });
    }
  
    setupCommandListener() {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'dynamic-shortcut') {
          // This will be handled by the content script's key detection
        }
      });
    }
  
    getShortcutForAction(action) {
      return this.currentShortcuts[action];
    }
  }