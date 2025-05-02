import { WebRTCMediaPipeConnector } from './WebRTCMediaPipeConnector.js';

export default class SignLanguageHandler {
    constructor() {
        this.isActive = false;
        this.stream = null;
        this.videoElement = null;
        this.canvasElement = null;
        this.debugMode = false;
        this.debugOverlay = null;
        this.debugContext = null;
        
        // Create WebRTC connector
        this.mediaPipeConnector = new WebRTCMediaPipeConnector();
        
        // Set up callback for landmark detection
        this.mediaPipeConnector.setLandmarksCallback(this.onLandmarksDetected.bind(this));
        
        // Set up callback for connection failures
        this.mediaPipeConnector.setConnectionFailCallback(this.onConnectionFailed.bind(this));
        
        // Variables for tracking state
        this.fps = 0;
        this.lastUpdateTime = 0;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
    }
    
    /**
     * Callback for connection failures
     * @param {string} state - The connection state that triggered the failure
     */
    onConnectionFailed(state) {
        console.error(`WebRTC connection failed: ${state}`);
        
        // Deactivate if active
        if (this.isActive) {
            this.deactivate();
            
            // Notify that screen sharing failed
            window.dispatchEvent(new CustomEvent('screenSharingFailed', {
                detail: { reason: `Connection failed: ${state}` }
            }));
            
            // Send message to the extension
            chrome.runtime.sendMessage({
                action: "signLanguageStatus",
                status: 'Error',
                message: `Connection failed: ${state}`
            });
        }
    }
    
    /**
     * Callback for when landmarks are detected
     * @param {Object} results - The landmark detection results
     */
    onLandmarksDetected(results) {
        // Calculate FPS
        const now = performance.now();
        this.fps = Math.round(1000 / (now - (this.lastUpdateTime || now)));
        this.lastUpdateTime = now;
        
        // Update hand landmarks
        this.leftHandLandmarks = this.findHandByType(results, 'Left');
        this.rightHandLandmarks = this.findHandByType(results, 'Right');
        
        // Draw landmarks if debug mode is active
        if (this.debugMode && this.debugOverlay) {
            this.drawHandLandmarks(results);
        }
        
        // Dispatch event with hand landmarks
        const event = new CustomEvent('handLandmarksDetected', {
            detail: {
                leftHand: this.leftHandLandmarks,
                rightHand: this.rightHandLandmarks,
                timestamp: now
            }
        });
        
        // Dispatch the event for other components to use
        window.dispatchEvent(event);
    }
    
    /**
     * Find a specific hand by type from results
     * @param {Object} results - The landmark detection results
     * @param {string} handType - 'Left' or 'Right'
     * @returns {Array|null} - The hand landmarks or null if not found
     */
    findHandByType(results, handType) {
        if (!results || !results.multiHandedness || !results.multiHandLandmarks) {
            return null;
        }
        
        for (let i = 0; i < results.multiHandedness.length; i++) {
            if (results.multiHandedness[i].label === handType) {
                return results.multiHandLandmarks[i];
            }
        }
        
        return null;
    }
    
 
    /**
     * Deactivate screen sharing and stop MediaPipe processing
     */
    deactivate() {
        if (!this.isActive) {
            console.log("Screen sharing already inactive");
            return;
        }
        
        console.log("Deactivating Screen Sharing");
        
        // Disconnect from MediaPipe server
        this.mediaPipeConnector.disconnect();
        
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
        
        // Clean up visualization element
        if (this.visualizationElement && this.visualizationElement.parentNode) {
            document.body.removeChild(this.visualizationElement.parentNode);
            this.visualizationElement = null;
        }
        
        // Reset hand landmarks
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        
        this.isActive = false;
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
 * Simplified video display initialization with better debugging
 */
initializeVideoDisplay() {
    // Create a container for the video
    const videoContainer = document.createElement("div");
    videoContainer.id = "sign-language-visualization-container";
    videoContainer.style.position = "fixed";
    videoContainer.style.bottom = "20px";
    videoContainer.style.right = "20px";
    videoContainer.style.zIndex = "9999";
    videoContainer.style.borderRadius = "8px";
    videoContainer.style.overflow = "hidden";
    videoContainer.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
    videoContainer.style.backgroundColor = "#111";
    videoContainer.style.width = "320px";
    
    // Create a title bar
    const titleBar = document.createElement("div");
    titleBar.textContent = "Sign Language Detection";
    titleBar.style.backgroundColor = "#4285F4";
    titleBar.style.color = "white";
    titleBar.style.padding = "8px";
    titleBar.style.textAlign = "center";
    titleBar.style.fontWeight = "bold";
    titleBar.style.fontSize = "14px";
    titleBar.style.position = "relative";
    
    // Create close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.position = "absolute";
    closeBtn.style.right = "8px";
    closeBtn.style.top = "6px";
    closeBtn.style.backgroundColor = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.color = "white";
    closeBtn.style.fontSize = "18px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.padding = "0 4px";
    closeBtn.onclick = () => {
        document.body.removeChild(videoContainer);
        this.visualizationElement = null;
    };
    
    // Create video element
    this.visualizationElement = document.createElement("video");
    this.visualizationElement.id = "sign-language-visualization-video";
    this.visualizationElement.autoplay = true;
    this.visualizationElement.playsInline = true;
    this.visualizationElement.muted = true;
    this.visualizationElement.style.width = "100%";
    this.visualizationElement.style.display = "block";
    this.visualizationElement.style.backgroundColor = "#000";
    
    // Add debug info display
    this.debugInfo = document.createElement("div");
    this.debugInfo.id = "sign-language-debug-info";
    this.debugInfo.textContent = "Initializing...";
    this.debugInfo.style.padding = "8px";
    this.debugInfo.style.color = "#aaa";
    this.debugInfo.style.fontSize = "12px";
    this.debugInfo.style.fontFamily = "monospace";
    
    // Add elements to container
    titleBar.appendChild(closeBtn);
    videoContainer.appendChild(titleBar);
    videoContainer.appendChild(this.visualizationElement);
    videoContainer.appendChild(this.debugInfo);
    
    // Add to document
    document.body.appendChild(videoContainer);
    
    return this.visualizationElement;
}

/**
 * Activate screen sharing and MediaPipe processing with improved error handling
 */
async activate() {
    if (this.isActive) {
        console.log("Screen sharing already active");
        return true;
    }
    
    console.log("Activating Screen Sharing with MediaPipe via WebRTC");
    
    try {
        // Initialize video display
        const visualizationElement = this.initializeVideoDisplay();
        this.updateDebugInfo("Requesting screen access...");
        
        // Request screen capture permission
        this.stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                frameRate: 30,
                cursor: "always"
            },
            audio: false
        });
        
        this.updateDebugInfo("Screen access granted. Setting up connection...");
        
        // Connect to the MediaPipe server
        const connected = await this.mediaPipeConnector.connect();
        if (!connected) {
            this.updateDebugInfo("Failed to connect to MediaPipe server");
            console.error("Failed to connect to MediaPipe server");
            return false;
        }
        
        this.updateDebugInfo("Connected to server. Setting up video stream...");
        
        // Set up video element for the stream
        this.videoElement = document.createElement("video");
        this.videoElement.srcObject = this.stream;
        this.videoElement.style.display = "none"; // Hide the source video element
        this.videoElement.autoplay = true;
        this.videoElement.playsInline = true;
        document.body.appendChild(this.videoElement);
        
        // Wait for video to be ready
        await new Promise((resolve) => {
            this.videoElement.onloadedmetadata = () => {
                console.log("Video metadata loaded");
                resolve();
            };
            // If already loaded, resolve immediately
            if (this.videoElement.readyState >= 2) {
                console.log("Video already loaded");
                resolve();
            }
        });
        
        // Start playing the source video
        await this.videoElement.play();
        console.log("Source video playback started");
        this.updateDebugInfo("Source video ready. Starting detection...");
        
        // Set up track receive handling
        this.mediaPipeConnector.pc.ontrack = (event) => {
            console.log(`Received track: ${event.track.kind}`);
            this.updateDebugInfo(`Received ${event.track.kind} track from server`);
            
            if (event.track.kind === 'video') {
                // Create a new MediaStream with the track
                const stream = new MediaStream([event.track]);
                
                // Attach the stream to the visualization element
                this.visualizationElement.srcObject = stream;
                this.visualizationElement.play().catch(err => {
                    console.error("Error playing visualization video:", err);
                    this.updateDebugInfo(`Error playing video: ${err.message}`);
                });
                
                // Debug visualization element
                console.log("Visualization element:", this.visualizationElement);
                console.log("Stream tracks:", stream.getTracks());
            }
        };
        
        // Start sending video to the WebRTC server
        const success = await this.mediaPipeConnector.startVideo(this.videoElement);
        if (!success) {
            this.updateDebugInfo("Failed to start video streaming");
            throw new Error("Failed to start video streaming to server");
        }
        
        this.updateDebugInfo("Video streaming started. Waiting for visualization...");
        
        // Handle stream ending (user stops sharing)
        this.stream.getVideoTracks()[0].onended = () => {
            console.log("Screen sharing stopped by user");
            this.deactivate();
            
            // Notify that screen sharing was stopped
            window.dispatchEvent(new CustomEvent('screenSharingEnded'));
            
            // Send message to the extension
            chrome.runtime.sendMessage({
                action: "signLanguageStatus",
                status: 'Off'
            });
        };
        
        this.isActive = true;
        return true;
        
    } catch (error) {
        console.error("Error activating sign language detection:", error);
        this.updateDebugInfo(`Error: ${error.message || error}`);
        
        // If the user cancels the screen sharing prompt
        if (error.name === 'NotAllowedError') {
            console.log("User denied screen capture permission");
            this.updateDebugInfo("Screen sharing permission denied");
        }
        
        // Clean up resources
        this.mediaPipeConnector.disconnect();
        return false;
    }
}

/**
 * Update the debug info panel with the latest status
 */
updateDebugInfo(message) {
    if (this.debugInfo) {
        const timestamp = new Date().toLocaleTimeString();
        this.debugInfo.textContent = `[${timestamp}] ${message}`;
        console.log(`Debug Info: ${message}`);
    }
}

    /**
     * Update the FPS display with the latest value
     * @param {number} fps - Frames per second value
     */
    updateFpsDisplay(fps) {
        if (this.fpsDisplay) {
            this.fpsDisplay.textContent = `FPS: ${fps.toFixed(1)}`;
            
            // Change color based on FPS quality
            if (fps >= 15) {
                this.fpsDisplay.style.color = "#4CAF50"; // Green for good FPS
            } else if (fps >= 8) {
                this.fpsDisplay.style.color = "#FFC107"; // Yellow for medium FPS
            } else {
                this.fpsDisplay.style.color = "#F44336"; // Red for low FPS
            }
        }
    }

  

    /**
     * Callback for when landmarks are detected
     * @param {Object} results - The landmark detection results
     */
    onLandmarksDetected(results) {
        // Extract the FPS from the results
        const fps = results.fps || 0;
        
        // Update the FPS display
        this.updateFpsDisplay(fps);
        
        // Update debug info
        this.updateDebugInfo(results);
        
        // Extract and process hand landmarks
        this.leftHandLandmarks = this.findHandByType(results.results, 'Left');
        this.rightHandLandmarks = this.findHandByType(results.results, 'Right');
        
        // Dispatch event with hand landmarks
        const event = new CustomEvent('handLandmarksDetected', {
            detail: {
                leftHand: this.leftHandLandmarks,
                rightHand: this.rightHandLandmarks,
                poseLandmarks: results.results.poseLandmarks,
                timestamp: results.timestamp,
                fps: fps
            }
        });
        
        // Dispatch the event for other components to use
        window.dispatchEvent(event);
    }
            

    /**
     * Toggle screen sharing state
     * @returns {Promise<boolean>} The new active state
     */
    async toggle() {
        if (this.isActive) {
            this.deactivate();
            return false;
        } else {
            return await this.activate();
        }
    }
    
    /**
     * Toggle debug visualization mode
     * @returns {boolean} The new debug mode state
     */
    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        
        if (this.debugMode && !this.debugOverlay && this.isActive) {
            this.initializeDebugOverlay();
        } else if (this.debugOverlay) {
            this.debugOverlay.parentNode.style.display = this.debugMode ? "block" : "none";
        }
        
        return this.debugMode;
    }
    
    /**
     * Get debug information about the current state
     * @returns {Object} Current state information
     */
    getDebugInfo() {
        return {
            isActive: this.isActive,
            serverConnected: this.mediaPipeConnector.isConnected,
            streamActive: this.stream !== null && 
                this.stream.getVideoTracks().some(track => track.readyState === 'live'),
            videoElementActive: this.videoElement !== null,
            fps: this.fps,
            lastUpdateTime: this.lastUpdateTime,
            leftHandDetected: this.leftHandLandmarks !== null,
            rightHandDetected: this.rightHandLandmarks !== null,
            debugMode: this.debugMode
        };
    }
}