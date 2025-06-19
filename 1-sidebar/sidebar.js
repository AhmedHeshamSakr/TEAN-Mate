import welcomeAudio from '../2-features/TTS/messages/welcome.wav';
import ArtyomAssistant from "../2-features/STT/ArtyomAssistant.js"; 
import ImageCaptionHandler from "../2-features/ImageCaptioning/ImageCaptionHandler.js"; 
import SignLanguageHandler from "../2-features/SignLanguage/SignLanguageHandler.js"; 
import { Document, Packer, Paragraph, TextRun } from "docx";

// Update the SidebarController
class SidebarController {
    constructor() {
        // Store button references for easy access across methods
        this.buttons = {};
        
        // Initialize feature handlers - these manage the core functionality
        this.artyomAssistant = new ArtyomAssistant(this); // Speech-to-text with voice commands
        this.imageCaptionHandler = new ImageCaptionHandler(); // AI-powered image descriptions
        this.signLanguageHandler = new SignLanguageHandler(); // MediaPipe-based sign language detection

        // Initialize state variables
        this.pushToTalkActive = false;
        this.screenSharingActive = false; // Track if screen sharing is active
        this.ttsActive = false; // Add a state tracking variable for TTS
        this.accumulatedSpeech = '';
        this.speechSegments = []; // Array to store speech segments with timestamps
        this.debugModeActive = false; // Track if debug visualization is active
        
        this.initialize(); // Set up the entire sidebar interface
    }

    /**
     * Initialize the sidebar interface and all its components.
     * This method orchestrates the setup of audio, UI, event listeners, and settings.
     */
    initialize() {
        // Welcome the user with audio feedback - this creates a more engaging experience
        const audio = new Audio(welcomeAudio);
        audio.play().then(() => {
            console.log("Welcome audio played successfully");
        }).catch((error) => {
            console.error("Error playing welcome audio:", error);
        });
    
        // Set the sidebar title from the extension manifest - keeps branding consistent
        document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;
    
        // Wait for the DOM to be fully loaded before setting up interactions
        document.addEventListener("DOMContentLoaded", () => {
            this.setupEventListeners(); // Main button interactions
            this.initializeSTTListeners(); // Keyboard shortcuts for speech-to-text
            this.initializeUIElements(); // Dropdowns, checkboxes, and other controls
            this.initializeScreenSharingListeners(); // MediaPipe-related event handling
            
            // Check if screen sharing was active from a previous session
            setTimeout(() => {
                this.sendMessageToActiveTab({
                    action: "getScreenSharingStatus"
                });
            }, 1000);
        });
    
        // Apply user theme preferences (light, dark, high-contrast, or system)
        const self = this;
        this.getSettings().then((settings) => {
            // Apply theme
            self.applyTheme(settings.theme || 'system');
        }).catch((error) => {
            console.error("Error loading settings:", error);
        });
        this.setupSystemThemeListener(); // React to system theme changes
    
        // Set up message handling for communication with content scripts and background
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleIncomingMessages(message, sender, sendResponse);
        });
    }

    /**
     * Handle all incoming messages from content scripts and background processes.
     * This central message handler keeps all communication organized and maintainable.
     */
    handleIncomingMessages(message, sender, sendResponse) {
        if (message.action === "ttsStarted") {
            // Text-to-speech has begun reading - update button state
            this.setTTSActive(true);
        } else if (message.action === "ttsStopped") {
            // Text-to-speech has finished - reset button state
            this.setTTSActive(false);
        } else if (message.action === "setCommandsEnabled") {
            // Enable/disable voice commands (typically when video overlay is active)
            if (this.artyomAssistant) {
                this.artyomAssistant.setCommandsEnabled(message.enabled);
                if (!message.enabled) {
                    this.updateStatusMessage('Voice commands disabled during video overlay');
                } else {
                    this.updateStatusMessage('Voice commands re-enabled');
                }
            }
        } else if (message.action === "screenSharingStatus") {
            // MediaPipe screen sharing status has changed
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
            // Real-time updates from MediaPipe hand tracking
            this.handleLandmarksUpdate(message);
        } else if (message.action === "screenSharingEnded") {
            // Screen sharing has ended (user stopped or error occurred)
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateScreenSharingStatus('Off');
            this.updateStatusMessage('Screen sharing ended');
        } else if (message.action === "debugModeStatus") {
            // MediaPipe debug visualization has been toggled
            this.debugModeActive = message.enabled;
            this.updateStatusMessage(`Debug visualization ${message.enabled ? 'enabled' : 'disabled'}`);
        }
    }

    /**
     * Update the visual state of the text-to-speech button.
     * This provides clear feedback about whether TTS is currently active.
     */
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

    /**
     * Initialize event listeners for screen sharing functionality.
     * These handle the complex MediaPipe integration for sign language detection.
     */
    initializeScreenSharingListeners() {
        // Listen for screen sharing ended event from the sign language handler
        window.addEventListener('screenSharingEnded', () => {
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateScreenSharingStatus('Off');
            this.updateStatusMessage('Screen sharing ended');
        });
    }

    /**
     * Initialize all UI elements that need interactive behavior.
     * This method sets up the complex interactions between different interface components.
     */
    initializeUIElements() {
        // Add listener for TTS mode change
        const ttsModeSelect = document.getElementById('tts-mode-select');
        if (ttsModeSelect) {
            ttsModeSelect.addEventListener('change', this.handleTTSModeChange.bind(this));
        }

        // Add listener for mode change
        const modeSelect = document.getElementById('stt-mode-select');
        if (modeSelect) {
            modeSelect.addEventListener('change', this.handleSTTModeChange.bind(this));
        }

        // NEW: Real-time caption type changes - this is the key improvement
        // Users can now change caption detail levels while the feature is active
        const captionTypeSelect = document.getElementById('caption-type-select');
        if (captionTypeSelect) {
            captionTypeSelect.addEventListener('change', this.handleCaptionTypeChange.bind(this));
        }

        // Keyboard shortcuts panel toggle
        const shortcutsBtn = document.getElementById('shortcutsButton');
        if (shortcutsBtn) {
            shortcutsBtn.addEventListener('click', this.toggleShortcutsPanel.bind(this));
        }

        // Speech recognition text management buttons
        const copyBtn = document.getElementById('copy-speech-btn');
        const saveBtn = document.getElementById('save-speech-btn');
        const clearBtn = document.getElementById('clear-speech-btn');
        
        if (copyBtn) copyBtn.addEventListener('click', this.handleCopySpeech.bind(this));
        if (saveBtn) saveBtn.addEventListener('click', this.handleSaveSpeech.bind(this));
        if (clearBtn) clearBtn.addEventListener('click', this.handleClearSpeech.bind(this));

        // Video overlay for speech-to-text in continuous mode
        const videoOverlayCheckbox = document.getElementById('video-overlay-checkbox');
        if (videoOverlayCheckbox) {
            videoOverlayCheckbox.addEventListener('change', (event) => {
                const isEnabled = event.target.checked;
                
                // Communicate with content script to show/hide video overlay
                this.sendMessageToActiveTab({
                    action: "toggleVideoOverlay",
                    enabled: isEnabled
                });
                
                this.updateStatusMessage(`Video text overlay ${isEnabled ? 'enabled' : 'disabled'}`);
            });
        }
        
        // Set initial ready state
        this.updateStatusMessage('Ready to assist');
    }

    /**
     * NEW: Handle real-time caption type changes while the feature is active.
     * This is a major UX improvement - users no longer need to restart the feature
     * to try different caption detail levels.
     */
    handleCaptionTypeChange(event) {
        const newType = event.target.value;
        
        // Only apply changes when image captioning is currently running
        if (this.imageCaptionHandler.isActive) {
            console.log('[SIDEBAR] Changing caption type to:', newType);
            
            // Update the local handler configuration
            this.imageCaptionHandler.setCaptionType(newType);
            
            // Notify the content script about the change
            this.sendMessageToActiveTab({ 
                action: "updateCaptionType",
                captionType: newType 
            });
            
            // Provide immediate feedback to the user
            this.updateStatusMessage(`Caption type changed to: ${this.getCaptionTypeDisplayName(newType)}`);
        }
        // If the feature isn't active, the selection is just stored for when it activates
    }

    /**
     * Convert internal caption type identifiers to user-friendly display names.
     * This abstraction makes the interface more accessible and the code more maintainable.
     */
    getCaptionTypeDisplayName(type) {
        switch(type) {
            case '<CAPTION>': return 'Basic';
            case '<DETAILED_CAPTION>': return 'Detailed';
            case '<MORE_DETAILED_CAPTION>': return 'More Detailed';
            default: return type;
        }
    }

    /**
     * Toggle the keyboard shortcuts help panel.
     * This provides users with quick reference for available keyboard commands.
     */
    toggleShortcutsPanel() {
        const panel = document.getElementById('shortcuts-panel');
        if (panel) {
            const isVisible = panel.style.display !== 'none';
            panel.style.display = isVisible ? 'none' : 'block';
        }
    }

    /**
     * Copy accumulated speech text to the system clipboard.
     * This enables users to easily transfer recognized speech to other applications.
     */
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
    
    async handleSaveSpeech() {
        if (!this.accumulatedSpeech) {
            this.updateStatusMessage("No speech to save", "error");
            return;
        }

        // Get file format and save location from settings with proper error handling
        let fileFormat = 'txt'; // Default format
        let saveLocation = 'TEAN Mate Transcriptions'; // Default location
        try {
            const settings = await this.getSettings();
            if (settings) {
                if (settings.defaultFileFormat) {
                    fileFormat = settings.defaultFileFormat;
                }
                if (settings.defaultSaveLocation) {
                    saveLocation = settings.defaultSaveLocation;
                }
            }
        } catch (settingsError) {
            console.warn("Could not load settings, using defaults:", settingsError);
        }

        try {
            let blob;
            let filename;
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            switch (fileFormat) {
                case 'docx': {
                    // Use docx library to create a real Word document
                    const doc = new Document({
                        sections: [{
                            properties: {},
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun(this.accumulatedSpeech)
                                    ]
                                })
                            ]
                        }]
                    });
                    blob = await Packer.toBlob(doc);
                    filename = `speech_${timestamp}.docx`;
                    break;
                }
                case 'srt': {
                    const srtContent = this.convertToSRTWithTimestamps();
                    blob = new Blob([srtContent], { type: 'application/x-subrip' });
                    filename = `speech_${timestamp}.srt`;
                    break;
                }
                case 'json': {
                    const startTime = this.speechSegments[0]?.timestamp || 0;
                    const jsonData = {
                        text: this.accumulatedSpeech,
                        timestamp: new Date().toISOString(),
                        segments: this.speechSegments.map(segment => ({
                            text: segment.text,
                            timestamp: segment.timestamp,
                            relativeTime: segment.timestamp - startTime,
                            formattedTime: this.formatRelativeTime(segment.timestamp - startTime)
                        }))
                    };
                    blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
                    filename = `speech_${timestamp}.json`;
                    break;
                }
                case 'txt':
                default: {
                    blob = new Blob([this.accumulatedSpeech], { type: 'text/plain' });
                    filename = `speech_${timestamp}.txt`;
                    break;
                }
            }

            // Create a temporary URL for the blob
            const url = URL.createObjectURL(blob);

            // Use Chrome's downloads API to save the file
            chrome.downloads.download({
                url: url,
                filename: `${saveLocation}/${filename}`,
                saveAs: false
            }, (downloadId) => {
                if (chrome.runtime.lastError) {
                    console.error("Error saving file:", chrome.runtime.lastError);
                    this.updateStatusMessage("Error saving speech");
                } else {
                    this.updateStatusMessage(`Speech saved as ${filename} in ${saveLocation} folder`);
                }
                // Clean up the temporary URL
                URL.revokeObjectURL(url);
            });
        } catch (error) {
            console.error("Error saving speech:", error);
            this.updateStatusMessage("Error saving speech");
        }
    }
    
    convertToSRTWithTimestamps() {
        if (this.speechSegments.length === 0) return '';
        
        let srtContent = '';
        const startTime = this.speechSegments[0].timestamp;
        
        this.speechSegments.forEach((segment, index) => {
            if (!segment.text.trim()) return;
            
            // Calculate relative timestamps in seconds
            const relativeStartTime = (segment.timestamp - startTime) / 1000;
            const relativeEndTime = index < this.speechSegments.length - 1 
                ? (this.speechSegments[index + 1].timestamp - startTime) / 1000
                : relativeStartTime + 3; // If it's the last segment, add 3 seconds
            
            srtContent += `${index + 1}\n`;
            srtContent += `${this.formatSRTTime(relativeStartTime)} --> ${this.formatSRTTime(relativeEndTime)}\n`;
            srtContent += `${segment.text.trim()}\n\n`;
        });
        
        return srtContent;
    }

    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }
    
    formatRelativeTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    /**
     * Update the word count display for accumulated speech.
     * This helps users track how much content they've dictated.
     */
    updateWordCount() {
        const wordCountElement = document.getElementById('word-count');
        if (!wordCountElement) return;
        
        if (!this.accumulatedSpeech) {
            wordCountElement.textContent = '0 words';
            return;
        }
        
        // Count words by splitting on whitespace and filtering empty strings
        const wordCount = this.accumulatedSpeech.trim().split(/\s+/).length;
        wordCountElement.textContent = `${wordCount} ${wordCount === 1 ? 'word' : 'words'}`;
    }
    
    // Update the updateSpeechDisplay method to track timestamps
    updateSpeechDisplay(text, isFinal = false) {
        const recognizedTextDiv = document.getElementById("recognizedText");
        const speechModeLabel = document.getElementById("speech-mode-label");
        const accumulationIndicator = document.getElementById("speech-accumulation-indicator");
        
        // Update the mode display to keep users informed
        const mode = this.getSTTMode();
        if (speechModeLabel) {
            speechModeLabel.textContent = `Mode: ${mode === 'continuous' ? 'Continuous' : 'Push-to-Talk'}`;
        }

        // Send text to video overlay if enabled in continuous mode
        const videoOverlayCheckbox = document.getElementById('video-overlay-checkbox');
        if (mode === 'continuous' && videoOverlayCheckbox && videoOverlayCheckbox.checked) {
            this.sendMessageToActiveTab({
                action: "displayOverlayText",
                text: text,
                isFinal: isFinal
            });
        }
        
        // Enable action buttons when there's text to work with
        const hasText = text && text.trim().length > 0;
        document.getElementById('copy-speech-btn').disabled = !hasText;
        document.getElementById('save-speech-btn').disabled = !hasText;
        document.getElementById('clear-speech-btn').disabled = !hasText;
        
        // Handle text accumulation in continuous mode
        if (mode === 'continuous' && isFinal && text.trim()) {
            // Show visual indicator that text is being accumulated
            if (accumulationIndicator) {
                accumulationIndicator.style.display = 'inline-block';
            }
            
            // Append new text with proper spacing
            if (this.accumulatedSpeech) {
                this.accumulatedSpeech += ' ' + text;
            } else {
                this.accumulatedSpeech = text;
            }

            // Add new segment with timestamp
            this.speechSegments.push({
                text: text.trim(),
                timestamp: new Date().getTime()
            });
            
            // Update the display with accumulated text
            recognizedTextDiv.textContent = this.accumulatedSpeech;
            recognizedTextDiv.classList.add('accumulating');
            
            // Keep word count current
            this.updateWordCount();
        } 
        // In push-to-talk mode, just show the current recognition
        else {
            // Hide accumulation indicator for immediate results
            if (accumulationIndicator) {
                accumulationIndicator.style.display = 'none';
            }
            
            recognizedTextDiv.textContent = text;
            recognizedTextDiv.classList.remove('accumulating');
        }
    }
    
    // Update handleClearSpeech to also clear speech segments
    handleClearSpeech() {
        this.accumulatedSpeech = '';
        this.speechSegments = [];
        
        // Reset the speech recognition display to its initial state
        document.getElementById('recognizedText').textContent = 'Start speaking to see the text here...';
        document.getElementById('recognizedText').classList.remove('accumulating');
        
        // Hide the accumulation indicator
        const accumulationIndicator = document.getElementById("speech-accumulation-indicator");
        if (accumulationIndicator) {
            accumulationIndicator.style.display = 'none';
        }
        
        // Disable action buttons since there's no text to act on
        document.getElementById('copy-speech-btn').disabled = true;
        document.getElementById('save-speech-btn').disabled = true;
        document.getElementById('clear-speech-btn').disabled = true;
        
        // Reset word count and provide feedback
        this.updateWordCount();
        this.updateStatusMessage('Speech text cleared');
    }
    
    // Update handleSTTModeChange to also clear speech segments
    handleSTTModeChange(event) {
        const mode = event.target.value;
        console.log('STT mode changed to:', mode);
        
        // Stop any active reading
        this.sendMessageToActiveTab({ action: "stopTTS" });
        
        // Send the new reading mode to the content script
        this.sendMessageToActiveTab({ 
            action: "setReadingMode", 
            mode: mode 
        });
        
        // Clear accumulated speech and segments when mode changes
        this.accumulatedSpeech = '';
        this.speechSegments = [];
        const recognizedTextDiv = document.getElementById("recognizedText");
        if (recognizedTextDiv) {
            recognizedTextDiv.textContent = '';
            recognizedTextDiv.classList.remove('accumulating');
        }
        
        this.updateStatusMessage(`Speech-to-text mode set to ${mode}`, "info");
    }

    /**
     * Handle the screen sharing button for MediaPipe sign language detection.
     * This manages the complex setup required for computer vision-based accessibility.
     */
    handleScreenSharing() {
        console.log("Screen Sharing button clicked");
        
        if (this.screenSharingActive) {
            // Deactivate screen sharing
            this.screenSharingActive = false;
            this.buttons.signLanguage.classList.remove('active');
            this.updateStatusMessage('Screen sharing with MediaPipe deactivated');
            this.updateScreenSharingStatus('Off');
            
            // Notify content script to stop capture
            this.sendMessageToActiveTab({
                action: "stopScreenCapture"
            });
            
        } else {
            // Activate screen sharing
            this.buttons.signLanguage.classList.add('active');
            this.updateStatusMessage('Preparing screen sharing with MediaPipe Holistic...');
            this.updateScreenSharingStatus('Processing');
            
            // Request content script to start capture
            this.sendMessageToActiveTab({
                action: "startScreenCapture"
            });
            
            // Provide feedback if activation takes too long
            setTimeout(() => {
                if (!this.screenSharingActive) {
                    this.updateStatusMessage('Waiting for screen share permission...');
                }
            }, 5000);
        }
    }
    
    /**
     * Toggle MediaPipe debug visualization mode.
     * This helps developers and advanced users understand what the AI is detecting.
     */
    toggleDebugMode() {
        this.sendMessageToActiveTab({
            action: "toggleDebugMode"
        });
    }
    
    /**
     * Handle real-time hand landmarks updates from MediaPipe.
     * This processes the computer vision data and provides user feedback.
     */
    handleLandmarksUpdate(message) {
        if (!this.screenSharingActive) return;
        
        const { face, pose, leftHand, rightHand, fps, timestamp } = message;
        
        // Create human-readable status based on detection results
        const time = new Date(timestamp).toLocaleTimeString();
        
        // Build a list of what's currently being detected
        let detectedParts = [];
        if (face) detectedParts.push("Face");
        if (pose) detectedParts.push("Pose");
        if (leftHand) detectedParts.push("Left Hand");
        if (rightHand) detectedParts.push("Right Hand");
        
        // Format the status message with timing and performance info
        let statusText = `[${time}] `;
        if (detectedParts.length > 0) {
            statusText += `Detected: ${detectedParts.join(", ")}`;
        } else {
            statusText += "No landmarks detected";
        }
        
        statusText += ` (${fps.toFixed(1)} FPS)`;
        
        this.updateStatusMessage(statusText);
    }
    
    /**
     * Update the visual status indicator for screen sharing.
     * This provides clear feedback about the MediaPipe system state.
     */
    updateScreenSharingStatus(status) {
        const indicator = document.getElementById('sign-status-indicator');
        if (!indicator) return;
        
        // Clear all existing status classes
        indicator.classList.remove('bg-secondary', 'bg-success', 'bg-danger', 'bg-warning');
        
        // Apply appropriate status styling and text
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

    /**
     * Update the visual status indicator for speech-to-text.
     * This helps users understand when the system is actively listening.
     */
    updateSTTStatus(status) {
        const indicator = document.getElementById('stt-status-indicator');
        if (!indicator) return;
        
        // Clear existing status classes
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
        
        // Update status message for listening state
        if (status === 'Listening') {
            this.updateStatusMessage('Speech recognition active...');
        }
    }

    /**
     * Update the visual status indicator for image captioning.
     * This shows users whether AI image analysis is currently enabled.
     */
    updateCaptionStatus(status) {
        const indicator = document.getElementById('caption-status');
        if (!indicator) return;
        
        // Clear existing status classes
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

    /**
     * Update the main status message area.
     * This provides centralized user feedback across all features.
     */
    updateStatusMessage(message) {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
        }
    }

    /**
     * Apply the selected theme (light, dark, high-contrast, or system).
     * This ensures the interface matches user preferences and accessibility needs.
     */
    applyTheme(themeSetting) {
        const htmlElement = document.documentElement;
        
        if (themeSetting === 'system') {
            // Respect the user's system-wide theme preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                htmlElement.setAttribute('data-theme', 'dark');
            } else {
                htmlElement.setAttribute('data-theme', 'light');
            }
        } else {
            // Apply the explicitly selected theme
            htmlElement.setAttribute('data-theme', themeSetting);
        }
        
        console.log(`Applied theme: ${themeSetting}`);
    }
    
    /**
     * Listen for system theme changes and respond appropriately.
     * This keeps the interface in sync when users change their system settings.
     */
    setupSystemThemeListener() {
        const self = this;
        if (window.matchMedia) {
            const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // React to theme changes only if set to follow system
            colorSchemeQuery.addEventListener('change', (e) => {
                self.getSettings().then((settings) => {
                    // Only update if set to system theme
                    if (settings.theme === 'system') {
                        self.applyTheme('system');
                    }
                }).catch((error) => {
                    console.error("Error loading settings:", error);
                });
            });
        }
    }

    // Get user settings from storage
    getSettings() {
        return new Promise((resolve, reject) => {
            // First check the storage preference
            chrome.storage.local.get('settings', function(localData) {
                if (localData.settings && localData.settings.dataStorage) {
                    const storagePreference = localData.settings.dataStorage;
                    
                    if (storagePreference === 'sync') {
                        // Load from sync storage
                        chrome.storage.sync.get('settings', function(syncData) {
                            resolve(syncData.settings || {});
                        });
                    } else {
                        // Load from local storage
                        resolve(localData.settings || {});
                    }
                } else {
                    // If no preference is set, try both storages
                    chrome.storage.sync.get('settings', function(syncData) {
                        if (syncData.settings) {
                            resolve(syncData.settings);
                        } else {
                            resolve(localData.settings || {});
                        }
                    });
                }
            });
        });
    }

    /**
     * Set up event listeners for all main accessibility feature buttons.
     * This creates the primary interaction points for users.
     */
    setupEventListeners() {
        const buttons = document.querySelectorAll(".accessibility-button");
        if (!buttons.length) {
            console.warn("No accessibility buttons found!");
            return;
        }

        // Map buttons to their handler methods
        this.buttons.tts = buttons[0];
        this.buttons.stt = buttons[1];
        this.buttons.imageCaption = buttons[2];
        this.buttons.signLanguage = buttons[3];
        this.buttons.options = document.getElementById('settingsButton');

        // Bind event handlers to each button
        this.addButtonListener(this.buttons.tts, this.handleTTS.bind(this));
        this.addButtonListener(this.buttons.stt, this.handleSTT.bind(this));
        this.addButtonListener(this.buttons.imageCaption, this.handleImageCaption.bind(this));
        this.addButtonListener(this.buttons.signLanguage, this.handleScreenSharing.bind(this));
        this.addButtonListener(this.buttons.options, this.handleOptions.bind(this));
        
        // Add debug mode toggle via double-click on sign language button
        this.buttons.signLanguage.addEventListener('dblclick', (e) => {
            e.preventDefault();
            this.toggleDebugMode();
        });
    }

    /**
     * Safely add an event listener to a button with error handling.
     * This prevents the entire interface from breaking if one button fails.
     */
    addButtonListener(button, handler) {
        if (!button) {
            console.warn("Button not found, skipping event binding.");
            return;
        }
        button.addEventListener("click", handler);
    }

    /**
     * Handle Text-to-Speech button clicks.
     * This toggles between starting and stopping page reading.
     */
    handleTTS() {
        console.log("Text-to-Speech button clicked");
        
        if (this.ttsActive) {
            // If currently reading, stop it
            this.sendMessageToActiveTab({ action: "stopTTS" });
            this.setTTSActive(false);
        } else {
            // Start reading the page content
            this.sendMessageToActiveTab({ action: "extractText" });
            this.updateStatusMessage('Extracting text from page...');
        }
    }

    /**
     * Handle Speech-to-Text button clicks.
     * This manages different behaviors based on the selected mode.
     */
    handleSTT() {
        console.log("Speech-to-Text button clicked");
        const mode = this.getSTTMode();
        
        // In push-to-talk mode, the button just shows instructions
        if (mode === 'push-to-talk') {
            this.updateStatusMessage('Hold SPACE key to speak');
            return;
        }
        
        // In continuous mode, the button toggles listening state
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

    /**
     * UPDATED: Handle Image Captioning button clicks with streamlined UX.
     * The main button now directly toggles activation, eliminating the extra confirmation step.
     */
    async handleImageCaption() {
        console.log("Image Captioning button clicked");
        
        if (this.imageCaptionHandler.isActive) {
            // Deactivate the feature and clean up
            await this.imageCaptionHandler.deactivate();
            this.updateCaptionStatus('Off');
            this.updateStatusMessage('Image captioning turned off');
            this.buttons.imageCaption.classList.remove('active');
            
            // Disable the caption type dropdown when inactive
            const captionTypeSelect = document.getElementById('caption-type-select');
            if (captionTypeSelect) {
                captionTypeSelect.disabled = true;
            }
            
            // Notify content script to stop captioning
            this.sendMessageToActiveTab({ 
                action: "deactivateImageCaptioning" 
            });
            return;
        }
        
        // Activate with the currently selected caption type
        const captionTypeSelect = document.getElementById('caption-type-select');
        const selectedType = captionTypeSelect ? captionTypeSelect.value : '<MORE_DETAILED_CAPTION>';
        
        console.log('[SIDEBAR] Activating with caption type:', selectedType);
        
        // Configure and activate the caption handler
        this.imageCaptionHandler.setCaptionType(selectedType);
        this.imageCaptionHandler.isActive = true;
        
        // Enable the dropdown for real-time type changes
        if (captionTypeSelect) {
            captionTypeSelect.disabled = false;
        }
        
        // Notify content script to start captioning
        this.sendMessageToActiveTab({ 
            action: "activateImageCaptioning",
            captionType: selectedType 
        });
        
        // Update interface to show active state
        this.buttons.imageCaption.classList.add('active');
        this.updateCaptionStatus('Active');
        this.updateStatusMessage(`Image captioning activated with ${this.getCaptionTypeDisplayName(selectedType)} captions`);
    }

    /**
     * Handle Options button clicks.
     * This opens the extension's settings page in a new browser tab.
     */
    handleOptions() {
        console.log("Options button clicked");
        chrome.runtime.openOptionsPage();
    }

    /**
     * Send a message to the active browser tab.
     * This is the primary way the sidebar communicates with content scripts.
     */
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

    /**
     * Initialize keyboard shortcuts for speech-to-text push-to-talk functionality.
     * This sets up the space bar as a voice activation key.
     */
    initializeSTTListeners() {
        // Space key down - start listening in push-to-talk mode
        window.addEventListener("keydown", (event) => {
            // Only respond in push-to-talk mode
            if (this.getSTTMode() !== 'push-to-talk') return;
            
            if (event.code === "Space" && !this.artyomAssistant.isListening && !this.pushToTalkActive) {
                console.log("Push-to-Talk: Listening activated");
                this.sendMessageToActiveTab({ action: "pauseTTS" });
                this.artyomAssistant.startListening();
                this.updateSTTStatus('Listening');
                this.pushToTalkActive = true;
            }
        });
        
        // Space key up - stop listening in push-to-talk mode
        window.addEventListener("keyup", (event) => {
            // Only respond if currently in push-to-talk mode and actively listening
            if (this.getSTTMode() !== 'push-to-talk' || !this.pushToTalkActive) return;
            
            if (event.code === "Space" && this.artyomAssistant.isListening) {
                console.log("Push-to-Talk: Listening stopped");
                this.sendMessageToActiveTab({ action: "resumeTTS" });
                this.artyomAssistant.stopListening();
                this.updateSTTStatus('Ready');
                this.pushToTalkActive = false;
            }
        });

        // Escape key - cancel any active operation
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

    /**
     * Get the currently selected speech-to-text mode.
     * This determines whether to use push-to-talk or continuous listening.
     */
    getSTTMode() {
        const modeSelect = document.getElementById('stt-mode-select');
        return modeSelect ? modeSelect.value : 'push-to-talk';
    }

    /**
     * Handle navigation commands for skipping to the next readable item.
     * This supports keyboard-driven page navigation for accessibility.
     */
    handleSkipNext() {
        console.log("Skipping to next item...");
        this.sendMessageToActiveTab({ action: "skipToNext" });
        this.updateStatusMessage('Skipping to next item...');
    }
    
    /**
     * Handle navigation commands for skipping to the previous readable item.
     * This enables backward navigation through page content.
     */
    handleSkipPrevious() {
        console.log("Skipping to previous item...");
        this.sendMessageToActiveTab({ action: "skipToPrevious" });
        this.updateStatusMessage('Skipping to previous item...');
    }
    
    /**
     * Handle activation of the currently focused interactive element.
     * This provides a way to "click" links and buttons via voice commands.
     */
    handleAccessLink() {
        console.log("Accessing link...");
        this.sendMessageToActiveTab({ action: "accessLink" });
        this.updateStatusMessage('Accessing selected link...');
    }
    
    /**
     * Handle stopping the current text-to-speech reading.
     * This provides immediate control over audio output.
     */
    handleStopReading() {
        console.log("Reading Stopped...");
        this.sendMessageToActiveTab({ action: "pauseTTS" });
        this.setTTSActive(false);
        this.updateStatusMessage('Reading paused');
    }

    /**
     * Handle web search functionality triggered by voice commands.
     * This opens search results in a new tab for user convenience.
     */
    handleSearch(query) {
        console.log(`Searching for: ${query}`);
        this.sendMessageToActiveTab({ 
            action: "performSearch", 
            query: query 
        });
        this.updateStatusMessage(`Searching for: ${query}`);
   }

   /**
    * Programmatically trigger button actions from voice commands.
    * This creates a bridge between speech recognition and interface actions.
    */
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

   // Handle TTS mode change
   handleTTSModeChange(event) {
       const mode = event.target.value;
       console.log(`TTS mode changed to: ${mode}`);
       
       // Stop any active reading
       if (this.ttsActive) {
           this.sendMessageToActiveTab({ action: "stopTTS" });
           this.setTTSActive(false);
       }
       
       // Send the new reading mode to content script
       this.sendMessageToActiveTab({
           action: "setReadingMode",
           mode: mode
       });
       
       // Update status message
       this.updateStatusMessage(`Reading mode set to: ${mode}`);
   }
}

// Instantiate the SidebarController
const sidebarController = new SidebarController();
export default sidebarController;