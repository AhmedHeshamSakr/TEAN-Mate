import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor  from "../2-features/TTS/TextExtractor.js";
import  SpeechHandler  from "../2-features/TTS/SpeechHandler.js";
import  LinkHandler  from "../2-features/TTS/LinkHandler.js";

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
        // Start iterating from the current position
        for (let i = startIndex; i < this.elements.length; i++) {
            const element = this.elements[i];
            if (this.isElementVisible(element)) {
                const text = this.textExtractor.extractText(element);
                if (text.trim()) {
                    this.currentIndex = i;
                    return { element, text };
                }
            }
        }
        return null; // No more valid elements
    }

    prevElement(startIndex) {
        // Start iterating backward from the current position
        for (let i = startIndex-1; i >= 0; i--) {
            const element = this.elements[i];
            if (this.isElementVisible(element)) {
                const text = this.textExtractor.extractText(element);
                if (text.trim()) {
                    this.currentIndex = i;
                    return { element, text };
                }
            }
        }
        return null; // No more valid elements
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

        this.highlightBox.addHighlight(element);
        this.speechHandler.speak(text, () => {
            this.highlightBox.removeHighlight(element);
            this.currentIndex++;
            this.currentElement = null; // Prepare for the next element
            this.speakCurrentSection();
        });
    }

    handleMessage(request) {
        if (request.action === "extractText") {
            this.currentIndex = 0;
            this.currentElement = null;
            this.speakCurrentSection();
        } else if (request.action === "skipToNext") {
            this.speechHandler.stop();
            this.highlightBox.removeHighlight(this.currentElement?.element);
            this.currentIndex++;
            this.currentElement = null;
            this.speakCurrentSection();
        } else if (request.action === "skipToPrevious") {
            this.speechHandler.stop();
            this.highlightBox.removeHighlight(this.currentElement?.element);
            // this.currentIndex = Math.max(0, this.currentIndex - 1);
            this.textExtractor.clearProcessedElements();
            this.currentElement = this.prevElement(this.currentIndex);
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            if (this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                this.highlightBox.removeHighlight(this.currentElement?.element);
            } else {
                this.speakCurrentSection();
            }
        } else if (request.action === "accessLink") {
            if (this.currentElement) {
                this.linkHandler.accessLink(this.currentElement.element);
                this.speechHandler.stop();
            }
        }
    }

    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 &&
                          rect.left >= 0;
        const isNotHidden = window.getComputedStyle(element).visibility !== 'hidden' &&
                            window.getComputedStyle(element).display !== 'none';
        return isVisible && isNotHidden;
    }
}

// Instantiate the content handler
new ContentHandler();