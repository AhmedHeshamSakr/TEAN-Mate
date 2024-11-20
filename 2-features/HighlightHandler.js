export default class HighlightHandler {
    constructor() {
        this.highlightBox = null;
    }

    createHighlightBox() {
        if (!this.highlightBox) {
            this.highlightBox = document.createElement("div");
            this.highlightBox.style.position = "absolute";
            this.highlightBox.style.border = "2px solid #A33";
            this.highlightBox.style.backgroundColor = "rgba(255, 0, 0, 0.03)";
            this.highlightBox.style.pointerEvents = "none";
            this.highlightBox.style.zIndex = "9999";
            this.highlightBox.style.borderRadius = "5px";
            document.body.appendChild(this.highlightBox);
        }
    }

    highlightElement(section) {
        this.createHighlightBox();
        const rect = section.element.getBoundingClientRect();

        this.highlightBox.style.top = `${rect.top + window.scrollY}px`;
        this.highlightBox.style.left = `${rect.left + window.scrollX}px`;
        this.highlightBox.style.width = `${rect.width}px`;
        this.highlightBox.style.height = `${rect.height}px`;

        section.element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    removeHighlightBox() {
        if (this.highlightBox) {
            this.highlightBox.remove();
            this.highlightBox = null;
        }
    }
}