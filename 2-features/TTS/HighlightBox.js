export default class HighlightBox {
    constructor() {
        this.highlightBox = null;
    }

    create() {
        if (!this.highlightBox) {
            this.highlightBox = document.createElement("div");
            Object.assign(this.highlightBox.style, {
                position: "absolute",
                border: "2px solid #A33",
                backgroundColor: "rgba(255, 0, 0, 0.03)",
                pointerEvents: "none",
                zIndex: "9999",
                borderRadius: "5px",
            });
            document.body.appendChild(this.highlightBox);
        }
    }

    highlight(section) {
        this.create();
        const rect = section.element.getBoundingClientRect();
        Object.assign(this.highlightBox.style, {
            top: `${rect.top + window.scrollY}px`,
            left: `${rect.left + window.scrollX}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
        });
        section.element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    remove() {
        if (this.highlightBox) {
            this.highlightBox.remove();
            this.highlightBox = null;
        }
    }
}
