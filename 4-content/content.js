import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor  from "../2-features/TTS/TextExtractor.js";
import  SpeechHandler  from "../2-features/TTS/SpeechHandler.js";
import  LinkHandler  from "../2-features/TTS/LinkHandler.js";
import ArtyomAssistant  from "../2-features/STT/ArtyomHandller.js";

class ContentHandler {
    constructor() {
        this.sections = [];
        this.currentIndex = 0;

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        this.ArtyomAssistant=new ArtyomAssistant();
        this.initializeVoiceCommands();

        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    }

    initializeVoiceCommands() {
        // Add commands
        this.ArtyomAssistant.addCommand("next", () => this.handleMessage({ action: "skipToNext" }));
        this.ArtyomAssistant.addCommand("previous", () => this.handleMessage({ action: "skipToPrevious" }));
        this.ArtyomAssistant.addCommand("start reading", () => this.handleMessage({ action: "toggleReading" }));
        this.ArtyomAssistant.addCommand("open link", () => this.handleMessage({ action: "accessLink" }));

        // Start Artyom listening
        this.ArtyomAssistant.startListening();
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

        }else if (request.action === "toggleListening"){
                this.ArtyomAssistant.toggleListening();
        
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
            
        }else {
            console.warn("Unhandled action:", request.action);
        }
        // ////// Using Voice Commands ///////////////////////////////////
        // else if (request.action === "startSpeechRecognition") {
        //     console.log("Starting speech recognition");
        //     this.ArtyomAssistant.start();
        // } else if (request.action === "stopSpeechRecognition") {
        //     console.log("Stopping speech recognition");
        //     this.ArtyomAssistant.stop();
        // } else if (request.action === "processSpeechCommand") {
        //     const command = request.command;
        //     console.log("Processing speech command:", command);
        //     // Add logic to handle recognized commands, e.g., triggering TTS, skipping, etc.
        //     if (command === "next") {
        //         this.handleMessage({ action: "skipToNext" });
        //     } else if (command === "previous") {
        //         this.handleMessage({ action: "skipToPrevious" });
        //     }
        // }
    }
}

// Instantiate the content handler
new ContentHandler();
