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
        this.debugModeActive = false; // Track if debug visualization is active
        
        // Enhanced communication tracking for unified display
        this.currentTranslation = null;
        this.communicationHistory = []; // Now stores both speech and translations
        this.lastCommunicationType = null; // Track what type of input we last received
        this.currentDisplayText = ''; // Current text being displayed (for copy operations)

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
            
            // Check if screen sharing is already active from a previous session
            setTimeout(() => {
                this.sendMessageToActiveTab({
                    action: "getScreenSharingStatus"
                });
            }, 1000);
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
            
            if (status === 'Active') {
                this.screenSharingActive = true;
                this.updateStatusMessage('Screen sharing active with MediaPipe Holistic');
            } else if (status === 'Error') {
                this.screenSharingActive = false;
                this.buttons.signLanguage.classList.remove('active');
                this.updateStatusMessage('Failed to start screen sharing: ' + (message.message || 'Unknown error'));
            } else if (status === 'Off') {
                this.screenSharingActive = false;
                this.buttons.signLanguage.classList.remove('active');
                this.updateStatusMessage('Screen sharing stopped');
            }
        } else if (message.action === "handLandmarksUpdate") {
            // Handle hand landmarks update from content script
            this.handleLandmarksUpdate(message);
        } else if (message.action === "screenSharingEnded") {
            // Handle screen sharing ended event
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateScreenSharingStatus('Off');
            this.updateStatusMessage('Screen sharing ended');
        } else if (message.action === "debugModeStatus") {
            // Handle debug mode status update
            this.debugModeActive = message.enabled;
            this.updateStatusMessage(`Debug visualization ${message.enabled ? 'enabled' : 'disabled'}`);
        } else if (message.action === "signLanguageTranslation") {
            // CRITICAL ADDITION: Handle translation messages from content script
            // This is the missing piece that receives translations and feeds them to the unified display
            this.handleTranslationReceived(message);
        } else if (message.action === "translationHistoryResponse") {
            // Handle translation history responses (for future enhancement)
            this.handleTranslationHistoryReceived(message.history);
        } else if (message.action === "translationHistoryCleared") {
            // Handle translation history cleared confirmation
            this.handleTranslationHistoryCleared();
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

    // Enhanced method to handle both speech and translation display
    updateCommunicationDisplay(text, options = {}) {
        const {
            isFinal = false,
            source = 'speech', // 'speech' or 'sign-language'
            confidence = null,
            timestamp = Date.now(),
            mode = null // For speech: 'push-to-talk' or 'continuous'
        } = options;

        const recognizedTextDiv = document.getElementById("recognizedText");
        const speechModeLabel = document.getElementById("speech-mode-label");
        const accumulationIndicator = document.getElementById("speech-accumulation-indicator");
        
        // Update the mode label to reflect current input source
        if (speechModeLabel) {
            if (source === 'sign-language') {
                speechModeLabel.textContent = 'Mode: Sign Language Translation';
            } else if (mode) {
                speechModeLabel.textContent = `Mode: ${mode === 'continuous' ? 'Continuous Speech' : 'Push-to-Talk'}`;
            }
        }

        // Handle different sources of communication input
        if (source === 'sign-language') {
            this.handleSignLanguageDisplay(text, confidence, timestamp, recognizedTextDiv, accumulationIndicator);
        } else {
            this.handleSpeechDisplay(text, isFinal, mode, recognizedTextDiv, accumulationIndicator);
        }

        // Enable the control buttons since we have content
        const hasText = text && text.trim().length > 0;
        this.updateControlButtons(hasText);
        
        // Update word count (works for both speech and translations)
        this.updateWordCount();
        
        // Store in unified communication history
        if (isFinal || source === 'sign-language') {
            this.addToCommunicationHistory(text, source, confidence, timestamp);
        }
    }

    // Handle sign language translation display
    handleSignLanguageDisplay(text, confidence, timestamp, displayElement, accumulationIndicator) {
        // Create a formatted display for sign language translations
        const timeStr = new Date(timestamp).toLocaleTimeString();
        
        // Build the display text with source indicator
        let displayText = `🤟 [${timeStr}] "${text}"`;
        
        // Add confidence indicator if available
        if (confidence !== null && confidence !== undefined) {
            const confidencePercent = Math.round(confidence * 100);
            displayText += ` (${confidencePercent}% confidence)`;
        }
        
        // Show accumulation indicator for sign language
        if (accumulationIndicator) {
            accumulationIndicator.style.display = 'inline-block';
            accumulationIndicator.textContent = 'Sign Language';
            accumulationIndicator.className = 'badge bg-info ms-2'; // Different color for sign language
        }
        
        // Update the display
        displayElement.textContent = displayText;
        displayElement.classList.add('sign-language-input');
        displayElement.classList.remove('speech-input');
        
        // Update current content for button operations
        this.currentDisplayText = text; // Store the clean text for copying
        this.lastCommunicationType = 'sign-language';
    }

    // Handle speech recognition display (enhanced version of your existing method)
    handleSpeechDisplay(text, isFinal, mode, displayElement, accumulationIndicator) {
        // Handle speech input similar to your existing logic but with source awareness
        
        if (mode === 'continuous' && isFinal && text.trim()) {
            // Show accumulation indicator for continuous speech
            if (accumulationIndicator) {
                accumulationIndicator.style.display = 'inline-block';
                accumulationIndicator.textContent = 'Accumulating Speech';
                accumulationIndicator.className = 'badge bg-primary ms-2'; // Original color for speech
            }
            
            // Add timestamp and source indicator for final speech results
            const timeStr = new Date().toLocaleTimeString();
            const displayText = `🎤 [${timeStr}] ${text}`;
            
            // Accumulate the speech as in your original logic
            if (this.accumulatedSpeech) {
                this.accumulatedSpeech += ' ' + text;
            } else {
                this.accumulatedSpeech = text;
            }
            
            displayElement.textContent = `🎤 Accumulated Speech: ${this.accumulatedSpeech}`;
            displayElement.classList.add('speech-input', 'accumulating');
            displayElement.classList.remove('sign-language-input');
            
            this.currentDisplayText = this.accumulatedSpeech;
        } else {
            // Handle interim speech results or push-to-talk
            if (accumulationIndicator) {
                accumulationIndicator.style.display = 'none';
            }
            
            const prefix = text.trim() ? '🎤 ' : '';
            displayElement.textContent = prefix + text;
            displayElement.classList.add('speech-input');
            displayElement.classList.remove('sign-language-input', 'accumulating');
            
            this.currentDisplayText = text;
        }
        
        this.lastCommunicationType = 'speech';
    }

    // Enhanced method to handle incoming translation messages
    handleTranslationReceived(message) {
        const { translatedText, timestamp, confidence, words } = message;
        
        console.log(`[SIDEBAR] Translation received: "${translatedText}"`);
        
        // Store the translation
        this.currentTranslation = {
            text: translatedText,
            timestamp: timestamp,
            confidence: confidence,
            words: words
        };
        
        // Display using the unified communication display
        this.updateCommunicationDisplay(translatedText, {
            source: 'sign-language',
            confidence: confidence,
            timestamp: timestamp,
            isFinal: true
        });
        
        // Update status message
        this.updateStatusMessage(`Sign Language: "${translatedText}"`);
    }

    // Handle translation history responses (for future enhancements)
    handleTranslationHistoryReceived(history) {
        console.log('[SIDEBAR] Translation history received:', history);
        // You can extend this method to do something with the history if needed
        // For now, we'll just store it for potential future use
        this.translationHistory = history || [];
    }

    // Handle translation history cleared confirmation
    handleTranslationHistoryCleared() {
        console.log('[SIDEBAR] Translation history cleared confirmation received');
        // Clear any local references to translation history
        this.translationHistory = [];
        this.updateStatusMessage('Translation history cleared');
    }

    // Enhanced method for speech display (modify your existing updateSpeechDisplay)
    updateSpeechDisplay(text, isFinal = false) {
        const mode = this.getSTTMode();
        
        // Use the unified display method
        this.updateCommunicationDisplay(text, {
            source: 'speech',
            isFinal: isFinal,
            mode: mode
        });

        // Handle video overlay for continuous mode (keep your existing logic)
        const videoOverlayCheckbox = document.getElementById('video-overlay-checkbox');
        if (mode === 'continuous' && videoOverlayCheckbox && videoOverlayCheckbox.checked) {
            this.sendMessageToActiveTab({
                action: "displayOverlayText",
                text: text,
                isFinal: isFinal
            });
        }
    }

    // Add items to unified communication history
    addToCommunicationHistory(text, source, confidence, timestamp) {
        const historyItem = {
            text: text,
            source: source,
            confidence: confidence,
            timestamp: timestamp,
            id: Date.now() + Math.random() // Unique identifier
        };
        
        this.communicationHistory.push(historyItem);
        
        // Keep only the last 50 items to prevent memory issues
        if (this.communicationHistory.length > 50) {
            this.communicationHistory.shift();
        }
    }

    // Enhanced control button management
    updateControlButtons(hasText) {
        const buttons = [
            'copy-speech-btn',
            'save-speech-btn',
            'clear-speech-btn'
        ];
        
        buttons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = !hasText;
            }
        });
    }

    // Enhanced copy functionality that works with both speech and translations
    handleCopySpeech() {
        if (!this.currentDisplayText) return;
        
        navigator.clipboard.writeText(this.currentDisplayText)
            .then(() => {
                const sourceText = this.lastCommunicationType === 'sign-language' ? 'translation' : 'speech';
                this.updateStatusMessage(`${sourceText} copied to clipboard`);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                this.updateStatusMessage('Failed to copy text');
            });
    }

    // Enhanced save functionality for unified communication history
    handleSaveSpeech() {
        if (this.communicationHistory.length === 0 && !this.currentDisplayText) return;
        
        // Prepare content for saving
        let content = '';
        
        if (this.communicationHistory.length > 0) {
            // Save the complete communication history
            content = this.communicationHistory.map(item => {
                const timeStr = new Date(item.timestamp).toLocaleString();
                const sourceIcon = item.source === 'sign-language' ? '🤟' : '🎤';
                const sourceLabel = item.source === 'sign-language' ? 'Sign Language' : 'Speech';
                
                let line = `${sourceIcon} [${timeStr}] ${sourceLabel}: "${item.text}"`;
                
                if (item.confidence) {
                    const confidencePercent = Math.round(item.confidence * 100);
                    line += ` (${confidencePercent}% confidence)`;
                }
                
                return line;
            }).join('\n');
        } else {
            // Fallback to current text if no history
            const sourceLabel = this.lastCommunicationType === 'sign-language' ? 'Sign Language' : 'Speech';
            content = `${sourceLabel}: "${this.currentDisplayText}"`;
        }
        
        // Create and download file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `communication-output-${timestamp}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.updateStatusMessage('Communication history saved to file');
    }

    // Enhanced clear functionality
    handleClearSpeech() {
        // Clear all communication data
        this.accumulatedSpeech = '';
        this.currentDisplayText = '';
        this.currentTranslation = null;
        this.communicationHistory = [];
        this.lastCommunicationType = null;
        
        // Reset the display
        const recognizedTextDiv = document.getElementById('recognizedText');
        recognizedTextDiv.textContent = 'Start speaking or signing to see text here...';
        recognizedTextDiv.className = 'p-2 border rounded bg-light'; // Reset classes
        
        // Hide accumulation indicator
        const accumulationIndicator = document.getElementById("speech-accumulation-indicator");
        if (accumulationIndicator) {
            accumulationIndicator.style.display = 'none';
        }
        
        // Reset mode label
        const speechModeLabel = document.getElementById("speech-mode-label");
        if (speechModeLabel) {
            const mode = this.getSTTMode();
            speechModeLabel.textContent = `Mode: ${mode === 'continuous' ? 'Continuous' : 'Push-to-Talk'}`;
        }
        
        // Disable buttons
        this.updateControlButtons(false);
        
        // Reset word count
        this.updateWordCount();
        
        // Request content script to clear its history too
        this.sendMessageToActiveTab({
            action: "clearTranslationHistory"
        });
        
        this.updateStatusMessage('All communication data cleared');
    }

    // Enhanced word count that works with current display text
    updateWordCount() {
        const wordCountElement = document.getElementById('word-count');
        if (!wordCountElement) return;
        
        let textToCount = '';
        
        if (this.lastCommunicationType === 'sign-language' && this.currentDisplayText) {
            textToCount = this.currentDisplayText;
        } else if (this.accumulatedSpeech) {
            textToCount = this.accumulatedSpeech;
        } else if (this.currentDisplayText) {
            textToCount = this.currentDisplayText;
        }
        
        if (!textToCount) {
            wordCountElement.textContent = '0 words';
            return;
        }
        
        const wordCount = textToCount.trim().split(/\s+/).length;
        const sourceLabel = this.lastCommunicationType === 'sign-language' ? 'sign language' : 'speech';
        wordCountElement.textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'} (${sourceLabel})`;
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
        document.getElementById('recognizedText').textContent = 'Start speaking or signing to see text here...';
        
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

    // Handle screen sharing button click
    handleScreenSharing() {
        console.log("Screen Sharing button clicked");
        
        // Toggle the active state
        if (this.screenSharingActive) {
            // Deactivate
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateStatusMessage('Screen sharing with MediaPipe deactivated');
            this.updateScreenSharingStatus('Off');
            
            // Send deactivation message to content script
            this.sendMessageToActiveTab({
                action: "stopScreenCapture"
            });
            
        } else {
            // Activate
            this.buttons.signLanguage.classList.add('active');
            this.updateStatusMessage('Preparing screen sharing with MediaPipe Holistic...');
            this.updateScreenSharingStatus('Processing');
            
            // Send activation command to content script
            this.sendMessageToActiveTab({
                action: "startScreenCapture"
            });
            
            // Set a timeout to check if activation succeeded
            setTimeout(() => {
                if (!this.screenSharingActive) {
                    // If still processing after 5 seconds, show a hint
                    this.updateStatusMessage('Waiting for screen share permission...');
                }
            }, 5000);
        }
    }
    
    // Toggle debug visualization mode
    toggleDebugMode() {
        this.sendMessageToActiveTab({
            action: "toggleDebugMode"
        });
    }
    
    // Add this method to handle incoming landmarks updates
    handleLandmarksUpdate(message) {
        if (!this.screenSharingActive) return;
        
        const { face, pose, leftHand, rightHand, fps, timestamp } = message;
        
        // Update status message with detection info
        const time = new Date(timestamp).toLocaleTimeString();
        
        // Build status text based on detected landmarks
        let detectedParts = [];
        if (face) detectedParts.push("Face");
        if (pose) detectedParts.push("Pose");
        if (leftHand) detectedParts.push("Left Hand");
        if (rightHand) detectedParts.push("Right Hand");
        
        let statusText = `[${time}] `;
        if (detectedParts.length > 0) {
            statusText += `Detected: ${detectedParts.join(", ")}`;
        } else {
            statusText += "No landmarks detected";
        }
        
        statusText += ` (${fps.toFixed(1)} FPS)`;
        
        this.updateStatusMessage(statusText);
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
        
        // Add debug mode toggle to the Screen Sharing button - double click to toggle
        this.buttons.signLanguage.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.toggleDebugMode();
        });
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