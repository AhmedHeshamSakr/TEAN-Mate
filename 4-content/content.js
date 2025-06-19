// content.js - Complete implementation for video overlay only sign language display
// This file replaces your existing content.js

import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";
import InteractionHandler from "../2-features/TTS/InteractionHandler.js";
import ImageCaptionHandler from "../2-features/ImageCaptioning/ImageCaptionHandler.js"; 
import VideoOverlayManager from "../2-features/STT/VideoOverlayManager.js";
import SignLanguageHandler from "../2-features/SignLanguage/SignLanguageHandler.js"; 

class ContentHandler {
    constructor() {
        // Text-to-Speech related properties
        this.sections = [];
        this.pastBorderStyle = "";
        this.pastBackgroundStyle = "";

        // Initialize core TTS functionality
        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        
        // Initialize image captioning functionality
        this.imageCaptionHandler = new ImageCaptionHandler(chrome.runtime.getURL('Florence-2-base-ft'));
        
        // Initialize STT video overlay manager (for speech recognition overlays, separate from sign language)
        this.videoOverlayManager = new VideoOverlayManager();
        
        // Initialize sign language handler with video overlay capability
        // This is the core component that will display translations as video captions
        this.signLanguageHandler = new SignLanguageHandler(); 
        
        console.log('VideoOverlayManager initialized in content script:', this.videoOverlayManager);
        console.log('Sign Language handler initialized for video overlay display only:', this.signLanguageHandler);

        // TTS navigation state
        this.currentElement = null;
        this.currentLink = null;
        this.nextElementAfterListbox = null;
        this.isProgrammaticFocus = false;
        this.isReadingActive = false;
        this.wasSpeaking = false;
        
        // Create tree walker for DOM navigation
        this.walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    const tagName = node.tagName?.toLowerCase();
                    if (["script", "style", "noscript"].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        // Set up event listeners
        document.addEventListener('focusin', this.handleFocusChange.bind(this));
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Initialize the system
        this.resetReadingState();
    }

    /**
     * Reset and initialize all system state
     * This method sets up event listeners for the video overlay system
     */
    resetReadingState() {
        // Reset TTS state
        this.isReadingActive = false;
        this.wasSpeaking = false;
        this.settings = null;
        this.initializeSettings();

        // Reset current element tracking
        this.currentElement = null;
        if (this.speechHandler.isSpeaking) {
            this.speechHandler.stop();
        }
        if (this.currentElement && this.currentElement.elementsToReturn) {
            for (let el of this.currentElement.elementsToReturn) {
                this.highlightBox.removeHighlight(el);
            }
        }
        
        // Set up MediaPipe landmark detection monitoring
        // This provides system health data but doesn't affect display
        window.addEventListener('handLandmarksDetected', (event) => {
            const { leftHand, rightHand, face, pose, timestamp, fps } = event.detail;
            console.log(`[${new Date(timestamp).toLocaleTimeString()}] MediaPipe Detection (${fps.toFixed(1)} FPS)`, 
                face ? 'Face detected' : 'No face',
                pose ? 'Pose detected' : 'No pose',
                leftHand ? 'Left hand detected' : 'No left hand', 
                rightHand ? 'Right hand detected' : 'No right hand');
            
            // Send basic detection status to sidebar for monitoring only
            // This is just for system health display, not for translation text
            chrome.runtime.sendMessage({
                action: "handLandmarksUpdate",
                face: face !== null,
                pose: pose !== null,
                leftHand: leftHand !== null,
                rightHand: rightHand !== null,
                fps: fps,
                timestamp: timestamp
            });
        });
        
        // CRITICAL: Set up sign language translation event listener for video overlay ONLY
        // This completely replaces the previous sidebar forwarding approach
        window.addEventListener('signLanguageTranslation', (event) => {
            const { translatedText, timestamp, confidence, words, translationHistory } = event.detail;
            
            console.log(`[${new Date(timestamp).toLocaleTimeString()}] Sign Language Translation for Video Overlay Only: "${translatedText}"`);
            
            // The translation is already displayed as a video overlay by the SignLanguageHandler
            // We only log this event for debugging and monitoring purposes
            
            // IMPORTANT: NO SIDEBAR FORWARDING FOR TRANSLATIONS
            // The SignLanguageHandler.processTranslationForVideoOverlay() method handles all display logic
            // This is the fundamental difference from the previous implementation
            
            console.log(`[CONTENT] Translation processed exclusively by video overlay system - no sidebar display`);
            
            // Optional: Send minimal data to sidebar for statistics/history tracking only
            // This is NOT for display purposes - only for system monitoring
            // Uncomment the following if you want basic sidebar statistics:
            /*
            chrome.runtime.sendMessage({
                action: "signLanguageStatistics",
                translatedText: translatedText,
                timestamp: timestamp,
                confidence: confidence,
                displayMethod: 'video-overlay-only',
                // Note: this is for statistics only, not display
                isStatisticsOnly: true
            });
            */
        });
        
        // Set up screen sharing lifecycle event listeners
        window.addEventListener('screenSharingEnded', () => {
            console.log('Screen sharing ended event received');
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: 'Off'
            });
        });
        
        window.addEventListener('screenSharingFailed', (event) => {
            console.error('Screen sharing failed:', event.detail?.reason || 'Unknown error');
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: 'Error',
                message: event.detail?.reason || 'Unknown error'
            });
        });
    }

    // TTS notification methods for sidebar integration
    notifySpeechStarted() {
        chrome.runtime.sendMessage({
            action: "ttsStarted"
        });
    }
    
    notifySpeechStopped() {
        chrome.runtime.sendMessage({
            action: "ttsStopped"
        });
    }

    // Settings management
    getSettings(callback) {
        chrome.storage.sync.get('settings', function(data) {
            if (data.settings) {
                callback(data.settings);
            } else {
                chrome.storage.local.get('settings', function(localData) {
                    callback(localData.settings || {});
                });
            }
        });
    }

    initializeSettings() {
        const self = this;
        this.getSettings(function(settings) {
            console.log('Loaded settings:', settings);
            self.settings = settings;
            self.highlightWhileReading = settings.highlightText || false;
            self.badge = settings.showIconBadge || false;
            self.readSelectedTextOnly = settings.readingElement === 'selected';
            const ttsRate = settings.ttsRate || 1.0;
            console.log('Using TTS rate:', ttsRate);
        });
    }

    // TTS text selection methods
    getSelectedText() {
        console.log('getSelectedText called');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString().trim();
            
            if (selectedText) {
                return { 
                    elementsToReturn: [], // Empty array to prevent highlighting
                    text: [selectedText]
                };
            }
        }
        return null;
    }

    // TTS DOM navigation methods
    getNextElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.nextNode()) {
            const element = this.walker.currentNode;
            if(TextExtractor.processedElements.has(element)) continue;
            if (this.isElementVisible(element)) {
                // Check if element has any interactive children
                const hasInteractiveChildren = Array.from(element.querySelectorAll('*')).some(child => 
                    InteractionHandler.isInteractiveElement(child) && this.isElementVisible(child)
                );

                // Skip this element if it has interactive children
                if (hasInteractiveChildren) {
                    continue;
                }

                const tagName = element.tagName?.toLowerCase();
                if (tagName === 'a' && element.href) {
                    const domain = new URL(element.href).hostname.replace('www.', '');
                    text.push(element.textContent.trim() ? `Link text: ${element.textContent.trim()}` : `Link to ${domain}`);
                    elementsToReturn.push(element);
                    this.currentLink = element;
                    TextExtractor.processAllDescendants(element);
                }
                else if (InteractionHandler.isInteractiveElement(element)) {
                    const stateText = TextExtractor.getElementState(element);
                    const isRadio = element.getAttribute('role') === 'radio' || element.type === 'radio';
                    const isCheckbox = element.getAttribute('role') === 'checkbox' || element.type === 'checkbox';
                    const isTreeItem = element.getAttribute('role') === 'treeitem';
                    
                    const ariaLabel = element.getAttribute('aria-label');
                    
                    if (isRadio || isCheckbox) {
                        console.log(`generic ${isRadio ? 'radio' : 'checkbox'} text discovery`);
                        const labelText = this.getInputLabelText(element);
                        text.push(`${stateText}. ${labelText}`);
                        elementsToReturn.push(element);
                        this.markInputLabelProcessed(element);
                    } else if (isTreeItem) {
                        console.log('treeitem text discovery');
                        const expanded = element.getAttribute('aria-expanded') === 'true';
                        const itemText = element.textContent.trim();
                        text.push(`${expanded ? 'Expanded' : 'Collapsed'} tree item: ${itemText}`);
                        elementsToReturn.push(element);
                        this.currentLink = element;
                    } else {
                        const radioOrCheckboxChild = element.querySelector('[role="radio"], [role="checkbox"], [type="radio"], [type="checkbox"]');
                        if (radioOrCheckboxChild && this.isElementVisible(radioOrCheckboxChild) &&
                            !TextExtractor.processedElements.has(radioOrCheckboxChild)) {
                            console.log('container with radio/checkbox child found');
                            const childStateText = TextExtractor.getElementState(radioOrCheckboxChild);
                            const childLabelText = this.getInputLabelText(radioOrCheckboxChild);
                            text.push(`${childStateText}. ${childLabelText}`);
                            elementsToReturn.push(radioOrCheckboxChild);
                            this.currentLink = radioOrCheckboxChild;
                            TextExtractor.processedElements.add(radioOrCheckboxChild);
                        } else {
                            console.log('non-radio/checkbox text discovery');
                            const elementText = ariaLabel || element.textContent.trim();
                            text.push(`${stateText}${elementText}`);
                            elementsToReturn.push(element);
                        }
                    }
                    TextExtractor.processAllDescendants(element);
                    this.currentLink = element;
                }
                else {
                    for (const child of element.childNodes) {
                        let textRes = '';
                        if (child.nodeType === Node.TEXT_NODE) {
                            textRes = child.textContent.trim();
                            if (textRes !== ''){
                                text.push(textRes);
                                elementsToReturn.push(element);
                            }
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            textRes = this.textExtractor.extractText(child);
                            if (textRes !== ''){
                                text.push(textRes);
                                elementsToReturn.push(child);
                            }
                            if (InteractionHandler.isInteractiveElement(child)) {
                                this.currentLink = child;
                            } else this.currentLink = null;
                        }
                    }
                }
                TextExtractor.processedElements.add(element);
            }
            if (text.length > 0) {
                return { elementsToReturn, text };
            }
        }
        console.log('no more elements');
        return { elementsToReturn, text };
    }

    prevElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.previousNode()) {
            const element = this.walker.currentNode;
            if (this.isElementVisible(element)) {
                const tagName = element.tagName?.toLowerCase();
                for (const child of element.childNodes) {
                    let textRes = '';
                    if (child.nodeType === Node.TEXT_NODE) {
                        if(TextExtractor.processedElements.has(element)) continue;
                        textRes = child.textContent.trim();
                        if (textRes !== ''){
                            text.push(textRes);
                            elementsToReturn.push(element);
                        }
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        textRes = this.textExtractor.extractText(child);
                        if (textRes !== ''){
                            text.push(textRes);
                            elementsToReturn.push(child);
                        }
                        if (InteractionHandler.isInteractiveElement(child)) {
                            this.currentLink = child;
                        } else this.currentLink = null;
                    }
                }
            }
            if (text.length > 0) {
                return { elementsToReturn, text };
            }
        }
        return { elementsToReturn, text };
    }

    // TTS speech processing
    async speakCurrentSection() {
        if (!this.currentElement) {
            if (this.readSelectedTextOnly) {
                this.currentElement = this.getSelectedText();
                if (!this.currentElement) {
                    console.log('No text selected');
                    return;
                }
            } else {
                this.currentElement = this.getNextElement();
            }
        }
        let { elementsToReturn, text } = this.currentElement;

        const isSelectedText = elementsToReturn.length === 0 && text.length > 0;
    
        if (isSelectedText) {
            await this.speechHandler.speak(text[0], ()=>{});
            this.currentElement = null;
            return;
        }

        if (!this.currentElement || !elementsToReturn || elementsToReturn.length === 0) {
            this.currentElement = null;
            this.notifySpeechStopped();
            return;
        }

        this.notifySpeechStarted();
    
        for (let i = 0; i < elementsToReturn.length; i++) {
            await new Promise(async (resolve) => {
              try {
                this.highlightWhileReading? this.highlightBox.addHighlight(elementsToReturn[i]) : null;

                if (elementsToReturn[i].tagName?.toLowerCase() === 'img') {
                    console.log('🖼️ Detected image element:', elementsToReturn[i]);
                    
                    try {
                        const caption = await this.imageCaptionHandler.generateCaptionForImage(elementsToReturn[i].src, elementsToReturn[i]);
                        text[i] = `Image description: ${caption}`;
                    } catch (error) {
                        console.error('Caption generation failed:', error);
                        text[i] = "Image description unavailable";
                    }
                }
                
                if (InteractionHandler.isInteractiveElement(elementsToReturn[i]) || 
                    elementsToReturn[i].tagName?.toLowerCase() === 'a') {
                    this.isProgrammaticFocus = true;
                    elementsToReturn[i].focus();
                    this.isProgrammaticFocus = false;
                }
      
                await this.speechHandler.speak(text[i], ()=>{});
                this.highlightWhileReading? this.highlightBox.removeHighlight(elementsToReturn[i]): null;
                
                resolve();
              } catch (error) {
                console.error('Error in sequence:', error);
                this.highlightWhileReading? this.highlightBox.removeHighlight(elementsToReturn[i]) : null;
                this.isProgrammaticFocus = false;
              }
            });
        }
        this.currentElement = null;
        if (this.wasSpeaking) {
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.speakCurrentSection();
        }
    }

    // Input label processing methods
    getInputLabelText(element) {
        console.log('getInputLabelText called');
        if (element.hasAttribute('aria-labelledby')) {
            const ids = element.getAttribute('aria-labelledby').split(' ');
            const labelText = ids.map(id => {
                const labelEl = document.getElementById(id);
                if (labelEl) {
                    TextExtractor.processedElements.add(labelEl);
                    return labelEl.textContent.trim();
                }
                return null;
            }).filter(Boolean).join(' ');
            if (labelText) return labelText;
        }
        if (element.hasAttribute('aria-label')) {
            return element.getAttribute('aria-label').trim();
        }
        if (element.id) {
            const forLabel = document.querySelector(`label[for="${element.id}"]`);
            if (forLabel) {
                TextExtractor.processedElements.add(forLabel);
                return forLabel.textContent.trim();
            }
        }
        const wrappingLabel = element.closest('label');
        if (wrappingLabel) {
            TextExtractor.processedElements.add(wrappingLabel);
            return wrappingLabel.textContent.trim();
        }
        const elementType = element.type || element.getAttribute('role');
        return element.value || `no ${elementType} label text found`;
    }
    
    markInputLabelProcessed(inputElement) {
        console.log('markInputLabelProcessed called');
        if (inputElement.hasAttribute('aria-labelledby')) {
            const ids = inputElement.getAttribute('aria-labelledby').split(' ');
            ids.forEach(id => {
                const labelEl = document.getElementById(id);
                if (labelEl) TextExtractor.processedElements.add(labelEl);
            });
        }
        const label = inputElement.closest('label');
        if (label) {
            TextExtractor.processedElements.add(label);
        }
        if (inputElement.id) {
            const forLabel = document.querySelector(`label[for="${inputElement.id}"]`);
            if (forLabel) TextExtractor.processedElements.add(forLabel);
        }
    }
    
    findAssociatedLabel(element) {
        const isInput = element.getAttribute('role') === 'radio' || 
                        element.type === 'radio' ||
                        element.getAttribute('role') === 'checkbox' || 
                        element.type === 'checkbox';
        if (!isInput) return null;
        
        if (element.hasAttribute('aria-labelledby')) {
            return document.getElementById(element.getAttribute('aria-labelledby'));
        }
        
        return element.closest('label') || 
               document.querySelector(`label[for="${element.id}"]`);
    }

    /**
     * Display STT (Speech-to-Text) overlay text on videos
     * This is separate from sign language overlays - this is for speech recognition overlays
     */
    displayOverlayText(text, isFinal = false) {
        if (!this.videoOverlayManager) {
            console.error('VideoOverlayManager not initialized!');
            return;
        }
        
        console.log('ContentHandler: Sending STT text to video overlay:', text, isFinal);
        this.videoOverlayManager.displayText(text, isFinal);
    }

    /**
     * NEW: Update sign language caption settings for video overlay system
     * Allows dynamic customization of caption appearance from sidebar controls
     */
    updateSignLanguageCaptionSettings(settings) {
        if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
            this.signLanguageHandler.updateCaptionSettings(settings);
            console.log('[CONTENT] Updated sign language caption settings:', settings);
        } else {
            console.warn('[CONTENT] Cannot update caption settings - sign language handler not active');
        }
    }

    /**
     * NEW: Clear all sign language video captions
     * Provides immediate caption clearing functionality
     */
    clearSignLanguageCaptions() {
        if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
            this.signLanguageHandler.clearAllVideoCaptions();
            console.log('[CONTENT] Cleared all sign language video captions');
        } else {
            console.warn('[CONTENT] Cannot clear captions - sign language handler not active');
        }
    }

    /**
     * NEW: Get comprehensive sign language status including caption information
     * Provides detailed system status for monitoring and debugging
     */
    getSignLanguageStatus() {
        if (!this.signLanguageHandler) {
            return { 
                status: 'Not Available', 
                error: 'Handler not initialized',
                displayMethod: 'video-overlay-only' 
            };
        }
        
        const debugInfo = this.signLanguageHandler.getDebugInfo();
        return {
            status: this.signLanguageHandler.isActive ? 'Active' : 'Inactive',
            displayMethod: 'video-overlay-only',
            captionSystemActive: this.signLanguageHandler.isActive,
            ...debugInfo
        };
    }
    
    /**
     * Main message handler for all extension communication
     * Routes messages to appropriate handlers based on action type
     */
    handleMessage(request) {
        // Handle page load reset
        if (request.action === "pageLoad") {
            this.resetReadingState();
            return;
        }

        // Image captioning handlers
        if (request.action === "activateImageCaptioning") {
            console.log('[CONTENT] Received image captioning activation');
            this.imageCaptionHandler.setCaptionType(request.captionType);
            this.imageCaptionHandler.activate();
        } else if (request.action === "deactivateImageCaptioning") {
            console.log('[CONTENT] Received image captioning deactivation');
            this.imageCaptionHandler.deactivate();
        } 
        
        // Sign language detection handlers (video overlay system)
        else if (request.action === "startScreenCapture") {
            console.log('[CONTENT] Screen capture activation requested for video overlay system');
            
            this.checkServerConnectivity()
                .then(serverAvailable => {
                    console.log('[CONTENT] Server connectivity check result:', serverAvailable);
                    
                    if (!serverAvailable) {
                        console.log('[CONTENT] MediaPipe server not available, showing notification');
                        chrome.runtime.sendMessage({
                            action: "screenSharingStatus",
                            status: 'Error',
                            message: "Python MediaPipe server is not running"
                        });
                        this.showServerNotification();
                        return;
                    }
                    
                    console.log('[CONTENT] Server available, activating video overlay system');
                    this.signLanguageHandler.activate()
                        .then(success => {
                            console.log('[CONTENT] Video overlay system activation result:', success);
                            chrome.runtime.sendMessage({
                                action: "screenSharingStatus",
                                status: success ? 'Active' : 'Error',
                                displayMethod: 'video-overlay-only'
                            });
                            
                            if (success) {
                                console.log('[CONTENT] Sign language video overlay system activated successfully');
                            } else {
                                console.error('[CONTENT] Failed to activate sign language video overlay system');
                            }
                        })
                        .catch(error => {
                            console.error('[CONTENT] Video overlay system activation failed:', error);
                            chrome.runtime.sendMessage({
                                action: "screenSharingStatus",
                                status: 'Error',
                                message: error.message
                            });
                        });
                })
                .catch(error => {
                    console.error('[CONTENT] Server connectivity check failed:', error);
                });
        } else if (request.action === "stopScreenCapture") {
            console.log('[CONTENT] Received screen capture deactivation');
            this.signLanguageHandler.deactivate();
            
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: 'Off'
            });
        } 
        
        // STT video overlay handlers (separate from sign language)
        else if (request.action === "toggleVideoOverlay") {
            console.log('[CONTENT] Toggle STT video overlay (not sign language):', request.enabled);
            this.videoOverlayManager.setActive(request.enabled);
            chrome.runtime.sendMessage({
                action: "setCommandsEnabled",
                enabled: !request.enabled
            });
        } else if (request.action === "displayOverlayText") {
            console.log('[CONTENT] Received STT text for video overlay:', request.text);
            this.displayOverlayText(request.text, request.isFinal);
        } 
        
        // Debug mode handler
        else if (request.action === "toggleDebugMode") {
            console.log('[CONTENT] Toggle debug mode for sign language video overlay');
            const debugEnabled = this.signLanguageHandler.toggleDebugMode();
            chrome.runtime.sendMessage({
                action: "debugModeStatus",
                enabled: debugEnabled
            });
        } 
        
        // NEW: Sign language caption management handlers
        else if (request.action === "updateSignLanguageCaptionSettings") {
            console.log('[CONTENT] Updating sign language caption settings:', request.settings);
            this.updateSignLanguageCaptionSettings(request.settings);
        } else if (request.action === "clearSignLanguageCaptions") {
            console.log('[CONTENT] Clearing sign language video captions');
            this.clearSignLanguageCaptions();
        } else if (request.action === "getSignLanguageStatus") {
            const status = this.getSignLanguageStatus();
            chrome.runtime.sendMessage({
                action: "signLanguageStatusResponse",
                ...status
            });
        } 
        
        // Translation history handlers (now for video overlay system)
        else if (request.action === "getTranslationHistory") {
            const history = this.signLanguageHandler.getTranslationHistory();
            chrome.runtime.sendMessage({
                action: "translationHistoryResponse",
                history: history,
                source: 'video-overlay'
            });
        } else if (request.action === "clearTranslationHistory") {
            this.signLanguageHandler.clearTranslationHistory();
            chrome.runtime.sendMessage({
                action: "translationHistoryCleared",
                source: 'video-overlay'
            });
        } 
        
        // TTS (Text-to-Speech) handlers
        else if (request.action === "extractText") {
            if (this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                if (this.currentElement && this.currentElement.elementsToReturn) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.notifySpeechStopped();
                return;
            }
            this.currentElement = null;
            this.isReadingActive = true;
            this.speakCurrentSection();
            this.wasSpeaking = true;
            this.badge? chrome.runtime.sendMessage({ 
                action: "updateBadge", 
                isActive: true, 
                text: "TTS" 
            }) : null;
        } else if (request.action === "stopTTS") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.wasSpeaking = false;
            this.notifySpeechStopped();
        } else if (request.action === "skipToNext") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.currentElement = null;
            this.isReadingActive = true;
            this.speakCurrentSection();
        } else if (request.action === "skipToPrevious") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.textExtractor.clearProcessedElements();
            this.currentElement = this.prevElement();
            this.isReadingActive = true;
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            if (this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.wasSpeaking = false;
                this.badge? chrome.runtime.sendMessage({ 
                    action: "updateBadge", 
                    isActive: false 
                }) : null;
                this.isReadingActive = false;
                this.notifySpeechStopped();
            } else {
                this.isReadingActive = true;
                this.speakCurrentSection();
                this.wasSpeaking = true;
                this.badge? chrome.runtime.sendMessage({ 
                    action: "updateBadge", 
                    isActive: true, 
                    text: "TTS" 
                }): null;
            }
        } else if (request.action === "accessLink") {
            console.log('accessLink called on: ', this.currentLink);
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
                this.speechHandler.stop();
                this.notifySpeechStopped();
                
                if (this.currentLink) {
                    const tagName = this.currentLink.tagName?.toLowerCase();
                    const role = this.currentLink.getAttribute('role');
                    
                    if (tagName === 'a') {
                        this.linkHandler.accessLink(this.currentLink);
                    } else if (role === 'treeitem') {
                        const expander = this.currentLink.querySelector('.tree-expander');
                        if (expander) {
                            expander.click();
                        }
                        
                        this.currentLink.click();
                        
                        const isExpanded = this.currentLink.getAttribute('aria-expanded') === 'true';
                        this.currentLink.setAttribute('aria-expanded', !isExpanded);
                        
                        this.currentLink.offsetHeight;
                    } else if (role === 'button' && this.currentLink.getAttribute('aria-haspopup') === 'true') {
                        const isExpanded = this.currentLink.getAttribute('aria-expanded') === 'true';
                        
                        this.currentLink.click();
                        this.currentLink.setAttribute('aria-expanded', !isExpanded);
                        this.currentLink.offsetHeight;
                    } else {
                        if (InteractionHandler.isCustomDropdown(this.currentLink)) {
                            this.saveNextElementAfterListbox(this.currentLink);
                        }
                        
                        InteractionHandler.handleInteraction(this.currentLink);

                        if (role === 'option' || tagName === 'option') {
                            this.restoreNextElementAfterListbox();
                        }
                        
                        if (InteractionHandler.isCustomDropdown(this.currentLink)) {
                            InteractionHandler.handleCustomDropdown(this.currentLink);
                        }
                    }
                }
            }
        } else if (request.action === "performSearch"){
            window.open(`https://www.google.com/search?q=${encodeURIComponent(request.query)}`, '_blank');
        } else if (request.action === "pauseTTS") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.wasSpeaking = false;
            this.badge? chrome.runtime.sendMessage({ 
                action: "updateBadge", 
                isActive: false 
            }): null;
            this.isReadingActive = false;
            this.notifySpeechStopped();
        } else if (request.action === "resumeTTS") {
            if (this.wasSpeaking) {
                if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.isReadingActive = true;
                this.speakCurrentSection();
                this.badge? chrome.runtime.sendMessage({ 
                    action: "updateBadge", 
                    isActive: true, 
                    text: "TTS" 
                }) : null;
            }
        } else if (request.action === "toggleImageCaptioning") {
            this.toggleImageCaptioning();
        } else if (request.action === "getScreenSharingStatus") {
            // Return comprehensive status including video overlay information
            const status = this.getSignLanguageStatus();
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: status.status === 'Active' ? 'Active' : 'Off',
                displayMethod: 'video-overlay-only',
                ...status
            });
        }
    }

    // MediaPipe server connectivity check
    async checkServerConnectivity() {
        try {
            const response = await fetch('http://localhost:8766/ping');
            
            if (response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('[CONTENT] Server connectivity check failed:', error);
            return false;
        }
    }
    
    // Show server connectivity notification to user
    showServerNotification() {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '15px 20px';
        notification.style.backgroundColor = '#f8d7da';
        notification.style.color = '#721c24';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.maxWidth = '80%';
        notification.style.width = '400px';
        notification.style.textAlign = 'center';
        
        notification.innerHTML = `
            <p><strong>MediaPipe Server Not Running</strong></p>
            <p>Please start the Python server to use sign language detection with video overlays.</p>
            <button id="dismissBtn" style="background: #721c24; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer; border-radius: 3px;">Dismiss</button>
        `;
        
        document.body.appendChild(notification);
        
        document.getElementById('dismissBtn').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 10000);
    }

    // Image captioning toggle functionality
    async toggleImageCaptioning() {
        try {
            const isActive = await this.imageCaptionHandler.toggle();
            console.log(`Image captioning ${isActive ? 'activated' : 'deactivated'}`);
            return isActive;
        } catch (error) {
            console.error("Error toggling image captioning:", error);
            return false;
        }
    }

    // Element visibility detection
    isElementVisible(element) {
        if (!(element instanceof HTMLElement)) return false;
        if (element.offsetHeight === 0 || element.offsetWidth === 0) {
            return false;
        }
        const style = window.getComputedStyle(element);
        const isNotHidden = style.visibility !== 'hidden' &&
                            style.display !== 'none' &&
                            style.opacity !== '0' &&
                            style.height !== '0px' &&
                            style.width !== '0px';
        const isInteractive = InteractionHandler.isInteractiveElement(element);
        const isTreeItem = element.getAttribute('role') === 'treeitem';

        if (element.disabled || element.getAttribute('aria-disabled') === 'true') return false;

        return isNotHidden || isInteractive || isTreeItem;
    }

    // Navigation state management for complex elements
    saveNextElementAfterListbox(listbox) {
        let container = listbox.closest('[role="listitem"], section, article, .question-block, .form-section');
        if (!container) container = listbox.parentElement;
        if (!container) container = listbox;

        let next = container.nextElementSibling;
        while (next && next.nodeType !== 1) {
            next = next.nextElementSibling;
        }
        if (next) {
            this.nextElementAfterListbox = next;
            console.log('Found next element after logical block:', next);
        }
    }

    restoreNextElementAfterListbox() {
        console.log('restoreNextElementAfterListbox: ', this.nextElementAfterListbox);
        if (this.nextElementAfterListbox) {
            this.textExtractor.clearProcessedElements();
            this.walker.currentNode = this.nextElementAfterListbox;
            this.nextElementAfterListbox = null;
        }
    }

    // Focus change handler for TTS navigation
    handleFocusChange(event) {
        if (this.isProgrammaticFocus || !this.isReadingActive) return;

        const focusedElement = event.target;
        if (!focusedElement) return;

        if (this.speechHandler.isSpeaking) {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
        }

        this.walker.currentNode = focusedElement;
        this.textExtractor.clearProcessedElements();
        this.currentElement = null;
        this.speakCurrentSection();
        this.wasSpeaking = true;
    }
}

// Initialize the content handler with video overlay functionality
console.log('[CONTENT] Initializing ContentHandler with video overlay sign language system');
new ContentHandler();