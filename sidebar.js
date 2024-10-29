document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.accessibility-button');
    const [signLanguageButton, ttsButton, sttButton, imageCaptionButton] = buttons;

    if (ttsButton) {
        ttsButton.addEventListener('click', function() {
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