import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";

class ContentHandler {
    constructor() {
        this.sections = [];
        this.pastBorderStyle = "";
        this.pastBackgroundStyle = "";

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
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

        this.settings = null;
        this.initializeSettings();
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
            // Example: Use TTS rate setting
            const ttsRate = settings.ttsRate || 1.0;
            console.log('Using TTS rate:', ttsRate);
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
            return;
        }

        for (let i = 0; i < elementsToReturn.length; i++) {
            // Wait for the previous speech/highlight to complete before starting the next
            await new Promise(async (resolve) => {
              try {
                // Add highlight first
                this.highlightWhileReading? this.highlightBox.addHighlight(elementsToReturn[i]) : null;
      
                // Wait for speech to complete
                await this.speechHandler.speak(text[i], ()=>{});
                this.highlightWhileReading? this.highlightBox.removeHighlight(elementsToReturn[i]): null;
                
                resolve();
              } catch (error) {
                console.error('Error in sequence:', error);
                this.highlightWhileReading? this.highlightBox.removeHighlight(elementsToReturn[i]) : null;
                //resolve(); // Continue to next item even if there's an error
              }
            });
        }
        this.currentElement = null; // Prepare for the next element
        this.speakCurrentSection();
    }

    handleMessage(request) {
        if (request.action === "extractText") {
            if (this.speechHandler.isSpeaking) return;
            this.currentElement = null;
            this.speakCurrentSection();
            this.wasSpeaking = true;
            this.badge? chrome.runtime.sendMessage({ 
                action: "updateBadge", 
                isActive: true, 
                text: "TTS" 
            }) : null;
        } else if (request.action === "skipToNext") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.currentElement = null;
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
            } else {
                this.speakCurrentSection();
                this.wasSpeaking = true;
                this.badge? chrome.runtime.sendMessage({ 
                    action: "updateBadge", 
                    isActive: true, 
                    text: "TTS" 
                }): null;
            }
        } else if (request.action === "accessLink") {
            if (this.currentElement  && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
                this.speechHandler.stop();
                this.linkHandler.accessLink(this.currentLink);
            }
        }else if (request.action === "performSearch"){
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
        } else if (request.action === "resumeTTS") {
            if (this.wasSpeaking) {
                if (this.currentElement && this.currentElement.elementsToReturn && this.highlightWhileReading) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.speakCurrentSection();
                this.badge? chrome.runtime.sendMessage({ 
                    action: "updateBadge", 
                    isActive: true, 
                    text: "TTS" 
                }) : null;
            }
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