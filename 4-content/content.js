import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";
import InteractionHandler from "../2-features/TTS/InteractionHandler.js";

class ContentHandler {
    constructor() {
        this.sections = [];
        this.pastBorderStyle = "";
        this.pastBackgroundStyle = "";

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();
        this.currentElement = null;
        this.currentLink = null;
        this.nextElementAfterListbox = null;
        this.walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    const tagName = node.tagName?.toLowerCase();
                    if (["script", "style", "noscript"].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

        this.wasSpeaking = false;
    }

    getNextElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.nextNode()) {
            const element = this.walker.currentNode;
            if(TextExtractor.processedElements.has(element)) continue;
            if (this.isElementVisible(element)) {
                const tagName = element.tagName?.toLowerCase();
                if (tagName === 'a' && element.href) {
                    const domain = new URL(element.href).hostname.replace('www.', '');
                    text.push(element.textContent.trim() ? `Link text: ${element.textContent.trim()}` : `Link to ${domain}`);
                    elementsToReturn.push(element);
                    this.currentLink = element;
                    TextExtractor.processAllDescendants(element);
                }
                else if (InteractionHandler.isInteractiveElement(element)) {
                    const stateText = TextExtractor.getElementState(element);
                    const isRadio = element.getAttribute('role') === 'radio' || element.type === 'radio';
                    const isCheckbox = element.getAttribute('role') === 'checkbox' || element.type === 'checkbox';
                    
                    // Generic radio/checkbox text discovery
                    if (isRadio || isCheckbox) {
                        console.log(`generic ${isRadio ? 'radio' : 'checkbox'} text discovery`);
                        const labelText = this.getInputLabelText(element);
                        text.push(`${stateText}. ${labelText}`);
                        elementsToReturn.push(element);
                        this.markInputLabelProcessed(element);
                    } else {
                        // Check if this is a container with a radio button or checkbox child
                        const radioOrCheckboxChild = element.querySelector('[role="radio"], [role="checkbox"], [type="radio"], [type="checkbox"]');
                        if (radioOrCheckboxChild && this.isElementVisible(radioOrCheckboxChild) &&
                            !TextExtractor.processedElements.has(radioOrCheckboxChild)) {
                            console.log('container with radio/checkbox child found');
                            const childStateText = TextExtractor.getElementState(radioOrCheckboxChild);
                            const childLabelText = this.getInputLabelText(radioOrCheckboxChild);
                            text.push(`${childStateText}. ${childLabelText}`);
                            elementsToReturn.push(radioOrCheckboxChild);
                            this.currentLink = radioOrCheckboxChild;
                            TextExtractor.processedElements.add(radioOrCheckboxChild);
                        } else {
                            console.log('non-radio/checkbox text discovery');
                            text.push(`${stateText}${element.textContent.trim()}`);
                            elementsToReturn.push(element);
                        }
                    }
                    TextExtractor.processAllDescendants(element);
                    this.currentLink = element;
                }
                else {
                    for (const child of element.childNodes) {
                        let textRes = '';
                        if (child.nodeType === Node.TEXT_NODE) {
                            textRes = child.textContent.trim();
                            if (textRes !== ''){
                                text.push(textRes);
                                elementsToReturn.push(element);
                            }
                        } else if (child.nodeType === Node.ELEMENT_NODE) {
                            textRes = this.textExtractor.extractText(child);
                            if (textRes !== ''){
                                text.push(textRes);
                                elementsToReturn.push(child);
                            }
                            if (InteractionHandler.isInteractiveElement(child)) {
                                this.currentLink = child;
                            } else this.currentLink = null;
                        }
                    }
                }
                TextExtractor.processedElements.add(element);
            }
            if (text.length > 0) {
                return { elementsToReturn, text };
            }
        }
        console.log('no more elements');
        return { elementsToReturn, text };
    }

    prevElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.previousNode()) {
            const element = this.walker.currentNode;
            if (this.isElementVisible(element)) {
                const tagName = element.tagName?.toLowerCase();
                for (const child of element.childNodes) {
                    let textRes = '';
                    if (child.nodeType === Node.TEXT_NODE) {
                        if(TextExtractor.processedElements.has(element)) continue;
                        textRes = child.textContent.trim();
                        if (textRes !== ''){
                            text.push(textRes);
                            elementsToReturn.push(element);
                        }
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        textRes = this.textExtractor.extractText(child);
                        if (textRes !== ''){
                            text.push(textRes);
                            elementsToReturn.push(child);
                        }
                        if (InteractionHandler.isInteractiveElement(child)) {
                            this.currentLink = child;
                        } else this.currentLink = null;
                    }
                }
            }
            if (text.length > 0) {
                return { elementsToReturn, text };
            }
        }
        return { elementsToReturn, text };
    }

    async speakCurrentSection() {
        if (!this.currentElement) {
            this.currentElement = this.getNextElement();
        }
        let { elementsToReturn, text } = this.currentElement;
        if (!this.currentElement || !elementsToReturn || elementsToReturn.length === 0) {
            this.currentElement = null;
            return;
        }

        for (let i = 0; i < elementsToReturn.length; i++) {
            // Wait for the previous speech/highlight to complete before starting the next
            await new Promise(async (resolve) => {
              try {
                // Add highlight first
                this.highlightBox.addHighlight(elementsToReturn[i]);
      
                // Wait for speech to complete
                await this.speechHandler.speak(text[i], ()=>{});
                this.highlightBox.removeHighlight(elementsToReturn[i]);
                
                resolve();
              } catch (error) {
                console.error('Error in sequence:', error);
                this.highlightBox.removeHighlight(elementsToReturn[i]);
                //resolve(); // Continue to next item even if there's an error
              }
            });
        }
        this.currentElement = null; // Prepare for the next element
        if (this.wasSpeaking) {
            await new Promise(resolve => setTimeout(resolve, 50));
            await this.speakCurrentSection(); // Add await
        }
    }

    // Modified label text extraction
    // Renamed from getRadioLabelText to handle both radio buttons and checkboxes
    getInputLabelText(element) {
        console.log('getInputLabelText called');
        if (element.hasAttribute('aria-labelledby')) {
            const ids = element.getAttribute('aria-labelledby').split(' ');
            const labelText = ids.map(id => {
                const labelEl = document.getElementById(id);
                if (labelEl) {
                    TextExtractor.processedElements.add(labelEl);
                    return labelEl.textContent.trim();
                }
                return null;
            }).filter(Boolean).join(' ');
            if (labelText) return labelText;
        }
        // 2. aria-label
        if (element.hasAttribute('aria-label')) {
            return element.getAttribute('aria-label').trim();
        }
        // 3. <label for="...">
        if (element.id) {
            const forLabel = document.querySelector(`label[for="${element.id}"]`);
            if (forLabel) {
                TextExtractor.processedElements.add(forLabel);
                return forLabel.textContent.trim();
            }
        }
        // 4. Closest wrapping <label>
        const wrappingLabel = element.closest('label');
        if (wrappingLabel) {
            TextExtractor.processedElements.add(wrappingLabel);
            return wrappingLabel.textContent.trim();
        }
        // 5. Fallback to value or empty
        const elementType = element.type || element.getAttribute('role');
        return element.value || `no ${elementType} label text found`;
    }
    
    // Renamed from markRadioLabelProcessed to handle both radio buttons and checkboxes
    markInputLabelProcessed(inputElement) {
        console.log('markInputLabelProcessed called');
        // Try ARIA-labelledby first
        if (inputElement.hasAttribute('aria-labelledby')) {
            const ids = inputElement.getAttribute('aria-labelledby').split(' ');
            ids.forEach(id => {
                const labelEl = document.getElementById(id);
                if (labelEl) TextExtractor.processedElements.add(labelEl);
            });
        }
        // Try closest label
        const label = inputElement.closest('label');
        if (label) {
            TextExtractor.processedElements.add(label);
        }
        // Try label[for]
        if (inputElement.id) {
            const forLabel = document.querySelector(`label[for="${inputElement.id}"]`);
            if (forLabel) TextExtractor.processedElements.add(forLabel);
        }
    }
    
    // Update findAssociatedLabel
    findAssociatedLabel(element) {
        const isInput = element.getAttribute('role') === 'radio' || 
                        element.type === 'radio' ||
                        element.getAttribute('role') === 'checkbox' || 
                        element.type === 'checkbox';
        if (!isInput) return null;
        
        // Check ARIA first
        if (element.hasAttribute('aria-labelledby')) {
            return document.getElementById(element.getAttribute('aria-labelledby'));
        }
        
        // Then check standard label associations
        return element.closest('label') || 
               document.querySelector(`label[for="${element.id}"]`);
    }

    handleMessage(request) {
        if (request.action === "extractText") {
            if (this.speechHandler.isSpeaking) return;
            this.currentElement = null;
            this.speakCurrentSection();
            this.wasSpeaking = true;
        } else if (request.action === "skipToNext") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.currentElement = null;
            this.speakCurrentSection();
        } else if (request.action === "skipToPrevious") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.textExtractor.clearProcessedElements();
            this.currentElement = this.prevElement();
            this.speakCurrentSection();
        } else if (request.action === "toggleReading") {
            if (this.speechHandler.isSpeaking) {
                this.speechHandler.stop();
                if (this.currentElement && this.currentElement.elementsToReturn) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.wasSpeaking = false;
            } else {
                this.speakCurrentSection();
                this.wasSpeaking = true;
            }
        } else if (request.action === "accessLink") {
            console.log('accessLink called on: ', this.currentLink);
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
                this.speechHandler.stop();
                
                // Check if the current link is a form element or a link
                if (this.currentLink) {
                    const tagName = this.currentLink.tagName?.toLowerCase();
                    if (tagName === 'a') {
                        this.linkHandler.accessLink(this.currentLink);
                    } else {
                        const role = this.currentLink.getAttribute('role');
                        const tagName = this.currentLink.tagName?.toLowerCase();
                        
                        // Save the next element before handling the dropdown
                        if (InteractionHandler.isCustomDropdown(this.currentLink)) {
                            this.saveNextElementAfterListbox(this.currentLink);
                        }
                        
                        // Always handle interaction regardless of element type
                        InteractionHandler.handleInteraction(this.currentLink);

                        if (role === 'option' || tagName === 'option') {
                            this.restoreNextElementAfterListbox();
                        }
                        
                        // Only check for custom dropdown if it's not a text field
                        if (InteractionHandler.isCustomDropdown(this.currentLink)) {
                            InteractionHandler.handleCustomDropdown(this.currentLink);
                        }
                    }
                }
            }
        } else if (request.action === "performSearch"){
            window.open(`https://www.google.com/search?q=${encodeURIComponent(request.query)}`, '_blank');
        } else if (request.action === "pauseTTS") {
            this.speechHandler.stop();
            if (this.currentElement && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
            }
            this.wasSpeaking = false;
        } else if (request.action === "resumeTTS") {
            if (this.wasSpeaking) {
                if (this.currentElement && this.currentElement.elementsToReturn) {
                    for (let el of this.currentElement.elementsToReturn) {
                        this.highlightBox.removeHighlight(el);
                    }
                }
                this.speakCurrentSection();
            }
        }
    }

    isElementVisible(element) {
        if (!(element instanceof HTMLElement)) return false;
        if (element.offsetHeight === 0 || element.offsetWidth === 0) {
            return false;
        }
        const style = window.getComputedStyle(element);
        const isNotHidden = style.visibility !== 'hidden' &&
                            style.display !== 'none' &&
                            style.opacity !== '0' &&
                            style.height !== '0px' &&
                            style.width !== '0px';
        const isInteractive = InteractionHandler.isInteractiveElement(element);
        return isNotHidden || isInteractive;
    }

    saveNextElementAfterListbox(listbox) {
        // Try to find a semantic container
        let container = listbox.closest('[role="listitem"], section, article, .question-block, .form-section');
        // Fallback: use parent or grandparent if no semantic container found
        if (!container) container = listbox.parentElement;
        if (!container) container = listbox;

        // Find the next sibling that is an element node
        let next = container.nextElementSibling;
        while (next && next.nodeType !== 1) {
            next = next.nextElementSibling;
        }
        if (next) {
            this.nextElementAfterListbox = next;
            console.log('Found next element after logical block:', next);
        }
    }

    restoreNextElementAfterListbox() {
        console.log('restoreNextElementAfterListbox: ', this.nextElementAfterListbox);
        if (this.nextElementAfterListbox) {
            // Clear the processed elements set to ensure we can process the next element
            this.textExtractor.clearProcessedElements();
            this.walker.currentNode = this.nextElementAfterListbox;
            this.nextElementAfterListbox = null;
        }
    }
}

// Instantiate the content handler
new ContentHandler();