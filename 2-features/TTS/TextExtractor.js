import LimitedWeakSet from "../TTS/LimitedWeakSet.js";
export default class TextExtractor {
    static processedElements = new LimitedWeakSet(50); // Tracks processed elements
    static textContainingTags = [
        "b", "strong", "i", "em", "u", "mark", "small", "sub", "sup", "s",
        "span", "abbr", "cite", "q", "code", "kbd", "var", "a", "time", "th", "td"
      ];
    constructor() {
        
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
        TextExtractor.processedElements = new LimitedWeakSet(50);
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