document.getElementById("sidebar-title").textContent = chrome.runtime.getManifest().name;
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.accessibility-button');
    const [ttsButton, sttButton, signLanguageButton, imageCaptionButton] = buttons;

    if (ttsButton) {
        ttsButton.addEventListener('click', function() {
            // alert('Text to Speech activated');
            console.log('Text to Speech button clicked');
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "extractText" });
            });
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