// Fetch the extension's name from the manifest and set it as the title


chrome.runtime.onInstalled.addListener(() => {
    // No need to open a new tab or side panel when installed
});

chrome.action.onClicked.addListener(() => {
    // No need to open a new tab or side panel when the action icon is clicked
});



