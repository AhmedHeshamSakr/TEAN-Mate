export default class LinkHandler {
    accessLink(element) {
        if (element.tagName.toLowerCase() === "a") {
            const url = element.href;
            if (url) window.open(url);
        }
    }
}
