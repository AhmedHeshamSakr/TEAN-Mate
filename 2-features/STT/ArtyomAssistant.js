import Artyom from "artyom.js";

export default class ArtyomAssistant {
    constructor(sidebarController) {
        this.artyom = new Artyom.default();
        this.sidebarController = sidebarController; // Reference to SidebarController
        this.isListening = false;
        this.setupCommands();
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
            self.badge = settings.showIconBadge || false;
        });
    }

    setupCommands() {
        const triggerAction = this.triggerExtensionAction.bind(this);
        this.artyom.addCommands([
            {
                indexes: ["text to speech", "start reading"],
                action: () => {triggerAction("tts");}
            },
            {
                indexes: ["stop", "pause"],
                action: () => {triggerAction("toggle-reading");}
            },
            {
                indexes: ["sign language", "show sign language"],
                action: () => {triggerAction("signLanguage");}
            },
            {
                indexes: ["image caption", "describe image"],
                action: () => {triggerAction("imageCaption");}
            },
            {
                indexes: ["next", "skip next"],
                action: () => {triggerAction("skip-next");}
            },
            {
                indexes: ["back", "skip back"],
                action: () => {triggerAction("skip-previous");}
            },
            {
                indexes: ["open link", "open this link"],
                action: () => {triggerAction("access-link");}
            },
            // New search command
            {
                indexes: ["search for *", "find *"],
                smart: true,
                action: (i, wildcard) => {triggerAction("search", wildcard);}
            }
        ]);

        this.artyom.redirectRecognizedTextOutput((recognized, isFinal) => {
            const recognizedTextDiv = document.getElementById("recognizedText");
            recognizedTextDiv.textContent = isFinal ? `You said: ${recognized}` : recognized;
        });
    }

    startListening() {
        if (!this.isListening) {
            this.isListening = true;
            console.log("Artyom is now listening...");
            this.artyom.fatality();
            setTimeout(() => {
                this.artyom.initialize({
                    lang: "en-US",
                    continuous: true,
                    listen: true,
                    debug: true,
                    speed: 1,
                }).then(() => {
                    console.log("Artyom is listening!");
                    this.isListening = true;
                }).catch(err => {
                    console.error("Artyom initialization error:", err);
                });
            }, 250);
        }
    }

    stopListening() {
        if (this.isListening) {
            this.isListening = false;
            console.log("Artyom stopped listening.");
            this.artyom.fatality();
            console.log("Artyom has stopped listening.");
            this.isListening = false;
            this.badge? chrome.runtime.sendMessage({
                action: "updateBadge",
                isActive: false
            }) : null;
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isListening;
    }

    triggerExtensionAction(action, query = null) {
        if (this.sidebarController) {
            console.log(`Triggering action: ${action}, Query: ${query}`);
            if (query) {
                this.sidebarController.triggerButtonAction(action, query);
            } else {
                this.sidebarController.triggerButtonAction(action);
            }
        } else {
            console.warn("SidebarController is not set.");
        }
    }
}

