export default class TextExtractor {
    static extractAllTextWithTags(node) {
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
                const text = node.textContent.trim();
                const domain = new URL(node.href).hostname.replace("www.", "");
                if (text) {
                    textSections.push(`Link text: ${text}. Link Destination: ${domain}`);
                    elementSections.push(node);
                } else {
                    textSections.push(`Link destination: ${domain}`);
                    elementSections.push(node);
                }
            }

            for (let child of node.childNodes) {
                const { textSections: childTexts, elementSections: childElements } = TextExtractor.extractAllTextWithTags(child);
                textSections = textSections.concat(childTexts);
                elementSections = elementSections.concat(childElements);
            }
        }

        return { textSections, elementSections };
    }
}