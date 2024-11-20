// Constants for keyboard commands
const KEYBOARD_COMMANDS = {
  'skip-next': 'skipToNext',
  'skip-previous': 'skipToPrevious',
  'toggle-reading': 'toggleReading',
  'access-link': 'accessLink'
};

// Extension installation handler
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed successfully');
});

// Extension icon click handler
chrome.action.onClicked.addListener(() => {
  console.log('Action icon clicked');
  // You might want to add logic here to toggle the sidebar
  // For example:
  // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //   chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSidebar' });
  // });
});

// Keyboard command handler
chrome.commands.onCommand.addListener(async (command) => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!activeTab?.id || !KEYBOARD_COMMANDS[command]) {
      return;
    }

    await chrome.tabs.sendMessage(activeTab.id, { 
      action: KEYBOARD_COMMANDS[command] 
    });
  } catch (error) {
    console.error('Error handling keyboard command:', error);
  }
});