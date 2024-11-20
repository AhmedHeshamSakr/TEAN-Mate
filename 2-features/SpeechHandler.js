export default class SpeechHandler {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isSpeaking = false;
        this.sections = [];
        this.currentIndex = 0;
        this.highlightHandler = null;
    }

    setSections(sections) {
        this.sections = sections;
    }

    setHighlightHandler(highlightHandler) {
        this.highlightHandler = highlightHandler;
    }

    speakCurrentSection() {
        if (this.currentIndex >= this.sections.length) {
            this.highlightHandler?.removeHighlightBox();
            return;
        }

        const section = this.sections[this.currentIndex];
        this.highlightHandler?.highlightElement(section);

        const utterance = new SpeechSynthesisUtterance(section.text);
        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentIndex++;
            this.speakCurrentSection();
        };

        this.isSpeaking = true;
        this.synth.speak(utterance);
    }

    stopSpeaking() {
        this.synth.cancel();
        this.isSpeaking = false;
    }

    skipToNext() {
        this.stopSpeaking();
        this.currentIndex = Math.min(this.currentIndex + 1, this.sections.length - 1);
        this.speakCurrentSection();
    }

    skipToPrevious() {
        this.stopSpeaking();
        this.currentIndex = Math.max(this.currentIndex - 1, 0);
        this.speakCurrentSection();
    }
}