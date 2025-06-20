// content.js - Complete implementation for webpage video overlay captions
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

        // Initialize core accessibility functionality
        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        
        // Initialize image captioning functionality
        this.imageCaptionHandler = new ImageCaptionHandler(chrome.runtime.getURL('Florence-2-base-ft'));
        
        // Initialize STT video overlay manager (for speech recognition overlays on videos)
        this.videoOverlayManager = new VideoOverlayManager();
        
        // Initialize ENHANCED sign language handler with webpage video caption capability
        // This is the core component that detects videos on the current page and overlays translations
        this.signLanguageHandler = new SignLanguageHandler(); 
        
        console.log('VideoOverlayManager initialized in content script:', this.videoOverlayManager);
        console.log('Enhanced Sign Language handler initialized for webpage video overlay display:', this.signLanguageHandler);

        // TTS navigation state
        this.currentElement = null;
        this.currentLink = null;
        this.nextElementAfterListbox = null;
        this.isProgrammaticFocus = false;
        this.isReadingActive = false;
        this.wasSpeaking = false;
        
        // Create tree walker for DOM navigation during TTS
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

        // Set up core event listeners
        document.addEventListener('focusin', this.handleFocusChange.bind(this));
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Initialize the system and set up webpage video detection
        this.resetReadingState();
        
        // Set up page navigation detection for Single Page Applications
        this.setupSPANavigationDetection();
    }

    /**
     * Reset and initialize all system state
     * Enhanced to support webpage video detection and caption overlay system
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
        
        // Set up MediaPipe landmark detection monitoring for system health
        window.addEventListener('handLandmarksDetected', (event) => {
            const { leftHand, rightHand, face, pose, timestamp, fps } = event.detail;
            console.log(`[${new Date(timestamp).toLocaleTimeString()}] MediaPipe Detection (${fps.toFixed(1)} FPS)`, 
                face ? 'Face detected' : 'No face',
                pose ? 'Pose detected' : 'No pose',
                leftHand ? 'Left hand detected' : 'No left hand', 
                rightHand ? 'Right hand detected' : 'No right hand');
            
            // Send detection status to sidebar for system monitoring
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
        
        // ENHANCED: Set up sign language translation event listener for WEBPAGE VIDEO OVERLAY
        // This is the key difference - translations now appear on the main webpage videos
        window.addEventListener('signLanguageTranslation', (event) => {
            const { translatedText, timestamp, confidence, words, translationHistory } = event.detail;
            
            console.log(`[${new Date(timestamp).toLocaleTimeString()}] Sign Language Translation for Webpage Video: "${translatedText}"`);
            
            // The translation is automatically displayed on webpage videos by the SignLanguageHandler
            // We log this for monitoring and can optionally send statistics to sidebar
            
            console.log(`[CONTENT] Translation displayed on webpage video - no sidebar forwarding needed`);
            
            // Optional: Send statistics to sidebar for monitoring (not for display)
            // This provides system health information without duplicating the caption display
            chrome.runtime.sendMessage({
                action: "signLanguageStatistics",
                translatedText: translatedText,
                timestamp: timestamp,
                confidence: confidence,
                displayMethod: 'webpage-video-overlay',
                activeVideoType: this.signLanguageHandler.activeVideoTarget?.type || 'unknown',
                isStatisticsOnly: true // Flag to indicate this is not for display
            });
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

    /**
     * NEW: Set up detection for Single Page Application navigation
     * This ensures video detection works even when pages change without full reload
     */
    setupSPANavigationDetection() {
        // Monitor URL changes (for SPAs like YouTube, Netflix, etc.)
        let lastUrl = location.href;
        
        const urlChangeObserver = new MutationObserver(() => {
            if (lastUrl !== location.href) {
                lastUrl = location.href;
                console.log('[CONTENT] Page navigation detected, re-initializing video detection');
                
                // Small delay to allow new content to load
                setTimeout(() => {
                    if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
                        // Re-initialize video detection for new page content
                        this.signLanguageHandler.initializeWebpageVideoDetection();
                    }
                }, 1000);
            }
        });
        
        urlChangeObserver.observe(document, { 
            subtree: true, 
            childList: true 
        });
        
        // Also listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', () => {
            console.log('[CONTENT] Popstate navigation detected');
            setTimeout(() => {
                if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
                    this.signLanguageHandler.initializeWebpageVideoDetection();
                }
            }, 1000);
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

    // Settings management (unchanged from original)
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

    // TTS text selection and navigation methods (unchanged from original)
    getSelectedText() {
        console.log('getSelectedText called');
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString().trim();
            
            if (selectedText) {
                return { 
                    elementsToReturn: [],
                    text: [selectedText]
                };
            }
        }
        return null;
    }

    getNextElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.nextNode()) {
            const element = this.walker.currentNode;
            if(TextExtractor.processedElements.has(element)) continue;
            if (this.isElementVisible(element)) {
                const hasInteractiveChildren = Array.from(element.querySelectorAll('*')).some(child => 
                    InteractionHandler.isInteractiveElement(child) && this.isElementVisible(child)
                );

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

    // TTS speech processing (unchanged from original)
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

    // Input label processing methods (unchanged from original)
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
     * ENHANCED: Update sign language caption settings for webpage video overlay system
     * Now supports settings for captions that appear on main webpage videos
     */
    updateSignLanguageCaptionSettings(settings) {
        if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
            this.signLanguageHandler.updateCaptionSettings(settings);
            console.log('[CONTENT] Updated webpage video caption settings:', settings);
        } else {
            console.warn('[CONTENT] Cannot update caption settings - sign language handler not active');
        }
    }

    /**
     * ENHANCED: Clear all sign language captions from webpage videos
     */
    clearSignLanguageWebpageCaptions() {
        if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
            this.signLanguageHandler.clearAllWebpageVideoCaptions();
            console.log('[CONTENT] Cleared all webpage video captions');
        } else {
            console.warn('[CONTENT] Cannot clear captions - sign language handler not active');
        }
    }

    /**
     * ENHANCED: Get comprehensive sign language status including webpage video information
     */
    getSignLanguageStatus() {
        if (!this.signLanguageHandler) {
            return { 
                status: 'Not Available', 
                error: 'Handler not initialized',
                displayMethod: 'webpage-video-overlay' 
            };
        }
        
        const debugInfo = this.signLanguageHandler.getDebugInfo();
        return {
            status: this.signLanguageHandler.isActive ? 'Active' : 'Inactive',
            displayMethod: 'webpage-video-overlay',
            webpageVideosDetected: debugInfo.webpageVideosCount,
            activeVideoTarget: debugInfo.activeVideoTarget,
            activeCaptionsCount: debugInfo.activeCaptionsCount,
            monitoringWindowVisible: debugInfo.showMonitoringWindow,
            ...debugInfo
        };
    }

    /**
     * NEW: Toggle the MediaPipe monitoring window visibility
     * Users can choose to show/hide the small monitoring window while keeping captions on webpage videos
     */
    toggleSignLanguageMonitoringWindow() {
        if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
            const isVisible = this.signLanguageHandler.toggleMonitoringWindow();
            console.log(`[CONTENT] MediaPipe monitoring window ${isVisible ? 'shown' : 'hidden'}`);
            return isVisible;
        }
        return false;
    }

    /**
     * NEW: Manually trigger webpage video re-detection
     * Useful for dynamically loaded content or when videos are added after page load
     */
    redetectWebpageVideos() {
        if (this.signLanguageHandler && this.signLanguageHandler.isActive) {
            this.signLanguageHandler.initializeWebpageVideoDetection();
            console.log('[CONTENT] Triggered webpage video re-detection');
            
            const status = this.getSignLanguageStatus();
            return {
                success: true,
                videosDetected: status.webpageVideosDetected,
                activeTarget: status.activeVideoTarget
            };
        }
        return { success: false, error: 'Sign language handler not active' };
    }
    
    /**
     * Main message handler for all extension communication
     * Enhanced to support webpage video overlay functionality
     */
    handleMessage(request) {
        // Handle page load reset
        if (request.action === "pageLoad") {
            this.resetReadingState();
            return;
        }

        // Image captioning handlers (unchanged)
        if (request.action === "activateImageCaptioning") {
            console.log('[CONTENT] Received image captioning activation');
            this.imageCaptionHandler.setCaptionType(request.captionType);
            this.imageCaptionHandler.activate();
        } else if (request.action === "deactivateImageCaptioning") {
            console.log('[CONTENT] Received image captioning deactivation');
            this.imageCaptionHandler.deactivate();
        } 
        
        // ENHANCED: Sign language detection handlers for webpage video overlay system
        else if (request.action === "startScreenCapture") {
            console.log('[CONTENT] Screen capture activation requested for webpage video overlay system');
            
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
                    
                    console.log('[CONTENT] Server available, activating webpage video overlay system');
                    this.signLanguageHandler.activate()
                        .then(success => {
                            console.log('[CONTENT] Webpage video overlay system activation result:', success);
                            const status = this.getSignLanguageStatus();
                            
                            chrome.runtime.sendMessage({
                                action: "screenSharingStatus",
                                status: success ? 'Active' : 'Error',
                                displayMethod: 'webpage-video-overlay',
                                webpageVideosDetected: status.webpageVideosDetected,
                                activeVideoTarget: status.activeVideoTarget
                            });
                            
                            if (success) {
                                console.log(`[CONTENT] Webpage video overlay system activated successfully - ${status.webpageVideosDetected} videos detected`);
                            } else {
                                console.error('[CONTENT] Failed to activate webpage video overlay system');
                            }
                        })
                        .catch(error => {
                            console.error('[CONTENT] Webpage video overlay system activation failed:', error);
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
        
        // STT video overlay handlers (separate from sign language - unchanged)
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
            console.log('[CONTENT] Toggle debug mode for webpage video overlay');
            const debugEnabled = this.signLanguageHandler.toggleDebugMode();
            chrome.runtime.sendMessage({
                action: "debugModeStatus",
                enabled: debugEnabled
            });
        } 
        
        // ENHANCED: Webpage video caption management handlers
        else if (request.action === "updateSignLanguageCaptionSettings") {
            console.log('[CONTENT] Updating webpage video caption settings:', request.settings);
            this.updateSignLanguageCaptionSettings(request.settings);
        } else if (request.action === "clearSignLanguageCaptions") {
            console.log('[CONTENT] Clearing webpage video captions');
            this.clearSignLanguageWebpageCaptions();
        } else if (request.action === "getSignLanguageStatus") {
            const status = this.getSignLanguageStatus();
            chrome.runtime.sendMessage({
                action: "signLanguageStatusResponse",
                ...status
            });
        } 
        
        // NEW: Additional webpage video management handlers
        else if (request.action === "toggleMonitoringWindow") {
            console.log('[CONTENT] Toggle MediaPipe monitoring window');
            const isVisible = this.toggleSignLanguageMonitoringWindow();
            chrome.runtime.sendMessage({
                action: "monitoringWindowToggled",
                visible: isVisible
            });
        } else if (request.action === "redetectWebpageVideos") {
            console.log('[CONTENT] Re-detecting webpage videos');
            const result = this.redetectWebpageVideos();
            chrome.runtime.sendMessage({
                action: "videoRedetectionResult",
                ...result
            });
        }
        
        // Translation history handlers (now for webpage video overlay system)
        else if (request.action === "getTranslationHistory") {
            const history = this.signLanguageHandler.getTranslationHistory();
            chrome.runtime.sendMessage({
                action: "translationHistoryResponse",
                history: history,
                source: 'webpage-video-overlay'
            });
        } else if (request.action === "clearTranslationHistory") {
            this.signLanguageHandler.clearTranslationHistory();
            chrome.runtime.sendMessage({
                action: "translationHistoryCleared",
                source: 'webpage-video-overlay'
            });
        } 
        
        // TTS (Text-to-Speech) handlers (unchanged from original)
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
            // Return comprehensive status including webpage video overlay information
            const status = this.getSignLanguageStatus();
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: status.status === 'Active' ? 'Active' : 'Off',
                displayMethod: 'webpage-video-overlay',
                ...status
            });
        }
    }

    // MediaPipe server connectivity check (unchanged)
    async checkServerConnectivity() {
        try {
            const response = await fetch('https://acknowledged-shared-card-stages.trycloudflare.com/ping');
            
            if (response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('[CONTENT] Server connectivity check failed:', error);
            return false;
        }
    }
    
    // Show server connectivity notification to user (enhanced for webpage videos)
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
        notification.style.zIndex = '2147483647'; // Maximum z-index to appear above everything
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        notification.style.maxWidth = '80%';
        notification.style.width = '450px';
        notification.style.textAlign = 'center';
        
        notification.innerHTML = `
            <p><strong>MediaPipe Server Not Running</strong></p>
            <p>Please start the Python server to use sign language detection with webpage video captions.</p>
            <p style="font-size: 12px; color: #856404; margin-top: 10px;">Captions will appear directly on your videos (YouTube, Netflix, etc.)</p>
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
        }, 12000); // Slightly longer display time for more information
    }

    // Image captioning toggle functionality (unchanged)
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

    // Element visibility detection (unchanged)
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

    // Navigation state management for complex elements (unchanged)
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

    // Focus change handler for TTS navigation (unchanged)
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

// Initialize the enhanced content handler with webpage video overlay functionality
console.log('[CONTENT] Initializing Enhanced ContentHandler with webpage video overlay sign language system');
new ContentHandler();