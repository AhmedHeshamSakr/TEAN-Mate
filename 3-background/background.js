import { initializeVoices } from "../2-features/TTS/initializeVoices.js";
class BackgroundHandler {
  constructor() {
    // Define keyboard shortcut commands and their corresponding actions
    // These map Chrome extension commands to content script actions
    this.commands = {
      "skip-next": "skipToNext",
      "skip-previous": "skipToPrevious",
      "toggle-reading": "toggleReading",
      "access-link": "accessLink",
      "toggle-stt": "toggleSTT",
    };

    // Translation Management System
    // This system handles all sign language translations with persistence and history
    this.translations = []; // In-memory storage for quick access
    this.maxStoredTranslations = 100; // Limit to prevent memory issues
    this.translationStats = {
      totalReceived: 0,
      sessionCount: 0,
      lastTranslationTime: null,
      averageConfidence: 0
    };

    // Extension state tracking
    this.extensionState = {
      isInitialized: false,
      lastActiveTabId: null,
      sidebarConnected: false
    };

    // Initialize all background functionality
    this.initialize();
  }

  /**
   * Initialize all event listeners and load persistent data
   * This method sets up the complete background script functionality
   */
  initialize() {
    // Set up all Chrome extension event listeners
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.action.onClicked.addListener(this.onActionClicked.bind(this));
    chrome.commands.onCommand.addListener(this.onCommand.bind(this));
    chrome.runtime.onMessage.addListener(this.onMessage.bind(this));
    
    // Listen for settings changes to update theme across all extension pages
    chrome.storage.onChanged.addListener(this.onStorageChanged.bind(this));
    
    // Listen for tab changes to track active tab for message routing
    chrome.tabs.onActivated.addListener(this.onTabActivated.bind(this));
    chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));

    // Load stored translations and initialize voices when extension starts
    this.loadStoredData();
    
    // Initialize TTS voices for the speech functionality
    this.initializeVoices();

    console.log('[Background] BackgroundHandler initialized with translation management');
  }

  /**
   * Load all persistent data from storage
   * This includes translations, user settings, and extension state
   */
  async loadStoredData() {
    try {
      // Load stored translations for persistence across browser sessions
      await this.loadTranslationsFromStorage();
      
      // Load any other persistent state data
      const result = await chrome.storage.local.get(['extensionState', 'translationStats']);
      
      if (result.translationStats) {
        this.translationStats = { ...this.translationStats, ...result.translationStats };
      }
      
      this.extensionState.isInitialized = true;
      console.log('[Background] Stored data loaded successfully');
      
    } catch (error) {
      console.error('[Background] Error loading stored data:', error);
    }
  }

  /**
   * Initialize TTS voices for speech functionality
   * This ensures voices are available when the extension starts
   */
  async initializeVoices() {
    try {
      const voices = await initializeVoices();
      await chrome.storage.local.set({ voices });
      console.log("[Background] Voices initialized:", voices.length, "voices available");
    } catch (error) {
      console.error("[Background] Failed to initialize voices:", error);
    }
  }

  /**
   * Handle extension installation and setup
   * This runs once when the extension is first installed or updated
   */
  async onInstalled() {
    try {
      // Initialize extension state in storage
      await chrome.storage.local.set({ 
        sidebarOpened: false,
        translationStats: this.translationStats,
        extensionState: this.extensionState
      });
      
      console.log("[Background] Extension installed and state initialized");
    } catch (error) {
      console.error("[Background] Error during installation:", error);
    }
  }

  /**
   * Handle extension icon clicks - opens the sidebar
   */
  onActionClicked(tab) {
    // Track the active tab for message routing
    this.extensionState.lastActiveTabId = tab.id;
    
    // Open the sidebar directly when the extension icon is clicked
    chrome.sidePanel.open({ windowId: tab.windowId });
    
    console.log('[Background] Sidebar opened for tab:', tab.id);
  }

  /**
   * Handle keyboard shortcut commands
   * These commands are defined in manifest.json and trigger content script actions
   */
  onCommand(command) {
    const action = this.commands[command];
    if (action) {
      console.log(`[Background] Executing command: ${command} -> ${action}`);
      this.sendMessageToActiveTab({ action });
    } else {
      console.warn(`[Background] Unknown command: ${command}`);
    }
  }

  /**
   * Handle storage changes (primarily for theme updates)
   */
  onStorageChanged(changes, namespace) {
    if (changes.settings && changes.settings.newValue) {
      const newSettings = changes.settings.newValue;
      
      // If theme changed, notify all extension pages
      if (changes.settings.oldValue && 
          changes.settings.oldValue.theme !== newSettings.theme) {
          
        // Send message to all extension pages (sidebar, options, etc.)
        chrome.runtime.sendMessage({
          action: "themeChanged",
          theme: newSettings.theme
        }).catch(() => {
          // No receivers available - this is normal when no extension pages are open
        });
      }
    }
  }

  /**
   * Track active tab changes for proper message routing
   */
  onTabActivated(activeInfo) {
    this.extensionState.lastActiveTabId = activeInfo.tabId;
  }

  /**
   * Track tab updates to maintain accurate tab state
   */
  onTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.active) {
      this.extensionState.lastActiveTabId = tabId;
    }
  }

  /**
   * Central message handler - routes all messages between extension components
   * This is the heart of the extension's communication system
   */
  onMessage(request, sender, sendResponse) {
    console.log(`[Background] Received message: ${request.action}`, request);

    // Handle different types of messages
    switch (request.action) {
      // TTS Voice Management
      case "getVoices":
        this.handleGetVoices(sendResponse);
        return true; // Required for async response

      // Extension Badge Updates
      case "updateBadge":
        this.updateBadge(request.isActive, request.text);
        break;

      // SIGN LANGUAGE TRANSLATION MANAGEMENT
      // This is the critical section that handles all translation-related messages

      case "signLanguageTranslation":
        // Main translation handler - processes translations from content scripts
        this.handleSignLanguageTranslation(request, sender, sendResponse);
        return true; // Keep message channel open for async response

      case "getTranslationHistory":
        // Sidebar requests for stored translation history
        this.handleGetTranslationHistory(sendResponse);
        return true;

      case "clearTranslationHistory":
        // Clear all stored translations
        this.handleClearTranslationHistory(sendResponse);
        return true;

      case "getTranslationStats":
        // Provide translation statistics for analytics
        this.handleGetTranslationStats(sendResponse);
        return true;

      case "exportTranslations":
        // Export translations for backup or sharing
        this.handleExportTranslations(sendResponse);
        return true;

      // MEDIAPIPE STATUS FORWARDING
      // These messages need to be forwarded to the sidebar for real-time updates

      case "handLandmarksUpdate":
        // Forward hand detection updates to sidebar
        this.forwardToSidebar(request);
        break;

      case "screenSharingStatus":
        // Forward screen sharing status to sidebar
        this.forwardToSidebar(request);
        break;

      case "debugModeStatus":
        // Forward debug mode status to sidebar
        this.forwardToSidebar(request);
        break;

      // SIDEBAR CONNECTION MANAGEMENT
      case "sidebarConnected":
        // Track when sidebar connects for better message routing
        this.extensionState.sidebarConnected = true;
        console.log('[Background] Sidebar connected');
        break;

      case "sidebarDisconnected":
        // Track when sidebar disconnects
        this.extensionState.sidebarConnected = false;
        console.log('[Background] Sidebar disconnected');
        break;

      default:
        console.log(`[Background] Unhandled message action: ${request.action}`);
    }
  }

  /**
   * Handle voice retrieval requests for TTS functionality
   */
  handleGetVoices(sendResponse) {
    chrome.storage.local.get("voices", (result) => {
      sendResponse({ 
        voices: result.voices || [],
        count: result.voices ? result.voices.length : 0
      });
    });
  }

  /**
   * MAIN TRANSLATION HANDLER
   * This is the core method that processes all sign language translations
   * It enriches the translation data, stores it, and forwards it to the sidebar
   */
  async handleSignLanguageTranslation(request, sender, sendResponse) {
    try {
      console.log('[Background] Processing sign language translation:', request.translatedText);

      // Create enriched translation data with metadata
      const translationData = {
        // Core translation content
        id: Date.now() + Math.random(), // Unique identifier
        text: request.translatedText,
        timestamp: request.timestamp || Date.now(),
        confidence: request.confidence,
        words: request.words,
        
        // Tab and context metadata
        tabId: sender.tab?.id,
        tabUrl: sender.tab?.url,
        tabTitle: sender.tab?.title,
        
        // Processing metadata
        processed: true,
        source: 'sign-language',
        sessionId: this.generateSessionId()
      };

      // Store the translation in our management system
      await this.addTranslation(translationData);

      // Update statistics for analytics
      this.updateTranslationStats(translationData);

      // Forward the translation to the sidebar for immediate display
      // We send the original request format to maintain compatibility with sidebar
      this.forwardToSidebar({
        action: "signLanguageTranslation",
        translatedText: request.translatedText,
        timestamp: request.timestamp,
        confidence: request.confidence,
        words: request.words,
        translationHistory: request.translationHistory
      });

      // Provide visual feedback with badge notification
      this.updateTranslationBadge();

      // Send success response back to content script
      sendResponse({ 
        success: true, 
        translationId: translationData.id,
        stored: true,
        totalTranslations: this.translations.length
      });

      console.log(`[Background] Translation processed successfully. Total stored: ${this.translations.length}`);

    } catch (error) {
      console.error('[Background] Error processing translation:', error);
      
      // Send error response
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Add a translation to our storage system with persistence
   */
  async addTranslation(translationData) {
    // Add to beginning of array (most recent first)
    this.translations.unshift(translationData);

    // Maintain storage limits to prevent memory issues
    if (this.translations.length > this.maxStoredTranslations) {
      this.translations = this.translations.slice(0, this.maxStoredTranslations);
    }

    // Save to persistent storage for browser restart persistence
    await this.saveTranslationsToStorage();

    console.log(`[Background] Translation added. Storage count: ${this.translations.length}`);
  }

  /**
   * Update translation statistics for analytics and monitoring
   */
  updateTranslationStats(translationData) {
    this.translationStats.totalReceived++;
    this.translationStats.sessionCount++;
    this.translationStats.lastTranslationTime = translationData.timestamp;

    // Calculate running average confidence if confidence data is available
    if (translationData.confidence) {
      const currentAvg = this.translationStats.averageConfidence;
      const count = this.translationStats.totalReceived;
      
      // Calculate new running average
      this.translationStats.averageConfidence = 
        ((currentAvg * (count - 1)) + translationData.confidence) / count;
    }

    // Save updated stats to storage
    chrome.storage.local.set({ translationStats: this.translationStats });
  }

  /**
   * Handle requests for translation history from sidebar or other components
   */
  handleGetTranslationHistory(sendResponse) {
    const recentCount = 50; // Return recent translations for UI display
    
    sendResponse({
      success: true,
      translations: this.translations.slice(0, recentCount),
      count: this.translations.length,
      totalEver: this.translationStats.totalReceived,
      stats: this.translationStats
    });
  }

  /**
   * Handle requests to clear all translation history
   */
  async handleClearTranslationHistory(sendResponse) {
    try {
      // Clear in-memory storage
      this.translations = [];
      
      // Reset statistics but keep total count for lifetime tracking
      const totalEver = this.translationStats.totalReceived;
      this.translationStats = {
        totalReceived: totalEver, // Keep lifetime total
        sessionCount: 0,
        lastTranslationTime: null,
        averageConfidence: 0
      };

      // Clear persistent storage
      await chrome.storage.local.remove(['signLanguageTranslations']);
      await chrome.storage.local.set({ translationStats: this.translationStats });

      // Notify sidebar that history was cleared
      this.forwardToSidebar({ 
        action: "translationHistoryCleared" 
      });

      sendResponse({ 
        success: true,
        message: 'Translation history cleared successfully'
      });

      console.log('[Background] Translation history cleared');

    } catch (error) {
      console.error('[Background] Error clearing translation history:', error);
      sendResponse({ 
        success: false, 
        error: error.message 
      });
    }
  }

  /**
   * Handle requests for translation statistics
   */
  handleGetTranslationStats(sendResponse) {
    const stats = {
      ...this.translationStats,
      currentSession: this.translations.length,
      storageUsed: this.translations.length,
      storageLimit: this.maxStoredTranslations,
      memoryUsage: this.calculateMemoryUsage()
    };

    sendResponse({
      success: true,
      stats: stats
    });
  }

  /**
   * Handle translation export requests
   */
  handleExportTranslations(sendResponse) {
    try {
      const exportData = {
        exportTimestamp: Date.now(),
        exportDate: new Date().toISOString(),
        translationCount: this.translations.length,
        translations: this.translations,
        stats: this.translationStats,
        extensionVersion: chrome.runtime.getManifest().version
      };

      sendResponse({
        success: true,
        data: exportData,
        filename: `sign-language-translations-${new Date().toISOString().split('T')[0]}.json`
      });

    } catch (error) {
      console.error('[Background] Error exporting translations:', error);
      sendResponse({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Forward messages to the sidebar/side panel
   * This handles the routing of real-time updates to the user interface
   */
  forwardToSidebar(message) {
    // Add metadata for better message tracking
    const enrichedMessage = {
      ...message,
      timestamp: Date.now(),
      fromBackground: true
    };

    // Send to sidebar (side panel)
    chrome.runtime.sendMessage(enrichedMessage).catch((error) => {
      // Sidebar might not be open, which is normal
      // Only log if it's an unexpected error
      if (error.message && !error.message.includes('Receiving end does not exist')) {
        console.warn('[Background] Error forwarding to sidebar:', error.message);
      }
    });
  }

  /**
   * Save translations to persistent storage
   * This ensures translations survive browser restarts
   */
  async saveTranslationsToStorage() {
    try {
      // Save recent translations to storage (limit for performance)
      const recentTranslations = this.translations.slice(0, 50);
      
      await chrome.storage.local.set({
        signLanguageTranslations: recentTranslations,
        translationStats: this.translationStats,
        lastSaved: Date.now()
      });

    } catch (error) {
      console.error('[Background] Error saving translations to storage:', error);
    }
  }

  /**
   * Load translations from persistent storage on extension startup
   */
  async loadTranslationsFromStorage() {
    try {
      const result = await chrome.storage.local.get([
        'signLanguageTranslations', 
        'translationStats'
      ]);

      if (result.signLanguageTranslations) {
        this.translations = result.signLanguageTranslations;
        console.log(`[Background] Loaded ${this.translations.length} translations from storage`);
      }

      if (result.translationStats) {
        this.translationStats = { ...this.translationStats, ...result.translationStats };
        console.log('[Background] Loaded translation statistics from storage');
      }

    } catch (error) {
      console.error('[Background] Error loading translations from storage:', error);
    }
  }

  /**
   * Update extension badge to show translation activity
   * This provides immediate visual feedback when translations occur
   */
  updateTranslationBadge() {
    // Show translation indicator briefly
    chrome.action.setBadgeText({ text: "🤟" });
    chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" });

    // Clear badge after a few seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: "" });
    }, 3000);
  }

  /**
   * Update extension badge for general TTS activity
   */
  updateBadge(isActive, text = "") {
    if (isActive) {
      chrome.action.setBadgeText({ text: text || "ON" });
      chrome.action.setBadgeBackgroundColor({ color: "#4CAF50" }); // Green color
    } else {
      chrome.action.setBadgeText({ text: "" }); // Clear the badge
    }
  }

  /**
   * Send a message to the currently active tab
   * This is used for keyboard shortcuts and other commands
   */
  async sendMessageToActiveTab(message) {
    try {
      // Use stored active tab ID if available, otherwise query for active tab
      let tabId = this.extensionState.lastActiveTabId;
      
      if (!tabId) {
        const [tab] = await chrome.tabs.query({ 
          active: true, 
          currentWindow: true 
        });
        
        if (tab) {
          tabId = tab.id;
          this.extensionState.lastActiveTabId = tabId;
        } else {
          console.warn("[Background] No active tab found");
          return;
        }
      }

      await chrome.tabs.sendMessage(tabId, message);
      console.log(`[Background] Message sent to tab ${tabId}:`, message.action);

    } catch (error) {
      console.error("[Background] Error sending message to tab:", error);
      
      // Clear stored tab ID if it's invalid
      if (error.message && error.message.includes('No tab with id')) {
        this.extensionState.lastActiveTabId = null;
      }
    }
  }

  /**
   * Generate a unique session ID for grouping related translations
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate approximate memory usage for monitoring
   */
  calculateMemoryUsage() {
    try {
      const jsonString = JSON.stringify(this.translations);
      return {
        bytes: jsonString.length,
        kilobytes: Math.round(jsonString.length / 1024),
        translationCount: this.translations.length
      };
    } catch (error) {
      return { error: 'Unable to calculate memory usage' };
    }
  }

  /**
   * Get comprehensive background script status for debugging
   */
  getStatus() {
    return {
      initialized: this.extensionState.isInitialized,
      sidebarConnected: this.extensionState.sidebarConnected,
      activeTabId: this.extensionState.lastActiveTabId,
      translationCount: this.translations.length,
      stats: this.translationStats,
      memoryUsage: this.calculateMemoryUsage()
    };
  }
}

// Initialize the enhanced background handler with translation management
const backgroundHandler = new BackgroundHandler();

// Make it globally accessible for debugging and testing
globalThis.backgroundHandler = backgroundHandler;

console.log('[Background] Enhanced background script with translation management loaded');