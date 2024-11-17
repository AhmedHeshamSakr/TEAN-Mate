import { runPredict } from "./TTSmodel/predict.js";

document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.accessibility-button');
    const [ttsButton, sttButton, imageCaptionButton, signLanguageButton] = buttons;

    if (ttsButton) {
        ttsButton.addEventListener('click', function() {
            const text = "Welcome to our online bookstore! Explore a wide range of books across genres like fiction, non-fiction, mystery, and science fiction."
            runPredict(text);
            alert('Text to Speech activated');
        });
    }

    if (sttButton) {
        sttButton.addEventListener('click', function() {
            alert('Speech to Text activated');
        });
    }

    if (imageCaptionButton) {
        imageCaptionButton.addEventListener('click', function() {
            alert('Image Captioning activated');
        });
    }

    if (signLanguageButton) {
        signLanguageButton.addEventListener('click', function() {
            alert('Sign Language Translator activated');
        });
    }
});