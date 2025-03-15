import { ImageProcessor } from "./ImageProcessor.js";

class ImageCaptionHandler {
    constructor(modelBasePath = null) {
        // Keep only essential properties
        this.imageProcessor = null;
        this.isActive = false;
        this.captionType = '<MORE_DETAILED_CAPTION>';
        this.processingQueue = [];
        this.isProcessing = false;
        this.MAX_CONCURRENT = 1;
        this.modelBasePath = modelBasePath || chrome.runtime.getURL('Florence-2-base-ft');
        
    }

    // Update deactivate to clean queue
    async deactivate() {
        this.isActive = false;
        this.processingQueue = [];
        
        // Release the reference to the image processor
        // Note: Current ImageProcessor doesn't have cleanup method
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

    async generateCaptionForImage(imageUrl) {
        if (!this.isActive) {
            console.warn('Caption handler is not active. Please activate it first.');
            return "Caption handler not active";
        }
        
        console.log('⏳ Starting caption generation for:', imageUrl);
        return new Promise((resolve) => {
            // Add to queue and process
            this.processingQueue.push({ 
                imageUrl, 
                resolve: (caption) => {
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
        const { imageUrl, resolve } = this.processingQueue.shift();
        
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