import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";

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

        this.captureStream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.animationFrameId = null;
        this.isCapturing = false;
        this.frameProcessor = null;
        this.debugMode = false;
        this.debugOverlay = null;
        this.debugContext = null;
        this.processFrames = this.processFrames.bind(this);

        this.holistic = null;
        this.holisticLoaded = false;
        this.resultsCanvas = null;
        this.resultsContext = null;
    }

    getNextElement() {
        let elementsToReturn = [];
        let text = [];
        while (this.walker.nextNode()) {
            const element = this.walker.currentNode;
            if(TextExtractor.processedElements.has(element)) continue;
            if (this.isElementVisible(element)) {
                const tagName = element.tagName?.toLowerCase();
                if (element.tagName.toLowerCase() === 'a' && element.href) {
                    const domain = new URL(element.href).hostname.replace('www.', '');
                    text.push(element.textContent.trim() ? `Link text: ${element.textContent.trim()}` : `Link to ${domain}`);
                    elementsToReturn.push(element);
                    this.currentLink = element;
                    TextExtractor.processAllDescendants(element);
                } else {
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
                            if (child.tagName.toLowerCase() === "a"){
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
                        if (child.tagName.toLowerCase() === "a"){
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
        if (!this.currentElement || !elementsToReturn) {
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
        this.speakCurrentSection();
    }

    initializeDebugOverlay() {
        // Create a canvas element for the debug overlay
        this.debugOverlay = document.createElement('canvas');
        this.debugOverlay.width = 320;  // Smaller preview size
        this.debugOverlay.height = 240;
        this.debugOverlay.style.position = 'fixed';
        this.debugOverlay.style.bottom = '20px';
        this.debugOverlay.style.right = '20px';
        this.debugOverlay.style.border = '2px solid #4CAF50';
        this.debugOverlay.style.borderRadius = '5px';
        this.debugOverlay.style.zIndex = '9999';  // Make sure it's on top
        this.debugOverlay.style.backgroundColor = '#000';
        this.debugContext = this.debugOverlay.getContext('2d');
        
        // Add a close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'X';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '5px';
        closeBtn.style.backgroundColor = 'red';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.width = '20px';
        closeBtn.style.height = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '12px';
        closeBtn.style.display = 'flex';
        closeBtn.style.justifyContent = 'center';
        closeBtn.style.alignItems = 'center';
        closeBtn.onclick = () => {
          this.debugOverlay.style.display = 'none';
          this.debugMode = false;
        };
        
        // Create a wrapper div to hold the canvas and button
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.bottom = '20px';
        wrapper.style.right = '20px';
        wrapper.style.zIndex = '9999';
        
        wrapper.appendChild(this.debugOverlay);
        wrapper.appendChild(closeBtn);
        document.body.appendChild(wrapper);
      }

      toggleDebugOverlay() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode && !this.debugOverlay) {
          this.initializeDebugOverlay();
        } else if (this.debugOverlay) {
          this.debugOverlay.parentNode.style.display = this.debugMode ? 'block' : 'none';
        }
      }
      

    // Function to initialize canvas and video elements
    initializeElements() {
        // Create hidden video element to receive the stream
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        this.videoElement.setAttribute('autoplay', true);
        document.body.appendChild(this.videoElement);
        
        // Create hidden canvas for frame extraction
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.style.display = 'none';
        document.body.appendChild(this.canvasElement);

        if (this.debugMode) {
            this.initializeDebugOverlay();
        }
    }

    async initializeHolistic() {
        if (this.holisticLoaded) return;
        
        try {
            // Load MediaPipe WASM files
            const filePathBase = chrome.runtime.getURL('lib/mediapipe/');
            console.log("checkpoint 1");
            
            // Create a script element to load the MediaPipe WASM files
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('lib/mediapipe/holistic.js');
            document.head.appendChild(script);
            console.log("checkpoint 2");
    
            // Wait for the script to load
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = (error) => {
                    console.error("Error loading script:", error);
                    reject(error);
                };
            });
            console.log("checkpoint 3");
            
            // Check what objects were exposed by the script
            console.log("Available MediaPipe objects:", Object.keys(window).filter(key => 
                key.includes('mediapipe') || key.includes('Holistic') || key.includes('holistic')));
            
            // Try to find the Holistic constructor
            let HolisticConstructor;
            if (window.Holistic) {
                console.log("Found direct Holistic constructor");
                HolisticConstructor = window.Holistic;
            } else if (window.mediapipe && window.mediapipe.Holistic) {
                console.log("Found Holistic in mediapipe namespace");
                HolisticConstructor = window.mediapipe.Holistic;
            } else {
                // Try loading a custom implementation
                console.log("Creating custom Holistic implementation");
                this.createCustomHolistic();
                HolisticConstructor = window.Holistic;
            }
            
            if (!HolisticConstructor) {
                throw new Error("Could not find Holistic constructor");
            }
            
            // Initialize Holistic with local WASM files
            this.holistic = new HolisticConstructor({
                locateFile: (file) => {
                    console.log(`Loading file: ${file}`);
                    return `${filePathBase}${file}`;
                }
            });
            console.log("checkpoint 4");
    
            // Configure Holistic
            await this.holistic.initialize();
            this.holistic.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });
            console.log("checkpoint 5");
    
            // Create canvas for displaying results
            this.resultsCanvas = document.createElement('canvas');
            this.resultsCanvas.width = 320;
            this.resultsCanvas.height = 240;
            this.resultsContext = this.resultsCanvas.getContext('2d');
            
            this.holisticLoaded = true;
            console.log("MediaPipe Holistic initialized successfully");
        } catch (error) {
            console.error("Error initializing MediaPipe Holistic:", error);
        }
    }
    
    // Helper method to create a custom Holistic implementation if needed
    createCustomHolistic() {
        // This is a simplified implementation - you may need to adjust based on your needs
        window.Holistic = class {
            constructor(options) {
                this.options = options;
                console.log("Custom Holistic constructor called with options:", options);
            }
            
            initialize() {
                console.log("Custom Holistic initialize called");
                return Promise.resolve();
            }
            
            setOptions(options) {
                console.log("Custom Holistic setOptions called with:", options);
                this.options = {...this.options, ...options};
            }
            
            send(input) {
                console.log("Custom Holistic send called with input:", input);
                return Promise.resolve({});
            }
        };
    }

    async startCapture() {
        if (this.isCapturing) return;
        
        try {
          // Initialize elements if not already done
          if (!this.videoElement) this.initializeElements();
          
          // Initialize MediaPipe Holistic if not already done
          if (!this.holisticLoaded) {
            await this.initializeHolistic();
          }
          
          // Request display media (screen sharing)
          this.captureStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
              cursor: "never",
              displaySurface: "window"
            },
            audio: false
          });
          
          // Connect stream to video element
          this.videoElement.srcObject = this.captureStream;
          
          // Set canvas size based on video dimensions
          this.videoElement.onloadedmetadata = () => {
            this.canvasElement.width = this.videoElement.videoWidth;
            this.canvasElement.height = this.videoElement.videoHeight;
            
            // Start the frame processing loop
            this.isCapturing = true;
            this.processFrames();
          };
          
          // Handle stream ending (user stops sharing)
          this.captureStream.getVideoTracks()[0].onended = () => {
            this.stopCapture();
          };
          
        } catch (error) {
          console.error("Error starting capture:", error);
        }
    }

    stopCapture() {
        if (!this.isCapturing) return;
        
        // Stop the animation frame loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Stop all tracks in the stream
        if (this.captureStream) {
            this.captureStream.getTracks().forEach(track => track.stop());
            this.captureStream = null;
        }
        
        // Clear video source
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        this.isCapturing = false;
    }

    // Function to process video frames
    async processFrames() {
        if (!this.isCapturing) return;
        
        // Draw current video frame to canvas
        const ctx = this.canvasElement.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Process the frame with MediaPipe Holistic
        if (this.holistic && this.holisticLoaded) {
            try {
                // Process the current frame
                const results = await this.holistic.send({image: this.canvasElement});
                
                // Draw the results
                this.drawResults(results);
                
                // Update debug overlay if enabled
                if (this.debugMode && this.debugContext && this.resultsCanvas) {
                    // Draw the results canvas to the debug overlay
                    this.debugContext.drawImage(
                        this.resultsCanvas,
                        0, 0, this.resultsCanvas.width, this.resultsCanvas.height,
                        0, 0, this.debugOverlay.width, this.debugOverlay.height
                    );
                    
                    // Add frame info text
                    this.debugContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
                    this.debugContext.fillRect(0, 0, 150, 20);
                    this.debugContext.fillStyle = 'white';
                    this.debugContext.font = '12px Arial';
                    this.debugContext.fillText(`Frame: ${new Date().toISOString().substr(11, 8)}`, 5, 15);
                }
                
                // Process the results for sign language recognition
                this.processHolisticResults(results);
            } catch (error) {
                console.error("Error processing frame with MediaPipe:", error);
            }
        } else {
            // Update debug overlay with raw frame if MediaPipe is not available
            if (this.debugMode && this.debugContext) {
                this.debugContext.drawImage(
                    this.canvasElement, 
                    0, 0, this.canvasElement.width, this.canvasElement.height,
                    0, 0, this.debugOverlay.width, this.debugOverlay.height
                );
            }
        }
        
        // Continue the loop
        setTimeout(() => {
            this.animationFrameId = requestAnimationFrame(this.processFrames);
        }, 100);
    }

    // Draw MediaPipe results on the results canvas
    drawResults(results) {
        if (!this.resultsContext || !this.resultsCanvas) return;
        
        // Clear the canvas
        this.resultsContext.clearRect(0, 0, this.resultsCanvas.width, this.resultsCanvas.height);
        
        // Draw the input image
        this.resultsContext.drawImage(
            this.canvasElement,
            0, 0, this.canvasElement.width, this.canvasElement.height,
            0, 0, this.resultsCanvas.width, this.resultsCanvas.height
        );
        
        // Draw face landmarks
        if (results.faceLandmarks) {
            this.drawLandmarks(this.resultsContext, results.faceLandmarks, {
                color: '#FF3030',
                lineWidth: 1
            });
        }
        
        // Draw pose landmarks
        if (results.poseLandmarks) {
            this.drawLandmarks(this.resultsContext, results.poseLandmarks, {
                color: '#00FF00',
                lineWidth: 2
            });
        }
        
        // Draw left hand landmarks
        if (results.leftHandLandmarks) {
            this.drawLandmarks(this.resultsContext, results.leftHandLandmarks, {
                color: '#30C0FF',
                lineWidth: 2
            });
        }
        
        // Draw right hand landmarks
        if (results.rightHandLandmarks) {
            this.drawLandmarks(this.resultsContext, results.rightHandLandmarks, {
                color: '#FF6060',
                lineWidth: 2
            });
        }
    }

    // Helper function to draw landmarks
    drawLandmarks(ctx, landmarks, options = {}) {
        if (!landmarks) return;
        
        const { color = 'white', lineWidth = 1 } = options;
        
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        
        // Draw each landmark point
        for (const landmark of landmarks) {
            const x = landmark.x * ctx.canvas.width;
            const y = landmark.y * ctx.canvas.height;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Connect landmarks with lines if needed
        // This would require knowledge of the connections between landmarks
    }

    // Process MediaPipe Holistic results for sign language recognition
    processHolisticResults(results) {
        // Extract relevant features from the results
        const features = {
            pose: results.poseLandmarks || [],
            leftHand: results.leftHandLandmarks || [],
            rightHand: results.rightHandLandmarks || [],
            face: results.faceLandmarks || []
        };
        
        // Here you would implement your sign language recognition logic
        // For example:
        // 1. Extract gesture features from the landmarks
        // 2. Apply classification or pattern recognition
        // 3. Map to sign language meanings
        
        // For demonstration, log some basic info
        console.log(`Processing holistic results: 
            - Pose landmarks: ${features.pose.length}
            - Left hand landmarks: ${features.leftHand.length}
            - Right hand landmarks: ${features.rightHand.length}
            - Face landmarks: ${features.face.length}`);
    }

    processFrame(imageData) {
        // This is where you would implement your sign language recognition logic
        // For example:
        
        // 1. Extract relevant regions of interest (hands, face)
        // 2. Preprocess the image (resize, normalize)
        // 3. Apply your sign language detection model
        // 4. Interpret the results
        
        // For demonstration, let's just log some basic info
        const frameTime = new Date().toISOString();
        console.log(`Processing frame at ${frameTime}: ${imageData.width}x${imageData.height}`);
        
        // For actual implementation, you might want to:
        // - Send frames to a web worker for processing
        // - Use TensorFlow.js or similar for ML inference
        // - Send results to background script or external service
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
            if (this.currentElement  && this.currentElement.elementsToReturn) {
                for (let el of this.currentElement.elementsToReturn) {
                    this.highlightBox.removeHighlight(el);
                }
                this.speechHandler.stop();
                this.linkHandler.accessLink(this.currentLink);
            }
        }else if (request.action === "performSearch"){
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
        } else if (request.action === "startSLcapture") {
            if (this.isCapturing) {
                this.stopCapture();
                this.toggleDebugOverlay();
            }
            else {
                this.startCapture();
                this.toggleDebugOverlay();
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
        return isNotHidden;
    }
}

// // Instantiate the content handler
// new ContentHandler();

// // ContentHandler.js
// import { VideoProcessor } from "./VideoProcessor.js";

// class ContentHandler {
//   constructor() {
//     this.videoProcessor = new VideoProcessor();

//     chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
//   }

//   handleMessage(request) {
//     if (request.action === "startSLcapture") {
//       if (this.videoProcessor.processingActive) {
//         this.videoProcessor.stopProcessing();
//       } else {
//         this.videoProcessor.startProcessing();
//       }
//     }
//     // Handle other actions...
//   }
// }

// // Instantiate the content handler
new ContentHandler();