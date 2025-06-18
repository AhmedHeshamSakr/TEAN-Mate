import Artyom from "artyom.js";
import VideoOverlayManager from './VideoOverlayManager.js';

export default class ArtyomAssistant {
    constructor(sidebarController) {
        this.artyom = new Artyom.default();
        this.sidebarController = sidebarController; // Reference to SidebarController
        this.isListening = false;
        this.videoOverlayManager = new VideoOverlayManager();
        this.setupCommands();
        this.initializeSettings();
        this.commandsDisabled = false;
    }

    getSettings(callback) {
        // First check the storage preference
        chrome.storage.local.get('settings', function(localData) {
            if (localData.settings && localData.settings.dataStorage) {
                const storagePreference = localData.settings.dataStorage;
                
                if (storagePreference === 'sync') {
                    // Load from sync storage
                    chrome.storage.sync.get('settings', function(syncData) {
                        callback(syncData.settings || {});
                    });
                } else {
                    // Load from local storage
                    callback(localData.settings || {});
                }
            } else {
                // If no preference is set, try both storages
                chrome.storage.sync.get('settings', function(syncData) {
                    if (syncData.settings) {
                        callback(syncData.settings);
                    } else {
                        callback(localData.settings || {});
                    }
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
        const triggerAction = (action, wildcard) => {
            // Don't process commands if disabled
            if (this.commandsDisabled) return;
            
            this.triggerExtensionAction(action, wildcard);
        };
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
            {
                indexes: ["search for *", "find *"],
                smart: true,
                action: (i, wildcard) => {triggerAction("search", wildcard);}
            },
            {
                indexes: ["copy text", "copy speech"],
                action: () => {
                    if (this.sidebarController) {
                        this.sidebarController.handleCopySpeech();
                    }
                }
            },
            {
                indexes: ["save text", "save speech"],
                action: () => {
                    if (this.sidebarController) {
                        this.sidebarController.handleSaveSpeech();
                    }
                }
            },
            {
                indexes: ["clear text", "clear speech"],
                action: () => {
                    if (this.sidebarController) {
                        this.sidebarController.handleClearSpeech();
                    }
                }
            }
        ]);
        // In ArtyomAssistant.js
        this.artyom.redirectRecognizedTextOutput((recognized, isFinal) => {
            // Update sidebar display
            if (this.sidebarController) {
                this.sidebarController.updateSpeechDisplay(recognized, isFinal);
                
                // Send ALL recognized text to overlay (not just final results)
                if (this.isVideoOverlayEnabled()) {
                    console.log("Sending recognized text to video overlay:", recognized);
                    
                    // Send directly to content script
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length > 0) {
                            chrome.tabs.sendMessage(tabs[0].id, {
                                action: "displayOverlayText",
                                text: recognized,
                                isFinal: isFinal
                            });
                        }
                    });
                }
            } else {
                // Fallback if sidebarController is not available
                const recognizedTextDiv = document.getElementById("recognizedText");
                if (recognizedTextDiv) {
                    recognizedTextDiv.textContent = isFinal ? `You said: ${recognized}` : recognized;
                }
            }
        });
    }

    isVideoOverlayEnabled() {
        const checkbox = document.getElementById('video-overlay-checkbox');
        return checkbox && checkbox.checked && 
               this.sidebarController.getSTTMode() === 'continuous';
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
    setCommandsEnabled(enabled) {
        this.commandsDisabled = !enabled;
        console.log(`Speech commands ${enabled ? 'enabled' : 'disabled'}`);
    }
}

