export class ShortcutManager {
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

    get shortcuts() {
      return this.currentShortcuts;
    }

    async resetToDefaults() {
      this.currentShortcuts = {...this.defaultShortcuts};
      return this.saveShortcuts(this.currentShortcuts);
    }
  
    async loadShortcuts() {
      return new Promise((resolve) => {
        chrome.storage.sync.get(['shortcuts'], (result) => {
          if (chrome.runtime.lastError || !result.shortcuts) {
            // Try local storage as fallback
            chrome.storage.local.get(['shortcuts'], (localResult) => {
              this.currentShortcuts = localResult.shortcuts || this.defaultShortcuts;
              resolve(this.currentShortcuts);
            });
          } else {
            this.currentShortcuts = result.shortcuts;
            resolve(this.currentShortcuts);
          }
        });
      });
    }
  
    async saveShortcuts(newShortcuts) {
      // Validate that all required actions have shortcuts
      const requiredActions = Object.keys(this.defaultShortcuts);
      const hasAllActions = requiredActions.every(action => 
        newShortcuts[action] && 
        newShortcuts[action].key && 
        Array.isArray(newShortcuts[action].modifiers)
      );
      
      if (!hasAllActions) {
        console.error('Invalid shortcut configuration');
        return false;
      }
      
      this.currentShortcuts = newShortcuts;
      return new Promise((resolve) => {
        chrome.storage.sync.set({ shortcuts: newShortcuts }, () => {
          // Also save to local as backup
          chrome.storage.local.set({ shortcuts: newShortcuts });
          resolve(true);
        });
      });
    }
  
    setupCommandListener() {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'dynamic-shortcut') {
          // This will be handled by the content script's key detection
        }
      });
    }
  
    getShortcutForAction(action) {
      return this._currentShortcuts[action] || this.defaultShortcuts[action];
    }
  }