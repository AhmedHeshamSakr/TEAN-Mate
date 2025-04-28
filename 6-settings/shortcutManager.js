export class ShortcutManager {
    constructor() {
      // this.defaultShortcuts = {
      //   "skip-next": { key: "ArrowDown", modifiers: ["alt"] },
      //   "skip-previous": { key: "ArrowUp", modifiers: ["alt"] },
      //   "toggle-reading": { key: " ", modifiers: ["alt"] },
      //   "access-link": { key: "Enter", modifiers: ["alt"] },
      //   "toggle-stt": { key: "s", modifiers: ["alt", "shift"] }
      // };
      this.actionNames = {
        'skip-next': 'Skip Next',
        'skip-previous': 'Skip Previous',
        'toggle-reading': 'Toggle Reading',
        'access-link': 'Access Link',
        'toggle-stt': 'Toggle STT'
      };
      
      this.defaultShortcuts = this.getPlatformDefaults();
      this.currentShortcuts = {...this.defaultShortcuts}; // Initialize immediately
    }
  
    getPlatformDefaults() {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      
      return {
        "skip-next": isMac ? 
          { key: "Right", modifiers: ["Command", "Shift"] } : 
          { key: "Right", modifiers: ["Ctrl"] },
        "skip-previous": isMac ?
          { key: "Left", modifiers: ["meta", "shift"] } :
          { key: "Left", modifiers: ["ctrl"] },
        "toggle-reading": isMac ?
          { key: "Space", modifiers: ["meta", "shift"] } :
          { key: "Space", modifiers: ["ctrl"] },
        "access-link": isMac ?
          { key: "Enter", modifiers: ["meta", "shift"] } :
          { key: "Enter", modifiers: ["ctrl"] },
        // "toggle-stt": isMac ?
        //   { key: "S", modifiers: ["meta", "shift"] } :
        //   { key: "S", modifiers: ["alt", "shift"] }
      };
    }    

  
    async initialize() {
      try {
        await this.loadShortcuts();
      } catch (error) {
        console.error("Failed to load shortcuts, using defaults:", error);
        this.currentShortcuts = {...this.defaultShortcuts};
      }
    }

    get shortcuts() {
      return this.currentShortcuts;
    }

    async resetToDefaults() {
      // this.currentShortcuts = {...this.defaultShortcuts};
      return this.saveShortcuts(this.defaultShortcuts);
    }
  
    async loadShortcuts() {
      return new Promise((resolve) => {
        // Try sync storage first
        chrome.storage.sync.get(['shortcuts'], (result) => {
          if (result.shortcuts) {
            this.currentShortcuts = result.shortcuts;
          } else {
            // // Fall back to local storage
            // chrome.storage.local.get(['shortcuts'], (result) => {
            //   this.currentShortcuts = result.shortcuts || this.defaultShortcuts;
            // });
            this.currentShortcuts = {...this.defaultShortcuts};
            this.saveShortcuts(this.currentShortcuts);
          }
          resolve(this.currentShortcuts);
        });
      });
    }
  
  
    // async saveShortcuts(newShortcuts) {
    //   // Validate that all required actions have shortcuts
    //   const requiredActions = Object.keys(this.defaultShortcuts);
    //   const hasAllActions = requiredActions.every(action => 
    //     newShortcuts[action] && 
    //     newShortcuts[action].key && 
    //     Array.isArray(newShortcuts[action].modifiers)
    //   );
      
    //   if (!hasAllActions) {
    //     console.error('Invalid shortcut configuration');
    //     return false;
    //   }
      
    //   this.currentShortcuts = newShortcuts;
    //   return new Promise((resolve) => {
    //     chrome.storage.sync.set({ shortcuts: newShortcuts }, () => {
    //       // Also save to local as backup
    //       chrome.storage.local.set({ shortcuts: newShortcuts });
    //       resolve(true);
    //     });
    //   });
    // }

    async saveShortcuts(newShortcuts) {
      // Validate before saving
      if (!this.validateShortcuts(newShortcuts)) {
        throw new Error("Invalid shortcut configuration");
      }
            // Update in-memory cache first
            this.currentShortcuts = newShortcuts;

      // Create a single storage operation promise
        try {
          // Save to both storage areas in parallel
          await Promise.all([
            chrome.storage.sync.set({ shortcuts: newShortcuts }),
            chrome.storage.local.set({ shortcuts: newShortcuts })
          ]);
        } catch (storageError) {
          console.error("Storage save failed:", storageError);
          // If sync fails but local succeeds, that's acceptable
      };      
      return true;
    }

    // async broadcastShortcutsUpdate(shortcuts) {
    //   try {
    //     // Send to all tabs
    //     const tabs = await chrome.tabs.query({});
    //     await Promise.allSettled(
    //       tabs.map(tab => {
    //         return chrome.tabs.sendMessage(tab.id, {
    //           action: "shortcuts-updated",
    //           shortcuts
    //         }).catch(() => {}); // Ignore tabs without content script
    //       })
    //     );
        
    //     // Send to extension pages
    //     chrome.runtime.sendMessage({
    //       action: "shortcuts-updated", 
    //       shortcuts
    //     }).catch(() => {}); // Ignore if no listeners
    //   } catch (error) {
    //     console.error("Broadcast failed:", error);
    //   }
    // }


    validateShortcuts(shortcuts) {
      // Check all required actions exist
      // const requiredActions = Object.keys(this.defaultShortcuts);
      // if (!requiredActions.every(action => shortcuts[action])) {
      //   return false;
      // }
      
      // Check for conflicts
      const shortcutMap = new Map();
      for (const [action, shortcut] of Object.entries(shortcuts)) {
        const key = `${shortcut.modifiers.sort().join('+')}+${shortcut.key}`.toLowerCase();
        if (shortcutMap.has(key)) {
          return false; // Conflict found
        }
        shortcutMap.set(key, action);
      }
      
      return true;
    }
  
    setupCommandListener() {
      chrome.commands.onCommand.addListener((command) => {
        if (command === 'dynamic-shortcut') {
          // This will be handled by the content script's key detection
        }
      });
    }
  
    getShortcutForAction(action) {
      return this.currentShortcuts[action] || this.defaultShortcuts[action];
    }
  }