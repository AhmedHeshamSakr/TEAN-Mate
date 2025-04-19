export default class InteractionHandler {
    static handleInteraction(element) {
        // First check if this is a complex input container
        const nestedInput = this.findNestedInput(element);
        if (nestedInput) {
            console.log('Found nested input, focusing on it');
            nestedInput.focus();
            return;
        }

        const tagName = element.tagName?.toLowerCase();
        
        switch (tagName) {
            case 'button':
                element.click();
                console.log('Button clicked');
                break;
                
            case 'input':
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.click();
                    console.log(`Checkbox ${element.checked? 'checked': 'unchecked'}`);
                    // For radio buttons, we might want to trigger a change event
                    if (element.type === 'radio') {
                        const event = new Event('change', { bubbles: true });
                        element.dispatchEvent(event);
                        console.log('Radio button changed');
                    }
                } else if (element.type === 'text' || element.type === 'password' || element.type === 'email' || element.type === 'number') {
                    element.focus();
                    console.log('Input focused');
                    // You can add default text or placeholder if needed
                    // element.value = "Sample text";
                }
                break;
                
            case 'select':
                element.focus();
                // Open the dropdown
                const clickEvent = new MouseEvent('mousedown', { bubbles: true });
                element.dispatchEvent(clickEvent);
                console.log('Dropdown opened');
                break;
                
            case 'textarea':
                element.focus();
                console.log('Textarea focused');
                // You can add default text if needed
                // element.value = "Sample text";
                break;
                
            case 'option':
                // Handle selecting an option in a dropdown
                if (element.parentElement && element.parentElement.tagName.toLowerCase() === 'select') {
                    element.selected = true;
                    const changeEvent = new Event('change', { bubbles: true });
                    element.parentElement.dispatchEvent(changeEvent);
                    console.log('Dropdown option selected');
                }
                break;
        }
    }

    // New method to find nested input elements
    static findNestedInput(element) {
        // If it's already an input, return it
        if (element.tagName?.toLowerCase() === 'input') {
            return element;
        }
        
        // Check for common Google-style form containers
        if (element.classList.contains('rFrNMe') || 
            element.classList.contains('Xb9hP') ||
            element.hasAttribute('jscontroller')) {
            
            // Look for input inside
            const input = element.querySelector('input');
            if (input) {
                console.log('Found input in container');
                return input;
            }
        }
        
        // Check for any input within 3 levels deep
        const inputs = element.querySelectorAll('input');
        if (inputs.length > 0) {
            console.log('Found input through general search');
            return inputs[0]; // Return the first input found
        }
        
        return null;
    }

    static isCustomDropdown(element) {
        // Check if the element itself is a dropdown
        if (element.getAttribute('role') === 'listbox' || 
            element.getAttribute('aria-expanded') !== null) {
                console.log('element is listbox in custom');
                return true;
        }
        
        // Check if the element is part of a dropdown
        let parent = element.parentElement;
        for (let i = 0; i < 5 && parent; i++) { // Check up to 5 levels up
            console.log(`searching for parent in ${parent.className}`);
            if (parent.getAttribute('role') === 'listbox' || 
                parent.querySelector('[role="listbox"]') ||
                parent.getAttribute('aria-expanded') !== null ||
                parent.className.includes('dropdown') ||
                parent.getAttribute('jscontroller') !== null) { // Google-specific attribute
                console.log('parent is listbox in custom');
                return true;
            }
            parent = parent.parentElement;
        }
        
        return false;
    }
    
    static handleCustomDropdown(element) {
        // Find the actual dropdown container
        let dropdownContainer = element;
        let listbox = null;
        
        // If the element itself isn't the listbox, try to find it
        if (element.getAttribute('role') !== 'listbox') {
            // Look up the tree
            let parent = element;
            for (let i = 0; i < 5 && parent; i++) {
                if (parent.getAttribute('role') === 'listbox') {
                    listbox = parent;
                    break;
                }
                if (parent.querySelector('[role="listbox"]')) {
                    listbox = parent.querySelector('[role="listbox"]');
                    break;
                }
                parent = parent.parentElement;
            }
            
            // If we found a listbox, use it as our container
            if (listbox) {
                dropdownContainer = listbox;
                console.log('parent listbox found in handle');
            } else {
                console.log('listbox not found');
                return;
            }
        } else {
            listbox = element;
            console.log('element is listbox in handle');
        }
        
        // First, try to open the dropdown
        if (dropdownContainer.getAttribute('aria-expanded') === 'false') {
            dropdownContainer.click();
            // Also try setting aria-expanded
            dropdownContainer.setAttribute('aria-expanded', 'true');
        }
        
        // Use a one-time timeout to prevent recursion issues
        const timeoutId = setTimeout(() => {
            // Clear the timeout to prevent memory leaks
            clearTimeout(timeoutId);
            
            try {
                // Find all options
                const options = dropdownContainer.querySelectorAll('[role="option"]');
                if (options.length > 0) {
                    // Find the first non-empty option that isn't "Choose"
                    for (const option of options) {
                        const text = option.textContent.trim();
                        if (text && text !== 'Choose') {
                            // Click the option
                            option.click();
                            return;
                        }
                    }
                    
                    // If we didn't find a good option, just click the first one
                    if (options.length > 1) {
                        options[1].click(); // Skip the first one which might be "Choose"
                    } else {
                        options[0].click();
                    }
                }
            } catch (error) {
                console.error('Error handling custom dropdown:', error);
            }
        }, 300); // Wait 300ms for the dropdown to open
    }

    static isInteractiveElement(element) {
        if (!element || !element.tagName) return false;
        
        const tagName = element.tagName.toLowerCase();
        
        // Basic interactive elements
        if (['button', 'input', 'select', 'textarea', 'option', 'a'].includes(tagName)) {
            return true;
        }
        
        // Elements with interactive roles
        const role = element.getAttribute('role');
        if (role && ['button', 'link', 'checkbox', 'radio', 'menuitem', 'option', 
                     'tab', 'combobox', 'listbox', 'switch'].includes(role)) {
            return true;
        }
        
        // Elements with click handlers or keyboard listeners
        if (element.hasAttribute('onclick') || 
            element.hasAttribute('onkeydown') || 
            element.hasAttribute('onkeypress')) {
            return true;
        }
        
        // Elements that look like custom dropdowns
        if (element.getAttribute('aria-expanded') !== null || 
            element.getAttribute('aria-controls') !== null) {
            return true;
        }
        
        return false;
    }
}
