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
            console.log("element: " + element);

            if (this.isElementVisible(element)) {
                console.log("element in if");
                const tagName = element.tagName?.toLowerCase();
                if (["script", "style", "noscript"].includes(tagName)) {
                    console.log("element is s/s/n");
                    continue;
                }
                for (const child of element.childNodes) {
                    let textRes = '';
                    console.log("child: " + child);
                    if (child.nodeType === Node.TEXT_NODE) {
                        console.log("entered text condition");
                        textRes = child.textContent.trim();
                        console.log("textRes in text: "+textRes);
                        if (textRes !== ''){
                            text.push(textRes);
                            elementsToReturn.push(element);
                        }
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        console.log("entered element condition");
                        textRes = this.textExtractor.extractText(child);
                        console.log("textRes in element: "+textRes);
                        if (textRes !== ''){
                            text.push(textRes);
                            elementsToReturn.push(child);
                        }
                    }
                }
            }
            if (text.length > 0) {
                this.currentIndex = i;
                console.log("elementsToReturn: "+ elementsToReturn);
                console.log("text to return: "+text);
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

    async speakCurrentSection() {
        console.log("in speakCurrentSection");
        if (!this.currentElement) {
            console.log("!this.currentElement");
            this.currentElement = this.getNextElement(this.currentIndex);
        }
        let { elementsToReturn, text } = this.currentElement;
        // if (!this.currentElement || !elementsToReturn|| !text) {
        //     console.log("in !this.currentElement || !element|| !text");
        //     console.log("this.currentElement : " + this.currentElement.elementsToReturn + " " + this.currentElement.text);
        //     console.log("element: " + elementsToReturn);
        //     console.log("text: " + text);
        //     this.currentElement = this.getNextElement(this.currentIndex); 
        // } 
        // elementsToReturn, text = this.currentElement; 
        if (!this.currentElement || !elementsToReturn) {
            console.log("No element to speak!");
            return;
        }

        for (let i = 0; i < elementsToReturn.length; i++) {
            // Wait for the previous speech/highlight to complete before starting the next
            await new Promise(async (resolve) => {
              try {
                // Add highlight first
                this.highlightBox.addHighlight(elementsToReturn[i]);
      
                // Wait for speech to complete
                await this.speechHandler.speak(text[i]);
                this.highlightBox.removeHighlight(elementsToReturn[i]);
                this.currentIndex++;
                this.currentElement = null; // Prepare for the next element
                this.speakCurrentSection();
                
                resolve();
              } catch (error) {
                console.error('Error in sequence:', error);
                this.highlightBox.removeHighlight(elementsToReturn[i]);
                resolve(); // Continue to next item even if there's an error
              }
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
