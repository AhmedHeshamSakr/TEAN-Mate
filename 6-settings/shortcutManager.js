import { ACTIONS } from './constants.js';

/**
 * Handles all keyboard shortcuts except the essential manifest-registered ones
 */
class ShortcutManager {
  constructor(settings, actionHandlers) {
    this.settings = settings;
    this.actionHandlers = actionHandlers;
    this.isEnabled = true;
    
    this.bindEvents();
    this.validateSettings();
  }

  bindEvents() {
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    chrome.storage.onChanged.addListener(this.handleSettingsChange.bind(this));
  }

  handleKeydown(event) {
    if (!this.isEnabled) return;
    if (this.isFormField(event.target)) return;

    const matchedAction = this.findMatchingAction(event);
    if (matchedAction) {
      event.preventDefault();
      this.triggerAction(matchedAction);
    }
  }

  isFormField(element) {
    const formFields = ['INPUT', 'TEXTAREA', 'SELECT'];
    return formFields.includes(element.tagName);
  }

  findMatchingAction(event) {
    return Object.entries(this.settings.shortcuts).find(([action, shortcut]) => {
      return this.matchesShortcut(event, shortcut);
    })?.[0]; // Returns the action name if found
  }

  matchesShortcut(event, shortcut) {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      event.ctrlKey === !!shortcut.ctrl &&
      event.shiftKey === !!shortcut.shift &&
      event.altKey === !!shortcut.alt &&
      !event.metaKey // Ensure Windows/Linux compatibility
    );
  }

  triggerAction(action) {
    if (this.actionHandlers[action]) {
      try {
        this.actionHandlers[action]();
      } catch (error) {
        console.error(`Error executing handler for ${action}:`, error);
      }
    }
  }

  handleSettingsChange(changes) {
    if (changes.shortcuts) {
      this.settings.shortcuts = this.validateShortcuts(changes.shortcuts.newValue);
    }
  }

  validateSettings() {
    this.settings.shortcuts = this.validateShortcuts(this.settings.shortcuts);
  }

  validateShortcuts(shortcuts) {
    const validated = {};
    
    Object.entries(DEFAULT_SHORTCUTS).forEach(([action, defaultShortcut]) => {
      validated[action] = this.isValidShortcut(shortcuts?.[action]) 
        ? shortcuts[action] 
        : defaultShortcut;
    });

    return validated;
  }

  isValidShortcut(shortcut) {
    return shortcut && 
      typeof shortcut.key === 'string' &&
      typeof shortcut.ctrl === 'boolean' &&
      typeof shortcut.shift === 'boolean' &&
      typeof shortcut.alt === 'boolean';
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Default shortcuts (matches constants.js actions)
const DEFAULT_SHORTCUTS = {
  [ACTIONS.EXTRACT_TEXT]: { key: 'x', ctrl: true, shift: false, alt: false },
  [ACTIONS.SKIP_NEXT]: { key: 'n', ctrl: true, shift: false, alt: false },
  [ACTIONS.SKIP_PREVIOUS]: { key: 'p', ctrl: true, shift: false, alt: false },
  [ACTIONS.TOGGLE_READING]: { key: 'r', ctrl: true, shift: false, alt: false }
};

// Initialize with settings from storage
chrome.storage.sync.get(['shortcuts'], (result) => {
  const settings = {
    shortcuts: {
      ...DEFAULT_SHORTCUTS,
      ...(result.shortcuts || {})
    }
  };

  // Action handlers forward to content script via messaging
  const actionHandlers = {
    [ACTIONS.EXTRACT_TEXT]: () => chrome.runtime.sendMessage({ action: ACTIONS.EXTRACT_TEXT }),
    [ACTIONS.SKIP_NEXT]: () => chrome.runtime.sendMessage({ action: ACTIONS.SKIP_NEXT }),
    [ACTIONS.SKIP_PREVIOUS]: () => chrome.runtime.sendMessage({ action: ACTIONS.SKIP_PREVIOUS }),
    [ACTIONS.TOGGLE_READING]: () => chrome.runtime.sendMessage({ action: ACTIONS.TOGGLE_READING })
  };

  // Export for potential debugging
  window.shortcutManager = new ShortcutManager(settings, actionHandlers);
});

// Optional: Type definitions for better IDE support
/**
 * @typedef {Object} ShortcutDefinition
 * @property {string} key - The keyboard key (case-insensitive)
 * @property {boolean} ctrl - Whether Ctrl is required
 * @property {boolean} shift - Whether Shift is required
 * @property {boolean} alt - Whether Alt is required
 */

/**
 * @typedef {Object} ShortcutSettings
 * @property {Object.<string, ShortcutDefinition>} shortcuts
 */