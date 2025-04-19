import HighlightBox from "../2-features/TTS/HighlightBox.js";
import TextExtractor from "../2-features/TTS/TextExtractor.js";
import SpeechHandler from "../2-features/TTS/SpeechHandler.js";
import LinkHandler from "../2-features/TTS/LinkHandler.js";
import RTMPose from "../2-features/SignLanguageHandler/RTMPoseLive.js";

class ContentHandler {
    constructor() {
        this.sections = [];
        this.pastBorderStyle = "";
        this.pastBackgroundStyle = "";

        this.highlightBox = new HighlightBox();
        this.textExtractor = new TextExtractor();
        this.speechHandler = new SpeechHandler();
        this.linkHandler = new LinkHandler();;
        this.rtmPose = new RTMPose({
            modelPath: chrome.runtime.getURL("rtmpose.onnx"),
            inputSize: [192, 256]
          });
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

    async startCapture() {
        if (this.isCapturing) return;

        if (!this.rtmPose.isLoaded) {
            await this.rtmPose.loadModel();
            console.log("Model loaded");
        }
        
        try {
            // Initialize elements if not already done
            if (!this.videoElement) this.initializeElements();
          
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
    processFrames() {
        if (!this.isCapturing) return;
        
        // Draw current video frame to canvas
        const ctx = this.canvasElement.getContext('2d');
        ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Get image data from canvas
        const imageData = ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);

        // Update debug overlay if enabled
        if (this.debugMode && this.debugContext) {
            // Draw a scaled version of the frame to the debug overlay
            this.debugContext.drawImage(
            this.canvasElement, 
            0, 0, this.canvasElement.width, this.canvasElement.height,
            0, 0, this.debugOverlay.width, this.debugOverlay.height
            );
            
            // Optional: Add frame info text
            this.debugContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.debugContext.fillRect(0, 0, 150, 20);
            this.debugContext.fillStyle = 'white';
            this.debugContext.font = '12px Arial';
            this.debugContext.fillText(`Frame: ${new Date().toISOString().substr(11, 8)}`, 5, 15);
        }

        this.processFrame();
        
        // Continue the loop
        setTimeout(() => {
            this.animationFrameId = requestAnimationFrame(this.processFrames);
          }, 30);
    }

    async processFrame() {
        
        try {
            if (!this.videoElement || !this.videoElement.videoWidth || !this.videoElement.videoHeight) {
                console.log('Video element not ready yet');
                return;
            }
            // console.log("before processing the frame");
            // // Create a temporary canvas with the exact dimensions of the video
            // if(!this.    ){
            //     this.tempCanvas = document.createElement('canvas');
            //     this.tempCanvas.width = this.videoElement.videoWidth;
            //     this.tempCanvas.height = this.videoElement.videoHeight;
            //     this.tempCtx = this.tempCanvas.getContext('2d');
            // }
            // this.tempCanvas.clearRect(0, 0, targetWidth, targetHeight);

            // // Draw the current video frame to the canvas
            // tempCtx.drawImage(this.videoElement, 0, 0, tempCanvas.width, tempCanvas.height);
            
            // // Get the image data from the canvas
            // const tempImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

            const startTime = performance.now();
            // Process a single image
            const results = await this.rtmPose.processFrame(this.videoElement);
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            console.log("Processing time:", processingTime, "ms");
            //FPS
            const fps = 1000 / processingTime;
            console.log("FPS:", fps.toFixed(2));

            // Access detected keypoints
            // console.log("Results:", results.keypoints);
            // console.log(this.debugOverlay.width, this.debugOverlay.height, this.canvasElement.width, this.canvasElement.height);

            
            //this.processHandGestures(hands)
            if (this.debugMode && this.debugContext) {
                this.drawLandmarks(results.keypoints);
            }

            // // Clean up the temporary canvas
            // tempCanvas.remove();
        } catch (error) {
            console.error('Error in pose detection:', error);
        }
        
    }

    drawLandmarks(keypoints) {
        // Scale factors to map from original image to debug overlay
        const scaleX = this.debugOverlay.width / 384;
        const scaleY = this.debugOverlay.height / 512;
        
        // Clear previous drawings
        this.debugContext.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height);
        this.debugContext.fillStyle = 'red';
        this.debugContext.strokeStyle = 'red';
        this.debugContext.lineWidth = 1;
        
        // Redraw the frame
        this.debugContext.drawImage(
            this.canvasElement, 
            0, 0, this.canvasElement.width, this.canvasElement.height,
            0, 0, this.debugOverlay.width, this.debugOverlay.height
        );
        // Draw hand landmarks
        for (const point of keypoints) {;
            
            const x = point.x * scaleX;
            const y = point.y * scaleY;
            
            this.debugContext.beginPath();
            this.debugContext.arc(x, y, 2, 0, 2 * Math.PI);
            this.debugContext.fill();
            
        }
        
        // Add text showing detected gesture if any
        if (this.lastDetectedGesture) {
            this.debugContext.fillStyle = 'white';
            this.debugContext.font = '16px Arial';
            this.debugContext.fillText(`Gesture: ${this.lastDetectedGesture}`, 10, 30);
        }
    }
    
    drawHandConnections(landmarks, scaleX, scaleY) {
        // Define connections between landmarks (simplified)
        const connections = [
            // Thumb
            ['wrist', 'thumb_cmc'],
            ['thumb_cmc', 'thumb_mcp'],
            ['thumb_mcp', 'thumb_ip'],
            ['thumb_ip', 'thumb_tip'],
            
            // Index finger
            ['wrist', 'index_finger_mcp'],
            ['index_finger_mcp', 'index_finger_pip'],
            ['index_finger_pip', 'index_finger_dip'],
            ['index_finger_dip', 'index_finger_tip'],
            
            // Middle finger
            ['wrist', 'middle_finger_mcp'],
            ['middle_finger_mcp', 'middle_finger_pip'],
            ['middle_finger_pip', 'middle_finger_dip'],
            ['middle_finger_dip', 'middle_finger_tip'],
            
            // Ring finger
            ['wrist', 'ring_finger_mcp'],
            ['ring_finger_mcp', 'ring_finger_pip'],
            ['ring_finger_pip', 'ring_finger_dip'],
            ['ring_finger_dip', 'ring_finger_tip'],
            
            // Pinky
            ['wrist', 'pinky_mcp'],
            ['pinky_mcp', 'pinky_pip'],
            ['pinky_pip', 'pinky_dip'],
            ['pinky_dip', 'pinky_tip'],
            
            // Palm
            ['index_finger_mcp', 'middle_finger_mcp'],
            ['middle_finger_mcp', 'ring_finger_mcp'],
            ['ring_finger_mcp', 'pinky_mcp']
        ];
        
        for (const [start, end] of connections) {
            const startPoint = landmarks.find(lm => lm.name === start);
            const endPoint = landmarks.find(lm => lm.name === end);
            
            if (startPoint && endPoint) {
                this.debugContext.beginPath();
                this.debugContext.moveTo(startPoint.x * scaleX, startPoint.y * scaleY);
                this.debugContext.lineTo(endPoint.x * scaleX, endPoint.y * scaleY);
                this.debugContext.stroke();
            }
        }
    }

    drawFaceLandmarks(faces) {
        // Scale factors to map from original image to debug overlay
        const scaleX = this.debugOverlay.width / this.canvasElement.width;
        const scaleY = this.debugOverlay.height / this.canvasElement.height;
        
        // Draw face landmarks
        for (const face of faces) {
            const keypoints = face.keypoints;
            
            // Set color for face landmarks
            this.debugContext.fillStyle = 'green';
            this.debugContext.strokeStyle = 'green';
            this.debugContext.lineWidth = 1;
            
            // Draw each landmark
            for (const keypoint of keypoints) {
                const x = keypoint.x * scaleX;
                const y = keypoint.y * scaleY;
                
                this.debugContext.beginPath();
                this.debugContext.arc(x, y, 1, 0, 2 * Math.PI);
                this.debugContext.fill();
            }
            
            // Draw face bounding box if available
            if (face.box) {
                const box = face.box;
                this.debugContext.strokeRect(
                    box.xMin * scaleX, 
                    box.yMin * scaleY, 
                    (box.xMax - box.xMin) * scaleX, 
                    (box.yMax - box.yMin) * scaleY
                );
            }
        }
    }
    
    drawPoseLandmarks(poses) {
        // Scale factors to map from original image to debug overlay
        const scaleX = this.debugOverlay.width / this.canvasElement.width;
        const scaleY = this.debugOverlay.height / this.canvasElement.height;
        
        // Draw pose landmarks
        for (const pose of poses) {
            const keypoints = pose.keypoints;
            
            // Set color for pose landmarks
            this.debugContext.fillStyle = 'yellow';
            this.debugContext.strokeStyle = 'yellow';
            this.debugContext.lineWidth = 2;
            
            // Draw each landmark
            for (const keypoint of keypoints) {
                if (keypoint.score > 0.3) { // Only draw high-confidence keypoints
                    const x = keypoint.x * scaleX;
                    const y = keypoint.y * scaleY;
                    
                    this.debugContext.beginPath();
                    this.debugContext.arc(x, y, 3, 0, 2 * Math.PI);
                    this.debugContext.fill();
                    
                    // Optionally add keypoint name
                    this.debugContext.fillText(keypoint.name, x + 5, y - 5);
                }
            }
            
            // Draw connections between pose keypoints
            this.drawPoseConnections(keypoints, scaleX, scaleY);
        }
    }
    
    drawPoseConnections(keypoints, scaleX, scaleY) {
        // Define connections between pose keypoints
        const connections = [
            ['nose', 'left_eye'],
            ['nose', 'right_eye'],
            ['left_eye', 'left_ear'],
            ['right_eye', 'right_ear'],
            ['nose', 'left_shoulder'],
            ['nose', 'right_shoulder'],
            ['left_shoulder', 'left_elbow'],
            ['left_elbow', 'left_wrist'],
            ['right_shoulder', 'right_elbow'],
            ['right_elbow', 'right_wrist'],
            ['left_shoulder', 'right_shoulder'],
            ['left_shoulder', 'left_hip'],
            ['right_shoulder', 'right_hip'],
            ['left_hip', 'right_hip'],
            ['left_hip', 'left_knee'],
            ['left_knee', 'left_ankle'],
            ['right_hip', 'right_knee'],
            ['right_knee', 'right_ankle']
        ];
        
        this.debugContext.strokeStyle = 'yellow';
        this.debugContext.lineWidth = 2;
        
        for (const [startName, endName] of connections) {
            const startPoint = keypoints.find(kp => kp.name === startName);
            const endPoint = keypoints.find(kp => kp.name === endName);
            
            if (startPoint && endPoint && startPoint.score > 0.3 && endPoint.score > 0.3) {
                this.debugContext.beginPath();
                this.debugContext.moveTo(startPoint.x * scaleX, startPoint.y * scaleY);
                this.debugContext.lineTo(endPoint.x * scaleX, endPoint.y * scaleY);
                this.debugContext.stroke();
            }
        }
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
new ContentHandler();