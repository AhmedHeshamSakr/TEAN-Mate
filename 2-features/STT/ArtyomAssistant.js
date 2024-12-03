import Artyom from '/node_modules/artyom.js/build/artyom.js';

export default class ArtyomAssistant {
    constructor(sidebarController) {
        this.artyom = new Artyom();
        this.sidebarController = sidebarController; // Reference to SidebarController
        this.isListening = false;
        this.setupCommands();
    }

    setupCommands() {
        this.artyom.addCommands([
            {
                indexes: ["text to speech", "start reading"],
                action: () => {
                    this.triggerExtensionAction("tts");
                }
            },
            {
                indexes: ["stop", "pause"],
                action: () => {
                    this.triggerExtensionAction("toggle-reading");
                }
            },
            {
                indexes: ["sign language", "show sign language"],
                action: () => {
                    this.triggerExtensionAction("signLanguage");
                }
            },
            {
                indexes: ["image caption", "describe image"],
                action: () => {
                    this.triggerExtensionAction("imageCaption");
                }
            },
            {
                indexes: ["next", "skip next"],
                action: () => {
                    this.triggerExtensionAction("skip-next");
                }
            },
            {
                indexes: ["back ", "skip back"],
                action: () => {
                    this.triggerExtensionAction("skip-previous");
                }
            },
            {
                indexes: ["open link", "open this link"],
                action: () => {
                    this.triggerExtensionAction("access-link");
                }
            }
        ]);

        this.artyom.redirectRecognizedTextOutput((recognized, isFinal) => {
            const recognizedTextDiv = document.getElementById("recognizedText");
            recognizedTextDiv.textContent = isFinal ? `You said: ${recognized}` : recognized;
        });
    }

    startListening() {
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

    stopListening() {
        this.artyom.fatality();
        console.log("Artyom has stopped listening.");
        this.isListening = false;
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
        return this.isListening;
    }

    triggerExtensionAction(action) {
        if (this.sidebarController) {
            this.sidebarController.triggerButtonAction(action);
        } else {
            console.warn("SidebarController is not set.");
        }
    }
}
