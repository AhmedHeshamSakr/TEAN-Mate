import { runPredict, initializeVoices } from "./TTSmodel/predict.js";
let voices, worker;

async function initialize() {
    console.log("Initializing extension");
    try {
        voices = await initializeVoices();
        console.log("Voices initialized:", voices);
    } catch (error) {
        console.error("Failed to initialize voices:", error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "runPredict") {
        const workerUrl = chrome.runtime.getURL("TTSmodel/worker.js");
        worker?.terminate();
        console.log("worker", workerUrl);
        worker = new Worker(workerUrl);
        runPredict(request.text, voices, request.worker).then(audioBlob => {
            sendResponse({ audioBlob });
        }).catch(error => {
            console.error("Error in runPredict:", error);
            sendResponse({ error: error.message });
        });
        return true;
    }
});
// Fetch the extension's name from the manifest and set it as the title


chrome.runtime.onInstalled.addListener(() => {
    // No need to open a new tab or side panel when installed
    initialize(voices);
});
chrome.runtime.onStartup.addListener(() => {
    initialize(voices);
});

chrome.action.onClicked.addListener(() => {
    // No need to open a new tab or side panel when the action icon is clicked
});

chrome.commands.onCommand.addListener((command) => {
    if (command === "skip-next") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "skipToNext" });
        });
    } else if (command === "skip-previous") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "skipToPrevious" });
        });
    } else if (command === "toggle-reading") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "toggleReading" });
        });
    } else if (command === "access-link") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "accessLink" });
        });
    }
});
