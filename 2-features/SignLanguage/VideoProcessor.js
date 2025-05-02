export class VideoProcessor {
  constructor() {
    this.processingActive = false;
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.debugOverlay = null;
    this.debugContext = null;
    this.debugMode = false;
    this.onPoseDetectedCallback = null;
    
    // Server connection properties
    this.serverUrl = "ws://localhost:8765"; // Adjust to your server URL
    this.websocket = null;
    this.isConnected = false;
    
    // Other properties
    this.lastFrameTime = 0;
    this.fps = 0;
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
          console.log('Connected to pose detection server');
          this.isConnected = true;
          resolve(true);
        };
        
        this.websocket.onclose = () => {
          console.log('Disconnected from pose detection server');
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
            if (data.type === 'pose_detection') {
              this.handlePoseResults(data.results);
            }
          } catch (error) {
            console.error('Error processing server message:', error);
          }
        };
        
        // Set timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection to pose detection server timed out'));
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
        console.error("Error processing video frame:", error);
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
            type: 'pose_frame',
            data: base64data,
            timestamp: Date.now()
          }));
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.7);  // Adjust quality as needed
  }

  handlePoseResults(results) {
    // Update FPS
    const now = performance.now();
    this.fps = Math.round(1000 / (now - (this.lastFrameTime || now)));
    this.lastFrameTime = now;
    
    // Process pose landmarks
    if (results && results.poseLandmarks) {
      // Draw landmarks if debug mode is on
      if (this.debugMode && this.debugContext) {
        this.drawKeypoints(results.poseLandmarks);
      }
      
      // Dispatch event with pose landmarks
      const event = new CustomEvent('poseDetected', {
        detail: {
          landmarks: results.poseLandmarks,
          timestamp: now
        }
      });
      window.dispatchEvent(event);
      
      // Call callback if provided
      if (this.onPoseDetectedCallback) {
        this.onPoseDetectedCallback(results.poseLandmarks);
      }
    }
  }

  async startProcessing() {
    if (this.processingActive) return true;
    
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        const success = await this.initialize();
        if (!success) return false;
      }
      
      console.log('Requesting screen capture permission...');
      
      // Request screen capture permission
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          frameRate: 30,
          cursor: "always"
        },
        audio: false
      });
      
      // Set up video element for the stream
      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = this.stream;
      this.videoElement.style.display = "none"; // Hide the video element
      document.body.appendChild(this.videoElement);
      
      // Start playing the video
      await this.videoElement.play();
      console.log("Video stream started");

      // Set up canvas for processing frames
      this.canvasElement = document.createElement("canvas");
      this.canvasElement.width = this.videoElement.videoWidth || 640;
      this.canvasElement.height = this.videoElement.videoHeight || 480;
      this.canvasElement.style.display = "none"; // Hide the canvas by default
      document.body.appendChild(this.canvasElement);

      // Initialize debug overlay if needed
      if (this.debugMode) {
        this.initializeDebugOverlay();
      }

      // Mark processing as active
      this.processingActive = true;
      
      // Start processing video frames
      this.processVideo();
      
      // Handle stream ending (user stops sharing)
      this.stream.getVideoTracks()[0].onended = () => {
        console.log("Screen sharing stopped by user");
        this.stopProcessing();
      };
      
      return true;
    } catch (error) {
      console.error("Error accessing screen capture:", error);
      // If the user cancels the screen sharing prompt
      if (error.name === 'NotAllowedError') {
        console.log("User denied screen capture permission");
      }
      return false;
    }
  }

  stopProcessing() {
    if (!this.processingActive) return;
    
    console.log("Stopping video processing");
    this.processingActive = false;
    
    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    
    // Clean up video element
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }
    
    // Clean up canvas element
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      this.canvasElement = null;
    }
    
    // Clean up debug overlay
    if (this.debugOverlay) {
      document.body.removeChild(this.debugOverlay.parentNode);
      this.debugOverlay = null;
      this.debugContext = null;
    }
  }

  sendToBackend(landmarks) {
    // You can implement logic to send landmarks to a backend server here
    // For now, we'll just use the callback if provided
    if (this.onPoseDetectedCallback && typeof this.onPoseDetectedCallback === 'function') {
      this.onPoseDetectedCallback(landmarks);
    }
  }

  setOnPoseDetectedCallback(callback) {
    if (typeof callback === 'function') {
      this.onPoseDetectedCallback = callback;
    }
  }

  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    
    if (this.debugMode && !this.debugOverlay && this.processingActive) {
      this.initializeDebugOverlay();
    } else if (this.debugOverlay) {
      this.debugOverlay.parentNode.style.display = this.debugMode ? "block" : "none";
    }
    
    return this.debugMode;
  }

  initializeDebugOverlay() {
    // Create a wrapper div for the debug overlay
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.bottom = "20px";
    wrapper.style.right = "20px";
    wrapper.style.zIndex = "9999";
    
    // Create the canvas for drawing
    this.debugOverlay = document.createElement("canvas");
    this.debugOverlay.width = 320;
    this.debugOverlay.height = 240;
    this.debugOverlay.style.border = "2px solid #4CAF50";
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
    title.textContent = "Sign Language Debug";
    title.style.backgroundColor = "#4CAF50";
    title.style.color = "white";
    title.style.padding = "5px";
    title.style.textAlign = "center";
    title.style.borderTopLeftRadius = "5px";
    title.style.borderTopRightRadius = "5px";
    title.style.fontWeight = "bold";
    
    // Add FPS counter
    const fpsCounter = document.createElement("div");
    fpsCounter.id = "pose-fps-counter";
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
      const fpsEl = document.getElementById("pose-fps-counter");
      if (fpsEl) {
        fpsEl.textContent = `${this.fps} FPS`;
      }
    }, 1000);
  }

  drawKeypoints(landmarks) {
    if (!this.debugContext || !this.debugOverlay) return;
    
    // Clear the canvas
    this.debugContext.clearRect(0, 0, this.debugOverlay.width, this.debugOverlay.height);
    
    // Draw connecting lines for the body
    this.drawConnectors(landmarks, this.debugContext);
    
    // Draw each keypoint
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * this.debugOverlay.width;
      const y = landmark.y * this.debugOverlay.height;
      
      // Draw circle for keypoint
      this.debugContext.beginPath();
      this.debugContext.arc(x, y, 5, 0, 2 * Math.PI);
      
      // Color-code based on keypoint type (hands are important for sign language)
      if (index >= 15 && index <= 22) {
        // Hand keypoints (wrists, hands, fingers)
        this.debugContext.fillStyle = "rgba(255, 255, 0, 0.8)"; // Yellow
      } else {
        // Other body keypoints
        this.debugContext.fillStyle = "rgba(0, 255, 255, 0.6)"; // Cyan
      }
      
      this.debugContext.fill();
    });
    
    // Add frame timestamp
    this.debugContext.fillStyle = "white";
    this.debugContext.font = "12px Arial";
    this.debugContext.fillText(`Frame: ${new Date().toISOString().substr(11, 8)}`, 5, 15);
  }
  
  drawConnectors(landmarks, ctx) {
    // Define body connections
    const connections = [
      // Torso
      [11, 12], // Left shoulder to right shoulder
      [11, 23], // Left shoulder to left hip
      [12, 24], // Right shoulder to right hip
      [23, 24], // Left hip to right hip
      
      // Arms
      [11, 13], // Left shoulder to left elbow
      [13, 15], // Left elbow to left wrist
      [12, 14], // Right shoulder to right elbow
      [14, 16], // Right elbow to right wrist
      
      // Legs
      [23, 25], // Left hip to left knee
      [25, 27], // Left knee to left ankle
      [24, 26], // Right hip to right knee
      [26, 28], // Right knee to right ankle
    ];
    
    // Draw each connection
    ctx.strokeStyle = "rgba(0, 255, 0, 0.7)"; // Green
    ctx.lineWidth = 2;
    
    connections.forEach(([p1, p2]) => {
      if (landmarks[p1] && landmarks[p2] && 
          landmarks[p1].visibility > 0.6 && landmarks[p2].visibility > 0.6) {
        const x1 = landmarks[p1].x * this.debugOverlay.width;
        const y1 = landmarks[p1].y * this.debugOverlay.height;
        const x2 = landmarks[p2].x * this.debugOverlay.width;
        const y2 = landmarks[p2].y * this.debugOverlay.height;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });
  }
}