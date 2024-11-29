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
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    speakCurrentSection() {
        if (this.currentIndex >= this.sections.length) {
            this.highlightBox.removeHighlight(this.sections[this.currentIndex - 1]?.element);
            return;
        }

        const section = this.sections[this.currentIndex];
        this.highlightBox.addHighlight(section.element);
        this.speechHandler.speak(section.text, () => {
            this.highlightBox.removeHighlight(section.element);
            this.currentIndex++;
            this.speakCurrentSection();
        });
    }

    handleMessage(request) {
        if (request.action === "extractText") {
            const { textSections, elementSections } = this.textExtractor.extractAllTextWithTags(document.body);
            this.sections = textSections.map((text, index) => ({
                text,
                element: elementSections[index],
            })).filter(section => this.isElementVisible(section.element));
            this.currentIndex = 0;
            this.speakCurrentSection();
        } else if (request.action === "skipToNext") {
            this.highlightBox.removeHighlight(this.sections[this.currentIndex]?.element);
            this.speechHandler.stop();
            this.currentIndex = Math.min(this.currentIndex + 1, this.sections.length - 1);
            this.speakCurrentSection();
        } else if (request.action === "skipToPrevious") {
            this.highlightBox.removeHighlight(this.sections[this.currentIndex]?.element);
            this.speechHandler.stop();
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            if(this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                this.highlightBox.removeHighlight(this.sections[this.currentIndex]?.element);
            } else this.speakCurrentSection();
        } else if (request.action === "accessLink") {
            const section = this.sections[this.currentIndex];
            this.linkHandler.accessLink(section.element);
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
