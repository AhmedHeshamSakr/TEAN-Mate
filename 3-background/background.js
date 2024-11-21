class BackgroundHandler {
  constructor() {
      this.commands = {
          "skip-next": "skipToNext",
          "skip-previous": "skipToPrevious",
          "toggle-reading": "toggleReading",
          "access-link": "accessLink",
      };

      this.initialize();
  }

  initialize() {
      chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
      chrome.action.onClicked.addListener(this.onActionClicked.bind(this));
      chrome.commands.onCommand.addListener(this.onCommand.bind(this));
  }

  onInstalled() {
      // Placeholder for installation logic, if needed in the future
      console.log("Extension installed");
  }

  onActionClicked() {
      // Placeholder for action click logic, if needed in the future
      console.log("Action icon clicked");
  }

  onCommand(command) {
      const action = this.commands[command];
      if (action) {
          this.sendMessageToActiveTab({ action });
      } else {
          console.warn(`Unknown command: ${command}`);
      }
  }

  sendMessageToActiveTab(message) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
              chrome.tabs.sendMessage(tabs[0].id, message);
          } else {
              console.warn("No active tab found");
          }
      });
  }
}

// Instantiate the BackgroundHandler
new BackgroundHandler();
