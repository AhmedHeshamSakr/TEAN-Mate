
let textSections = [];
let currentIndex = 0;
let isSpeaking = false;


function extractAllTextWithTags(node) {
    let sections = [];

    // Only process text nodes and element nodes
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        
        // Check if the text is non-empty and if the node is visible
        if (text && node.parentNode.offsetParent !== null) {
            sections.push(text);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Ignore style and script tags entirely
        if (node.tagName.toLowerCase() !== 'style' && node.tagName.toLowerCase() !== 'script') {
            for (let child of node.childNodes) {
                sections = sections.concat(extractAllTextWithTags(child));
            }
        }
    }

    return sections;
}


// Listen for messages from the sidebar or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // console.log(request.action);
    if (request.action === "extractText") {
        // console.log("content.js received extractText");
        loadTextSections(extractAllTextWithTags(document.body));
        speakCurrentSection();
        return true;
    }
});


function loadTextSections(sections) {
    textSections = sections;
    currentIndex = 0;
}

function speakCurrentSection() {
    if (currentIndex >= textSections.length) return;
    // console.log("reading section");
    const utterance = new SpeechSynthesisUtterance(textSections[currentIndex]);
    utterance.onend = () => {
        isSpeaking = false;
        currentIndex++;
        speakCurrentSection();
    };
    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
}

// Stop and skip functions remain the same
function stopSpeaking() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
}

function skipToNext() {
    // alert("skipped to next");
    stopSpeaking();
    currentIndex = Math.min(currentIndex + 1, textSections.length - 1);
    speakCurrentSection();
}

function skipToPrevious() {
    // alert("skipped to previous");
    stopSpeaking();
    currentIndex = Math.max(currentIndex - 1, 0);
    speakCurrentSection();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "skipToNext") {
        skipToNext();
    } else if (request.action === "skipToPrevious") {
        skipToPrevious();
    } else if (request.action === "toggleReading") {
        if (isSpeaking) {
            stopSpeaking();
        } else {
            speakCurrentSection();
        }
    }
});


