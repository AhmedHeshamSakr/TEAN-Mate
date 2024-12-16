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
        let text = '';
        for (let child of node.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) {
                const trimmed = child.textContent.trim();
                if (trimmed) {
                    text += ' ' + trimmed;
                }
            }
        }

        // Special handling for links
        if (tagName === 'a' && node.href) {
            const domain = new URL(node.href).hostname.replace('www.', '');
            text = text.trim() ? `Link text: ${text.trim()}` : `Link destination: ${domain}`;
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