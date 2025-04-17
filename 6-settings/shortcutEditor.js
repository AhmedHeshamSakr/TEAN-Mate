class ShortcutEditor {
    constructor() {
      this.recording = false;
      this.currentAction = null;
      this.shortcuts = {};
      this.keyElements = new Map(); // Stores key elements for each action
      this.actionNamesMap = {
        'skip-next': 'Skip Next',
        'skip-previous': 'Skip Previous',
        'toggle-reading': 'Start/Stop Reading',
        'access-link': 'Access Link',
        'toggle-stt': 'Toggle STT'
      };
      this.init();
    }
  
    async init() {
      try {
        await this.loadShortcuts();
        this.cacheKeyElements();
        this.setupEventListeners();
        this.setupResetButton();
      } catch (error) {
        console.error("Error initializing ShortcutEditor:", error);
        this.showError("Failed to initialize shortcut editor. Please try reloading the page.");
      }
    }
  
    cacheKeyElements() {
      document.querySelectorAll('.keyboard-item').forEach(item => {
        const actionElement = item.querySelector('.shortcut-action');
        if (actionElement) {
          const displayName = actionElement.textContent.trim();
          const keyElements = Array.from(item.querySelectorAll('.keyboard-key'));
          
          // Find the technical action name from the display name
          const technicalName = Object.keys(this.actionNamesMap).find(
            key => this.actionNamesMap[key] === displayName
          );
          
          if (technicalName) {
            this.keyElements.set(technicalName, {
              displayName,
              elements: keyElements,
              item
            });
          }
        }
      });
    }
  
    async loadShortcuts() {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "shortcut-get-shortcuts" },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
              return;
            }
            
            if (response && response.shortcuts) {
              this.shortcuts = response.shortcuts;
              this.updateShortcutDisplay();
              resolve();
            } else {
              reject(new Error("Failed to load shortcuts"));
            }
          }
        );
      });
    }
  
    // // Maps technical action names to display names
    // mapActionNamesToKeys(shortcuts) {
    //   return {
    //     'Skip Next': shortcuts['skip-next'],
    //     'Skip Previous': shortcuts['skip-previous'],
    //     'Start/Stop Reading': shortcuts['toggle-reading'],
    //     'Access Link': shortcuts['access-link'],
    //     'Toggle STT': shortcuts['toggle-stt']
    //   };
    // }
  
    // // Reverse mapping for saving
    // mapDisplayNamesToKeys(shortcuts) {
    //   return {
    //     'skip-next': shortcuts['Skip Next'],
    //     'skip-previous': shortcuts['Skip Previous'],
    //     'toggle-reading': shortcuts['Start/Stop Reading'],
    //     'access-link': shortcuts['Access Link'],
    //     'toggle-stt': shortcuts['Toggle STT']
    //   };
    // }
  
    updateShortcutDisplay() {
      Object.entries(this.shortcuts).forEach(([actionName, shortcut]) => {
        const keyData = this.keyElements.get(actionName);
        if (!keyData) return;
        
        const { elements } = keyData;
        
        // Clear existing keys
        elements.forEach(el => {
          el.textContent = '';
          el.classList.remove('has-key');
        });
        
        if (!shortcut || !shortcut.key) return;
        
        // Add modifier keys
        let keyIndex = 0;
        shortcut.modifiers.forEach(mod => {
          if (keyIndex < elements.length) {
            elements[keyIndex].textContent = this.formatKeyName(mod);
            elements[keyIndex].classList.add('has-key');
            keyIndex++;
          }
        });
        
        // Add main key
        if (keyIndex < elements.length) {
          elements[keyIndex].textContent = this.formatKeyName(shortcut.key);
          elements[keyIndex].classList.add('has-key');
        }
      });
    }
  
    formatKeyName(key) {
      const keyMap = {
        'ctrl': 'Ctrl',
        'alt': 'Alt',
        'shift': 'Shift',
        'meta': 'Cmd',
        'arrowup': '↑',
        'arrowdown': '↓',
        'arrowleft': '←',
        'arrowright': '→',
        ' ': 'Space',
        'escape': 'Esc',
        'enter': '↵',
        'tab': 'Tab',
        'delete': 'Del',
        'backspace': '⌫'
      };
      
      const formattedKey = keyMap[key.toLowerCase()] || key.toUpperCase();
      return formattedKey.length === 1 ? formattedKey.toUpperCase() : formattedKey;
    }
  
  
// setupEventListeners() {
//     document.querySelectorAll('.keyboard-item').forEach(item => {
//       console.log('Adding listener to:', item); // Debug log
//       item.addEventListener('click', (e) => {
//         console.log('Item clicked'); // Verify clicks work
//         if (this.recording) return;
        
//         const actionElement = item.querySelector('.shortcut-action');
//         if (actionElement) {
//           this.currentAction = actionElement.textContent.trim();
//           console.log('Starting recording for:', this.currentAction);
//           this.startRecording(item);
//         }
//       });
//     });
//   }
setupEventListeners() {
  this.keyElements.forEach((keyData, actionName) => {
    const { item } = keyData;
    
    item.addEventListener('click', (e) => {
      // Skip if already recording another shortcut
      if (this.recording) return;
      
      this.currentAction = actionName;
      this.startRecording(item);
    });
  });
}

setupResetButton() {
  const resetBtn = document.getElementById('resetShortcuts');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm("Are you sure you want to reset all keyboard shortcuts to their default values?")) {
        try {
          const response = await this.sendMessage({
            action: "shortcut-reset-defaults"
          });
          
          if (response && response.success) {
            await this.loadShortcuts();
            this.showToast("Shortcuts have been reset to defaults", "success");
          } else {
            this.showToast("Failed to reset shortcuts", "error");
          }
        } catch (error) {
          console.error("Error resetting shortcuts:", error);
          this.showToast("Failed to reset shortcuts", "error");
        }
      }
    });
  }
}
startRecording(item) {
  this.recording = true;
  const originalContent = item.innerHTML;
  item.innerHTML = '<div class="recording-prompt">Press key combination...</div>';
  item.classList.add('recording');

  // Overlay to block clicks outside
  const overlay = document.createElement('div');
  overlay.className = 'shortcut-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    zIndex: '9999'
  });
  document.body.appendChild(overlay);

  const escapeInfo = document.createElement('div');
  escapeInfo.className = 'escape-info';
  escapeInfo.textContent = 'Press Escape to cancel';
  Object.assign(escapeInfo.style, {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    borderRadius: '4px',
    zIndex: '10000'
  });
  document.body.appendChild(escapeInfo);

  const handler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      this.cancelRecording(item, originalContent, handler, overlay, escapeInfo);
      return;
    }

    if (['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) return;

    const modifiers = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');

    this.shortcuts[this.currentAction] = {
      key: e.key.toLowerCase(),
      modifiers
    };

    this.saveShortcuts();
    this.cancelRecording(item, originalContent, handler, overlay, escapeInfo);
  };

  window.addEventListener('keydown', handler, { capture: true });
}

cancelRecording(item, originalContent, handler, overlay, escapeInfo) {
  this.recording = false;
  item.innerHTML = originalContent;
  item.classList.remove('recording');
  window.removeEventListener('keydown', handler, { capture: true });

  if (overlay) document.body.removeChild(overlay);
  if (escapeInfo) document.body.removeChild(escapeInfo);

  this.updateShortcutDisplay();
}

saveShortcuts() {
  chrome.runtime.sendMessage({
    action: "shortcut-update-shortcuts",
    newShortcuts: this.shortcuts
  });
}

sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

showToast(message, type) {
  // Basic implementation, can be styled or replaced by a proper toast library
  alert(`${type === 'success' ? '✔️' : '❌'} ${message}`);
}

showError(message) {
  console.error(message);
  this.showToast(message, 'error');
}
}

new ShortcutEditor();