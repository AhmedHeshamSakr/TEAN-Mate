import HighlightBox from "../2-features/TTS/HighlightBox.js";

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap tabs
    const tabEls = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabEls.forEach(tabEl => {
        tabEl.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Get the target tab content
            const targetId = this.getAttribute('data-bs-target');
            const targetTab = document.querySelector(targetId);
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-link').forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
            });
            
            // Show the selected tab pane
            targetTab.classList.add('show', 'active');
            
            // Set the clicked tab as active
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
        });
    });

    // Initialize range input displays
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        const valueDisplay = document.getElementById(`${input.id}Value`);
        if (valueDisplay) {
            // Set initial value
            updateRangeValue(input, valueDisplay);
            
            // Update on change
            input.addEventListener('input', () => {
                updateRangeValue(input, valueDisplay);
            });
        }
    });

    function updateRangeValue(input, display) {
        const value = input.value;
        
        // Format display based on input ID
        if (input.id === 'ttsRate') {
            display.textContent = `${value}x`;
        } else if (input.id === 'ttsPitch') {
            display.textContent = value < 0.8 ? 'Low' : value > 1.2 ? 'High' : 'Normal';
        } else if (input.id === 'ttsVolume') {
            display.textContent = `${Math.round(value * 100)}%`;
        } else if (input.id === 'confidenceThreshold') {
            display.textContent = `${Math.round(value * 100)}%`;
        } else if (input.id === 'detectionSensitivity') {
            display.textContent = `${Math.round(value * 100)}%`;
        } else if (input.id === 'inputTimeout') {
            display.textContent = `${value} second${value !== '1' ? 's' : ''}`;
        } else {
            display.textContent = value;
        }
    }

    // Show/hide custom elements row based on reading element selection
    const readingElementSelect = document.getElementById('readingElement');
    const customElementsRow = document.getElementById('customElementsRow');
    
    if (readingElementSelect && customElementsRow) {
        readingElementSelect.addEventListener('change', function() {
            customElementsRow.style.display = this.value === 'custom' ? 'block' : 'none';
            saveSettings();
        });
    }

    // Handle clear data button
    const clearDataBtn = document.getElementById('clearData');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
                // Clear extension storage
                chrome.storage.sync.clear(() => {
                    chrome.storage.local.clear(() => {
                        alert('All stored data has been cleared.');
                    });
                });
            }
        });
    }

    // Save settings when changed
    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('change', saveSettings);
        // For range inputs, also save on input event
        if (input.type === 'range') {
            input.addEventListener('input', saveSettings);
        }
    });

    // Load saved settings
    loadSettings();

    chrome.storage.sync.get('settings', function(data) {
        if (data.settings && data.settings.theme) {
            applyThemeToOptionsPage(data.settings.theme);
        } else {
            // Default to system theme
            applyThemeToOptionsPage('system');
        }
    });

    function saveSettings() {
        const settings = {};
        
        // Collect all input values
        document.querySelectorAll('input, select').forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox') {
                    settings[input.id] = input.checked;
                } else {
                    settings[input.id] = input.value;
                }
            }
        });

        const theme = document.getElementById('theme').value;
        settings.theme = theme;
        applyThemeToOptionsPage(theme);
        
        // Save to Chrome storage (both sync and local for redundancy)
        chrome.storage.sync.set({ settings: settings }, function() {
            console.log('Settings saved to sync storage');
            
            // Also save to local storage as backup
            chrome.storage.local.set({ settings: settings }, function() {
                console.log('Settings saved to local storage');
                
                // Dispatch an event that settings were updated
                chrome.runtime.sendMessage({ action: "settingsUpdated", settings: settings });
            });
        });
    }

    function applyThemeToOptionsPage(themeSetting) {
        const htmlElement = document.documentElement;
        
        if (themeSetting === 'system') {
            // Check system preference
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                htmlElement.setAttribute('data-theme', 'dark');
            } else {
                htmlElement.setAttribute('data-theme', 'light');
            }
        } else {
            // Apply the selected theme directly
            htmlElement.setAttribute('data-theme', themeSetting);
        }
    }

    function loadSettings() {
        chrome.storage.sync.get('settings', function(data) {
            if (data.settings) {
                applySettings(data.settings);
            } else {
                // If not in sync, try local storage
                chrome.storage.local.get('settings', function(localData) {
                    if (localData.settings) {
                        applySettings(localData.settings);
                    }
                });
            }
        });
    }

    function applySettings(settings) {
        // Apply saved settings to inputs
        Object.keys(settings).forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = settings[id];
                } else {
                    input.value = settings[id];
                }
                
                // Trigger change event for range inputs to update displays
                if (input.type === 'range') {
                    const event = new Event('input');
                    input.dispatchEvent(event);
                }
                
                // Handle special case for reading element select
                if (id === 'readingElement') {
                    const customElementsRow = document.getElementById('customElementsRow');
                    if (customElementsRow) {
                        customElementsRow.style.display = input.value === 'custom' ? 'block' : 'none';
                    }
                }
            }
        });
    }

        // Save settings function
    document.getElementById('saveSettings').addEventListener('click', function() {
        saveSettings();
            
            // Show a success message
            const toast = document.createElement('div');
            toast.className = 'position-fixed bottom-0 end-0 p-3';
            toast.style.zIndex = '5';
            toast.innerHTML = `
                <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="toast-header">
                        <strong class="me-auto">TEAN Mate</strong>
                        <small>Just now</small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                    <div class="toast-body">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        Settings saved successfully!
                    </div>
                </div>
            `;
            document.body.appendChild(toast);
            
            // Remove the toast after 3 seconds
            setTimeout(() => {
                toast.remove();
            }, 3000);
    });

    // Reset All Settings
    document.getElementById('resetAll').addEventListener('click', function() {
        if (confirm("Are you sure you want to reset all settings to their default values?")) {
            // Clear settings from storage
            chrome.storage.sync.remove('settings', function() {
                chrome.storage.local.remove('settings', function() {
                    // Reload the page to reset all form elements
                    location.reload();
                });
            });
        }
    });
});

// Reset shortcuts
document.getElementById('resetShortcuts').addEventListener('click', function() {
    if (confirm("Are you sure you want to reset all keyboard shortcuts to their default values?")) {
        // Reset shortcut specific settings
        console.log("Shortcuts have been reset to defaults");
    }
});

// Calibrate camera (mock functionality)
document.getElementById('calibrateCamera').addEventListener('click', function() {
    const button = this;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Calibrating...';
    
    // Simulate calibration process
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check me-2"></i>Calibration Complete';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-camera me-2"></i>Calibrate Camera';
        }, 2000);
    }, 3000);
});

// Edit shortcuts (mock functionality)
document.getElementById('editShortcuts').addEventListener('click', function() {
    // For demonstration, toggle "editing" class on first shortcut
    const firstShortcut = document.querySelector('.keyboard-shortcut');
    firstShortcut.classList.toggle('shortcut-editing');
    
    if (firstShortcut.classList.contains('shortcut-editing')) {
        firstShortcut.querySelector('.shortcut-keys').innerHTML = 
            '<span class="keyboard-key text-muted">Press new shortcut...</span>';
    } else {
        firstShortcut.querySelector('.shortcut-keys').innerHTML = 
            '<span class="keyboard-key">Alt</span> + <span class="keyboard-key">T</span>';
    }
});

// Initialize Bootstrap tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// Initialize the tabs
const triggerTabList = document.querySelectorAll('#settingsTabs button');
triggerTabList.forEach(triggerEl => {
    const tabTrigger = new bootstrap.Tab(triggerEl);
    triggerEl.addEventListener('click', event => {
        event.preventDefault();
        tabTrigger.show();
    });
});


function setupTextNavigation() {
    // Create instance of HighlightBox
    const highlightBox = new HighlightBox();

    // Get all meaningful elements
    const elements = [];
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode: function (node) {
                const tagName = node.tagName?.toLowerCase();
                if (["script", "style", "noscript"].includes(tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Exclude container-like elements that have children
                if (
                    node.textContent.trim().length > 0 &&
                    node.children.length === 0
                ) {
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_SKIP;
            }
        },
        false
    );

    // Collect elements
    while (walker.nextNode()) {
        elements.push(walker.currentNode);
    }

    // Current index
    let currentIndex = 0;
    let isAutoPlaying = true; // Default to auto-navigation
    
    function speak(text, rate = 1.0, callback = null) {
        if (!window.speechSynthesis) {
            alert("Speech Synthesis not supported in this browser.");
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = rate;

        // When speech ends, move to next element if auto-playing
        utterance.onend = function() {
            if (isAutoPlaying) {
                moveToNext();
            }
            if (callback) {
                callback();
            }
        };

        speechSynthesis.speak(utterance);
    }
    
    function moveToNext() {
        if (currentIndex < elements.length - 1) {
            highlightBox.removeHighlight(elements[currentIndex]);
    
            currentIndex++;
            processCurrent();
        } else {
            // End of page reached
            speak("End of page reached. Auto-navigation stopped.", 1.0, function() {
                isAutoPlaying = false;
            });
        }
    }

    function processCurrent() {
        if (currentIndex >= elements.length) {
            speak("End of page reached.");
            currentIndex = elements.length - 1; // Stay at last element
            isAutoPlaying = false; // Stop auto-navigation
            return;
        }

        const element = elements[currentIndex];
        
        // Highlight the current element
        // highlightBox.removeHighlight();
        highlightBox.addHighlight(element);

        const tagName = element.tagName.toLowerCase();
        let elemText = element.innerText || element.value || "Unnamed element";
        elemText = elemText.trim();

        if (
            tagName === 'button' ||
            (tagName === 'input' && ['button', 'submit'].includes(element.type)) ||
            (tagName === 'a' && element.href)
        ) {
            let label = `This is a ${tagName}`;
            if (tagName === 'a') label = 'This is a link';
            if (tagName === 'button') label = 'This is a button';
            if (tagName === 'input') label = `This is an input of type ${element.type}`;

            speak(`${label} that says: ${elemText}. Press Enter to click it.`);
        } else {
            speak(elemText);
        }
        //highlightBox.removeHighlight(element);
    }

    // Set up keyboard navigation
    document.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                isAutoPlaying = false; // Stop auto-navigation when manual control is used
                speechSynthesis.cancel();
                currentIndex = Math.min(currentIndex + 1, elements.length - 1);
                processCurrent();
                break;

            case 'ArrowLeft':
            case 'ArrowUp':
                isAutoPlaying = false; // Stop auto-navigation when manual control is used
                speechSynthesis.cancel();
                currentIndex = Math.max(currentIndex - 1, 0);
                processCurrent();
                break;

            case 'Enter':
                isAutoPlaying = false; // Stop auto-navigation when manual control is used
                const element = elements[currentIndex];
                const tagName = element.tagName.toLowerCase();
                if (
                    tagName === 'button' ||
                    (tagName === 'input' && ['button', 'submit'].includes(element.type)) ||
                    (tagName === 'a' && element.href)
                ) {
                    element.click();
                    speak("Clicked on element.");
                }
                break;

            case ' ':
                // Toggle auto-navigation
                e.preventDefault(); // Prevent scrolling
                isAutoPlaying = !isAutoPlaying;
                speak(isAutoPlaying ? "Auto-navigation resumed." : "Auto-navigation paused.", 1.0, function() {
                    if (isAutoPlaying) {
                        moveToNext();
                    }
                });
                break;
                
            case 'Escape':
                // Stop auto-navigation
                isAutoPlaying = false;
                speak("Auto-navigation stopped.");
                break;
        }
    });

    // Start with the first element
    processCurrent();
}

window.addEventListener("DOMContentLoaded", () => {
    setupTextNavigation();
});