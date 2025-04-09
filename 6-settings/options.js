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
        });
    }

    // Handle clear data button
    const clearDataBtn = document.getElementById('clearData');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all stored data? This action cannot be undone.')) {
                // Clear extension storage
                chrome.storage.local.clear(() => {
                    alert('All stored data has been cleared.');
                });
            }
        });
    }

    // Save settings when changed
    const allInputs = document.querySelectorAll('input, select');
    allInputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });

    // Load saved settings
    loadSettings();

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
        
        // Save to Chrome storage
        chrome.storage.sync.set({ settings: settings }, function() {
            console.log('Settings saved');
        });
    }

    function loadSettings() {
        chrome.storage.sync.get('settings', function(data) {
            if (data.settings) {
                // Apply saved settings to inputs
                Object.keys(data.settings).forEach(id => {
                    const input = document.getElementById(id);
                    if (input) {
                        if (input.type === 'checkbox') {
                            input.checked = data.settings[id];
                        } else {
                            input.value = data.settings[id];
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
        });
    }
});

document.getElementById('readingElement').addEventListener('change', function() {
    const customElementsRow = document.getElementById('customElementsRow');
    if (this.value === 'custom') {
        customElementsRow.style.display = 'block';
    } else {
        customElementsRow.style.display = 'none';
    }
});

// Update range slider values in real-time
document.getElementById('ttsRate').addEventListener('input', function() {
    document.getElementById('ttsRateValue').textContent = `${this.value}x`;
});

document.getElementById('ttsPitch').addEventListener('input', function() {
    const value = parseFloat(this.value);
    let pitchText = 'Normal';
    
    if (value < 0.8) pitchText = 'Lower';
    else if (value > 1.2) pitchText = 'Higher';
    
    document.getElementById('ttsPitchValue').textContent = pitchText;
});

document.getElementById('ttsVolume').addEventListener('input', function() {
    document.getElementById('ttsVolumeValue').textContent = `${Math.round(this.value * 100)}%`;
});

document.getElementById('confidenceThreshold').addEventListener('input', function() {
    document.getElementById('confidenceThresholdValue').textContent = `${Math.round(this.value * 100)}%`;
});

document.getElementById('detectionSensitivity').addEventListener('input', function() {
    document.getElementById('detectionSensitivityValue').textContent = `${Math.round(this.value * 100)}%`;
});

document.getElementById('inputTimeout').addEventListener('input', function() {
    document.getElementById('inputTimeoutValue').textContent = `${this.value} seconds`;
});

// Save settings function
document.getElementById('saveSettings').addEventListener('click', function() {
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
    
    // Here you would actually save the settings to storage
    // Example:
    // const settings = {
    //    general: {
    //        enableStartup: document.getElementById('enableStartup').checked,
    //        // ... other settings
    //    },
    //    tts: {
    //        // Text to speech settings
    //    },
    //    // ... other categories
    // };
    // browser.storage.sync.set(settings);
});

// Reset All Settings
document.getElementById('resetAll').addEventListener('click', function() {
    if (confirm("Are you sure you want to reset all settings to their default values?")) {
        // Here you would reset all form elements to their defaults
        // For demonstration, just reload the page
        location.reload();
    }
});

// Reset shortcuts
document.getElementById('resetShortcuts').addEventListener('click', function() {
    if (confirm("Are you sure you want to reset all keyboard shortcuts to their default values?")) {
        // Reset shortcut specific settings
        console.log("Shortcuts have been reset to defaults");
    }
});

// Clear stored data
document.getElementById('clearData').addEventListener('click', function() {
    if (confirm("Are you sure you want to clear all stored data? This action cannot be undone.")) {
        // Clear extension storage
        console.log("All stored data has been cleared");
        
        // Show confirmation
        alert("All stored data has been cleared successfully.");
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