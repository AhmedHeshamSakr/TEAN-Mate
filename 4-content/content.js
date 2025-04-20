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
        this.debugMode = false;
        this.debugOverlay = null;
        this.debugContext = null;
        this.processFrames = this.processFrames.bind(this);
        
        // MediaPipe server settings
        this.serverUrl = 'http://localhost:5000/process_frame';
        this.serverConnected = false;
        this.lastDetectedGesture = null;
        
        // Performance optimizations
        this.processingQueue = [];
        this.isProcessingFrame = false;
        this.frameSkipThreshold = 5; // Process every 6th frame (increased from 2)
        this.frameSkipCount = 0;
        this.frameScale = 0.5; // Scale down frames to 50% of original size
        this.lastFrameTime = 0;
        
        // Frame size constraints
        this.maxFrameWidth = 640;
        this.maxFrameHeight = 480;
        
        // Throttle server checks to reduce overhead
        this.serverCheckInterval = 10000; // Check server every 10 seconds
        this.lastServerCheck = 0;
        
        // WebSocket connection (faster than HTTP)
        this.ws = null;
        this.useWebSocket = true; // Try to use WebSocket if available
        this.wsReconnectAttempts = 0;
        this.maxReconnectAttempts = 3;
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
        this.debugContext = this.debugOverlay.getContext('2d', { alpha: false });
        
        // Performance improvement: Use a more efficient canvas context
        this.debugContext.imageSmoothingEnabled = false;
        
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
        
        // Add server status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.id = 'server-status';
        statusIndicator.style.position = 'absolute';
        statusIndicator.style.bottom = '5px';
        statusIndicator.style.left = '5px';
        statusIndicator.style.padding = '2px 6px';
        statusIndicator.style.borderRadius = '10px';
        statusIndicator.style.fontSize = '10px';
        statusIndicator.style.backgroundColor = 'red';
        statusIndicator.textContent = 'Server: Disconnected';
        
        wrapper.appendChild(statusIndicator);
        
        // Add FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'fps-counter';
        fpsCounter.style.position = 'absolute';
        fpsCounter.style.top = '5px';
        fpsCounter.style.left = '5px';
        fpsCounter.style.padding = '2px 6px';
        fpsCounter.style.borderRadius = '10px';
        fpsCounter.style.fontSize = '10px';
        fpsCounter.style.backgroundColor = 'rgba(0,0,0,0.5)';
        fpsCounter.style.color = 'white';
        fpsCounter.textContent = 'FPS: 0';
        
        wrapper.appendChild(fpsCounter);
        
        // Check server connection
        this.checkServerConnection();
    }

    async initializeWebSocket() {
        // Convert from HTTP to WebSocket URL
        const wsUrl = this.serverUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
        
        try {
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('WebSocket connection established');
                this.serverConnected = true;
                this.wsReconnectAttempts = 0;
                
                const statusIndicator = document.getElementById('server-status');
                if (statusIndicator) {
                    statusIndicator.style.backgroundColor = 'green';
                    statusIndicator.textContent = 'Server: WebSocket Connected';
                }
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const results = JSON.parse(event.data);
                    
                    // Process the received data
                    if (results && results.success) {
                        if (this.debugMode && this.debugContext) {
                            this.drawLandmarks(results.keypoints);
                        }
                        
                        // Process gesture detection
                        if (results.gestures && results.gestures.length > 0) {
                            this.lastDetectedGesture = results.gestures[0].name;
                            console.log("Detected gesture:", this.lastDetectedGesture);
                            
                        }
                    }
                    
                    // Indicate that processing is complete
                    this.isProcessingFrame = false;
                    
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                    this.isProcessingFrame = false;
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.serverConnected = false;
                
                const statusIndicator = document.getElementById('server-status');
                if (statusIndicator) {
                    statusIndicator.style.backgroundColor = 'red';
                    statusIndicator.textContent = 'Server: Error';
                }
            };
            
            this.ws.onclose = () => {
                console.log('WebSocket connection closed');
                this.serverConnected = false;
                
                const statusIndicator = document.getElementById('server-status');
                if (statusIndicator) {
                    statusIndicator.style.backgroundColor = 'red';
                    statusIndicator.textContent = 'Server: Disconnected';
                }
                
                // Try to reconnect if we haven't exceeded the max attempts
                if (this.wsReconnectAttempts < this.maxReconnectAttempts) {
                    this.wsReconnectAttempts++;
                    setTimeout(() => this.initializeWebSocket(), 2000 * this.wsReconnectAttempts);
                } else {
                    this.useWebSocket = false; // Fall back to HTTP
                    console.log('Falling back to HTTP connection');
                }
            };
            
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            this.useWebSocket = false; // Fall back to HTTP
        }
    }

    async checkServerConnection() {
        const now = Date.now();
        const statusIndicator = document.getElementById('server-status');
        
        // Throttle server checks
        if (now - this.lastServerCheck < this.serverCheckInterval) return;
        this.lastServerCheck = now;
        
        if (!statusIndicator) return;
        
        // Try WebSocket connection first if enabled
        if (this.useWebSocket && (!this.ws || this.ws.readyState !== WebSocket.OPEN)) {
            this.initializeWebSocket();
            return;
        }
        
        // Fall back to HTTP check
        if (!this.useWebSocket) {
            try {
                const response = await fetch(this.serverUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'ping' }),
                });
                
                if (response.ok) {
                    this.serverConnected = true;
                    statusIndicator.style.backgroundColor = 'green';
                    statusIndicator.textContent = 'Server: HTTP Connected';
                } else {
                    this.serverConnected = false;
                    statusIndicator.style.backgroundColor = 'red';
                    statusIndicator.textContent = 'Server: Error';
                }
            } catch (error) {
                this.serverConnected = false;
                statusIndicator.style.backgroundColor = 'red';
                statusIndicator.textContent = 'Server: Disconnected';
            }
        }
        
        // Schedule next check
        setTimeout(() => this.checkServerConnection(), this.serverCheckInterval);
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

        // Create offscreen canvas for pre-processing (faster)
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.maxFrameWidth;
        this.offscreenCanvas.height = this.maxFrameHeight;
        this.offscreenContext = this.offscreenCanvas.getContext('2d', { alpha: false });
        this.offscreenContext.imageSmoothingEnabled = false;

        if (this.debugMode) {
            this.initializeDebugOverlay();
        }
    }

    async startCapture() {
        if (this.isCapturing) return;
        
        try {
            // Initialize elements if not already done
            if (!this.videoElement) this.initializeElements();
          
            // Request display media (screen sharing)
            this.captureStream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                  cursor: "never",
                  displaySurface: "window",
                  frameRate: { ideal: 15, max: 30 } // Lower frame rate for better performance
                },
                audio: false
            });
          
            // Connect stream to video element
            this.videoElement.srcObject = this.captureStream;
          
            // Set canvas size based on video dimensions, but constrain to max size
            this.videoElement.onloadedmetadata = () => {
                // Calculate appropriate size while maintaining aspect ratio
                const videoAspect = this.videoElement.videoWidth / this.videoElement.videoHeight;
                let width, height;
                
                if (videoAspect > 1) { // Wider than tall
                    width = Math.min(this.videoElement.videoWidth, this.maxFrameWidth);
                    height = width / videoAspect;
                } else { // Taller than wide
                    height = Math.min(this.videoElement.videoHeight, this.maxFrameHeight);
                    width = height * videoAspect;
                }
                
                // Set canvas dimensions
                this.canvasElement.width = width;
                this.canvasElement.height = height;
                
                // Start the frame processing loop
                this.isCapturing = true;
                this.lastFrameTime = performance.now();
                this.processFrames();
            };
          
            // Handle stream ending (user stops sharing)
            this.captureStream.getVideoTracks()[0].onended = () => {
                this.stopCapture();
            };
          
            // Initialize WebSocket connection if enabled
            if (this.useWebSocket) {
                this.initializeWebSocket();
            }
          
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
        
        // Close WebSocket connection
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
        }
        
        this.isCapturing = false;
    }

    // Function to process video frames - optimized version
    processFrames() {
        if (!this.isCapturing) return;
        
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Calculate and display FPS
        const fps = 1000 / deltaTime;
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) {
            fpsCounter.textContent = `FPS: ${fps.toFixed(1)}`;
        }
        
        // Skip frames to reduce server load
        this.frameSkipCount = (this.frameSkipCount + 1) % (this.frameSkipThreshold + 1);
        if (this.frameSkipCount === 0) {
            // Draw current video frame to canvas with downscaling
            this.drawScaledVideoFrame();
            
            // Check if we should process this frame
            if (!this.isProcessingFrame && this.serverConnected) {
                this.isProcessingFrame = true;
                this.processFrame();
            }
        }
        
        // Update debug overlay if enabled
        if (this.debugMode && this.debugContext && this.frameSkipCount === 0) {
            // Draw a scaled version of the frame to the debug overlay
            this.debugContext.drawImage(
                this.canvasElement, 
                0, 0, this.canvasElement.width, this.canvasElement.height,
                0, 0, this.debugOverlay.width, this.debugOverlay.height
            );
        }
        
        // Continue the loop - use requestAnimationFrame for better performance
        this.animationFrameId = requestAnimationFrame(this.processFrames);
    }
    
    // Draw scaled video frame to canvas - optimized
    drawScaledVideoFrame() {
        if (!this.videoElement || !this.canvasElement || 
            !this.videoElement.videoWidth || !this.videoElement.videoHeight) {
            return;
        }
        
        const ctx = this.canvasElement.getContext('2d', { alpha: false });
        ctx.imageSmoothingEnabled = false; // Faster rendering
        
        // Clear canvas with black background (faster than clearRect)
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Draw the frame at the constrained size
        ctx.drawImage(
            this.videoElement,
            0, 0, this.videoElement.videoWidth, this.videoElement.videoHeight,
            0, 0, this.canvasElement.width, this.canvasElement.height
        );
    }

    async processFrame() {
        try {
            if (!this.canvasElement || !this.canvasElement.width || !this.canvasElement.height) {
                console.log('Canvas element not ready yet');
                this.isProcessingFrame = false;
                return;
            }
    
            // Start measuring end-to-end latency
            const startTime = performance.now();
    
            // Use more efficient image encoding
            const imageData = this.canvasElement.toDataURL('image/webp', 0.6);
    
            // Send frame for processing
            if (this.useWebSocket && this.ws && this.ws.readyState === WebSocket.OPEN) {
                // WebSocket processing (more efficient)
                this.ws.send(JSON.stringify({
                    image: imageData.split(',')[1],
                    width: this.canvasElement.width,
                    height: this.canvasElement.height
                }));
    
                // Note: WebSocket response is handled in the `onmessage` event
                this.ws.onmessage = (event) => {
                    const endTime = performance.now(); // End time for WebSocket response
                    const latency = endTime - startTime;
                    console.log(`End-to-end latency (WebSocket): ${latency.toFixed(2)} ms`);
                    // Display FPS in console
                    const fps = 1000 / latency;
                    console.log(`FPS: ${fps.toFixed(1)}`);
    
                    // Process the received data
                    try {
                        const results = JSON.parse(event.data);
                        if (results && results.success) {
                            if (this.debugMode && this.debugContext) {
                                this.drawLandmarks(results.keypoints);
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
    
                    // Mark processing as complete
                    this.isProcessingFrame = false;
                };
            } else {
                // HTTP fallback
                const response = await fetch(this.serverUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        image: imageData.split(',')[1],
                        width: this.canvasElement.width,
                        height: this.canvasElement.height
                    }),
                });
    
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
    
                const results = await response.json();
                const endTime = performance.now(); // End time for HTTP response
                const latency = endTime - startTime;
                console.log(`End-to-end latency (HTTP): ${latency.toFixed(2)} ms`);
    
                // Process results
                if (results && results.success) {
                    if (this.debugMode && this.debugContext) {
                        this.drawLandmarks(results.keypoints);
                    }
                }
    
                // Mark processing as complete
                this.isProcessingFrame = false;
            }
        } catch (error) {
            console.error('Error in pose detection:', error);
            this.isProcessingFrame = false;
        }
    }
    // Optimized landmark drawing function
    drawLandmarks(keypoints) {
        if (!keypoints || keypoints.length === 0 || !this.debugContext) return;
        
        // Scale factors to map from original image to debug overlay
        const scaleX = this.debugOverlay.width / this.canvasElement.width;
        const scaleY = this.debugOverlay.height / this.canvasElement.height;
        
        // Group keypoints by type for batch rendering
        const pointsByType = {
            pose: [],
            hand: [],
            face: []
        };
        
        // Collect points by type
        for (const point of keypoints) {
            if (!point || (point.visibility && point.visibility < 0.1)) continue;
            
            const x = point.x * this.debugOverlay.width;
            const y = point.y * this.debugOverlay.height;
            
            if (point.type && pointsByType[point.type]) {
                pointsByType[point.type].push({x, y, connections: point.connections});
            }
        }
        
        // Draw points by type in batches (more efficient than individual circles)
        this.debugContext.fillStyle = 'red';
        this.batchDrawPoints(pointsByType.pose);
        
        this.debugContext.fillStyle = 'lime';
        this.batchDrawPoints(pointsByType.hand);
        
        this.debugContext.fillStyle = 'cyan';
        this.batchDrawPoints(pointsByType.face, true); // Limit face points
        
        // Draw connections
        this.batchDrawConnections(pointsByType);
        
        // Add text showing detected gesture if any
        if (this.lastDetectedGesture) {
            this.debugContext.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.debugContext.fillRect(5, 5, 160, 30);
            
            this.debugContext.fillStyle = 'white';
            this.debugContext.font = '16px Arial';
            this.debugContext.fillText(`Gesture: ${this.lastDetectedGesture}`, 10, 25);
        }
    }

    // Batch draw points for better performance
    batchDrawPoints(points, limit = false) {
        if (!points.length) return;
        
        const ctx = this.debugContext;
        const pointSize = limit ? 2 : 3;
        
        // For face landmarks, only draw a subset
        if (limit) {
            points = points.filter((_, i) => i % 5 === 0);
        }
        
        for (const point of points) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Batch draw connections for better performance
    batchDrawConnections(pointsByType) {
        if (!this.debugContext) return;
        
        // Draw connections for each body part with appropriate styling
        this.debugContext.lineWidth = 2;
        this.debugContext.strokeStyle = 'red';
        this.drawConnectionLines(pointsByType.pose);
        
        this.debugContext.lineWidth = 1;
        this.debugContext.strokeStyle = 'lime';
        this.drawConnectionLines(pointsByType.hand);
        
        this.debugContext.lineWidth = 0.5;
        this.debugContext.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        this.drawConnectionLines(pointsByType.face, true);
    }
    
    // Helper method to draw connection lines efficiently
    drawConnectionLines(points, limit = false) {
        if (!points.length) return;
        
        const ctx = this.debugContext;
        
        // For face connections, limit them to reduce visual clutter
        const pointsToProcess = limit ? points.filter((_, i) => i % 5 === 0) : points;
        
        ctx.beginPath();
        for (const point of pointsToProcess) {
            if (!point.connections) continue;
            
            for (const connIdx of point.connections) {
                const connPoint = points[connIdx];
                if (connPoint) {
                    ctx.moveTo(point.x, point.y);
                    ctx.lineTo(connPoint.x, connPoint.y);
                }
            }
        }
        ctx.stroke();
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

// Instantiate the content handler
new ContentHandler();