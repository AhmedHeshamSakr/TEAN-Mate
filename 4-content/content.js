import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";
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

        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        this.wasSpeaking = false;
        
        // Add speech event listeners for notification
        this.speechHandler.addEventListener('speechstart', () => {
            this.notifySpeechStarted();
        });
        
        this.speechHandler.addEventListener('speechend', () => {
            this.notifySpeechStopped();
        });
        
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

    getNextElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.nextNode()) {
            const element = this.walker.currentNode;
            if(TextExtractor.processedElements.has(element)) continue;
            if (this.isElementVisible(element)) {
                const tagName = element.tagName?.toLowerCase();
                if (element.tagName.toLowerCase() === 'a' && element.href) {
                    const domain = new URL(element.href).hostname.replace('www.', '');
                    text.push(element.textContent.trim() ? `Link text: ${element.textContent.trim()}` : `Link to ${domain}`);
                    elementsToReturn.push(element);
                    this.currentLink = element;
                    TextExtractor.processAllDescendants(element);
                } else {
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
                            if (child.tagName.toLowerCase() === "a"){
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
                        if (child.tagName.toLowerCase() === "a"){
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
            this.currentElement = this.getNextElement();
        }
        let { elementsToReturn, text } = this.currentElement;
        if (!this.currentElement || !elementsToReturn) {
            // Send a notification that speech has finished completely
            this.notifySpeechStopped();
            return;
        }
    
        // Notify that speech has started
        this.notifySpeechStarted();
    
        for (let i = 0; i < elementsToReturn.length; i++) {
            await new Promise(async (resolve) => {
                try {
                    const element = elementsToReturn[i];
                    let speechText = text[i];
                    
                    if (element.tagName?.toLowerCase() === 'img') {
                        console.log('🖼️ Detected image element:', element);
                        
                        try {
                            // Pass both the URL and the element to the caption generator
                            // This will trigger the processing sound and overlay
                            const caption = await this.imageCaptionHandler.generateCaptionForImage(element.src, element);
                            speechText = `Image description: ${caption}`;
                        } catch (error) {
                            console.error('Caption generation failed:', error);
                            speechText = "Image description unavailable";
                        }
                    }
    
                    // Highlight and process speech
                    this.highlightBox.addHighlight(element);
                    await this.speechHandler.speak(speechText, () => {});
                    this.highlightBox.removeHighlight(element);
                    
                    resolve();
                } catch (error) {
                    console.error('Element processing error:', error);
                    if (element) this.highlightBox.removeHighlight(element);
                    resolve();
                }
            });
        }
        this.currentElement = null;
        this.speakCurrentSection();
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
            this.speakCurrentSection();
            this.wasSpeaking = true;
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
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.currentElement = null;
            this.speakCurrentSection();
        } else if (request.action === "skipToPrevious") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.textExtractor.clearProcessedElements();
            this.currentElement = this.prevElement();
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            if (this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                if (this.currentElement && this.currentElement.elementsToReturn) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.wasSpeaking = false;
                this.notifySpeechStopped();
            } else {
                this.speakCurrentSection();
                this.wasSpeaking = true;
            }
        } else if (request.action === "accessLink") {
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
                this.speechHandler.stop();
                this.notifySpeechStopped();
                this.linkHandler.accessLink(this.currentLink);
            }
        } else if (request.action === "performSearch") {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(request.query)}`, '_blank');
        } else if (request.action === "pauseTTS") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.wasSpeaking = false;
            this.notifySpeechStopped();
        } else if (request.action === "resumeTTS") {
            if (this.wasSpeaking) {
                if (this.currentElement && this.currentElement.elementsToReturn) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.speakCurrentSection();
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
        return isNotHidden;
    }
}

// Instantiate the content handler
new ContentHandler();