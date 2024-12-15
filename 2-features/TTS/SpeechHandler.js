import PiperTTS from "./PiperTTS.js";

export default class SpeechHandler {
    constructor() {
        this.isSpeaking = false;
        this.piperTTS = new PiperTTS();
        this.currentAudio = null;
        this.abortController = null;
        this.speed = 1.0;

        chrome.runtime.sendMessage({ action: "getVoices" }, (response) => {
            if (response.voices) {
                this.piperTTS.setVoices(response.voices);
                console.log("Voices set in content script:", response.voices);
            } else {
                console.error("Failed to get voices from background script");
            }
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
              this.currentAudio.playbackRate = this.speed;
      
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
              await this.currentAudio.play();
      
            } catch (error) {
              if (this.abortController?.signal.aborted) {
                console.log("Request aborted");
              } else {
                console.error("Error in speak:", error);
              }
              this.isSpeaking = false;
              this.currentAudio = null;
              this.abortController = null;
              reject(error);
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
