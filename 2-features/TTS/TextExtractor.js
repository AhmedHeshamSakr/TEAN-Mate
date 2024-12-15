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

        let text = '';
        if (tagName === 'a' && node.href) {
            const domain = new URL(node.href).hostname.replace('www.', '');
            text += node.textContent.trim() ? `Link text: ${node.textContent.trim()}` : '';
        }
        else if (tagName === "em" || tagName === 'b') {
            this.processedElements.add(node);
            text += node.textContent.trim();
        }
        return text.trim();
    }
    extractTextFromElementNode(node) {
        const tagName = node.tagName?.toLowerCase();
        let text = '';
        this.processedElements.add(node);
        if (tagName === 'a' && node.href) {
            const domain = new URL(node.href).hostname.replace('www.', '');
            text = node.textContent.trim() ? `Link text: ${node.textContent.trim()}` : `Link destination: ${domain}`;
        }
        else if (tagName === "em" || tagName === 'b') {
            text = node.textContent.trim();
        }
        return text;
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
