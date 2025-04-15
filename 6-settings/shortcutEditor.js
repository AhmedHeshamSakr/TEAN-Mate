class ShortcutEditor {
    constructor() {
      this.recording = false;
      this.currentAction = null;
      this.shortcuts = {};
      this.keyElements = new Map(); // Stores key elements for each action
      this.init();
    }
  
    async init() {
      await this.loadShortcuts();
      this.cacheKeyElements();
      this.setupEventListeners();
    }
  
    cacheKeyElements() {
      document.querySelectorAll('.keyboard-item').forEach(item => {
        const action = item.querySelector('.shortcut-action').textContent.trim();
        const keyElements = Array.from(item.querySelectorAll('.keyboard-key'));
        this.keyElements.set(action, keyElements);
      });
    }
  
    async loadShortcuts() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "shortcut-get-shortcuts" },
          (response) => {
            this.shortcuts = this.mapActionNamesToKeys(response.shortcuts);
            this.updateShortcutDisplay();
            resolve();
          }
        );
      });
    }
  
    // Maps technical action names to display names
    mapActionNamesToKeys(shortcuts) {
      return {
        'Skip Next': shortcuts['skip-next'],
        'Skip Previous': shortcuts['skip-previous'],
        'Start/Stop Reading': shortcuts['toggle-reading'],
        'Access Link': shortcuts['access-link'],
        'Toggle STT': shortcuts['toggle-stt']
      };
    }
  
    // Reverse mapping for saving
    mapDisplayNamesToKeys(shortcuts) {
      return {
        'skip-next': shortcuts['Skip Next'],
        'skip-previous': shortcuts['Skip Previous'],
        'toggle-reading': shortcuts['Start/Stop Reading'],
        'access-link': shortcuts['Access Link'],
        'toggle-stt': shortcuts['Toggle STT']
      };
    }
  
    updateShortcutDisplay() {
      this.keyElements.forEach((keyElements, action) => {
        const shortcut = this.shortcuts[action];
        if (shortcut) {
          // Clear existing keys
          keyElements.forEach(el => el.textContent = '');
          
          // Add modifier keys
          let keyIndex = 0;
          shortcut.modifiers.forEach(mod => {
            if (keyIndex < keyElements.length) {
              keyElements[keyIndex].textContent = this.formatKeyName(mod);
              keyIndex++;
            }
          });
          
          // Add main key
          if (keyIndex < keyElements.length) {
            keyElements[keyIndex].textContent = this.formatKeyName(shortcut.key);
          }
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
        ' ': 'Space'
      };
      
      return keyMap[key.toLowerCase()] || key.toUpperCase();
    }
  
// In shortcutEditor.js, modify the event listener setup:
setupEventListeners() {
    document.querySelectorAll('.keyboard-item').forEach(item => {
      console.log('Adding listener to:', item); // Debug log
      item.addEventListener('click', (e) => {
        console.log('Item clicked'); // Verify clicks work
        if (this.recording) return;
        
        const actionElement = item.querySelector('.shortcut-action');
        if (actionElement) {
          this.currentAction = actionElement.textContent.trim();
          console.log('Starting recording for:', this.currentAction);
          this.startRecording(item);
        }
      });
    });
  }
    startRecording(item) {
      this.recording = true;
      const originalContent = item.innerHTML;
      item.innerHTML = '<div class="recording-prompt">Press new keys...</div>';
      
      const handler = (e) => {
        if (e.key === 'Escape') {
          this.cancelRecording(item, originalContent, handler);
          return;
        }
        
        if (!['Alt', 'Control', 'Shift', 'Meta'].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          
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
          this.cancelRecording(item, originalContent, handler);
        }
      };
      
      window.addEventListener('keydown', handler, { capture: true });
    }
  
    cancelRecording(item, originalContent, handler) {
      this.recording = false;
      item.innerHTML = originalContent;
      window.removeEventListener('keydown', handler, { capture: true });
      this.updateShortcutDisplay();
    }
  
    saveShortcuts() {
      chrome.runtime.sendMessage({
        action: "shortcut-update-shortcuts",
        newShortcuts: this.mapDisplayNamesToKeys(this.shortcuts)
      });
    }
  }
  
  new ShortcutEditor();