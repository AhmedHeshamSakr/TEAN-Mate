// Constants
const ACTIONS = {
    EXTRACT_TEXT: 'extractText',
    STT_ACTIVATE: 'sttActivate',
    SIGN_LANGUAGE: 'signLanguage',
    IMAGE_CAPTION: 'imageCaption'
  };
  
  // Main initialization
  document.addEventListener('DOMContentLoaded', () => {
    const elements = {
      sidebar: document.querySelector('main.sidebar-MainContainer'),
      title: document.getElementById('sidebar-title'),
      buttons: document.querySelectorAll('.accessibility-button'),
      speechDisplay: document.getElementById('recognizedText')
    };
  
    if (!validateElements(elements)) return;
  
    setupSidebar(elements);
    setupButtonHandlers(elements);
  
    const extractButton = document.getElementById('extractText');
    if (extractButton) {
      extractButton.addEventListener('click', handleTextExtraction);
    } else {
      console.error('Sidebar: Extract text button not found');
    }
  });
  
  // Validate all required DOM elements are present
  function validateElements(elements) {
    const missingElements = Object.entries(elements)
      .filter(([, element]) => !element)
      .map(([key]) => key);
    
    if (missingElements.length) {
      console.error(`Sidebar: Missing elements - ${missingElements.join(', ')}`);
      return false;
    }
    return true;
  }
  
  // Setup sidebar functionality
  function setupSidebar(elements) {
    const { sidebar, title } = elements;
  
    try {
      title.textContent = chrome.runtime.getManifest().name;
    } catch {
      title.textContent = 'TEAN Mate'; // Fallback title
    }
  
    sidebar.style.display = 'block';
  
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'toggleSidebar') {
        const isVisible = sidebar.style.display !== 'none';
        sidebar.style.display = isVisible ? 'none' : 'block';
        sendResponse({ success: true, isVisible: !isVisible });
      }
    });
  }
  
  // Setup button click handlers
  function setupButtonHandlers(elements) {
    const { buttons, speechDisplay } = elements;
  
    buttons.forEach((button, index) => {
      const action = Object.values(ACTIONS)[index];
      if (!action) return;
  
      button.addEventListener('click', () => handleButtonClick(button, action, speechDisplay));
    });
  }
  
  // Handle individual button clicks
  async function handleButtonClick(button, action, speechDisplay) {
    button.disabled = true;
  
    try {
      console.log(`Button clicked: ${action}`);
      if (action === ACTIONS.EXTRACT_TEXT) {
        await handleTextExtraction();
      } else {
        speechDisplay.textContent = `${action} is now active`;
        console.log(`${action} feature activated`);
      }
    } catch (error) {
      console.error(`Error handling ${action}:`, error);
    } finally {
      button.disabled = false;
    }
  }
  
  // Handle text extraction
  async function handleTextExtraction() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('No active tab found');
  
      const response = await new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: ACTIONS.EXTRACT_TEXT }, (response) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(response);
        });
  
        setTimeout(() => reject(new Error('Message send timeout')), 5000);
      });
  
      if (!response?.success) throw new Error('Text extraction failed');
      console.log('Text extraction successful');
    } catch (error) {
      console.error('Text extraction error:', error);
    }ß
  }
  