// class ShortcutEditor {
//     constructor() {

//       this.recording = false;
//       this.currentAction = null;
//       this.shortcuts = {};
//       // this.keyElements = new Map(); // Stores key elements for each action
//       this.actionNames = {
//         'skip-next': 'Skip Next',
//         'skip-previous': 'Skip Previous',
//         'toggle-reading': 'Start/Stop Reading',
//         'access-link': 'Access Link',
//         'toggle-stt': 'Toggle STT'
//       };
//       this.init();
//     }
  
//     async init() {
//       try {
//         await this.loadShortcuts();
//         // this.cacheKeyElements();
//         this.setupEventListeners();
//         this.setupUI();

//         // this.setupResetButton();
//         // this.setupEditButton();

//       } catch (error) {
//         console.error("Error initializing ShortcutEditor:", error);
//         this.showError("Failed to initialize shortcut editor. Please try reloading the page.");
//       }
//     }

//     setupUI() {
//       Object.entries(this.actionNames).forEach(([action, name]) => {
//         const element = document.querySelector(`[data-action="${action}"]`);
//         if (element) {
//           const keysElement = element.querySelector('.shortcut-keys');
//           keysElement.innerHTML = this.formatShortcut(this.shortcuts[action]);
//         }
//       });
//     }

//     formatShortcut(shortcut) {
//       if (!shortcut) return '';
//       return [
//         ...shortcut.modifiers.map(m => `<span class="key">${this.formatKey(m)}</span>`),
//         `<span class="key">${this.formatKey(shortcut.key)}</span>`
//       ].join(' + ');
//     }
  
//     formatKey(key) {
//       const keyMap = {
//         'ctrl': 'Ctrl',
//         'alt': 'Alt',
//         'shift': 'Shift',
//         'meta': 'Cmd',
//         'right': '→',
//         'left': '←',
//         'space': 'Space',
//         'enter': 'Enter'
//       };
//       return keyMap[key.toLowerCase()] || key.toUpperCase();
//     }

//     // setupEditButton() {
//     //   console.log("ShortcutEditor constructor called4!"); // Debug log

//     //   const editButton = document.getElementById('editShortcuts');
//     //   if (editButton) {
//     //     editButton.addEventListener('click', () => {
//     //       // Toggle the shortcut editing UI
//     //       const shortcutContainer = document.querySelector('.keyboard-shortcuts-container');
//     //       if (shortcutContainer) {
//     //         shortcutContainer.classList.toggle('editing-mode');
             
//     //         // Update button text
//     //         editButton.textContent = shortcutContainer.classList.contains('editing-mode') 
//     //           ? 'Done' 
//     //           : 'Edit Shortcuts';
            
//     //         // You might want to add some visual indication that shortcuts are editable
//     //         const shortcutItems = document.querySelectorAll('.keyboard-item');
//     //         shortcutItems.forEach(item => {
//     //           item.classList.toggle('editable', shortcutContainer.classList.contains('editing-mode'));
//     //         });
//     //       }
//     //     });
//     //   }
//     // }
  
//     // cacheKeyElements() {
//     //   document.querySelectorAll('.keyboard-item').forEach(item => {
//     //     const actionElement = item.querySelector('.shortcut-action');
//     //     if (actionElement) {
//     //       const displayName = actionElement.textContent.trim();
//     //       const keyElements = Array.from(item.querySelectorAll('.keyboard-key'));
          
//     //       // Find the technical action name from the display name
//     //       const technicalName = Object.keys(this.actionNamesMap).find(
//     //         key => this.actionNamesMap[key] === displayName
//     //       );
          
//     //       if (technicalName) {
//     //         this.keyElements.set(technicalName, {
//     //           displayName,
//     //           elements: keyElements,
//     //           item
//     //         });
//     //       }
//     //     }
//     //   });
//     // }
//     async loadShortcuts() {
//       try {
//         return new Promise((resolve, reject) => {
//           chrome.runtime.sendMessage(
//             { action: "shortcut-get-shortcuts" },
//             (response) => {
//               if (chrome.runtime.lastError) {
//                 console.error("Error loading shortcuts:", chrome.runtime.lastError);
//                 reject(chrome.runtime.lastError);
//                 return;
//               }
              
//               if (response && response.shortcuts) {
//                 // this.shortcutMap = response.shortcuts;
//                 this.shortcuts = response?.shortcuts || {}; // critical fix
//                 this.shortcutMap = response.shortcuts; // optional, if used elsewhere
 
//                 console.log("Shortcuts loaded in content script:", this.shortcutMap);
//                 resolve(this.shortcutMap);
//               } else {
//                 const error = new Error('Failed to load shortcuts');
//                 console.error(error);
//                 reject(error);
//               }
//             }
//           );
//         });
//       } catch (error) {
//         console.error("Exception in loadShortcuts:", error);
//         // Fall back to empty shortcuts
//         this.shortcutMap = {};
//         return {};
//       }
//     }
//     // // Maps technical action names to display names
//     // mapActionNamesToKeys(shortcuts) {
//     //   return {
//     //     'Skip Next': shortcuts['skip-next'],
//     //     'Skip Previous': shortcuts['skip-previous'],
//     //     'Start/Stop Reading': shortcuts['toggle-reading'],
//     //     'Access Link': shortcuts['access-link'],
//     //     'Toggle STT': shortcuts['toggle-stt']
//     //   };
//     // }
  
//     // // Reverse mapping for saving
//     // mapDisplayNamesToKeys(shortcuts) {
//     //   return {
//     //     'skip-next': shortcuts['Skip Next'],
//     //     'skip-previous': shortcuts['Skip Previous'],
//     //     'toggle-reading': shortcuts['Start/Stop Reading'],
//     //     'access-link': shortcuts['Access Link'],
//     //     'toggle-stt': shortcuts['Toggle STT']
//     //   };
//     // }
  
//     updateShortcutDisplay() {
//       if (!this.shortcuts || typeof this.shortcuts !== 'object') {
//         console.warn("Shortcuts not ready, skipping display update");
//         return;
//       }
    
//       Object.entries(this.shortcuts).forEach(([actionName, shortcut]) => {
//         const keyData = this.keyElements.get(actionName);
//         if (!keyData) return;
        
//         const { elements } = keyData;
        
//         // Clear existing keys
//         elements.forEach(el => {
//           el.textContent = '';
//           el.classList.remove('has-key');
//         });
        
//         if (!shortcut || !shortcut.key) return;
        
//         // Add modifier keys
//         let keyIndex = 0;
//         shortcut.modifiers.forEach(mod => {
//           if (keyIndex < elements.length) {
//             elements[keyIndex].textContent = this.formatKeyName(mod);
//             elements[keyIndex].classList.add('has-key');
//             keyIndex++;
//           }
//         });
        
//         // Add main key
//         if (keyIndex < elements.length) {
//           elements[keyIndex].textContent = this.formatKeyName(shortcut.key);
//           elements[keyIndex].classList.add('has-key');
//         }
//       });
//     }
  
//     formatKeyName(key) {
//       const keyMap = {
//         'ctrl': 'Ctrl',
//         'alt': 'Alt',
//         'shift': 'Shift',
//         'meta': 'Cmd',
//         'arrowup': '↑',
//         'arrowdown': '↓',
//         'arrowleft': '←',
//         'arrowright': '→',
//         ' ': 'Space',
//         'escape': 'Esc',
//         'enter': '↵',
//         'tab': 'Tab',
//         'delete': 'Del',
//         'backspace': '⌫'
//       };
      
//       const formattedKey = keyMap[key.toLowerCase()] || key.toUpperCase();
//       return formattedKey.length === 1 ? formattedKey.toUpperCase() : formattedKey;
//     }
  
  
// // setupEventListeners() {
// //     document.querySelectorAll('.keyboard-item').forEach(item => {
// //       console.log('Adding listener to:', item); // Debug log
// //       item.addEventListener('click', (e) => {
// //         console.log('Item clicked'); // Verify clicks work
// //         if (this.recording) return;
        
// //         const actionElement = item.querySelector('.shortcut-action');
// //         if (actionElement) {
// //           this.currentAction = actionElement.textContent.trim();
// //           console.log('Starting recording for:', this.currentAction);
// //           this.startRecording(item);
// //         }
// //       });
// //     });
// //   }
// setupEventListeners() {
//   document.querySelectorAll('[data-action]').forEach(item => {
//     item.addEventListener('click', () => {
//       if (this.recording) return;
//       this.startRecording(item);
//     });
//   });
  
//   document.getElementById('resetShortcuts')?.addEventListener('click', () => {
//     if (confirm("Reset all shortcuts to defaults?")) {
//       chrome.runtime.sendMessage(
//         { action: "shortcut-reset-defaults" },
//         () => location.reload()
//       );
//     }
//   });
// }

// // setupResetButton() {
// //   const resetBtn = document.getElementById('resetShortcuts');
// //   if (resetBtn) {
// //     resetBtn.addEventListener('click', async () => {
// //       if (confirm("Are you sure you want to reset all keyboard shortcuts to their default values?")) {
// //         try {
// //           const response = await this.sendMessage({
// //             action: "shortcut-reset-defaults"
// //           });
          
// //           if (response && response.success) {
// //             await this.loadShortcuts();
// //             this.showToast("Shortcuts have been reset to defaults", "success");
// //           } else {
// //             this.showToast("Failed to reset shortcuts", "error");
// //           }
// //         } catch (error) {
// //           console.error("Error resetting shortcuts:", error);
// //           this.showToast("Failed to reset shortcuts", "error");
// //         }
// //       }
// //     });
// //   }
// // }
// // startRecording(item) {
// //   this.recording = true;
// //   const originalContent = item.innerHTML;
// //   item.innerHTML = '<div class="recording-prompt">Press key combination...</div>';
// //   item.classList.add('recording');

// //   // Overlay to block clicks outside
// //   const overlay = document.createElement('div');
// //   overlay.className = 'shortcut-overlay';
// //   Object.assign(overlay.style, {
// //     position: 'fixed',
// //     top: '0',
// //     left: '0',
// //     width: '100%',
// //     height: '100%',
// //     zIndex: '9999'
// //   });
// //   document.body.appendChild(overlay);

// //   const escapeInfo = document.createElement('div');
// //   escapeInfo.className = 'escape-info';
// //   escapeInfo.textContent = 'Press Escape to cancel';
// //   Object.assign(escapeInfo.style, {
// //     position: 'fixed',
// //     bottom: '20px',
// //     left: '50%',
// //     transform: 'translateX(-50%)',
// //     padding: '8px 16px',
// //     backgroundColor: 'rgba(0,0,0,0.7)',
// //     color: 'white',
// //     borderRadius: '4px',
// //     zIndex: '10000'
// //   });
// //   document.body.appendChild(escapeInfo);

// //   const handler = (e) => {
// //     e.preventDefault();
// //     e.stopPropagation();

// //     if (e.key === 'Escape') {
// //       this.cancelRecording(item, originalContent, handler, overlay, escapeInfo);
// //       return;
// //     }

// //     if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

// //     const modifiers = [];
// //     if (e.ctrlKey) modifiers.push('ctrl');
// //     if (e.altKey) modifiers.push('alt');
// //     if (e.shiftKey) modifiers.push('shift');
// //     if (e.metaKey) modifiers.push('meta');

// //     this.shortcuts[this.currentAction] = {
// //       key: e.key.toLowerCase(),
// //       modifiers
// //     };

// //     this.saveShortcuts();
// //     this.cancelRecording(item, originalContent, handler, overlay, escapeInfo);
// //   };

// //   window.addEventListener('keydown', handler, { capture: true });
// // }
// // startRecording(item) {
// //   this.recording = true;
// //   const originalContent = item.innerHTML;
// //   item.innerHTML = '<div class="recording-prompt">Press key combination...</div>';
// //   item.classList.add('recording');

// //   // Overlay to block clicks outside
// //   const overlay = document.createElement('div');
// //   overlay.className = 'shortcut-overlay';
// //   Object.assign(overlay.style, {
// //     position: 'fixed',
// //     top: '0',
// //     left: '0',
// //     width: '100%',
// //     height: '100%',
// //     zIndex: '9999'
// //   });
// //   document.body.appendChild(overlay);

// //   const escapeInfo = document.createElement('div');
// //   escapeInfo.className = 'escape-info';
// //   escapeInfo.textContent = 'Press Escape to cancel';
// //   Object.assign(escapeInfo.style, {
// //     position: 'fixed',
// //     bottom: '20px',
// //     left: '50%',
// //     transform: 'translateX(-50%)',
// //     padding: '8px 16px',
// //     backgroundColor: 'rgba(0,0,0,0.7)',
// //     color: 'white',
// //     borderRadius: '4px',
// //     zIndex: '10000'
// //   });
// //   document.body.appendChild(escapeInfo);

// //   // This handler function processes keyboard input
// //   const handler = (e) => {
// //     console.log("Key pressed:", e.key); // Debugging
// //     e.preventDefault();
// //     e.stopPropagation();

// //     if (e.key === 'Escape') {
// //       this.cancelRecording(item, originalContent, handler, overlay, escapeInfo);
// //       return;
// //     }

// //     if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

// //     const modifiers = [];
// //     if (e.ctrlKey) modifiers.push('ctrl');
// //     if (e.altKey) modifiers.push('alt');
// //     if (e.shiftKey) modifiers.push('shift');
// //     if (e.metaKey) modifiers.push('meta');

// //     console.log("Recording shortcut:", e.key, modifiers); // Debugging

// //     this.shortcuts[this.currentAction] = {
// //       key: e.key.toLowerCase(),
// //       modifiers
// //     };

// //     this.saveShortcuts(this.shortcuts);
// //     this.cancelRecording(item, originalContent, handler, overlay, escapeInfo);
// //   };

// //   // Use a setTimeout to ensure the listener is attached after the current event completes
// //   setTimeout(() => {
// //     // Add a message to the console to confirm we're waiting for keys
// //     console.log("Waiting for key presses...");
    
// //     // Attach to document for broadest capture
// //     document.addEventListener('keydown', handler, { capture: true });
// //   }, 100);
// // }

// // cancelRecording(item, originalContent, handler, overlay, escapeInfo) {
// //   console.log("Canceling recording"); // Debugging

// //   this.recording = false;
// //   item.innerHTML = originalContent;
// //   item.classList.remove('recording');
// //   window.removeEventListener('keydown', handler, { capture: true });

// //   if (overlay && overlay.parentNode === document.body) {
// //     document.body.removeChild(overlay);
// // }

// // if (escapeInfo && escapeInfo.parentNode === document.body) {
// //     document.body.removeChild(escapeInfo);
// // }


// //   this.updateShortcutDisplay();
// // }

// startRecording(item) {
//   this.recording = true;
//   this.currentAction = item.dataset.action;
//   const originalHTML = item.innerHTML;
  
//   item.innerHTML = `
//     <div class="recording">
//       <div class="prompt">Press new shortcut...</div>
//       <div class="hint">Press Esc to cancel</div>
//     </div>
//   `;
  
//   const keyHandler = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     if (e.key === 'Escape') {
//       this.cancelRecording(item, originalHTML, keyHandler);
//       return;
//     }
    
//     if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;
    
//     const modifiers = [];
//     if (e.ctrlKey) modifiers.push('ctrl');
//     if (e.altKey) modifiers.push('alt');
//     if (e.shiftKey) modifiers.push('shift');
//     if (e.metaKey) modifiers.push('meta');
    
//     const key = this.normalizeKey(e.key);
//     this.saveShortcut(this.currentAction, key, modifiers);
//     this.cancelRecording(item, originalHTML, keyHandler);
//   };
  
//   window.addEventListener('keydown', keyHandler, { once: true });
// }

// cancelRecording(item, originalHTML, handler) {
//   this.recording = false;
//   item.innerHTML = originalHTML;
//   window.removeEventListener('keydown', handler);
// }
// // saveShortcuts() {
// //   chrome.runtime.sendMessage({
// //     action: "shortcut-update-shortcuts",
// //     newShortcuts: this.shortcuts
// //   });
// // }

// // async saveShortcuts(newShortcuts) {
// //   // Validate that all required actions have shortcuts
// //   const requiredActions = this.defaultShortcuts ? Object.keys(this.defaultShortcuts) : [];
  
// //   // Check that all required shortcuts exist
// //   const hasAllActions = requiredActions.every(action =>
// //     newShortcuts[action] &&
// //     newShortcuts[action].key &&
// //     Array.isArray(newShortcuts[action].modifiers)
// //   );
  
// //   if (!hasAllActions) {
// //     console.error('Invalid shortcut configuration - missing required shortcuts');
// //     return false;
// //   }
  
// //   // Check for conflicts between shortcuts
// //   const shortcutMap = new Map();
// //   for (const [action, shortcut] of Object.entries(newShortcuts)) {
// //     const key = shortcut.key.toLowerCase();
// //     const modifiers = shortcut.modifiers.sort().join(',');
// //     const shortcutKey = `${modifiers}+${key}`;
    
// //     if (shortcutMap.has(shortcutKey)) {
// //       console.error(`Shortcut conflict: ${action} and ${shortcutMap.get(shortcutKey)} use the same combination`);
// //       return false;
// //     }
    
// //     shortcutMap.set(shortcutKey, action);
// //   }
  
// //   this.currentShortcuts = newShortcuts;
// //   return new Promise((resolve) => {
// //     chrome.storage.sync.set({ shortcuts: newShortcuts }, () => {
// //       // Also save to local as backup
// //       chrome.storage.local.set({ shortcuts: newShortcuts });
// //       // Notify other parts of the extension
// //       chrome.runtime.sendMessage({
// //         action: "shortcuts-updated",
// //         shortcuts: newShortcuts
// //       });
// //       resolve(true);
// //     });
// //   });
// // }
// async saveShortcut(action, key, modifiers) {
//   const newShortcuts = {...this.shortcuts, [action]: { key, modifiers }};
  
//   chrome.runtime.sendMessage({
//     action: "shortcut-update-shortcuts",
//     newShortcuts
//   }, (response) => {
//     if (response?.success) {
//       this.shortcuts = newShortcuts;
//       this.setupUI();
//     } else {
//       alert("Failed to save shortcut. It may conflict with another shortcut.");
//     }
//   });
// }
// sendMessage(message) {
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage(message, (response) => {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError);
//       } else {
//         resolve(response);
//       }
//     });
//   });
// }

// showToast(message, type) {
//   // Basic implementation, can be styled or replaced by a proper toast library
//   alert(`${type === 'success' ? '✔️' : '❌'} ${message}`);
// }

// showError(message) {
//   console.error(message);
//   this.showToast(message, 'error');
//   }
// }

// new ShortcutEditor();
class ShortcutEditor {
  constructor() {
    this.recording = false;
    this.currentAction = null;
    this.keyElements = new Map();
    this.shortcuts = {};
    this.actionNames = {
      'skip-next': 'Skip Next',
      'skip-previous': 'Skip Previous',
      'toggle-reading': 'Start/Stop Reading',
      'access-link': 'Access Link',
      'toggle-stt': 'Toggle STT'
    };
    this.init();
  }

  // Add the missing normalizeKey function
  normalizeKey(key) {
    const keyMap = {
      'ArrowRight': 'Right',
      'ArrowLeft': 'Left',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      ' ': 'Space',
      'Enter': 'Enter',
      'Escape': 'Esc',
      'Control': 'Ctrl',
      'Meta': 'Cmd'
    };
    return keyMap[key] || key;
  }

  async init() {
    try {
      await this.loadShortcuts();
      this.setupEventListeners();
      this.setupUI();
    } catch (error) {
      console.error("Error initializing ShortcutEditor:", error);
      this.showError("Failed to initialize shortcut editor. Please try reloading the page.");
    }
  }

  setupUI() {
    Object.entries(this.actionNames).forEach(([action, name]) => {
      const item = document.querySelector(`[data-action="${action}"]`);
      if (item) {
        const keysContainer = item.querySelector('.shortcut-keys');
        if (keysContainer) {
          keysContainer.innerHTML = this.formatShortcut(this.shortcuts[action]);
          this.keyElements.set(action, {
            item,
            keysContainer,
            originalHTML: keysContainer.innerHTML
          });
        }
      }
    });
  }
  

  formatShortcut(shortcut) {
    if (!shortcut) return '';
    return [
      ...shortcut.modifiers.map(m => `<span class="key">${this.formatKey(m)}</span>`),
      `<span class="key">${this.formatKey(shortcut.key)}</span>`
    ].join(' + ');
  }

  formatKey(key) {
    const keyMap = {
      'ctrl': 'Ctrl',
      'alt': 'Alt',
      'shift': 'Shift',
      'meta': 'Cmd',
      'right': '→',
      'left': '←',
      'up': '↑',
      'down': '↓',
      'space': 'Space',
      'enter': 'Enter'
    };
    return keyMap[key.toLowerCase()] || key.toUpperCase();
  }

async loadShortcuts() {
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "shortcut-get-shortcuts" },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        }
      );
    });

    if (response?.shortcuts) {
      this.shortcuts = response.shortcuts;
      this.shortcutMap = response.shortcuts;
      return this.shortcutMap;
    }
    throw new Error('No shortcuts in response');
    
  } catch (error) {
    console.error("Error loading shortcuts:", error);
    // Get defaults from background instead of local copy
    const defaultResponse = await new Promise(resolve => {
      chrome.runtime.sendMessage(
        { action: "shortcut-get-defaults" },
        (response) => resolve(response?.defaults || {})
      );
    });
    
    this.shortcuts = defaultResponse;
    this.shortcutMap = defaultResponse;
    return this.shortcutMap;
  }
}

  

  setupEventListeners() {
    document.querySelectorAll('[data-action]').forEach(item => {
      item.addEventListener('click', () => {
        if (this.recording) return;
        this.startRecording(item);
      });
    });
    
    document.getElementById('resetShortcuts')?.addEventListener('click', () => {
      if (confirm("Reset all shortcuts to defaults?")) {
        chrome.runtime.sendMessage(
          { action: "shortcut-reset-defaults" },
          () => location.reload()
        );
      }
    });
  }

  startRecording(item) {
    if (this.recording) return;
    
    this.recording = true;
    this.currentAction = item.dataset.action;
    const element = this.keyElements.get(this.currentAction);
    
    if (!element) {
      console.warn(`No keyElements entry found for action: ${this.currentAction}`);
      this.recording = false;
      return;
    }    
    // Save original state
    element.originalHTML = element.keysContainer.innerHTML;
    element.keysContainer.innerHTML = '<span class="recording-prompt">Press new keys...</span>';
    element.item.classList.add('recording');
    
    // Create overlay
    this.createOverlay();
    
    // Add event listener
    this.keydownHandler = (e) => this.handleKeyDown(e, this.currentAction);
    window.addEventListener('keydown', this.keydownHandler, true);
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'recording-overlay';
    this.overlay.innerHTML = `
      <div class="recording-hint">Press any key combination (Esc to cancel)</div>
    `;
    document.body.appendChild(this.overlay);
  }

  handleKeyDown(e, action) {
    e.preventDefault();
    e.stopPropagation();
    
    // Cancel recording
    if (e.key === 'Escape') {
      this.cancelRecording(action);
      return;
    }
    
    // Ignore modifier-only presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    
    // Get modifiers
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');
    
    // Normalize key
    const key = this.normalizeKey(e.key);
    
    // Save the shortcut
    this.saveShortcut(action, key, modifiers);
    this.cancelRecording(action);
  }

  cancelRecording(action) {
    if (!this.recording) return;
    
    this.recording = false;
    const element = this.keyElements.get(action);
    if (element?.originalHTML) {
      element.keysContainer.innerHTML = element.originalHTML;
    }
    
    element?.item.classList.remove('recording');
    window.removeEventListener('keydown', this.keydownHandler, true);
    
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
  }
  async saveShortcut(action, key, modifiers) {
    // Validate the shortcut first
    if (!key || key === 'Escape') {
      this.cancelRecording(action);
      return false;
    }
  
    const newShortcut = { key, modifiers };
    const newShortcuts = { ...this.shortcuts, [action]: newShortcut };
  
    try {
      // Show loading state
      const element = this.keyElements.get(action);
      if (element) {
        element.keysContainer.innerHTML = '<span class="saving">Saving...</span>';
      }
  
      // Save to storage
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "shortcut-update-shortcuts",
          newShortcuts
        }, (response) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(response);
        });
      });
  
      if (!response?.success) {
        throw new Error(response?.error || "Failed to save shortcut");
      }
  
      // Update local state only after successful save
      this.shortcuts = newShortcuts;
      this.updateUI();
      return true;
  
    } catch (error) {
      console.error("Save failed:", error);
      // Revert UI
      if (element && element.originalHTML) {
        element.keysContainer.innerHTML = element.originalHTML;
      }
      this.showError(`Failed to save: ${error.message || error}`);
      return false;
    }
  }
  // async saveShortcut(action, key, modifiers) {
  //   const newShortcuts = { ...this.shortcuts, [action]: { key, modifiers } };
  
  //   // Optimistically update UI
  //   this.shortcuts = newShortcuts;
  //   this.updateUI();
  
  //   let timeoutId;
  
  //   try {
  //     const response = await new Promise((resolve, reject) => {
  //       const message = {
  //         action: "shortcut-update-shortcuts",
  //         newShortcuts
  //       };
  
  //       chrome.runtime.sendMessage(message, (response) => {
  //         clearTimeout(timeoutId);
  //         if (chrome.runtime.lastError) {
  //           reject(chrome.runtime.lastError);
  //         } else {
  //           resolve(response);
  //         }
  //       });
  
  //       timeoutId = setTimeout(() => {
  //         reject(new Error("Timeout after 2 seconds"));
  //       }, 2000);
  //     });
  
  //     if (!response?.success) {
  //       throw new Error(response?.error || "Failed to save shortcut");
  //     }
  
  //     return true;
  //   } catch (error) {
  //     console.error("Save failed:", error);
  
  //     // Revert UI on failure
  //     await this.loadShortcuts();
  //     this.showError(`Failed to save: ${error.message || error}`);
  
  //     return false;
  //   }
  // }
  
  updateUI() {
    Object.entries(this.shortcuts).forEach(([action, shortcut]) => {
      const element = this.keyElements.get(action);
      if (element) {
        element.keysContainer.innerHTML = this.formatShortcut(shortcut);
      }
    });
  }
  

  showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'shortcut-error';
    errorElement.textContent = message;
    document.body.appendChild(errorElement);
    
    setTimeout(() => {
      errorElement.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(errorElement), 300);
    }, 2000);
  }
}

window.ShortcutEditor = ShortcutEditor;
