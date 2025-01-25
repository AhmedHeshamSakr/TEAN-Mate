export default class HighlightBox {
    addHighlight(element) {
        this.pastBackgroundStyle = element.style.background;
        this.pastBorderStyle = element.style.border;
        Object.assign(element.style, {
            border: "2px solid #A33",
            background: "rgba(255, 0, 0, 0.2)",
            borderRadius: "5px"
        });
        element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    removeHighlight(element) {
        if (element) {
            Object.assign(element.style, {
                border: this.pastBackgroundStyle,
                background: this.pastBorderStyle,
                borderRadius: ""
            });
        }
    }
}