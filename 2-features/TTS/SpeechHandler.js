export default class SpeechHandler {
    constructor() {
        this.isSpeaking = false;
    }

    speak(text, onEnd) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            this.isSpeaking = false;
            if (onEnd) onEnd();
        };
        this.isSpeaking = true;
        window.speechSynthesis.speak(utterance);
    }

    stop() {
        window.speechSynthesis.cancel();
        this.isSpeaking = false;
    }
}
