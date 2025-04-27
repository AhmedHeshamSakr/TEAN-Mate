import LimitedWeakSet from "../TTS/LimitedWeakSet.js";
export default class TextExtractor {
    static processedElements = new LimitedWeakSet(20); // Tracks processed elements
    static textContainingTags = [
        "b", "strong", "i", "em", "u", "mark", "small", "sub", "sup", "s",
        "span", "abbr", "cite", "q", "code", "kbd", "var", "a", "time", "th", "td",
        "button", "input", "select", "textarea", "option", "label"
      ];
    constructor() {
        
    }

    static getElementState(element) {
        const role = element.getAttribute('role') || '';
        const tagName = element.tagName.toLowerCase();
        let stateText = '';

        switch(role.toLowerCase()) {
            case 'button':
                stateText = element.disabled || element.getAttribute('aria-disabled') === 'true' 
                    ? 'Disabled button: ' : 'Button: ';
                break;
                
            case 'checkbox':
                const checkedState = element.getAttribute('aria-checked');
                stateText = `Checkbox ${checkedState === 'mixed' ? 'partially checked' :
                            checkedState === 'true' ? 'checked' : 'unchecked'}`;
                if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
                    stateText += ' (disabled)';
                }
                break;
                
            case 'radio':
                const isChecked = element.getAttribute('aria-checked') === 'true';
                const labelIds = element.getAttribute('aria-labelledby')?.split(' ') || [];
                const labelText = labelIds.map(id => 
                    document.getElementById(id)?.textContent.trim()
                ).filter(Boolean).join(' ');
                stateText = `Radio button ${isChecked ? 'selected' : 'not selected'}. ${labelText ? `: ${labelText}` : ''}`;
                if (element.disabled || element.getAttribute('aria-disabled') === 'true') {
                    stateText += ' (disabled)';
                }
                break;
                
            case 'option':
                const isSelected = element.getAttribute('aria-selected') === 'true';
                stateText = isSelected ? 'Selected option: ' : 'Option: ';
                break;
                
            case 'combobox':
            case 'listbox':
                const expanded = element.getAttribute('aria-expanded') === 'true';
                stateText = `${role} ${expanded ? 'expanded' : 'collapsed'}`;
                break;
                
            default:
                switch (tagName) {
                    case 'button':
                        stateText = element.disabled ? 'Disabled button: ' : 'Button: ';
                        break;
                        
                    case 'input':
                        switch (element.type.toLowerCase()) {
                            case 'text':
                            case 'email':
                            case 'password':
                            case 'search':
                            case 'tel':
                            case 'url':
                                stateText = `${element.type} field`;
                                if (element.value) stateText += ` containing: ${element.value}`;
                                if (element.placeholder) stateText += ` placeholder: ${element.placeholder}`;
                                if (element.disabled) stateText += ' (disabled)';
                                if (element.readOnly) stateText += ' (read-only)';
                                break;
                                
                            case 'checkbox':
                                stateText = `Checkbox ${element.checked ? 'checked' : 'unchecked'}`;
                                if (element.disabled) stateText += ' (disabled)';
                                break;
                                
                            case 'radio':
                                stateText = `Radio button ${element.checked ? 'selected' : 'unselected'}`;
                                if (element.disabled) stateText += ' (disabled)';
                                break;
                                
                            case 'submit':
                                stateText = 'Submit button';
                                if (element.disabled) stateText += ' (disabled)';
                                break;
                        }
                        break;
                        
                    case 'select':
                        const selectedOptions = Array.from(element.selectedOptions)
                            .map(opt => opt.textContent)
                            .join(', ');
                        stateText = element.multiple ? 'Multiple select' : 'Dropdown';
                        if (selectedOptions) stateText += ` selected: ${selectedOptions}`;
                        if (element.disabled) stateText += ' (disabled)';
                        break;
                        
                    case 'textarea':
                        stateText = 'Text area';
                        if (element.value) stateText += ` containing: ${element.value}`;
                        if (element.placeholder) stateText += ` placeholder: ${element.placeholder}`;
                        if (element.disabled) stateText += ' (disabled)';
                        if (element.readOnly) stateText += ' (read-only)';
                        break;
                        
                    case 'option':
                        stateText = element.selected ? 'Selected option: ' : 'Option: ';
                        break;
                }
                break;
        }
        // Add additional ARIA states for all elements
        const ariaLabels = [];
        if (element.getAttribute('aria-busy') === 'true') ariaLabels.push('busy');
        if (element.getAttribute('aria-expanded')) ariaLabels.push(`expanded=${element.getAttribute('aria-expanded')}`);
        if (element.getAttribute('aria-haspopup')) ariaLabels.push(`has popup`);
        
        if (ariaLabels.length > 0) {
            stateText += ` (${ariaLabels.join(', ')})`;
        }

        return stateText;
    }

    /**
     * Extracts visible and meaningful text from a given node.
     * @param {Node} node - The DOM node to extract text from.
     * @returns {string} - Extracted text.
     */
    extractText(node) {
        // Skip non-visible elements
        if (!this.isElementVisible(node)) {
            return '';
        }

        // Skip non-relevant tags
        const tagName = node.tagName?.toLowerCase();

        // Avoid processing the same element multiple times
        if (TextExtractor.processedElements.has(node)) {
            return '';
        }
        TextExtractor.processedElements.add(node);

        let text = '';
        if (tagName === 'a' && node.href) {
            const domain = new URL(node.href).hostname.replace('www.', '');
            text += node.textContent.trim() ? `Link text: ${node.textContent.trim()}` : `Link to ${domain}`;
            TextExtractor.processAllDescendants(node);
        }
        else if (['button', 'input', 'select', 'textarea', 'option'].includes(tagName)) {
            const stateText = TextExtractor.getElementState(node);
            text += `${stateText}${node.textContent.trim()}`;
            TextExtractor.processAllDescendants(node);
        }
        else if (TextExtractor.textContainingTags.includes(tagName.toLowerCase())) {
            // text += node.textContent.trim();
            for (const child of node.childNodes) {
                // Only process element nodes and check for anchor tags
                if (child.nodeType === Node.ELEMENT_NODE) {  // Check if it's an element node
                    const noAnchorChildren = child.getElementsByTagName('a').length === 0;
                    if (child.tagName.toLowerCase() !== 'a' && 
                        noAnchorChildren) {
                        TextExtractor.processedElements.add(child);
                    }else {
                        return text;
                    }
                }
            }
            text += node.textContent.trim();
        }
        return text.trim();
    }

    /**
     * Checks if an element is visible in the DOM.
     * @param {Element} element - The element to check.
     * @returns {boolean} - True if the element is visible, false otherwise.
     */
    isElementVisible(element) {
        if (!(element instanceof HTMLElement)) return false;
        if (element.offsetHeight === 0 || element.offsetWidth === 0) {
            return false;
        }
        const style = window.getComputedStyle(element);
        const isNotHidden = style.visibility !== 'hidden' &&
                            style.display !== 'none' &&
                            style.opacity !== '0' &&
                            style.height !== '0px' &&
                            style.width !== '0px';
        return isNotHidden;
    }

    clearProcessedElements() {
        TextExtractor.processedElements = new LimitedWeakSet(20);
    }

    static processAllDescendants(element) {
        for (const child of element.children) {
            if (child.nodeType === Node.ELEMENT_NODE) {
                TextExtractor.processedElements.add(child);
                // Recursively process this child's children
                if (child.children.length > 0) {
                    TextExtractor.processAllDescendants(child);
                }
            }
        }
    }
}