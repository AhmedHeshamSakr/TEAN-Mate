export default class InteractionHandler {
    static handleInteraction(element) {
        const tagName = element.tagName?.toLowerCase();
        
        switch (tagName) {
            case 'button':
                element.click();
                break;
                
            case 'input':
                if (['checkbox', 'radio'].includes(element.type)) {
                    element.click();
                } else {
                    element.focus();
                }
                break;
                
            case 'select':
                element.focus();
                break;
                
            case 'textarea':
                element.focus();
                break;
        }
    }
}
