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
        this.screenSharingHandler = new SignLanguageHandler(); 
        
        console.log('VideoOverlayManager initialized in content script:', this.videoOverlayManager);
        console.log('ScreenSharing handler initialized in content script:', this.screenSharingHandler);

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
            // Activate screen sharing with MediaPipe
            this.screenSharingHandler.activate()
                .then(success => {
                    // Notify sidebar of activation result
                    chrome.runtime.sendMessage({
                        action: "screenSharingStatus",
                        status: success ? 'Active' : 'Error'
                    });
                    
                    if (success) {
                        console.log('[CONTENT] Screen sharing with MediaPipe activated');
                        
                        // Listen for hand landmarks events and log them to console
                        window.addEventListener('handLandmarksDetected', (event) => {
                            const { leftHand, rightHand, timestamp } = event.detail;
                            console.log(`[${new Date(timestamp).toLocaleTimeString()}] Hand Landmarks:`, 
                                { leftHand, rightHand });
                        });
                    } else {
                        console.error('[CONTENT] Failed to activate screen sharing with MediaPipe');
                    }
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
        }
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