import welcomeAudio from '../2-features/TTS/messages/welcome.wav';

import ArtyomAssistant from "../2-features/STT/ArtyomAssistant.js"; 

// Update the SidebarController
class SidebarController {
    constructor() {
        this.buttons = {}; // Store button references for easy access
        this.artyomAssistant = new ArtyomAssistant(this); // Initialize ArtyomAssistant with SidebarController instance
        this.initialize(); // Set up event listeners and initial state
    }

  // Initialize sidebar
    initialize() {
        // Check if the sidebar has been opened before
        // Play the welcome audio
        //   const audioUrl = chrome.runtime.getURL(welcomeAudio);
        //   console.log("Welcome audio URL:", audioUrl);
        const audio = new Audio(welcomeAudio);
        audio.play().then(() => {
            console.log("Welcome audio played successfully");
        }).catch((error) => {
            console.error("Error playing welcome audio:", error);
        });

        // Set sidebar title using the extension's name
        document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;

        // Wait for DOM to load before attaching event listeners
        document.addEventListener("DOMContentLoaded", this.setupEventListeners.bind(this));

        // Get sidebar position and theme preferences
        const self = this;
        this.getSettings(function(settings) {
            // Apply theme
            self.applyTheme(settings.theme || 'system');
        });
        
        // Listen for system theme changes if using system theme
        this.setupSystemThemeListener();
    }

    applyTheme(themeSetting) {
        // Get the document element (html tag)
        const htmlElement = document.documentElement;
        
        if (themeSetting === 'system') {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                htmlElement.setAttribute('data-theme', 'dark');
            } else {
                htmlElement.setAttribute('data-theme', 'light');
            }
        } else {
            // Apply the selected theme directly
            htmlElement.setAttribute('data-theme', themeSetting);
        }
        
        console.log(`Applied theme: ${themeSetting}`);
    }
    
    // Add this method to listen for system theme changes
    setupSystemThemeListener() {
        const self = this;
        if (window.matchMedia) {
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Add listener for theme changes
            colorSchemeQuery.addEventListener('change', (e) => {
                self.getSettings(function(settings) {
                    // Only update if set to system theme
                    if (settings.theme === 'system') {
                        self.applyTheme('system');
                    }
                });
            });
        }
    }

    getSettings(callback) {
        // Try to get settings from sync storage first
        chrome.storage.sync.get('settings', function(data) {
            if (data.settings) {
                callback(data.settings);
            } else {
                // Fall back to local storage if not found in sync
                chrome.storage.local.get('settings', function(localData) {
                    callback(localData.settings || {});
                });
            }
        });
    }

    // Set up event listeners for all buttons
    setupEventListeners() {
        const buttons = document.querySelectorAll(".accessibility-button");
        if (!buttons.length) {
            console.warn("No accessibility buttons found!");
            return;
        }

        // Assign buttons dynamically and bind their handlers
        this.buttons.tts = buttons[0];
        this.buttons.stt = buttons[1];
        this.buttons.signLanguage = buttons[2];
        this.buttons.imageCaption = buttons[3];
        this.buttons.options = document.getElementById('settingsButton');

        this.addButtonListener(this.buttons.tts, this.handleTTS.bind(this));
        this.addButtonListener(this.buttons.stt, this.handleSTT.bind(this));
        this.addButtonListener(this.buttons.signLanguage, this.handleSignLanguage.bind(this));
        this.addButtonListener(this.buttons.imageCaption, this.handleImageCaption.bind(this));
        this.addButtonListener(this.buttons.options, this.handleOptions.bind(this));
    }

    // Add an event listener to a button, with error handling
    addButtonListener(button, handler) {
        if (!button) {
            console.warn("Button not found, skipping event binding.");
            return;
        }
        button.addEventListener("click", handler);
    }

    // Handle Text-to-Speech button click
    async handleTTS() {
        try {
            // 1. Get active tab
            const [tab] = await chrome.tabs.query({ 
                active: true, 
                currentWindow: true 
            });
    
            if (!tab?.id) {
                throw new Error("No active tab found");
            }
    
            // 2. Always inject content script first
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.bundle.js']
                });
            } catch (injectError) {
                console.error("Injection failed:", injectError);
                throw new Error("Failed to load required components");
            }
    
            // 3. Add manual timeout
            const messagePromise = chrome.tabs.sendMessage(
                tab.id, 
                { 
                    action: "extractText",
                    timestamp: Date.now() 
                }
            );
    
            // Implement manual timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("TTS timeout: No response after 2 seconds")), 2000);
            });
    
            // Race between message and timeout
            await Promise.race([messagePromise, timeoutPromise]);
    
        } catch (error) {
            console.error("TTS Failed:", error);
            alert(`TTS Error: ${error.message}\n\nPlease try these steps:\n1. Refresh the page\n2. Click TTS button again`);
        }
    }

    async verifyConnection(tabId) {
        try {
            const response = await chrome.tabs.sendMessage(
                tabId,
                { action: 'ping' },
                { timeout: 1000 }
            );
            return response?.alive === true;
        } catch {
            return false;
        }
    }

    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.bundle.js']
            });
        } catch (error) {
            throw new Error("Content script injection failed");
        }
    }

    async sendWithRetry(tabId, message, maxRetries) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await chrome.tabs.sendMessage(tabId, message);
            } catch (error) {
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
            }
        }
        throw lastError;
    }

    showTtsError() {
        const errorElement = document.createElement('div');
        errorElement.className = 'tts-error';
        errorElement.textContent = 'Failed to start TTS. Please refresh the page and try again.';
        document.body.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 3000);
    }

    // Handle Speech-to-Text button click
    handleSTT() {
        console.log("Speech-to-Text initialized with push-to-talk");
    
        // Add keyboard listeners for push-to-talk
        window.addEventListener("keydown", (event) => {
            if (event.code === "Space" && !this.artyomAssistant.isListening) {
                console.log("Push-to-Talk: Listening activated");
                this.sendMessageToActiveTab({ action: "pauseTTS" });
                this.artyomAssistant.startListening(); // Start STT
                this.buttons.stt.textContent = "Listening..."; // Change button text
            }
        });
    
        window.addEventListener("keyup", (event) => {
            if (event.code === "Space" && this.artyomAssistant.isListening) {
                console.log("Push-to-Talk: Listening stopped");
                this.sendMessageToActiveTab({ action: "resumeTTS" });
                this.artyomAssistant.stopListening(); // Stop STT
                this.buttons.stt.textContent = "Speech to Text"; // Reset button text
            }
        });
    }
    

    // Handle Sign Language Translator button click
    handleSignLanguage() {
        console.log("Sign Language Translator button clicked");
        alert("Sign Language Translator activated"); // Placeholder for sign language functionality
    }

    // Handle Image Captioning button click
    handleImageCaption() {
        console.log("Image Captioning button clicked");
        alert("Image Captioning activated"); // Placeholder for image captioning functionality
    }

    handleOptions() {
        console.log("Options button clicked");
        // Open the options page in a new tab
        chrome.runtime.openOptionsPage();
    }

    // Send a message to the active tab
    sendMessageToActiveTab(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            } else {
                console.warn("No active tab found");
            }
        });
    }

    handleSkipNext() {
        console.log("Skipping to next item...");
        this.sendMessageToActiveTab({ action: "skipToNext" });
    }
    
    handleSkipPrevious() {
        console.log("Skipping to previous item...");
        this.sendMessageToActiveTab({ action: "skipToPrevious" });
    }
    
    handleAccessLink() {
        console.log("Accessing link...");
        this.sendMessageToActiveTab({ action: "accessLink" });
    }
    handleStopReading() {
        console.log("Reading Stoped...");
        this.sendMessageToActiveTab({ action: "pauseTTS" });
    }

    handleSearch(query) {
        console.log(`Searching for: ${query}`);
        // Send a message to the active tab to perform the search
        this.sendMessageToActiveTab({ 
            action: "performSearch", 
            query: query 
        });
    }

    // Trigger button action programmatically
    triggerButtonAction(action , query = null) {
        switch (action) {
            case "search":
                if (query) {
                    this.handleSearch(query);
                } else {
                    console.warn("Search query is missing");
                }break;
            case "tts":
                this.handleTTS();
                break;
            case "stt":
                this.handleSTT();
                break;
            case "signLanguage":
                this.handleSignLanguage();
                break;
            case "imageCaption":
                this.handleImageCaption();
                break;
            case "skip-next":
                this.handleSkipNext();
                break;
            case "skip-previous":
                this.handleSkipPrevious();
                break;
            case "access-link":
                this.handleAccessLink();
                break;
            case "toggle-reading":
                this.handleStopReading();
                break;    
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }
}

// Instantiate the SidebarController
const sidebarController = new SidebarController();
export default sidebarController;