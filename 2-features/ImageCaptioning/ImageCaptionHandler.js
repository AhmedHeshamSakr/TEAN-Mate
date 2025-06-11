import { ImageProcessor } from "./ImageProcessor.js";
// Import audio files
import processingAudio from '../TTS/messages/lol.wav';
import loadingBeepAudio from '../TTS/messages/Loading.wav';

class ImageCaptionHandler {
    constructor(modelBasePath = null) {
        // Keep existing properties
        this.imageProcessor = null;
        this.isActive = false;
        this.captionType = '<MORE_DETAILED_CAPTION>';
        this.processingQueue = [];
        this.isProcessing = false;
        this.MAX_CONCURRENT = 1;
        this.modelBasePath = modelBasePath || chrome.runtime.getURL('Florence-2-base-ft');
        
        // Add new properties for audio
        this.processingSound = new Audio(processingAudio);
        this.loadingBeepSound = new Audio(loadingBeepAudio);
        this.loadingBeepSound.loop = true; // Make the beep loop continuously
        this.currentOverlay = null;
    }

    // Create an overlay for the image
    createLoadingOverlay(imgElement) {
        // First remove any existing overlay
        if (this.currentOverlay) {
            this.removeLoadingOverlay();
        }
        
        // Create a wrapper div
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        wrapper.className = 'image-caption-wrapper';
        
        // Create the overlay div
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            color: white;
            font-weight: bold;
        `;
        
        // Create spinner
        const spinner = document.createElement('div');
        spinner.className = 'caption-spinner';
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 4px solid #ffffff;
            animation: spin 1s linear infinite;
        `;
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
        // Add "Processing Image" text
        const text = document.createElement('div');
        text.textContent = 'Processing Image...';
        text.style.marginTop = '10px';
        
        // Add elements to overlay
        overlay.appendChild(spinner);
        overlay.appendChild(text);
        
        // Save original position and parent
        const originalParent = imgElement.parentNode;
        const nextSibling = imgElement.nextSibling;
        const originalPos = {parent: originalParent, nextSibling: nextSibling};
        
        // Create wrapper structure
        wrapper.appendChild(imgElement.cloneNode(true));
        wrapper.appendChild(overlay);
        
        // Replace original image with wrapper
        originalParent.replaceChild(wrapper, imgElement);
        
        // Store references for later removal
        this.currentOverlay = {wrapper, originalImg: imgElement, originalPos};
        
        return wrapper;
    }
    
    // Remove the overlay and restore original image
    removeLoadingOverlay() {
        if (!this.currentOverlay) return;
        
        const {wrapper, originalImg, originalPos} = this.currentOverlay;
        
        if (originalPos.nextSibling) {
            originalPos.parent.insertBefore(originalImg, originalPos.nextSibling);
        } else {
            originalPos.parent.appendChild(originalImg);
        }
        
        if (wrapper.parentNode) {
            wrapper.parentNode.removeChild(wrapper);
        }
        
        this.currentOverlay = null;
    }

   // In ImageCaptionHandler.js - consolidate the generateCaptionForImage methods

async generateCaptionForImage(imageUrl, imgElement = null) {
    if (!this.isActive) {
        console.warn('Caption handler is not active. Please activate it first.');
        return "Caption handler not active";
    }
    
    // Play the "processing image" audio
    this.processingSound.play().catch(err => console.error('Error playing processing audio:', err));
    
    // Create overlay if image element is provided
    if (imgElement && imgElement instanceof HTMLImageElement) {
        this.createLoadingOverlay(imgElement);
        
        // Start the loading beep sound after a short delay
        setTimeout(() => {
            this.loadingBeepSound.play().catch(err => console.error('Error playing beep audio:', err));
        }, 1000); // Start beeping after the announcement finishes
    }
    
    console.log('⏳ Starting caption generation for:', imageUrl);
    return new Promise((resolve) => {
        // Add to queue and process
        this.processingQueue.push({ 
            imageUrl,
            imgElement,
            resolve: (caption) => {
                // Stop the loading sound
                this.loadingBeepSound.pause();
                this.loadingBeepSound.currentTime = 0;
                
                // Remove overlay if it exists
                this.removeLoadingOverlay();
                
                console.log('✅ Caption generated for:', imageUrl, '->', caption);
                resolve(caption);
            }
        });
        this.processQueue();
    });
}
    
    async processQueue() {
        console.log('[QUEUE] Processing queue, items:', this.processingQueue.length);
        if (this.isProcessing || !this.processingQueue.length) return;
        
        this.isProcessing = true;
        const { imageUrl, imgElement, resolve } = this.processingQueue.shift();
        
        console.log('[QUEUE] Processing image:', imageUrl);
        
        try {
            const captionResult = await this.imageProcessor.generateCaptionFromUrl(
                imageUrl,
                this.captionType
            );
            const caption = this.extractCaptionText(captionResult);
            console.log('[QUEUE] Success:', caption);
            resolve(caption);
        } catch (error) {
            console.error('[QUEUE] Failed:', error);
            resolve("Caption error: " + error.message);
        } finally {
            this.isProcessing = false;
            this.processQueue();
        }
    }

    // Update deactivate to clean queue and stop sounds
    async deactivate() {
        this.isActive = false;
        this.processingQueue = [];
        
        // Stop any playing sounds
        this.processingSound.pause();
        this.processingSound.currentTime = 0;
        this.loadingBeepSound.pause();
        this.loadingBeepSound.currentTime = 0;
        
        // Remove any active overlays
        this.removeLoadingOverlay();
        
        // Release the reference to the image processor
        this.imageProcessor = null;
        
        console.log("Image captioning deactivated");
    }
    
    setCaptionType(type) {
        if (['<CAPTION>', '<DETAILED_CAPTION>', '<MORE_DETAILED_CAPTION>'].includes(type)) {
            this.captionType = type;
            console.log(`Caption type set to: ${this.captionType}`);
        } else {
            console.error(`Invalid caption type: ${type}`);
        }
    }

    // async generateCaptionForImage(imageUrl) {
    //     if (!this.isActive) {
    //         console.warn('Caption handler is not active. Please activate it first.');
    //         return "Caption handler not active";
    //     }
        
    //     console.log('⏳ Starting caption generation for:', imageUrl);
    //     return new Promise((resolve) => {
    //         // Add to queue and process
    //         this.processingQueue.push({ 
    //             imageUrl, 
    //             resolve: (caption) => {
    //                 console.log('✅ Caption generated for:', imageUrl, '->', caption);
    //                 resolve(caption);
    //             }
    //         });
    //         this.processQueue();
    //     });
    // }
    
    // async processQueue() {
    //     console.log('[QUEUE] Processing queue, items:', this.processingQueue.length);
    //     if (this.isProcessing || !this.processingQueue.length) return;
        
    //     this.isProcessing = true;
    //     const { imageUrl, resolve } = this.processingQueue.shift();
        
    //     console.log('[QUEUE] Processing image:', imageUrl);
        
    //     try {
    //         const captionResult = await this.imageProcessor.generateCaptionFromUrl(
    //             imageUrl,
    //             this.captionType
    //         );
    //         const caption = this.extractCaptionText(captionResult);
    //         console.log('[QUEUE] Success:', caption);
    //         resolve(caption);
    //     } catch (error) {
    //         console.error('[QUEUE] Failed:', error);
    //         resolve("Caption error: " + error.message);
    //     } finally {
    //         this.isProcessing = false;
    //         this.processQueue();
    //     }
    // }
    
    async initialize() {
        try {
            // Initialize the image processor with the model base path
            this.imageProcessor = new ImageProcessor(this.modelBasePath);
            // Log the path to help with debugging
            console.log('Model base path:', this.modelBasePath);
            const initialized = await this.imageProcessor.initialize();
            if (!initialized) {
                console.error("Failed to initialize image processor");
                return false;
            }
            
            return true;
        } catch (error) {
            console.error("Error initializing image caption handler:", error);
            return false;
        }
    }
    async toggle() {
        if (this.isActive) {
            await this.deactivate();
        } else {
            await this.activate();
        }
        return this.isActive; // Return after awaiting activation/deactivation
    }
    
    async activate() {
        console.log('[CAPTION] Starting activation...');
        try {
            if (!this.imageProcessor) {
                console.log('[CAPTION] Initializing processor...');
                const initialized = await this.initialize();
                if (!initialized) throw new Error('Processor init failed');
            }
            this.isActive = true;
            console.log('[CAPTION] Activation complete - Ready');
            return true;
        } catch (error) {
            console.error('[CAPTION] Activation failed:', error);
            this.isActive = false;
            return false;
        }
    }
 
    /**
     * Extracts the actual caption text from the Florence-2 model response
     * which has the format: { '<MORE_DETAILED_CAPTION>': 'The actual caption text' }
     */
    extractCaptionText(captionResult) {
        // Handle null or undefined result
        if (!captionResult) {
            return "No caption available";
        }
        
        // If it's already a string, return it directly
        if (typeof captionResult === 'string') {
            return captionResult;
        }
        
        // Check for all possible task identifiers
        const possibleTasks = [
            '<MORE_DETAILED_CAPTION>', 
            '<DETAILED_CAPTION>', 
            '<CAPTION>'
        ];
        
        for (const task of possibleTasks) {
            if (captionResult[task]) {
                return captionResult[task];
            }
        }
        
        // If the specific format isn't found, try to extract any string value
        const values = Object.values(captionResult);
        if (values.length > 0 && typeof values[0] === 'string') {
            return values[0];
        }
        
        // Last resort: convert the object to a string
        return JSON.stringify(captionResult);
    }
}

export default ImageCaptionHandler;