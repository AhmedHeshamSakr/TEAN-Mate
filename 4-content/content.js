import HighlightBox from "../2-features/HighlightBox.js";
import TextExtractor  from "../2-features/TextExtractor.js";
import  SpeechHandler  from "../2-features/SpeechHandler.js";
import  LinkHandler  from "../2-features/LinkHandler.js";

class ContentHandler {
    constructor() {
        this.sections = [];
        this.currentIndex = 0;

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    speakCurrentSection() {
        if (this.currentIndex >= this.sections.length) {
            this.highlightBox.remove();
            return;
        }

        const section = this.sections[this.currentIndex];
        this.highlightBox.highlight(section);
        this.speechHandler.speak(section.text, () => {
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
            }));
            this.currentIndex = 0;
            this.speakCurrentSection();
        } else if (request.action === "skipToNext") {
            this.speechHandler.stop();
            this.currentIndex = Math.min(this.currentIndex + 1, this.sections.length - 1);
            this.speakCurrentSection();
        } else if (request.action === "skipToPrevious") {
            this.speechHandler.stop();
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            this.speechHandler.isSpeaking ? this.speechHandler.stop() : this.speakCurrentSection();
        } else if (request.action === "accessLink") {
            const section = this.sections[this.currentIndex];
            this.linkHandler.accessLink(section.element);
        }
    }
}

// Instantiate the content handler
new ContentHandler();
