export default class InteractionHandler {
    static handleInteraction(element) {
        // First check if this is a complex input container
        const nestedInput = this.findNestedInput(element);
        if (nestedInput) {
            console.log('Found nested input, focusing on it');
            nestedInput.focus();
            return;
        }

        // Handle array return from findInteractiveElement
        const interactiveElements = this.findInteractiveElement(element) || [];
        const targets = Array.isArray(interactiveElements) ? interactiveElements : [interactiveElements];
        
        for (const target of targets) {
            if (target) {
                console.log('Found interactive element, interacting with it');
                target.click();
                return;
            }
        }

        const role = element.getAttribute('role');
        const tagName = element.tagName?.toLowerCase();
        
        if (role === 'option' || tagName === 'option') {
            this.handleOptionSelection(element);
            return;
        }

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

    static findInteractiveElement(element) {
        // If the element itself is interactive, return it
        if (element.getAttribute('role') === 'radio' || 
            element.getAttribute('role') === 'checkbox' ||
            element.getAttribute('role') === 'button') {
            return element;
        }

        // Handle radio button labels first
        if (element.tagName?.toLowerCase() === 'label') {
            const associatedInput = document.getElementById(element.getAttribute('for'));
            if (associatedInput?.type === 'radio') {
                console.log('Found radio button label');
                return associatedInput; // Return the actual radio button
            }
        }
        
        // Look for interactive elements that are direct children only
        const directChildren = Array.from(element.children);
        for (const child of directChildren) {
            if (child.tagName?.toLowerCase() === 'input' && 
                (child.type === 'radio' || child.type === 'checkbox')) {
                console.log('Found direct child input');
                return child;
            }
            
            if (child.getAttribute('role') === 'radio' || 
                child.getAttribute('role') === 'checkbox' || 
                child.getAttribute('role') === 'button') {
                console.log('Found direct child with role');
                return child;
            }
            
            if (child.tagName?.toLowerCase() === 'button') {
                console.log('Found direct child button');
                return child;
            }
        }
        
        // Check if this is a label with a for attribute
        if (element.tagName?.toLowerCase() === 'label' && element.hasAttribute('for')) {
            const forId = element.getAttribute('for');
            const associatedInput = document.getElementById(forId);
            if (associatedInput && 
                (associatedInput.type === 'radio' || associatedInput.type === 'checkbox')) {
                console.log('Found associated input through label');
                return [associatedInput, element];
            }
        }
        
        // Check parent containers (up to 2 levels only)
        let parent = element.parentElement;
        if (parent) {
            // Check if parent is a label
            if (parent.tagName?.toLowerCase() === 'label' && parent.hasAttribute('for')) {
                const forId = parent.getAttribute('for');
                const associatedInput = document.getElementById(forId);
                if (associatedInput && 
                    (associatedInput.type === 'radio' || associatedInput.type === 'checkbox')) {
                    console.log('Found associated input through parent label');
                    return associatedInput;
                }
            }
            
            // Check for siblings that might be the actual interactive element
            const siblings = Array.from(parent.children);
            for (const sibling of siblings) {
                if (sibling === element) continue; // Skip the current element
                
                if (sibling.tagName?.toLowerCase() === 'input' && 
                    (sibling.type === 'radio' || sibling.type === 'checkbox')) {
                    console.log('Found sibling input');
                    return sibling;
                }
            }

            // This handles cases where text is in a separate element from the radio button
            if (element.textContent.trim()) {
                // Look for radio buttons near this text element
                const radioNearby = this.findNearbyRadioButton(element);
                if (radioNearby) {
                    console.log('Found nearby radio button for text element');
                    return radioNearby;
                }

                // Look for checkboxes near this text element
                const checkboxNearby = this.findNearbyCheckbox(element);
                if (checkboxNearby) {
                    console.log('Found nearby checkbox for text element');
                    return checkboxNearby;
                }
            }
        }
        
        return null;
    }

    // NEW: Method to find radio buttons near text elements
    static findNearbyRadioButton(element) {
        // First check if we're inside a label container
        const labelContainer = element.closest('label');
        if (labelContainer) {
            // Look for radio input or element with role="radio" inside the label
            const radioInLabel = labelContainer.querySelector('input[type="radio"], [role="radio"]');
            if (radioInLabel) {
                return radioInLabel;
            }
        }
        
        // Check if we're in a common radio button pattern (like Google Forms)
        // Look for parent containers that might contain both the text and radio
        let container = element;
        for (let i = 0; i < 4 && container; i++) { // Check up to 4 levels up
            container = container.parentElement;
            if (!container) break;
            
            // Generic approach - look for any radio button in this container
            const radioInContainer = container.querySelector('input[type="radio"], [role="radio"]');
            if (radioInContainer) {
                return radioInContainer;
            }

            if (container.querySelector('[role="radio"]') || 
                container.closest('[role="radiogroup"]') ||
                container.getAttribute('aria-checked') !== null) {
                
                // Find the radio button element within this container
                const radioElement = container.querySelector('[role="radio"], input[type="radio"]');
                if (radioElement) {
                    return radioElement;
                }
                
                // If the container itself has radio-like attributes, it might be the radio button
                if (container.getAttribute('aria-checked') !== null || 
                    container.getAttribute('role') === 'radio') {
                    return container;
                }
            }
        }
        
        // If we're in a list item that might be part of a radio group
        const radioGroup = element.closest('[role="radiogroup"]');
        if (radioGroup) {
            // Find the closest list item or div that contains this element
            const listItem = element.closest('li, div');
            if (listItem) {
                // Look for a radio button in this list item
                const radioInListItem = listItem.querySelector('input[type="radio"], [role="radio"]');
                if (radioInListItem) {
                    return radioInListItem;
                }
                
                // If no explicit radio button, the list item itself might be acting as a radio
                if (listItem.getAttribute('aria-checked') !== null) {
                    return listItem;
                }
            }
        }

        // Check for common structural patterns in forms
        // Many forms place radio buttons and their labels in adjacent elements
        const parentElement = element.parentElement;
        if (parentElement) {
            // Check siblings for radio buttons
            const siblings = Array.from(parentElement.children);
            const elementIndex = siblings.indexOf(element);
            
            // Check adjacent siblings (both previous and next)
            if (elementIndex > 0) {
                const prevSibling = siblings[elementIndex - 1];
                if (prevSibling.tagName?.toLowerCase() === 'input' && prevSibling.type === 'radio') {
                    return prevSibling;
                }
                if (prevSibling.getAttribute('role') === 'radio') {
                    return prevSibling;
                }
            }
            
            if (elementIndex < siblings.length - 1) {
                const nextSibling = siblings[elementIndex + 1];
                if (nextSibling.tagName?.toLowerCase() === 'input' && nextSibling.type === 'radio') {
                    return nextSibling;
                }
                if (nextSibling.getAttribute('role') === 'radio') {
                    return nextSibling;
                }
            }
        }
        
        return null;
    }

    static findNearbyCheckbox(element) {
        // First check if we're inside a label container
        const labelContainer = element.closest('label');
        if (labelContainer) {
            // Look for checkbox input or element with role="checkbox" inside the label
            const checkboxInLabel = labelContainer.querySelector('input[type="checkbox"], [role="checkbox"]');
            if (checkboxInLabel) {
                return checkboxInLabel;
            }
        }
        
        // Check if we're in a common checkbox pattern (like Google Forms)
        // Look for parent containers that might contain both the text and checkbox
        let container = element;
        for (let i = 0; i < 4 && container; i++) { // Check up to 4 levels up
            container = container.parentElement;
            if (!container) break;
            
            // Generic approach - look for any checkbox in this container
            const checkboxInContainer = container.querySelector('input[type="checkbox"], [role="checkbox"]');
            if (checkboxInContainer) {
                return checkboxInContainer;
            }
    
            if (container.querySelector('[role="checkbox"]') || 
                container.getAttribute('aria-checked') !== null) {
                
                // Find the checkbox element within this container
                const checkboxElement = container.querySelector('[role="checkbox"], input[type="checkbox"]');
                if (checkboxElement) {
                    return checkboxElement;
                }
                
                // If the container itself has checkbox-like attributes, it might be the checkbox
                if (container.getAttribute('aria-checked') !== null || 
                    container.getAttribute('role') === 'checkbox') {
                    return container;
                }
            }
        }
        
        // If we're in a list item that might contain a checkbox
        const listItem = element.closest('li, div[role="listitem"]');
        if (listItem) {
            // Look for a checkbox in this list item
            const checkboxInListItem = listItem.querySelector('input[type="checkbox"], [role="checkbox"]');
            if (checkboxInListItem) {
                return checkboxInListItem;
            }
            
            // If no explicit checkbox, the list item itself might be acting as a checkbox
            if (listItem.getAttribute('aria-checked') !== null) {
                return listItem;
            }
        }
    
        // Check for common structural patterns in forms
        // Many forms place checkboxes and their labels in adjacent elements
        const parentElement = element.parentElement;
        if (parentElement) {
            // Check siblings for checkboxes
            const siblings = Array.from(parentElement.children);
            const elementIndex = siblings.indexOf(element);
            
            // Check adjacent siblings (both previous and next)
            if (elementIndex > 0) {
                const prevSibling = siblings[elementIndex - 1];
                if (prevSibling.tagName?.toLowerCase() === 'input' && prevSibling.type === 'checkbox') {
                    return prevSibling;
                }
                if (prevSibling.getAttribute('role') === 'checkbox') {
                    return prevSibling;
                }
            }
            
            if (elementIndex < siblings.length - 1) {
                const nextSibling = siblings[elementIndex + 1];
                if (nextSibling.tagName?.toLowerCase() === 'input' && nextSibling.type === 'checkbox') {
                    return nextSibling;
                }
                if (nextSibling.getAttribute('role') === 'checkbox') {
                    return nextSibling;
                }
            }
        }
        
        return null;
    }

    // New method to find nested input elements
    static findNestedInput(element) {
        // If it's already an input, return it
        if (element.tagName?.toLowerCase() === 'input') {
            return element;
        }
        
        // Check for common Google-style form containers
        if (element.hasAttribute('jscontroller')) {
            
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
            // Find the first interactive element within the dropdown that could be the trigger
            const triggerElement = dropdownContainer.querySelector('button, [role="button"], [tabindex="0"]') || dropdownContainer;
            
            // Trigger a sequence of events that most dropdowns expect
            const events = ['mousedown', 'mouseup', 'click'];
            events.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                triggerElement.dispatchEvent(event);
            });
            
            // Also try setting aria-expanded
            dropdownContainer.setAttribute('aria-expanded', 'true');
        }
    }

    static handleOptionSelection(element) {
        const container = element.closest('[role="listbox"]');
        if (!container) return;
    
        const options = container.querySelectorAll('[role="option"]');
        if (options.length === 0) return;
    
        let selectedIndex = -1;
        options.forEach((option, index) => {
            if (option === element || option.contains(element)) {
                selectedIndex = index;
            }
        });
    
        if (selectedIndex > -1) {
            options[selectedIndex].click();
            options[selectedIndex].setAttribute('aria-selected', 'true');
        }

        if (container) {
            container.setAttribute('aria-expanded', 'false');
        }
    }

    static isInteractiveElement(element) {
        if (!element || !element.tagName) return false;
        
        const tagName = element.tagName.toLowerCase();
        
        if (['body', 'main', 'article', 'section', 'div'].includes(tagName) && 
            element.children.length > 3) {
            // Only process large containers if they have specific interactive attributes
            if (!element.hasAttribute('role') && 
                !element.hasAttribute('tabindex') && 
                !element.hasAttribute('onclick')) {
                return false;
            }
        }

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

        const children = Array.from(element.children);
        if (children.length <= 3 && children.some(child => {
            const childTag = child.tagName?.toLowerCase();
            const childRole = child.getAttribute('role');
            return ['button', 'input', 'select'].includes(childTag) || 
                   (childRole && ['button', 'checkbox', 'radio'].includes(childRole));
        })) {
            return true;
        }
        
        // Check for tabindex only on elements that look like they might be interactive
        if (element.hasAttribute('tabindex') && 
            element.getAttribute('tabindex') !== '-1' && 
            (element.textContent.trim() || element.querySelector('img'))) {
            return true;
        }
        
        return false;
    }
}
