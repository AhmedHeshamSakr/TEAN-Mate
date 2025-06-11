import '/2-features/ImageCaptioning/early-config.js';
import { Florence2ForConditionalGeneration, AutoProcessor, AutoTokenizer , RawImage} from '@huggingface/transformers';
/**
 * Class responsible for handling image processing and caption generation
 * using the Florence-2 model.
 */
export class ImageProcessor {
  constructor(modelBasePath) {
    // Store the base path for the model files
    this.modelBasePath = modelBasePath || 'Florence-2-base-ft';
     
    // Initialize properties that will hold the loaded models
    this.model = null;
    this.processor = null;
    this.tokenizer = null;
    
    // Set default parameters
    this.maxNewTokens = 100;
  }
  async initialize() {
    try {
      if (typeof transformers !== 'undefined' && transformers.env) {
        transformers.env.allowLocalModels = true;
      }
      const testUrl = chrome.runtime.getURL('Florence-2-base-ft/config.json');
      console.log('Trying to access:', testUrl);
      const response = await fetch(testUrl);
      console.log('Config exists:', response.ok);
      // Load the Florence-2 model with optimized settings for memory efficiency
      this.model = await Florence2ForConditionalGeneration.from_pretrained(this.modelBasePath, {
        dtype: 'bnb4',
        local_files_only: true
      });
      // Load the processor that handles image inputs
      this.processor = await AutoProcessor.from_pretrained(this.modelBasePath, {
        local_files_only: true
      });
      // Load the tokenizer for handling text inputs and outputs
      this.tokenizer = await AutoTokenizer.from_pretrained(this.modelBasePath, {
        local_files_only: true
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize models:', error);
      return false;
    }
  }

  async generateCaptionFromUrl(imageUrl, task = '<MORE_DETAILED_CAPTION>') {
    if (!this.model || !this.processor || !this.tokenizer) {
      throw new Error('Models not initialized. Call initialize() first.');
    }
    try {
      // Load the image from the URL
      const image = await RawImage.fromURL(imageUrl);
      // Process the image for the model
      const visionInputs = await this.processor(image);
      // Prepare text inputs with the specified task
      const prompts = this.processor.construct_prompts(task);
      const textInputs = this.tokenizer(prompts);
      // Generate text based on the image and prompt
      const generatedIds = await this.model.generate({
        ...textInputs,
        ...visionInputs,
        max_new_tokens: this.maxNewTokens,
      });
      // Decode and post-process the generated text
      const generatedText = this.tokenizer.batch_decode(generatedIds, { skip_special_tokens: false })[0];
      return this.processor.post_process_generation(generatedText, task, image.size);
    } catch (error) {
      console.error('Error generating caption:', error);
      throw error;
    }
  }

  extractMissingAltTextImages(document) {
    // Check if running in a browser environment
    if (typeof document === 'undefined') {
      throw new Error('Document object is required. This function must run in a browser environment.');
    }

    // Query all images on the page
    const allImages = document.querySelectorAll('img');
    
    // Filter images that are missing alt text or have empty alt text
    const missingAltTextImages = Array.from(allImages).filter(img => {
      // Check if alt attribute is missing or empty
      return !img.hasAttribute('alt') || img.getAttribute('alt').trim() === '';
    });

    return missingAltTextImages;
  }

  /**
   * Detects all images on a webpage and returns them with metadata.
   * @param {Document} document - The DOM document object
   * @returns {Array<Object>} - Array of image objects with metadata
   */
  detectAllImagesOnPage(document) {
    // Check if running in a browser environment
    if (typeof document === 'undefined') {
      throw new Error('Document object is required. This function must run in a browser environment.');
    }
    // Query all images on the page
    const allImages = document.querySelectorAll('img');
    // Map each image to an object containing its metadata
    return Array.from(allImages).map(img => {
      return {
        element: img,
        src: img.src,
        alt: img.alt || null,
        width: img.width,
        height: img.height,
        hasAltText: img.hasAttribute('alt') && img.getAttribute('alt').trim() !== '',
        isVisible: img.getBoundingClientRect().height > 0 && img.getBoundingClientRect().width > 0,
        position: img.getBoundingClientRect()
      };
    });
  }

 
}

// const processor = new ImageProcessor();
// console.log("Memory used:", (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), "MB");

// await processor.initialize();
// const caption = await processor.generateCaptionFromUrl('https://cats.com/wp-content/uploads/2023/10/how-the-litter-robot-works-feature-1.jpg');
// console.log(caption);
// console.log("Memory used:", (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2), "MB");

