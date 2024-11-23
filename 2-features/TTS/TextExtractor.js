export default class TextExtractor {
    extractAllTextWithTags(node) {
        let textSections = [];
        let elementSections = [];

        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text && node.parentNode.offsetParent !== null) {
                textSections.push(text);
                elementSections.push(node.parentNode);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (tagName === "style" || tagName === "script") return { textSections, elementSections };

            if (tagName === "a" && node.href) {
                const text = Array.from(node.childNodes)
                    .filter(child => child.nodeType === Node.TEXT_NODE)
                    .map(child => child.textContent.trim())
                    .join("");
                const domain = new URL(node.href).hostname.replace("www.", "");
                textSections.push(text ? `Link text: ${text}` : `Link destination: ${domain}`);
                elementSections.push(node);
            }

            for (let child of node.childNodes) {
                const { textSections: childTexts, elementSections: childElements } = this.extractAllTextWithTags(child);
                textSections = textSections.concat(childTexts);
                elementSections = elementSections.concat(childElements);
            }
        }

        return { textSections, elementSections };
    }
}
