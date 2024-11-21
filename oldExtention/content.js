
let sections = [];
let currentIndex = 0;
let isSpeaking = false;
let highlightBox = null;

function createHighlightBox() {
    // Create the highlight box if it doesn't already exist
    if (!highlightBox) {
        highlightBox = document.createElement("div");
        highlightBox.style.position = "absolute";
        highlightBox.style.border = "2px solid #A33";
        highlightBox.style.backgroundColor = "rgba(255, 0, 0, 0.03)";
        highlightBox.style.pointerEvents = "none"; // Prevent interference with clicks
        highlightBox.style.zIndex = "9999"; // Ensure it appears above other elements
        highlightBox.style.borderRadius = "5px";
        // highlightBox.style.padding = "2px";
        document.body.appendChild(highlightBox);
    }
}

function highlightElement(section) {
    createHighlightBox();

    // Get the element's position and size
    const rect = section.element.getBoundingClientRect();

    // Position the highlight box over the element
    highlightBox.style.top = `${rect.top + window.scrollY}px`;
    highlightBox.style.left = `${rect.left + window.scrollX}px`;
    highlightBox.style.width = `${rect.width}px`;
    highlightBox.style.height = `${rect.height}px`;

    section.element.scrollIntoView({ behavior: "smooth", block: "center" });
}

function removeHighlightBox() {
    if (highlightBox) {
        highlightBox.remove();
        highlightBox = null;
    }
}

function extractAllTextWithTags(node) {
    let textSections = []; // Array of text content
    let elementSections = []; // Array of corresponding elements

    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();

        // Check if the text is non-empty and if the node is visible
        if (text && node.parentNode.offsetParent !== null) {
            textSections.push(text);
            elementSections.push(node.parentNode); // Store the parent element of the text
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Ignore style and script tags
        if (tagName === 'style' || tagName === 'script') return { textSections, elementSections };

        // Handle links specifically
        if (tagName === 'a' && node.href) {
            // const text = node.textContent.trim(); // Use text content
            let text = Array.from(node.childNodes)
                .filter(child => child.nodeType === Node.TEXT_NODE)
                .map(child => child.textContent.trim())
                .join('');
            const domain = new URL(node.href).hostname.replace('www.', ''); // Extract domain
            if (text) {
                textSections.push(`Link text: ${text}`);
                elementSections.push(node);
            } else {
                textSections.push(`Link destination: ${domain}`);
                elementSections.push(node);
            }
        }

        // Process child nodes
        for (let child of node.childNodes) {
            const { textSections: childTexts, elementSections: childElements } = extractAllTextWithTags(child);
            textSections = textSections.concat(childTexts);
            elementSections = elementSections.concat(childElements);
        }
    }

    return { textSections, elementSections };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extractText") {
        // console.log("received extractText");
        const { textSections, elementSections } = extractAllTextWithTags(document.body);

        // Store the sections as an array of objects with text and element references
        sections = textSections.map((text, index) => ({
            text,
            element: elementSections[index],
        }));

        currentIndex = 0; // Reset to the first section
        speakCurrentSection(); // Start reading the text
        return true;
    }
});

function speakCurrentSection() {
    if (currentIndex >= sections.length) {
        removeHighlightBox();
        return;
    }
    const section = sections[currentIndex];
    highlightElement(section);

    const utterance = new SpeechSynthesisUtterance(section.text);
    utterance.onend = () => {
        isSpeaking = false;
        currentIndex++;
        speakCurrentSection();
    };
    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    window.speechSynthesis.cancel();
    isSpeaking = false;
}

function skipToNext() {
    stopSpeaking();
    currentIndex = Math.min(currentIndex + 1, sections.length - 1);
    speakCurrentSection();
}

function skipToPrevious() {
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
    } else if (request.action === "accessLink") {
        if (sections[currentIndex]) {
            const section = sections[currentIndex];
    
            // Check if the current section is a link
            if (section.element.tagName.toLowerCase() === 'a') {
                const url = section.element.href;
                if (url) {
                    window.open(url); 
                }
            }
        }
    }
});