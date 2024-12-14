import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";

class ContentHandler {
    constructor() {
        this.sections = [];
        this.currentIndex = 0;
        this.pastBorderStyle = "";
        this.pastBackgroundStyle = "";

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        this.currentElement = null;
        this.elements = Array.from(document.body.querySelectorAll('*'));

        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    getNextElement(startIndex) {
        let elementsToReturn = [];
        let text = [];
        for (let i = startIndex; i < this.elements.length; i++) {
            const element = this.elements[i];

            if (this.isElementVisible(element)) {
                for (const child of element.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        text.push(child.textContent.trim() + ' ');
                        elementsToReturn.push(child);
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        text.push(this.textExtractor.extractText(child));
                        elementsToReturn.push(child);
                    }
                }
            }
            if (text.length > 0) {
                this.currentIndex = i;
                return { elementsToReturn, text };
            }
        }
        return { elementsToReturn, text };
    }

    prevElement(startIndex) {
        for (let i = startIndex - 1; i >= 0; i--) {
            const element = this.elements[i];
            if (this.isElementVisible(element)) {
                const text = this.textExtractor.extractText(element);
                if (text.trim()) {
                    this.currentIndex = i;
                    return { element, text };
                }
            }
        }
        return null;
    }

    speakCurrentSection() {
        if (!this.currentElement) {
            this.currentElement = this.getNextElement(this.currentIndex);
        }

        if (!this.currentElement) {
            // No more elements to process
            return;
        }

        const { element, text } = this.currentElement;
        for (let i = 0; i<element.length; i++) {
            this.highlightBox.addHighlight(element[i]);
            this.speechHandler.speak(text[i], () => {
                this.highlightBox.removeHighlight(element[i]);
                this.currentIndex++;
                this.currentElement = null; // Prepare for the next element
                this.speakCurrentSection();
            });
        }
    }

    handleMessage(request) {
        if (request.action === "extractText") {
            this.currentIndex = 0;
            this.currentElement = null;
            this.speakCurrentSection();
        } else if (request.action === "skipToNext") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.currentIndex++;
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
            this.currentElement = this.prevElement(this.currentIndex);
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            if (this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                if (this.currentElement && this.currentElement.elementsToReturn) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
            } else {
                this.speakCurrentSection();
            }
        } else if (request.action === "accessLink") {
            if (this.currentElement) {
                this.linkHandler.accessLink(this.currentElement.elementsToReturn);
                this.speechHandler.stop();
            }
        }
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.left >= 0;
        const isNotHidden = window.getComputedStyle(element).visibility !== 'hidden' &&
                            window.getComputedStyle(element).display !== 'none';
        return isVisible && isNotHidden;
    }
}

// Instantiate the content handler
new ContentHandler();
