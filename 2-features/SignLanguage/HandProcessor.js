export class HandProcessor {
    constructor() {
      this.processingActive = false;
      this.stream = null;
      this.videoElement = null;
      this.canvasElement = null;
      this.debugOverlay = null;
      this.debugContext = null;
      this.debugMode = false;
      this.onHandsDetectedCallback = null;
      
      // Server connection properties
      this.serverUrl = "ws://localhost:8765";  // Adjust to your server URL
      this.websocket = null;
      this.isConnected = false;
      
      // Store other properties
      this.lastFrameTime = 0;
      this.fps = 0;
      this.leftHandLandmarks = null;
      this.rightHandLandmarks = null;
      this.lastUpdateTime = 0;
    }
  
    // Add an initialization method
    async initialize() {
        if (this.isConnected) return true;
        
        try {
            // Connect to Python server
            await this.connectToServer();
            return this.isConnected;
        } catch (error) {
            console.error('Error initializing connection to Python server:', error);
            return false;
        }
    }
    
    async connectToServer() {
        return new Promise((resolve, reject) => {
            try {
                this.websocket = new WebSocket(this.serverUrl);
                
                this.websocket.onopen = () => {
                    console.log('Connected to hand detection server');
                    this.isConnected = true;
                    resolve(true);
                };
                
                this.websocket.onclose = () => {
                    console.log('Disconnected from hand detection server');
                    this.isConnected = false;
                };
                
                this.websocket.onerror = (error) => {
                    console.error('WebSocket connection error:', error);
                    this.isConnected = false;
                    reject(error);
                };
                
                // Handle incoming messages from the server
                this.websocket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'hand_detection') {
                            this.handleHandResults(data.results);
                        }
                    } catch (error) {
                        console.error('Error processing server message:', error);
                    }
                };
                
                // Set timeout for connection
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('Connection to hand detection server timed out'));
                    }
                }, 5000);
                
            } catch (error) {
                console.error('Error connecting to server:', error);
                reject(error);
            }
        });
    }
      
    // Process video frames and send to server
    async processVideo() {
        if (!this.processingActive || !this.videoElement || !this.isConnected) return;
        
        const processFrame = async () => {
            if (!this.processingActive) return;
            
            try {
                // Calculate FPS
                const now = performance.now();
                if (this.lastFrameTime) {
                    this.fps = Math.round(1000 / (now - this.lastFrameTime));
                }
                this.lastFrameTime = now;
                
                // Capture frame from video and send to server
                this.captureAndSendFrame();
                
                // Continue processing frames
                requestAnimationFrame(processFrame);
            } catch (error) {
                console.error("Error processing video frame for hand detection:", error);
                // Continue despite errors
                requestAnimationFrame(processFrame);
            }
        };
        
        // Start the frame processing loop
        processFrame();
    }
    
    captureAndSendFrame() {
        if (!this.canvasElement) {
            this.canvasElement = document.createElement('canvas');
            this.canvasElement.width = this.videoElement.videoWidth || 640;
            this.canvasElement.height = this.videoElement.videoHeight || 480;
        }
        
        const context = this.canvasElement.getContext('2d');
        context.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Convert to JPEG and send to server
        this.canvasElement.toBlob((blob) => {
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                // Create a reader to convert blob to base64
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64data = reader.result.split(',')[1];
                    this.websocket.send(JSON.stringify({
                        type: 'hand_frame',
                        data: base64data,
                        timestamp: Date.now()
                    }));
                };
                reader.readAsDataURL(blob);
            }
        }, 'image/jpeg', 0.7);  // Adjust quality as needed
    }

    handleHandResults(results) {
        // Calculate FPS
        const now = performance.now();
        this.fps = Math.round(1000 / (now - (this.lastUpdateTime || now)));
        this.lastUpdateTime = now;
        
        // Process hand landmarks from server
        if (results && results.multiHandLandmarks && results.multiHandedness) {
            // Process each detected hand
            this.leftHandLandmarks = null;
            this.rightHandLandmarks = null;
            
            for (let i = 0; i < results.multiHandLandmarks.length; i++) {
                const landmarks = results.multiHandLandmarks[i];
                const handedness = results.multiHandedness[i];
                
                // Store landmarks based on which hand was detected
                if (handedness.label === 'Left') {
                    this.leftHandLandmarks = landmarks;
                } else if (handedness.label === 'Right') {
                    this.rightHandLandmarks = landmarks;
                }
            }
            
            // Draw landmarks if debug mode is active
            if (this.debugMode) {
                this.drawHandLandmarks(results);
            }
            
            // Dispatch event for hand detection
            const event = new CustomEvent('handsDetected', {
                detail: {
                    leftHand: this.leftHandLandmarks,
                    rightHand: this.rightHandLandmarks,
                    timestamp: now
                }
            });
            window.dispatchEvent(event);
            
            // Call callback if provided
            if (this.onHandsDetectedCallback) {
                this.onHandsDetectedCallback({
                    leftHand: this.leftHandLandmarks,
                    rightHand: this.rightHandLandmarks,
                    timestamp: now
                });
            }
        }
    }
    
    // Update startProcessing to ensure connection is initialized
    async startProcessing(videoElement) {
        if (this.processingActive) {
            console.log("Hand processor already active");
            return true;
        }
        
        if (!videoElement) {
            console.error("No video element provided for hand detection");
            return false;
        }
        
        try {
            // Initialize if not already done
            if (!this.isConnected) {
                const success = await this.initialize();
                if (!success) return false;
            }
            
            this.videoElement = videoElement;
            
            // Set up debug overlay if needed
            if (this.debugMode) {
                this.initializeDebugOverlay();
            }
            
            // Mark as active
            this.processingActive = true;
            
            // Start processing video frames
            this.processVideo();
            
            console.log("Hand detection processing started");
            return true;
        } catch (error) {
            console.error("Error starting hand detection:", error);
            return false;
        }
    }

    // Stop processing
    stopProcessing() {
        if (!this.processingActive) return;
        
        console.log("Stopping hand detection processing");
        this.processingActive = false;
        
        // Reset hand data
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        
        // Close WebSocket connection
        if (this.websocket) {
            this.websocket.close();
            this.isConnected = false;
        }
        
        // Clean up debug overlay
        if (this.debugOverlay) {
            document.body.removeChild(this.debugOverlay.parentNode);
            this.debugOverlay = null;
            this.debugContext = null;
        }
    }


  /**
   * Set callback for hand detection
   * @param {Function} callback - Function to call with hand landmark data
   */
  setOnHandsDetectedCallback(callback) {
    if (typeof callback === 'function') {
      this.onHandsDetectedCallback = callback;
    }
  }

  /**
   * Toggle debug visualization mode
   * @returns {boolean} The new debug mode state
   */
  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode && !this.debugOverlay && this.processingActive) {
      this.initializeDebugOverlay();
    } else if (this.debugOverlay) {
      this.debugOverlay.parentNode.style.display = this.debugMode ? "block" : "none";
    }
    
    return this.debugMode;
  }

  /**
   * Initialize the debug overlay for visualizing hand detection
   */
  initializeDebugOverlay() {
    // Create a wrapper div for the debug overlay
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.bottom = "20px";
    wrapper.style.left = "20px"; // Position on the left side (different from pose)
    wrapper.style.zIndex = "9999";
    
    // Create the canvas for drawing
    this.debugOverlay = document.createElement("canvas");
    this.debugOverlay.width = 320;
    this.debugOverlay.height = 240;
    this.debugOverlay.style.border = "2px solid #FF6B6B"; // Different color from pose
    this.debugOverlay.style.borderRadius = "5px";
    this.debugOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    this.debugContext = this.debugOverlay.getContext("2d");
    
    // Create a close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "X";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "5px";
    closeBtn.style.right = "5px";
    closeBtn.style.backgroundColor = "red";
    closeBtn.style.color = "white";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "50%";
    closeBtn.style.width = "20px";
    closeBtn.style.height = "20px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "12px";
    closeBtn.style.display = "flex";
    closeBtn.style.justifyContent = "center";
    closeBtn.style.alignItems = "center";
    closeBtn.onclick = () => {
      this.debugMode = false;
      wrapper.style.display = "none";
    };
    
    // Create a title bar
    const title = document.createElement("div");
    title.textContent = "Hand Detection Debug";
    title.style.backgroundColor = "#FF6B6B"; // Different color from pose
    title.style.color = "white";
    title.style.padding = "5px";
    title.style.textAlign = "center";
    title.style.borderTopLeftRadius = "5px";
    title.style.borderTopRightRadius = "5px";
    title.style.fontWeight = "bold";
    
    // Add FPS counter
    const fpsCounter = document.createElement("div");
    fpsCounter.id = "hand-fps-counter";
    fpsCounter.textContent = "0 FPS";
    fpsCounter.style.position = "absolute";
    fpsCounter.style.bottom = "5px";
    fpsCounter.style.left = "5px";
    fpsCounter.style.color = "white";
    fpsCounter.style.fontSize = "12px";
    fpsCounter.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    fpsCounter.style.padding = "2px 5px";
    fpsCounter.style.borderRadius = "3px";
    
    // Assemble the overlay components
    wrapper.appendChild(title);
    wrapper.appendChild(this.debugOverlay);
    wrapper.appendChild(closeBtn);
    wrapper.appendChild(fpsCounter);
    document.body.appendChild(wrapper);
    
    // Set up interval to update FPS counter
    setInterval(() => {
      const fpsEl = document.getElementById("hand-fps-counter");
      if (fpsEl) {
        fpsEl.textContent = `${this.fps} FPS`;
      }
    }, 1000); // Update every second
  }

  /**
   * Draw hand landmarks on the debug overlay
   * @param {Object} results - The hand detection results
   */
  drawHandLandmarks(results) {
    if (!this.debugContext || !this.debugOverlay) return;
    
    // Clear the canvas
    this.debugContext.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height);
    
    // Draw a gradient background
    const gradient = this.debugContext.createLinearGradient(0, 0, 0, this.debugOverlay.height);
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
    gradient.addColorStop(1, "rgba(40, 0, 40, 0.8)");
    this.debugContext.fillStyle = gradient;
    this.debugContext.fillRect(0, 0, this.debugOverlay.width, this.debugOverlay.height);
    
    // Draw hand landmarks if available
    if (results.multiHandLandmarks) {
      for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const handLandmarks = results.multiHandLandmarks[i];
        const handedness = results.multiHandedness[i];
        
        // Color based on which hand (left/right)
        const color = handedness.label === 'Left' ? 
          'rgba(255, 100, 100, 0.9)' : 'rgba(100, 255, 100, 0.9)';
        
        // Draw connections between landmarks (fingers)
        this.drawHandConnectors(handLandmarks, color);
        
        // Draw landmarks (joints)
        this.drawHandLandmarkPoints(handLandmarks, handedness.label, color);
      }
    }
    
    // Add timestamp
    this.debugContext.fillStyle = "white";
    this.debugContext.font = "10px Arial";
    this.debugContext.fillText(`FPS: ${this.fps}`, 5, 15);
    this.debugContext.fillText(`Left hand: ${this.leftHandLandmarks ? "Detected" : "None"}`, 5, 30);
    this.debugContext.fillText(`Right hand: ${this.rightHandLandmarks ? "Detected" : "None"}`, 5, 45);
  }
  
  /**
   * Draw connections between hand landmarks to form the hand structure
   * @param {Array} landmarks - Hand landmarks
   * @param {string} color - Color to use for drawing
   */
  drawHandConnectors(landmarks, color) {
    if (!this.debugContext) return;
    
    // Define hand connections (fingers and palm)
    const connections = [
      // Thumb
      [0, 1], [1, 2], [2, 3], [3, 4],
      // Index finger
      [0, 5], [5, 6], [6, 7], [7, 8],
      // Middle finger
      [0, 9], [9, 10], [10, 11], [11, 12],
      // Ring finger
      [0, 13], [13, 14], [14, 15], [15, 16],
      // Pinky
      [0, 17], [17, 18], [18, 19], [19, 20],
      // Palm
      [0, 5], [5, 9], [9, 13], [13, 17]
    ];
    
    this.debugContext.strokeStyle = color;
    this.debugContext.lineWidth = 2;
    
    // Draw each connection
    connections.forEach(([i, j]) => {
      const x1 = landmarks[i].x * this.debugOverlay.width;
      const y1 = landmarks[i].y * this.debugOverlay.height;
      const x2 = landmarks[j].x * this.debugOverlay.width;
      const y2 = landmarks[j].y * this.debugOverlay.height;
      
      this.debugContext.beginPath();
      this.debugContext.moveTo(x1, y1);
      this.debugContext.lineTo(x2, y2);
      this.debugContext.stroke();
    });
  }
  
  /**
   * Draw individual landmark points for the hand
   * @param {Array} landmarks - Hand landmarks
   * @param {string} handLabel - Which hand (Left/Right)
   * @param {string} color - Color to use for drawing
   */
  drawHandLandmarkPoints(landmarks, handLabel, color) {
    if (!this.debugContext) return;
    
    // Draw each landmark
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * this.debugOverlay.width;
      const y = landmark.y * this.debugOverlay.height;
      
      // Draw circle for the landmark
      this.debugContext.fillStyle = color;
      
      // Special highlighting for fingertips (landmarks 4, 8, 12, 16, 20)
      const isFingerTip = [4, 8, 12, 16, 20].includes(index);
      const radius = isFingerTip ? 5 : 3;
      
      this.debugContext.beginPath();
      this.debugContext.arc(x, y, radius, 0, 2 * Math.PI);
      this.debugContext.fill();
      
      // Add index number for specific landmarks
      if (index % 4 === 0 || index === 0) {
        this.debugContext.fillStyle = "white";
        this.debugContext.font = "8px Arial";
        this.debugContext.fillText(`${index}`, x + 5, y);
      }
    });
    
    // Add hand label
    const firstPoint = landmarks[0];
    const labelX = firstPoint.x * this.debugOverlay.width;
    const labelY = firstPoint.y * this.debugOverlay.height - 10;
    
    this.debugContext.fillStyle = "white";
    this.debugContext.font = "10px Arial";
    this.debugContext.fillText(handLabel, labelX, labelY);
  }
  
  /**
   * Get the current state of hand detection
   * @returns {Object} Hand detection state information
   */
  getHandDetectionState() {
    return {
      active: this.processingActive,
      leftHandDetected: this.leftHandLandmarks !== null,
      rightHandDetected: this.rightHandLandmarks !== null,
      fps: this.fps,
      lastUpdateTime: this.lastUpdateTime,
      debugMode: this.debugMode
    };
  }
}