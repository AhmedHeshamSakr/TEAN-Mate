import Artyom from '/node_modules/artyom.js/build/artyom.js'

export default class ArtyomAssistant {
    static instance = null;
    
    // Singleton pattern ensures only one instance exists
    static getInstance() {
      if (!this.instance) {
        this.instance = new ArtyomAssistant();
      }
      return this.instance;
    }
  
    constructor() {
      // Prevent multiple instantiations
      if (ArtyomAssistant.instance) {
        return ArtyomAssistant.instance;
      }
  
      // Robust initialization of Artyom with fallback and environment checks
      this.artyom = this.initializeArtyom();

      this.isListening = false;
      
      // Set up a default help command
      this.setupDefaultCommands();
      
      // Store the instance
      ArtyomAssistant.instance = this;
    }
  
    // Safe Artyom initialization method
    initializeArtyom() {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        // First, try the imported Artyom
        if (typeof Artyom === 'function') {
          return new Artyom();
        }
        
        // Fallback to window.Artyom if available
        if (window.Artyom) {
          return new window.Artyom();
        }
      }
      
      // If no Artyom is available, log an error and return null
      console.error('Artyom speech recognition is not available in this environment.');
      return null;
    }
  
    // Modify existing methods to check for artyom initialization
    setupDefaultCommands() {
      // Only set up commands if Artyom is initialized
      if (!this.artyom) {
        console.warn('Cannot set up default commands: Artyom not initialized');
        return;
      }

      this.artyom.addCommands({
        indexes: ["hello", "help"],
        action: () => {
          console.log("Default command triggered!");
          // Optionally speak a response
          this.artyom.say("How can I assist you today?");
        }
      });
      console.log("ArtyomAssistant initialized with default commands.");
    }
  
    // Modify startListening to handle potential Artyom absence
    startListening() {
      // Check if Artyom is initialized
      if (!this.artyom) {
        console.error('Cannot start listening: Artyom not initialized');
        return Promise.reject(new Error('Speech recognition not available'));
      }

      // Check if already listening to prevent duplicate initialization
      if (this.isListening) {
        console.warn("Speech recognition is already active.");
        return Promise.resolve();
      }
  
      // Return a promise to handle async permission and initialization
      return new Promise((resolve, reject) => {
        // Ensure browser environment supports necessary APIs
        if (typeof navigator === 'undefined' || !navigator.permissions) {
          reject(new Error('Browser does not support required permissions API'));
          return;
        }

        // First, check microphone permissions
        navigator.permissions.query({ name: 'microphone' })
          .then((permissionStatus) => {
            switch(permissionStatus.state) {
              case 'granted':
                this.initializeSpeechRecognition(resolve, reject);
                break;
              case 'prompt':
                this.requestMicrophonePermission(resolve, reject);
                break;
              case 'denied':
                this.handleMicrophoneDenied(reject);
                break;
            }
          })
          .catch((error) => {
            console.error('Permission check failed:', error);
            this.handleMicrophoneDenied(reject);
          });
      });
    }
  
    // Other methods remain largely the same, but add checks for this.artyom
    // For example, in stopListening:
    stopListening() {
      // Check if Artyom is initialized
      if (!this.artyom) {
        console.error('Cannot stop listening: Artyom not initialized');
        return Promise.reject(new Error('Speech recognition not available'));
      }

      // Check if already stopped
      if (!this.isListening) {
        console.warn("Speech recognition is not currently active.");
        return Promise.resolve();
      }
  
      return this.artyom.fatality()
        .then(() => {
          this.isListening = false;
          console.log("Speech recognition stopped successfully");
          this.showSuccessNotification("Speech recognition deactivated");
        })
        .catch((err) => {
          console.error("Error stopping speech recognition:", err.message);
          this.showErrorNotification("Could not stop speech recognition");
        });
    }
  
    // Toggle listening state
    toggleListening() {
      return this.isListening ? this.stopListening() : this.startListening();
    }
  
    // User notification methods (can be customized)
    showSuccessNotification(message) {
      // Implement your preferred notification method
      console.log(`✅ ${message}`);
      // Could use browser notifications, custom UI, or voice feedback
    }
  
    showErrorNotification(message) {
      // Implement your preferred error notification method
      console.error(`❌ ${message}`);
      // Could use browser notifications, custom UI, or voice feedback
    }
  
    // Handle microphone permission denial
    handleMicrophoneDenied(reject) {
      const errorMessage = `
        Microphone access is required for Speech-to-Text.
        Please:
        1. Check your browser settings
        2. Ensure microphone permissions are granted
        3. Reload the extension
      `;
      
      console.error(errorMessage);
      this.showErrorNotification(errorMessage);
      
      // Reject the promise to signal initialization failure
      reject(new Error('Microphone access denied'));
    }
  
    // Getter for listening state
    isArtyomListening() {
      return this.isListening;
    }
  }