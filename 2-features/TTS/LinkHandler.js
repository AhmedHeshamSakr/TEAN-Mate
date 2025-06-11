export default class LinkHandler {
    accessLink(element) {
        if (element && element.tagName?.toLowerCase() === "a") {
            const url = element.href;
            if (url) window.open(url);
        }
    }
}
