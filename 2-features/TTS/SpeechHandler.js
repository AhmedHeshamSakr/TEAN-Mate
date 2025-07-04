import PiperTTS from "./PiperTTS.js";

export default class SpeechHandler {
    constructor() {
        this.isSpeaking = false;
        this.currentAudio = null;
        this.abortController = null;
        this.speed = 1.0;
        this.initializeSettings();

        this.piperTTS = new PiperTTS();
        chrome.runtime.sendMessage({ action: "getVoices" }, (response) => {
            if (response.voices) {
                this.piperTTS.setVoices(response.voices);
                console.log("Voices set in content script:", response.voices);
            } else {
                console.log("Failed to get voices from background script");
            }
        });
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
            // Now you can use the settings
            console.log('Loaded settings:', settings);
            self.speed = settings.ttsRate || 1.0;
            self.volume = settings.ttsVolume || 1.0;
            
            self.piperTTS.setVoice(settings.ttsVoice);
        });
    }

    async speak(text, onEnd) {
        if(this.abortController){
            console.log("Abort previous request");
            this.abortController.abort();
            this.abortController = null;
        }

        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        return new Promise(async (resolve, reject) => {
            try {
              this.abortController = new AbortController();
              const signal = this.abortController.signal;
      
              // Generate new audio
              const audioBlob = await this.piperTTS.runPredict(text, signal);
              const audioUrl = URL.createObjectURL(audioBlob);
              
              this.currentAudio = new Audio(audioUrl);
              if(!this.isSpeaking){
                this.isSpeaking = true;
                console.log("Playing audio");
                this.currentAudio.playbackRate = this.speed;
                this.currentAudio.volume = this.volume;
                this.currentAudio.play().catch(error => {
                    if (error.name === 'AbortError') {
                        console.log("Audio play aborted");
                    } else {
                        console.log("Error in play:", error);
                    }
                });
              }
      
              // Set up event handlers
              this.currentAudio.onended = () => {
                this.isSpeaking = false;
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl); // Clean up the blob URL
                resolve();
              };
      
              this.currentAudio.onerror = (error) => {
                this.isSpeaking = false;
                this.currentAudio = null;
                URL.revokeObjectURL(audioUrl);
                reject(error);
              };
      
              // Start playback
              this.isSpeaking = true;
      
            } catch (error) {
              if (this.abortController?.signal.aborted) {
                console.log("Request aborted");
              } else {
                console.log("Error in speak:", error);
              }
              this.isSpeaking = false;
              this.currentAudio = null;
              this.abortController = null;
            //   reject(error);
            }
          });
    }


    async stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isSpeaking = false;
        if(this.abortController){
            this.abortController.abort();
            this.abortController = null;
        }
    }
}