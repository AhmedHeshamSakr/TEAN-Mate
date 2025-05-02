import welcomeAudio from '../2-features/TTS/messages/welcome.wav';
import ArtyomAssistant from "../2-features/STT/ArtyomAssistant.js"; 
import ImageCaptionHandler from "../2-features/ImageCaptioning/ImageCaptionHandler.js"; 
import SignLanguageHandler from "../2-features/SignLanguage/SignLanguageHandler.js"; 

// Update the SidebarController
class SidebarController {
    constructor() {
        this.buttons = {}; // Store button references for easy access
        this.artyomAssistant = new ArtyomAssistant(this); // Initialize ArtyomAssistant with SidebarController instance
        this.imageCaptionHandler = new ImageCaptionHandler(); // Add this line
        this.signLanguageHandler = new SignLanguageHandler(); // Add sign language handler

        // Initialize state variables
        this.pushToTalkActive = false;
        this.screenSharingActive = false; // Track if screen sharing is active
        this.ttsActive = false; // Add a state tracking variable for TTS
        this.accumulatedSpeech = ''; // Track accumulated speech for continuous mode
        
        this.initialize(); // Set up event listeners and initial state
    }

    // Initialize sidebar
    initialize() {
        // Play the welcome audio
        const audio = new Audio(welcomeAudio);
        audio.play().then(() => {
            console.log("Welcome audio played successfully");
        }).catch((error) => {
            console.error("Error playing welcome audio:", error);
        });

        // Set sidebar title using the extension's name
        document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;

        // Wait for DOM to load before attaching event listeners
        document.addEventListener("DOMContentLoaded", () => {
            this.setupEventListeners();
            this.initializeSTTListeners();
            this.initializeUIElements();
            this.initializeScreenSharingListeners();
        });

        // Get sidebar position and theme preferences
        const self = this;
        this.getSettings(function(settings) {
            // Apply theme
            self.applyTheme(settings.theme || 'system');
        });
        this.setupSystemThemeListener(); 

        // Add listener for messages from content scripts and background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleIncomingMessages(message, sender, sendResponse);
        });
    }

    // Handle incoming messages from content scripts or background
    handleIncomingMessages(message, sender, sendResponse) {
        if (message.action === "ttsStarted") {
            // Update TTS button state when reading starts
            this.setTTSActive(true);
        } else if (message.action === "ttsStopped") {
            // Update TTS button state when reading stops
            this.setTTSActive(false);
        } else if (message.action === "setCommandsEnabled") {
            // Update ArtyomAssistant command state
            if (this.artyomAssistant) {
                this.artyomAssistant.setCommandsEnabled(message.enabled);
                if (!message.enabled) {
                    this.updateStatusMessage('Voice commands disabled during video overlay');
                } else {
                    this.updateStatusMessage('Voice commands re-enabled');
                }
            }
        } else if (message.action === "screenSharingStatus") {
            // Update screen sharing status based on content script response
            const status = message.status;
            this.updateScreenSharingStatus(status);
            
            if (status === 'Error') {
                this.updateStatusMessage('Failed to start screen sharing. Please try again.');
                this.screenSharingActive = false;
                this.buttons.signLanguage.classList.remove('active');
            }
        } else if (message.action === "screenSharingEnded") {
            // Handle screen sharing ended event
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateScreenSharingStatus('Off');
            this.updateStatusMessage('Screen sharing ended');
        }
    }

    // Set TTS button active state
    setTTSActive(active) {
        this.ttsActive = active;
        
        if (this.buttons.tts) {
            if (active) {
                this.buttons.tts.classList.add('active');
                this.updateStatusMessage('Reading text...');
            } else {
                this.buttons.tts.classList.remove('active');
                this.updateStatusMessage('Reading stopped');
            }
        }
    }

    // Initialize listeners for screen sharing events
    initializeScreenSharingListeners() {
        // Listen for screen sharing ended event
        window.addEventListener('screenSharingEnded', () => {
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateScreenSharingStatus('Off');
            this.updateStatusMessage('Screen sharing ended');
        });
    }

    // Initialize UI elements that need event listeners
    initializeUIElements() {
        // Add listener for mode change
        const modeSelect = document.getElementById('stt-mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', this.handleSTTModeChange.bind(this));
        }

        // Add listener for caption type confirmation
        const confirmCaptionBtn = document.getElementById('confirm-caption-type');
        if (confirmCaptionBtn) {
            confirmCaptionBtn.addEventListener('click', this.handleCaptionTypeConfirm.bind(this));
        }

        // Add listener for shortcuts button
        const shortcutsBtn = document.getElementById('shortcutsButton');
        if (shortcutsBtn) {
            shortcutsBtn.addEventListener('click', this.toggleShortcutsPanel.bind(this));
        }

        // Add listeners for speech buttons
        const copyBtn = document.getElementById('copy-speech-btn');
        const saveBtn = document.getElementById('save-speech-btn');
        const clearBtn = document.getElementById('clear-speech-btn');
        
        if (copyBtn) copyBtn.addEventListener('click', this.handleCopySpeech.bind(this));
        if (saveBtn) saveBtn.addEventListener('click', this.handleSaveSpeech.bind(this));
        if (clearBtn) clearBtn.addEventListener('click', this.handleClearSpeech.bind(this));

        // Add listener for video overlay checkbox
        const videoOverlayCheckbox = document.getElementById('video-overlay-checkbox');
        if (videoOverlayCheckbox) {
            videoOverlayCheckbox.addEventListener('change', (event) => {
                const isEnabled = event.target.checked;
                
                // Send message to content script to enable/disable video overlay
                this.sendMessageToActiveTab({
                    action: "toggleVideoOverlay",
                    enabled: isEnabled
                });
                
                this.updateStatusMessage(`Video text overlay ${isEnabled ? 'enabled' : 'disabled'}`);
            });
        }
        
        // Set initial status message
        this.updateStatusMessage('Ready to assist');
    }

    // Toggle shortcuts panel visibility
    toggleShortcutsPanel() {
        const panel = document.getElementById('shortcuts-panel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        }
    }

    handleCopySpeech() {
        if (!this.accumulatedSpeech) return;
        
        navigator.clipboard.writeText(this.accumulatedSpeech)
            .then(() => {
                this.updateStatusMessage('Text copied to clipboard');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                this.updateStatusMessage('Failed to copy text');
            });
    }
    
    handleSaveSpeech() {
        if (!this.accumulatedSpeech) return;
        
        const blob = new Blob([this.accumulatedSpeech], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `speech-text-${timestamp}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.updateStatusMessage('Text saved as file');
    }
    
    updateWordCount() {
        const wordCountElement = document.getElementById('word-count');
        if (!wordCountElement) return;
        
        if (!this.accumulatedSpeech) {
            wordCountElement.textContent = '0 words';
            return;
        }
        
        // Count words by splitting on whitespace
        const wordCount = this.accumulatedSpeech.trim().split(/\\s+/).length;
        wordCountElement.textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;
    }
    
    // Update the updateSpeechDisplay method to include word count updates
    updateSpeechDisplay(text, isFinal = false) {
        const recognizedTextDiv = document.getElementById("recognizedText");
        const speechModeLabel = document.getElementById("speech-mode-label");
        const accumulationIndicator = document.getElementById("speech-accumulation-indicator");
        
        // Update mode display
        const mode = this.getSTTMode();
        if (speechModeLabel) {
            speechModeLabel.textContent = `Mode: ${mode === 'continuous' ? 'Continuous' : 'Push-to-Talk'}`;
        }

        const videoOverlayCheckbox = document.getElementById('video-overlay-checkbox');
        if (mode === 'continuous' && videoOverlayCheckbox && videoOverlayCheckbox.checked) {
            this.sendMessageToActiveTab({
                action: "displayOverlayText",
                text: text,
                isFinal: isFinal
            });
        }
        
        // If in continuous mode and text is final, accumulate it
        if (mode === 'continuous' && isFinal && text.trim()) {
            // Show accumulation indicator
            if (accumulationIndicator) {
                accumulationIndicator.style.display = 'inline-block';
            }
            
            // Add the new text with proper spacing
            if (this.accumulatedSpeech) {
                this.accumulatedSpeech += ' ' + text;
            } else {
                this.accumulatedSpeech = text;
            }
            
            // Update the display with accumulated text
            recognizedTextDiv.textContent = this.accumulatedSpeech;
            recognizedTextDiv.classList.add('accumulating');
            
            // Enable the action buttons
            document.getElementById('copy-speech-btn').disabled = false;
            document.getElementById('save-speech-btn').disabled = false;
            document.getElementById('clear-speech-btn').disabled = false;
            
            // Update word count
            this.updateWordCount();
        } 
        // In push-to-talk mode or for interim results, just show current recognition
        else {
            // Hide accumulation indicator
            if (accumulationIndicator) {
                accumulationIndicator.style.display = 'none';
            }
            
            recognizedTextDiv.textContent = text;
            recognizedTextDiv.classList.remove('accumulating');
        }
    }
    
    // Update handleClearSpeech to reset word count
    handleClearSpeech() {
        this.accumulatedSpeech = '';
        
        // Reset speech recognition display
        document.getElementById('recognizedText').textContent = 'Start speaking to see the text here...';
        document.getElementById('recognizedText').classList.remove('accumulating');
        
        // Hide accumulation indicator
        const accumulationIndicator = document.getElementById("speech-accumulation-indicator");
        if (accumulationIndicator) {
            accumulationIndicator.style.display = 'none';
        }
        
        // Disable buttons when text is cleared
        document.getElementById('copy-speech-btn').disabled = true;
        document.getElementById('save-speech-btn').disabled = true;
        document.getElementById('clear-speech-btn').disabled = true;
        
        // Reset word count
        this.updateWordCount();
        this.updateStatusMessage('Speech text cleared');
    }
    
    // Update the handleSTTModeChange method to reset accumulated speech when changing modes
    handleSTTModeChange(event) {
        const mode = event.target.value;
        console.log(`STT mode changed to: ${mode}`);
        
        // Stop any active listening when changing modes
        if (this.artyomAssistant.isListening) {
            this.artyomAssistant.stopListening();
            this.updateSTTStatus('Ready');
        }
        
        // Reset accumulated speech when changing modes
        this.accumulatedSpeech = '';
        document.getElementById('recognizedText').textContent = 'Start speaking to see the text here...';
        
        // Disable buttons
        document.getElementById('copy-speech-btn').disabled = true;
        document.getElementById('save-speech-btn').disabled = true;
        document.getElementById('clear-speech-btn').disabled = true;
        
        // Show/hide video overlay option based on mode
        const videoOverlayOption = document.getElementById('video-overlay-option');
        if (videoOverlayOption) {
            videoOverlayOption.style.display = mode === 'continuous' ? 'block' : 'none';
            // Reset checkbox when changing modes
            document.getElementById('video-overlay-checkbox').checked = false;
        }
        
        // Show appropriate guidance in status area
        if (mode === 'push-to-talk') {
            this.updateStatusMessage('Hold SPACE key to speak');
        } else {
            this.updateStatusMessage('Click the button to toggle listening');
        }
    }

    handleScreenSharing() {
        console.log("Screen Sharing button clicked");
        
        // Toggle the active state
        if (this.screenSharingActive) {
            // Deactivate
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateStatusMessage('Screen sharing deactivated');
            this.updateScreenSharingStatus('Off');
            
            // Send deactivation message to content script
            this.sendMessageToActiveTab({
                action: "stopScreenCapture"
            });
            
        } else {
            // Activate
            this.buttons.signLanguage.classList.add('active');
            this.updateStatusMessage('Preparing screen sharing...');
            this.updateScreenSharingStatus('Processing');
            
            // Send activation command to content script
            this.sendMessageToActiveTab({
                action: "startScreenCapture"
            });
            
            // Set a timeout to check if activation succeeded
            setTimeout(() => {
                if (this.screenSharingActive && !document.getElementById("sign-status-indicator").classList.contains('bg-success')) {
                    // If still processing after 5 seconds, show a hint
                    this.updateStatusMessage('Waiting for screen share permission...');
                }
            }, 5000);
        }
    }
    
    // Update screen sharing status indicator
    updateScreenSharingStatus(status) {
        const indicator = document.getElementById('sign-status-indicator');
        if (!indicator) return;
        
        // Remove all existing status classes
        indicator.classList.remove('bg-secondary', 'bg-success', 'bg-danger', 'bg-warning');
        
        // Apply appropriate status
        switch(status) {
            case 'Active':
                this.screenSharingActive = true;
                indicator.classList.add('bg-success');
                indicator.textContent = 'Active';
                break;
            case 'Processing':
                indicator.classList.add('bg-warning');
                indicator.textContent = 'Processing';
                break;
            case 'Error':
                this.screenSharingActive = false;
                indicator.classList.add('bg-danger');
                indicator.textContent = 'Error';
                break;
            default:
                this.screenSharingActive = false;
                indicator.classList.add('bg-secondary');
                indicator.textContent = 'Off';
        }
    }

    // Update STT status indicator
    updateSTTStatus(status) {
        const indicator = document.getElementById('stt-status-indicator');
        if (!indicator) return;
        
        // Remove all existing status classes
        indicator.classList.remove('bg-secondary', 'bg-success', 'bg-danger');
        
        // Apply appropriate status
        switch(status) {
            case 'Listening':
                indicator.classList.add('bg-success');
                indicator.textContent = 'Listening';
                break;
            case 'Error':
                indicator.classList.add('bg-danger');
                indicator.textContent = 'Error';
                break;
            default:
                indicator.classList.add('bg-secondary');
                indicator.textContent = 'Ready';
        }
        
        // Update status message
        if (status === 'Listening') {
            this.updateStatusMessage('Speech recognition active...');
        }
    }

    // Update caption status indicator
    updateCaptionStatus(status) {
        const indicator = document.getElementById('caption-status');
        if (!indicator) return;
        
        // Remove all existing status classes
        indicator.classList.remove('bg-secondary', 'bg-success', 'bg-danger', 'bg-warning');
        
        // Apply appropriate status
        switch(status) {
            case 'Active':
                indicator.classList.add('bg-success');
                indicator.textContent = 'Active';
                break;
            case 'Processing':
                indicator.classList.add('bg-warning');
                indicator.textContent = 'Processing';
                break;
            case 'Error':
                indicator.classList.add('bg-danger');
                indicator.textContent = 'Error';
                break;
            default:
                indicator.classList.add('bg-secondary');
                indicator.textContent = 'Off';
        }
    }

    // Update the status message area
    updateStatusMessage(message) {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
        }
    }

    // Apply theme based on settings or system preference
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

    // Get user settings from storage
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
        this.buttons.imageCaption = buttons[2];
        this.buttons.signLanguage = buttons[3];
        this.buttons.options = document.getElementById('settingsButton');

        this.addButtonListener(this.buttons.tts, this.handleTTS.bind(this));
        this.addButtonListener(this.buttons.stt, this.handleSTT.bind(this));
        this.addButtonListener(this.buttons.imageCaption, this.handleImageCaption.bind(this));
        this.addButtonListener(this.buttons.signLanguage, this.handleScreenSharing.bind(this));
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
    handleTTS() {
        console.log("Text-to-Speech button clicked");
        
        // If TTS is already active, stop it
        if (this.ttsActive) {
            this.sendMessageToActiveTab({ action: "stopTTS" });
            this.setTTSActive(false);
        } else {
            // Otherwise start TTS
            this.sendMessageToActiveTab({ action: "extractText" });
            this.updateStatusMessage('Extracting text from page...');
            // The active state will be set when we receive "ttsStarted" message
        }
    }

    // Handle Speech-to-Text button click
    handleSTT() {
        console.log("Speech-to-Text button clicked");
        const mode = this.getSTTMode();
        
        // For push-to-talk mode, just show instructions
        if (mode === 'push-to-talk') {
            this.updateStatusMessage('Hold SPACE key to speak');
            return;
        }
        
        // For continuous mode, toggle listening state
        if (!this.artyomAssistant.isListening) {
            this.artyomAssistant.startListening();
            this.buttons.stt.classList.add('active');
            this.updateSTTStatus('Listening');
        } else {
            this.artyomAssistant.stopListening();
            this.buttons.stt.classList.remove('active');
            this.updateSTTStatus('Ready');
            this.updateStatusMessage('Speech recognition stopped');
        }
    }

    // Handle Image Captioning button click - Updated to toggle functionality
    async handleImageCaption() {
        console.log("Image Captioning button clicked");
        
        // If already active, deactivate
        if (this.imageCaptionHandler.isActive) {
            await this.imageCaptionHandler.deactivate();
            this.updateCaptionStatus('Off');
            this.updateStatusMessage('Image captioning turned off');
            this.buttons.imageCaption.classList.remove('active');
            
            // Send deactivation message to content script
            this.sendMessageToActiveTab({ 
                action: "deactivateImageCaptioning" 
            });
            return;
        }
        
        // Show the caption controls if not already visible
        const controls = document.querySelector('.caption-controls');
        if (controls) {
            controls.style.display = 'block';
            this.updateStatusMessage('Select caption type and click Activate');
        }
    }

    // Handle caption type confirmation
    handleCaptionTypeConfirm() {
        const select = document.getElementById('caption-type-select');
        const type = select.value;
        
        console.log('[SIDEBAR] Selected caption type:', type);
        
        this.imageCaptionHandler.setCaptionType(type);
        this.imageCaptionHandler.isActive = true; // Set active state
        
        // Send activation command to content script
        this.sendMessageToActiveTab({ 
            action: "activateImageCaptioning",
            captionType: type 
        });
        
        // Update UI
        this.buttons.imageCaption.classList.add('active');
        this.updateCaptionStatus('Active');
        this.updateStatusMessage('Image captioning activated');
        
        // Hide the caption controls
        const controls = document.querySelector('.caption-controls');
        if (controls) {
            controls.style.display = 'none';
        }
    }

    // Send a message to the active tab
    sendMessageToActiveTab(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            } else {
                console.warn("No active tab found");
                this.updateStatusMessage('No active tab found');
            }
        });
    }

    // Initialize listeners for STT push-to-talk
    initializeSTTListeners() {
        // Space key down - start listening
        window.addEventListener("keydown", (event) => {
            // Only respond if in push-to-talk mode
            if (this.getSTTMode() !== 'push-to-talk') return;
            
            if (event.code === "Space" && !this.artyomAssistant.isListening && !this.pushToTalkActive) {
                console.log("Push-to-Talk: Listening activated");
                this.sendMessageToActiveTab({ action: "pauseTTS" });
                this.artyomAssistant.startListening();
                this.updateSTTStatus('Listening');
                this.pushToTalkActive = true;
            }
        });
        
        // Space key up - stop listening
        window.addEventListener("keyup", (event) => {
            // Only respond if currently in push-to-talk mode and listening
            if (this.getSTTMode() !== 'push-to-talk' || !this.pushToTalkActive) return;
            
            if (event.code === "Space" && this.artyomAssistant.isListening) {
                console.log("Push-to-Talk: Listening stopped");
                this.sendMessageToActiveTab({ action: "resumeTTS" });
                this.artyomAssistant.stopListening();
                this.updateSTTStatus('Ready');
                this.pushToTalkActive = false;
            }
        });

        // Add Escape key to cancel any action
        window.addEventListener("keydown", (event) => {
            if (event.code === "Escape") {
                if (this.artyomAssistant.isListening) {
                    console.log("Action canceled with Escape key");
                    this.artyomAssistant.stopListening();
                    this.updateSTTStatus('Ready');
                    this.pushToTalkActive = false;
                    this.updateStatusMessage('Action canceled');
                }
            }
        });
    }

    // Get the currently selected STT mode
    getSTTMode() {
        const modeSelect = document.getElementById('stt-mode-select');
        return modeSelect ? modeSelect.value : 'push-to-talk';
    }

    // Handle Options button click
    handleOptions() {
        console.log("Options button clicked");
        // Open the options page in a new tab
        chrome.runtime.openOptionsPage();
    }

    // Handle skipping to next item
    handleSkipNext() {
        console.log("Skipping to next item...");
        this.sendMessageToActiveTab({ action: "skipToNext" });
        this.updateStatusMessage('Skipping to next item...');
    }
    
    // Handle skipping to previous item
    handleSkipPrevious() {
        console.log("Skipping to previous item...");
        this.sendMessageToActiveTab({ action: "skipToPrevious" });
        this.updateStatusMessage('Skipping to previous item...');
    }
    
    // Handle accessing the current link
    handleAccessLink() {
        console.log("Accessing link...");
        this.sendMessageToActiveTab({ action: "accessLink" });
        this.updateStatusMessage('Accessing selected link...');
    }
    
    // Handle stopping text reading
    handleStopReading() {
        console.log("Reading Stopped...");
        this.sendMessageToActiveTab({ action: "pauseTTS" });
        this.setTTSActive(false);
        this.updateStatusMessage('Reading paused');
    }

    // Handle search functionality
    handleSearch(query) {
        console.log(`Searching for: ${query}`);
        // Send message to content script to perform the search
        this.sendMessageToActiveTab({ 
            action: "performSearch", 
            query: query 
        });
        this.updateStatusMessage(`Searching for: ${query}`);
   }

   // Trigger button action programmatically
   triggerButtonAction(action, query = null) {
       switch (action) {
           case "search":
               if (query) {
                   this.handleSearch(query);
               } else {
                   console.warn("Search query is missing");
                   this.updateStatusMessage('Search query is missing');
               }
               break;
           case "tts":
               this.handleTTS();
               break;
           case "stt":
               this.handleSTT();
               break;
           case "screenSharing":
               this.handleScreenSharing();
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
               this.updateStatusMessage(`Unknown action: ${action}`);
       }
   }
}

// Instantiate the SidebarController
const sidebarController = new SidebarController();
export default sidebarController;