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
        this.sections = [];
        this.pastBorderStyle = "";
        this.pastBackgroundStyle = "";

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        this.imageCaptionHandler = new ImageCaptionHandler(chrome.runtime.getURL('Florence-2-base-ft'));
        this.videoOverlayManager = new VideoOverlayManager();
        this.signLanguageHandler = new SignLanguageHandler(); 
        
        console.log('VideoOverlayManager initialized in content script:', this.videoOverlayManager);
        console.log('Sign Language handler initialized in content script:', this.signLanguageHandler);

        this.currentElement = null;
        this.currentLink = null;
        this.nextElementAfterListbox = null;
        this.isProgrammaticFocus = false;
        this.isReadingActive = false;
        this.wasSpeaking = false;
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

        // Add focus change listener
        document.addEventListener('focusin', this.handleFocusChange.bind(this));
        
        // Listen for messages
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        // Reset reading state on page load
        this.resetReadingState();
    }

    resetReadingState() {
        this.isReadingActive = false;
        this.wasSpeaking = false;
        this.settings = null;
        this.initializeSettings();

        this.currentElement = null;
        if (this.speechHandler.isSpeaking) {
            this.speechHandler.stop();
        }
        if (this.currentElement && this.currentElement.elementsToReturn) {
            for (let el of this.currentElement.elementsToReturn) {
                this.highlightBox.removeHighlight(el);
            }
        }
        
        // Add speech event listeners for notification
        // this.speechHandler.addEventListener('speechstart', () => {
        //     this.notifySpeechStarted();
        // });
        
        // this.speechHandler.addEventListener('speechend', () => {
        //     this.notifySpeechStopped();
        // });
        
        // Listen for hand landmarks detected events from the sign language handler
        window.addEventListener('handLandmarksDetected', (event) => {
            const { leftHand, rightHand, face, pose, timestamp, fps } = event.detail;
            console.log(`[${new Date(timestamp).toLocaleTimeString()}] MediaPipe Holistic Detection (${fps.toFixed(1)} FPS)`, 
                face ? 'Face detected' : 'No face',
                pose ? 'Pose detected' : 'No pose',
                leftHand ? 'Left hand detected' : 'No left hand', 
                rightHand ? 'Right hand detected' : 'No right hand');
            
            // Send to sidebar
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
        
        // Listen for screen sharing ended event
        window.addEventListener('screenSharingEnded', () => {
            console.log('Screen sharing ended event received');
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: 'Off'
            });
        });
        
        // Listen for screen sharing failed event
        window.addEventListener('screenSharingFailed', (event) => {
            console.error('Screen sharing failed:', event.detail?.reason || 'Unknown error');
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: 'Error',
                message: event.detail?.reason || 'Unknown error'
            });
        });
    }

    // Notify sidebar that speech has started
    notifySpeechStarted() {
        chrome.runtime.sendMessage({
            action: "ttsStarted"
        });
    }
    
    // Notify sidebar that speech has stopped
    notifySpeechStopped() {
        chrome.runtime.sendMessage({
            action: "ttsStopped"
        });
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

    initializeSettings() {
        const self = this;
        this.getSettings(function(settings) {
            // Now you can use the settings
            console.log('Loaded settings:', settings);
            self.settings = settings;
            self.highlightWhileReading = settings.highlightText || false;
            self.badge = settings.showIconBadge || false;
            self.readSelectedTextOnly = settings.readingElement === 'selected';
            // Example: Use TTS rate setting
            const ttsRate = settings.ttsRate || 1.0;
            console.log('Using TTS rate:', ttsRate);
        });
    }

    getSelectedText() {
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

    getNextElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.nextNode()) {
            const element = this.walker.currentNode;
            if(TextExtractor.processedElements.has(element)) continue;
            if (this.isElementVisible(element)) {
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
                    
                    // Generic radio/checkbox text discovery
                    if (isRadio || isCheckbox) {
                        console.log(`generic ${isRadio ? 'radio' : 'checkbox'} text discovery`);
                        const labelText = this.getInputLabelText(element);
                        text.push(`${stateText}. ${labelText}`);
                        elementsToReturn.push(element);
                        this.markInputLabelProcessed(element);
                    } else {
                        // Check if this is a container with a radio button or checkbox child
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
                            text.push(`${stateText}${element.textContent.trim()}`);
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

    async speakCurrentSection() {
        if (!this.currentElement) {
            if (this.readSelectedTextOnly) {
                this.currentElement = this.getSelectedText();
                // If no text is selected, don't read anything
                if (!this.currentElement) {
                    console.log('No text selected');
                    return;
                }
            } else {
                this.currentElement = this.getNextElement();
            }
        }
        let { elementsToReturn, text } = this.currentElement;

        if (!this.currentElement || !elementsToReturn || elementsToReturn.length === 0) {
            this.currentElement = null;
            // Send a notification that speech has finished completely
            this.notifySpeechStopped();
            return;
        }

        const isSelectedText = elementsToReturn.length === 0 && text.length > 0;
    
        if (isSelectedText) {
            // Just speak the text without highlighting
            await this.speechHandler.speak(text[0], ()=>{});
            this.currentElement = null;
            return;
        }

    
        // Notify that speech has started
        this.notifySpeechStarted();
    
        for (let i = 0; i < elementsToReturn.length; i++) {
            await new Promise(async (resolve) => {
              try {
                // Add highlight first
                this.highlightWhileReading? this.highlightBox.addHighlight(elementsToReturn[i]) : null;

                if (elementsToReturn[i].tagName?.toLowerCase() === 'img') {
                    console.log('🖼️ Detected image element:', elementsToReturn[i]);
                    
                    try {
                        // Pass both the URL and the element to the caption generator
                        // This will trigger the processing sound and overlay
                        const caption = await this.imageCaptionHandler.generateCaptionForImage(elementsToReturn[i].src, elementsToReturn[i]);
                        text[i] = `Image description: ${caption}`;
                    } catch (error) {
                        console.error('Caption generation failed:', error);
                        text[i] = "Image description unavailable";
                    }
                }
                
                // If the element is interactive or a link, set focus to it
                if (InteractionHandler.isInteractiveElement(elementsToReturn[i]) || 
                    elementsToReturn[i].tagName?.toLowerCase() === 'a') {
                    this.isProgrammaticFocus = true;
                    elementsToReturn[i].focus();
                    this.isProgrammaticFocus = false;
                }
      
                // Wait for speech to complete
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
        this.currentElement = null; // Prepare for the next element
        if (this.wasSpeaking) {
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.speakCurrentSection(); // Add await
        }
    }

    // Modified label text extraction
    // Renamed from getRadioLabelText to handle both radio buttons and checkboxes
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
        // 2. aria-label
        if (element.hasAttribute('aria-label')) {
            return element.getAttribute('aria-label').trim();
        }
        // 3. <label for="...">
        if (element.id) {
            const forLabel = document.querySelector(`label[for="${element.id}"]`);
            if (forLabel) {
                TextExtractor.processedElements.add(forLabel);
                return forLabel.textContent.trim();
            }
        }
        // 4. Closest wrapping <label>
        const wrappingLabel = element.closest('label');
        if (wrappingLabel) {
            TextExtractor.processedElements.add(wrappingLabel);
            return wrappingLabel.textContent.trim();
        }
        // 5. Fallback to value or empty
        const elementType = element.type || element.getAttribute('role');
        return element.value || `no ${elementType} label text found`;
    }
    
    // Renamed from markRadioLabelProcessed to handle both radio buttons and checkboxes
    markInputLabelProcessed(inputElement) {
        console.log('markInputLabelProcessed called');
        // Try ARIA-labelledby first
        if (inputElement.hasAttribute('aria-labelledby')) {
            const ids = inputElement.getAttribute('aria-labelledby').split(' ');
            ids.forEach(id => {
                const labelEl = document.getElementById(id);
                if (labelEl) TextExtractor.processedElements.add(labelEl);
            });
        }
        // Try closest label
        const label = inputElement.closest('label');
        if (label) {
            TextExtractor.processedElements.add(label);
        }
        // Try label[for]
        if (inputElement.id) {
            const forLabel = document.querySelector(`label[for="${inputElement.id}"]`);
            if (forLabel) TextExtractor.processedElements.add(forLabel);
        }
    }
    
    // Update findAssociatedLabel
    findAssociatedLabel(element) {
        const isInput = element.getAttribute('role') === 'radio' || 
                        element.type === 'radio' ||
                        element.getAttribute('role') === 'checkbox' || 
                        element.type === 'checkbox';
        if (!isInput) return null;
        
        // Check ARIA first
        if (element.hasAttribute('aria-labelledby')) {
            return document.getElementById(element.getAttribute('aria-labelledby'));
        }
        
        // Then check standard label associations
        return element.closest('label') || 
               document.querySelector(`label[for="${element.id}"]`);
    }

    displayOverlayText(text, isFinal = false) {
        if (!this.videoOverlayManager) {
            console.error('VideoOverlayManager not initialized!');
            return;
        }
        
        console.log('ContentHandler: Sending text to overlay:', text, isFinal);
        this.videoOverlayManager.displayText(text, isFinal);
    }
    
    handleMessage(request) {
        // Reset reading state if we're on a new page
        if (request.action === "pageLoad") {
            this.resetReadingState();
            return;
        }

        if (request.action === "activateImageCaptioning") {
            console.log('[CONTENT] Received captioning activation');
            this.imageCaptionHandler.setCaptionType(request.captionType);
            this.imageCaptionHandler.activate();
        } else if (request.action === "deactivateImageCaptioning") {
            console.log('[CONTENT] Received captioning deactivation');
            this.imageCaptionHandler.deactivate();
        } else if (request.action === "startScreenCapture") {
            console.log('[CONTENT] Received screen capture activation');
            
            // Check server connectivity first
            this.checkServerConnectivity()
                .then(serverAvailable => {
                    if (!serverAvailable) {
                        // Server not available, notify about it
                        chrome.runtime.sendMessage({
                            action: "screenSharingStatus",
                            status: 'Error',
                            message: "Python MediaPipe server is not running"
                        });
                        
                        // Show notification to start server
                        this.showServerNotification();
                        return;
                    }
                    
                    // Proceed with activation if server is available
                    this.signLanguageHandler.activate()
                        .then(success => {
                            // Notify sidebar of activation result
                            chrome.runtime.sendMessage({
                                action: "screenSharingStatus",
                                status: success ? 'Active' : 'Error'
                            });
                            
                            if (success) {
                                console.log('[CONTENT] Screen sharing with MediaPipe Holistic activated successfully');
                            } else {
                                console.error('[CONTENT] Failed to activate screen sharing with MediaPipe Holistic');
                            }
                        });
                });
        } else if (request.action === "stopScreenCapture") {
            console.log('[CONTENT] Received screen capture deactivation');
            this.signLanguageHandler.deactivate();
            
            // Notify sidebar of deactivation
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: 'Off'
            });
        } else if (request.action === "toggleVideoOverlay") {
            console.log('[CONTENT] Toggle video overlay:', request.enabled);
            // Enable/disable the overlay
            this.videoOverlayManager.setActive(request.enabled);
            // Notify background script to disable/enable commands
            chrome.runtime.sendMessage({
                action: "setCommandsEnabled",
                enabled: !request.enabled
            });
        } else if (request.action === "toggleDebugMode") {
            console.log('[CONTENT] Toggle debug mode for MediaPipe visualization');
            const debugEnabled = this.signLanguageHandler.toggleDebugMode();
            chrome.runtime.sendMessage({
                action: "debugModeStatus",
                enabled: debugEnabled
            });
        } else if (request.action === "displayOverlayText") {
            console.log('[CONTENT] Received text for overlay:', request.text);
            this.displayOverlayText(request.text, request.isFinal);
        } else if (request.action === "extractText") {
            if (this.speechHandler.isSpeaking) {
                // If already speaking, stop it first
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
            // Complete stop of TTS
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
                
                // Check if the current link is a form element or a link
                if (this.currentLink) {
                    const tagName = this.currentLink.tagName?.toLowerCase();
                    if (tagName === 'a') {
                        this.linkHandler.accessLink(this.currentLink);
                    } else {
                        const role = this.currentLink.getAttribute('role');
                        const tagName = this.currentLink.tagName?.toLowerCase();
                        
                        // Save the next element before handling the dropdown
                        if (InteractionHandler.isCustomDropdown(this.currentLink)) {
                            this.saveNextElementAfterListbox(this.currentLink);
                        }
                        
                        // Always handle interaction regardless of element type
                        InteractionHandler.handleInteraction(this.currentLink);

                        if (role === 'option' || tagName === 'option') {
                            this.restoreNextElementAfterListbox();
                        }
                        
                        // Only check for custom dropdown if it's not a text field
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
            // Return the current status of screen sharing
            chrome.runtime.sendMessage({
                action: "screenSharingStatus",
                status: this.signLanguageHandler.isActive ? 'Active' : 'Off',
                fps: this.signLanguageHandler.fps || 0,
                face: this.signLanguageHandler.faceLandmarks !== null,
                pose: this.signLanguageHandler.poseLandmarks !== null,
                leftHand: this.signLanguageHandler.leftHandLandmarks !== null,
                rightHand: this.signLanguageHandler.rightHandLandmarks !== null
            });
        }
    }

    async checkServerConnectivity() {
        try {
            const response = await fetch('http://localhost:8765/ping');
            
            if (response.ok) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('[CONTENT] Server connectivity check failed:', error);
            return false;
        }
    }
    
    showServerNotification() {
        // Create a notification to inform user to start the server
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
            <p>Please start the Python server to use sign language detection.</p>
            <button id="dismissBtn" style="background: #721c24; color: white; border: none; padding: 5px 10px; margin-top: 10px; cursor: pointer; border-radius: 3px;">Dismiss</button>
        `;
        
        document.body.appendChild(notification);
        
        // Add event listener to dismiss button
        document.getElementById('dismissBtn').addEventListener('click', () => {
            document.body.removeChild(notification);
        });
        
        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 10000);
    }

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

        if (element.disabled || element.getAttribute('aria-disabled') === 'true') return false;

        return isNotHidden || isInteractive;
    }

    saveNextElementAfterListbox(listbox) {
        // Try to find a semantic container
        let container = listbox.closest('[role="listitem"], section, article, .question-block, .form-section');
        // Fallback: use parent or grandparent if no semantic container found
        if (!container) container = listbox.parentElement;
        if (!container) container = listbox;

        // Find the next sibling that is an element node
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
            // Clear the processed elements set to ensure we can process the next element
            this.textExtractor.clearProcessedElements();
            this.walker.currentNode = this.nextElementAfterListbox;
            this.nextElementAfterListbox = null;
        }
    }

    handleFocusChange(event) {
        // Skip if this is a programmatic focus change or reading is not active
        if (this.isProgrammaticFocus || !this.isReadingActive) return;

        const focusedElement = event.target;
        if (!focusedElement) return;

        // Stop current speech if any
        if (this.speechHandler.isSpeaking) {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
        }

        // Update walker position to the focused element
        this.walker.currentNode = focusedElement;
        
        // Clear processed elements to ensure we can process the focused element
        this.textExtractor.clearProcessedElements();
        
        // Set current element to null to force a new element fetch
        this.currentElement = null;
        
        // Start speaking from the focused element
        this.speakCurrentSection();
        this.wasSpeaking = true;
    }
}

// Instantiate the content handler
new ContentHandler();