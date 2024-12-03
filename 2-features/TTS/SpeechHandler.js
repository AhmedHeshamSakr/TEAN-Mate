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
        }

        this.abortController = new AbortController();
        const signal = this.abortController.signal;

        try {
            if(this.currentAudio == null){
                const audioBlob = await this.piperTTS.runPredict(text, signal);
                const audioUrl = URL.createObjectURL(audioBlob);
                this.currentAudio = new Audio(audioUrl);
            }
            if(!this.isSpeaking){
                this.isSpeaking = true;
                console.log("Playing audio");
                this.currentAudio.playbackRate = this.speed;
                this.currentAudio.play();
            }
            this.currentAudio.onended = () => {
                this.isSpeaking = false;
                this.currentAudio = null;
                console.log("Audio Ended")
                if (onEnd) onEnd();
            };
        } catch (error) {
            if (signal.aborted) {
                console.log("Request aborted");
            } else {
                console.error("Error in speak:", error);
            }
            this.isSpeaking = false;
            this.abortController = null;
        }
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