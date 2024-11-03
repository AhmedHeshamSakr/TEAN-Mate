// Fetch the extension's name from the manifest and set it as the title


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
    }
});



