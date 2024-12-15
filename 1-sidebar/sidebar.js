import ArtyomAssistant from "../2-features/STT/ArtyomAssistant.js"; 

// Update the SidebarController
class SidebarController {
    constructor() {
        this.buttons = {}; // Store button references for easy access
        this.artyomAssistant = new ArtyomAssistant(this); // Initialize ArtyomAssistant with SidebarController instance
        this.initialize(); // Set up event listeners and initial state
    }

    // Initialize sidebar
    initialize() {
        // Set sidebar title using the extension's name
        document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;

        // Wait for DOM to load before attaching event listeners
        document.addEventListener("DOMContentLoaded", this.setupEventListeners.bind(this));
    }

    // Set up event listeners for all buttons
    setupEventListeners() {
        const buttons = document.querySelectorAll(".accessibility-button");
        if (!buttons.length) {
            console.warn("No accessibility buttons found!");
            return;
        }

        // Assign buttons dynamically and bind their handlers
        this.buttons.tts = buttons[0];
        this.buttons.stt = buttons[1];
        this.buttons.signLanguage = buttons[2];
        this.buttons.imageCaption = buttons[3];

        this.addButtonListener(this.buttons.tts, this.handleTTS.bind(this));
        this.addButtonListener(this.buttons.stt, this.handleSTT.bind(this));
        this.addButtonListener(this.buttons.signLanguage, this.handleSignLanguage.bind(this));
        this.addButtonListener(this.buttons.imageCaption, this.handleImageCaption.bind(this));
    }

    // Add an event listener to a button, with error handling
    addButtonListener(button, handler) {
        if (!button) {
            console.warn("Button not found, skipping event binding.");
            return;
        }
        button.addEventListener("click", handler);
    }

    // Handle Text-to-Speech button click
    handleTTS() {
        console.log("Text-to-Speech button clicked");
        this.sendMessageToActiveTab({ action: "extractText" });
    }

    // Handle Speech-to-Text button click
    handleSTT() {
        console.log("Speech-to-Text initialized with push-to-talk");
    
        // Add keyboard listeners for push-to-talk
        window.addEventListener("keydown", (event) => {
            if (event.code === "Space" && !this.artyomAssistant.isListening) {
                console.log("Push-to-Talk: Listening activated");
                this.artyomAssistant.startListening(); // Start STT
                this.buttons.stt.textContent = "Listening..."; // Change button text
            }
        });
    
        window.addEventListener("keyup", (event) => {
            if (event.code === "Space" && this.artyomAssistant.isListening) {
                console.log("Push-to-Talk: Listening stopped");
                this.artyomAssistant.stopListening(); // Stop STT
                this.buttons.stt.textContent = "Speech to Text (STT)"; // Reset button text
            }
        });
    }
    

    // Handle Sign Language Translator button click
    handleSignLanguage() {
        console.log("Sign Language Translator button clicked");
        alert("Sign Language Translator activated"); // Placeholder for sign language functionality
    }

    // Handle Image Captioning button click
    handleImageCaption() {
        console.log("Image Captioning button clicked");
        alert("Image Captioning activated"); // Placeholder for image captioning functionality
    }

    // Send a message to the active tab
    sendMessageToActiveTab(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            } else {
                console.warn("No active tab found");
            }
        });
    }

    handleSkipNext() {
        console.log("Skipping to next item...");
        this.sendMessageToActiveTab({ action: "skipNext" });
    }
    
    handleSkipPrevious() {
        console.log("Skipping to previous item...");
        this.sendMessageToActiveTab({ action: "skipPrevious" });
    }
    
    handleAccessLink() {
        console.log("Accessing link...");
        this.sendMessageToActiveTab({ action: "accessLink" });
    }
    handleStopReading() {
        console.log("Reading Stoped...");
        this.sendMessageToActiveTab({ action: "toggleReading" });
    }

    // Trigger button action programmatically
    triggerButtonAction(action) {
        switch (action) {
            case "tts":
                this.handleTTS();
                break;
            case "stt":
                this.handleSTT();
                break;
            case "signLanguage":
                this.handleSignLanguage();
                break;
            case "imageCaption":
                this.handleImageCaption();
                break;
            case "skip-next":
                this.handleSkipNext();
                break;
            case "skip-previous":
                this.handleSkipPrevious();
                break;
            case "access-link":
                this.handleAccessLink();
                break;
            case "toggle-reading":
                this.handleStopReading();
                break;    
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }
}

// Instantiate the SidebarController
const sidebarController = new SidebarController();
export default sidebarController;
