// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "startSTT") {
//         console.log("Received STT start request in background script.");

//         // Query the active tab
//         chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//             const url = tabs[0]?.url || "";
            
//             // Check for restricted pages
//             if (url.startsWith("chrome://") || url.startsWith("https://chrome.google.com/webstore")) {
//                 console.error("Cannot inject scripts into restricted pages.");
//                 sendResponse({ status: "error", message: "Restricted page detected." });
//                 return;
//             }

//             // Inject content script
//             chrome.scripting.executeScript(
//                 {
//                     target: { tabId: tabs[0].id },
//                     files: ["content.js"]
//                 },
//                 () => {
//                     if (chrome.runtime.lastError) {
//                         console.error("Error injecting content script:", chrome.runtime.lastError.message);
//                         sendResponse({ status: "error", message: chrome.runtime.lastError.message });
//                     } else {
//                         console.log("Content script successfully injected.");
//                         sendResponse({ status: "success", message: "Content script injected." });
//                     }
//                 }
//             );
//         });

//         return true; // Keep the message channel open for asynchronous response
//     }
// });

chrome.runtime.onInstalled.addListener(() => {
    // No need to open a new tab or side panel when installed
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
