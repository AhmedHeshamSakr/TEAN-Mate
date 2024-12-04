export default class TextExtractor {
    constructor() {
        this.processedElements = new WeakSet(); // Tracks processed elements
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
        if (["script", "style", "noscript"].includes(tagName)) {
            return '';
        }

        // Avoid processing the same element multiple times
        if (this.processedElements.has(node)) {
            return '';
        }
        this.processedElements.add(node);

        // Extract text from text nodes
        let text = ''; // Initialize text
        for (const child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                text += child.textContent.trim() + ' ';
                if (child.nextSibling && child.nextSibling.nodeType === Node.ELEMENT_NODE) {
                    //this.extractText(child);
                    break;
            } else if (child.nodeType === Node.ELEMENT_NODE) {

            }
            // Recursively process child nodes to handle nested structures
            text += this.extractText(child);
        
        }}
        //Special handling for links
        if (tagName === 'a' && node.href) {
            const domain = new URL(node.href).hostname.replace('www.', '');
            text = text.trim() ? `Link text: ${text.trim()}` : `Link destination: ${domain}`;
            if (node.nextSibling && node.nextSibling.nodeType === Node.TEXT_NODE) {
                const nextText = node.nextSibling.textContent.trim();
                if (nextText) {
                    text += nextText + ' ';
                }
        }
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
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none'
        );
    }

    clearProcessedElements() {
        this.processedElements = new WeakSet();
    }
}
