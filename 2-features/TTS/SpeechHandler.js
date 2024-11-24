import PiperTTS from "./PiperTTS.js";

export default class SpeechHandler {
    constructor() {
        this.isSpeaking = false;
        this.piperTTS = new PiperTTS();

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
        try {
            const audioBlob = await this.piperTTS.runPredict(text);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            audio.onended = () => {
                this.isSpeaking = false;
                if (onEnd) onEnd();
            };

            this.isSpeaking = true;
            this.currentAudio = audio;
            console.log("Playing audio");
            audio.play();
            
        } catch (error) {
            console.error("Error in speak:", error);
        }
    }


    async stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
        }
        this.isSpeaking = false;
        this.piperTTS.abort();
    }
}
