// SignLanguageHandler.js - Clean display with minimal clutter
export default class SignLanguageHandler {
    constructor() {
        this.isActive = false;
        this.serverUrl = 'http://localhost:8766';
        this.peerConnection = null;
        this.dataChannel = null;
        this.stream = null;
        
        // Video elements
        this.videoElement = null;
        this.displayElement = null;
        
        // Landmark data
        this.faceLandmarks = null;
        this.poseLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        
        // Performance tracking
        this.lastFrameTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        
        // Server performance data
        this.serverPerformanceData = null;
        this.lastLandmarkUpdate = null;
        
        // Translation data - NEW
        this.lastTranslation = null;
        this.translationHistory = [];

        // Display preferences
        this.showDetailedInfo = false;  // Toggle for detailed technical info
    }
    
    // Activate screen sharing and WebRTC connection
    async activate() {
        if (this.isActive) {
            console.log("[SignLanguageHandler] Already active");
            return true;
        }
        
        try {
            console.log("[SignLanguageHandler] Starting activation process");
            
            // Step 1: Test server connectivity
            console.log("[SignLanguageHandler] Step 1: Testing server connectivity");
            const serverAvailable = await this.pingServer();
            console.log("[SignLanguageHandler] Server availability:", serverAvailable);
            
            if (!serverAvailable) {
                throw new Error("Python MediaPipe server is not available");
            }
            
            // Step 2: Create video elements
            console.log("[SignLanguageHandler] Step 2: Creating video elements");
            this.createVideoElements();
            
            // Step 3: Request screen sharing
            console.log("[SignLanguageHandler] Step 3: Requesting screen sharing");
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                    cursor: 'always',
                    frameRate: { ideal: 30, max: 30 },
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                },
                audio: false
            });
            
            console.log("[SignLanguageHandler] Screen sharing granted, stream obtained:", this.stream);
            
            // Step 4: Set up video element
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            console.log("[SignLanguageHandler] Video element playing");
            
            // Step 5: Create RTCPeerConnection
            console.log("[SignLanguageHandler] Step 5: Creating RTCPeerConnection");
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            // Add comprehensive connection state monitoring
            this.peerConnection.onconnectionstatechange = () => {
                console.log(`[SignLanguageHandler] Connection state changed to: ${this.peerConnection.connectionState}`);
                
                if (this.peerConnection.connectionState === 'connected') {
                    console.log('[SignLanguageHandler] WebRTC connection successfully established!');
                } else if (this.peerConnection.connectionState === 'failed') {
                    console.error('[SignLanguageHandler] WebRTC connection failed!');
                    this.deactivate();
                }
            };
            
            // Monitor ICE connection state
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log(`[SignLanguageHandler] ICE connection state: ${this.peerConnection.iceConnectionState}`);
            };
            
            // Monitor ICE gathering state
            this.peerConnection.onicegatheringstatechange = () => {
                console.log(`[SignLanguageHandler] ICE gathering state: ${this.peerConnection.iceGatheringState}`);
            };
            
            // Step 6: Create data channel BEFORE adding tracks
            console.log("[SignLanguageHandler] Step 6: Creating data channel");
            this.dataChannel = this.peerConnection.createDataChannel('holistic-landmarks');
            this.setupDataChannelHandlers();
            console.log("[SignLanguageHandler] Data channel created and handlers set up");
            
            // Step 7: Set up track handler
            this.peerConnection.ontrack = (event) => {
                console.log(`[SignLanguageHandler] Received ${event.track.kind} track from server`);
                this.displayElement.srcObject = new MediaStream([event.track]);
                this.displayElement.play().catch(e => {
                    console.error("[SignLanguageHandler] Error playing display video:", e);
                });
            };
            
            // Step 8: Add tracks to peer connection
            console.log("[SignLanguageHandler] Step 8: Adding tracks to peer connection");
            this.stream.getTracks().forEach(track => {
                console.log(`[SignLanguageHandler] Adding ${track.kind} track to peer connection`);
                this.peerConnection.addTrack(track, this.stream);
            });
            
            // Step 9: Create and send offer
            console.log("[SignLanguageHandler] Step 9: Creating offer");
            const offer = await this.peerConnection.createOffer();
            console.log("[SignLanguageHandler] Offer created:", offer);
            
            await this.peerConnection.setLocalDescription(offer);
            console.log("[SignLanguageHandler] Local description set");
            
            // Step 10: Wait for ICE gathering to complete
            console.log("[SignLanguageHandler] Step 10: Waiting for ICE gathering");
            await new Promise(resolve => {
                if (this.peerConnection.iceGatheringState === 'complete') {
                    console.log("[SignLanguageHandler] ICE gathering already complete");
                    resolve();
                } else {
                    this.peerConnection.onicegatheringstatechange = () => {
                        console.log(`[SignLanguageHandler] ICE gathering state changed to: ${this.peerConnection.iceGatheringState}`);
                        if (this.peerConnection.iceGatheringState === 'complete') {
                            console.log("[SignLanguageHandler] ICE gathering completed");
                            resolve();
                        }
                    };
                }
            });
            
            // Step 11: Send offer to server
            console.log("[SignLanguageHandler] Step 11: Sending offer to server");
            const response = await fetch(`${this.serverUrl}/offer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sdp: {
                        type: this.peerConnection.localDescription.type,
                        sdp: this.peerConnection.localDescription.sdp
                    }
                })
            });
            
            console.log("[SignLanguageHandler] Server response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const answer = await response.json();
            console.log("[SignLanguageHandler] Received answer from server:", answer);
            
            // Step 12: Set remote description
            console.log("[SignLanguageHandler] Step 12: Setting remote description");
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));
            console.log("[SignLanguageHandler] Remote description set successfully");
            
            console.log("[SignLanguageHandler] WebRTC connection process completed");
            this.isActive = true;
            this.showVideoContainer();
            
            return true;
            
        } catch (error) {
            console.error('[SignLanguageHandler] Error during activation:', error);
            this.cleanupResources();
            window.dispatchEvent(new CustomEvent('screenSharingFailed', {
                detail: { reason: error.message || error.name || "Unknown error" }
            }));
            return false;
        }
    }
    
    /**
     * Set up data channel handlers with focus on essential information
     * Log detailed info to console but only show key metrics in UI
     */
    setupDataChannelHandlers() {
        console.log("[SignLanguageHandler] Setting up data channel handlers");
        
        this.dataChannel.onopen = () => {
            console.log("[SignLanguageHandler] 🎉 DATA CHANNEL OPENED SUCCESSFULLY!");
            this.updateConnectionStatus('connected');
            
            setTimeout(() => {
                if (this.dataChannel.readyState === 'open') {
                    console.log("[SignLanguageHandler] Sending initial requests to server");
                    this.dataChannel.send('get_landmarks');
                    this.dataChannel.send('get_performance');
                }
            }, 1000);
            this.landmarkInterval = setInterval(() => {
            if (this.dataChannel.readyState === 'open') {
            console.log("[SignLanguageHandler] Sending periodic requests to server");
            this.dataChannel.send('get_translation'); // NEW: Request translation data
                }
            }, 1000);

        };
        
        this.dataChannel.onclose = () => {
            console.log("[SignLanguageHandler] ❌ Data channel closed");
            this.updateConnectionStatus('disconnected');
        };
        
        this.dataChannel.onerror = (error) => {
            console.error("[SignLanguageHandler] ❌ Data channel error:", error);
        };
        
        this.dataChannel.onmessage = (event) => {
            // console.log("[SignLanguageHandler] 📨 Received message from server:", event.data);
            
            try {
                const data = JSON.parse(event.data);
                console.log('[SignLanguageHandler] Parsed message:', data.type, data);
                
                // Handle different types of server messages
                if (data.type === 'holistic_landmarks') {
                    this.processLandmarksData(data);
                } else if (data.type === 'performance_stats') {
                    this.processPerformanceData(data);
                } else if (data.type === 'translation') {
                    // NEW: Handle translation messages from the server
                    console.log("[SignLanguageHandler] 🤟 Translation message received:", data);
                    this.processTranslationData(data);
                } else if (data.type === 'stats' && data.fps !== undefined) {
                    this.fps = data.fps;
                    this.updateFPSDisplay();
                }
                
            } catch (error) {
                console.error("[SignLanguageHandler] Error parsing data channel message:", error);
            }
        };
    }
    
    /**
     * Process landmarks data and update UI with clean, essential information
     */
    processLandmarksData(data) {
        // Update landmark state
        this.faceLandmarks = data.has_face ? {} : null;
        this.poseLandmarks = data.has_pose ? (data.pose_info || {}) : null;
        this.leftHandLandmarks = data.has_left_hand ? {} : null;
        this.rightHandLandmarks = data.has_right_hand ? {} : null;
        
        // Store for reference
        this.lastLandmarkUpdate = {
            timestamp: Date.now(),
            frame_id: data.frame_id,
            quality_score: data.quality_score,
            processing_scale: data.processing_scale
        };
        
        // Update UI with clean detection status
        this.updateDetectionStatus(data);
        
        // Dispatch event for other components
        const event = new CustomEvent('handLandmarksDetected', {
            detail: {
                leftHand: this.leftHandLandmarks,
                rightHand: this.rightHandLandmarks,
                face: this.faceLandmarks,
                pose: this.poseLandmarks,
                fps: this.fps,
                timestamp: Date.now(),
                frameId: data.frame_id,
                qualityScore: data.quality_score
            }
        });
        window.dispatchEvent(event);
    }

     /**
     * NEW: Process translation data received from the MediaPipe server
     */
     processTranslationData(data) {
        console.log("[SignLanguageHandler] Translation received:", data.text);
        
        // Store the translation data
        this.lastTranslation = {
            text: data.text,
            timestamp: Date.now(),
            confidence: data.confidence || null, // if server provides confidence scores
            words: data.words || null // if server provides individual words
        };
        
        // Add to translation history (keep last 10 translations)
        this.translationHistory.push(this.lastTranslation);
        if (this.translationHistory.length > 10) {
            this.translationHistory.shift(); // Remove oldest translation
        }
        
        // Dispatch custom event for the content script to listen to
        const translationEvent = new CustomEvent('signLanguageTranslation', {
            detail: {
                translatedText: data.text,
                timestamp: this.lastTranslation.timestamp,
                confidence: data.confidence,
                words: data.words,
                translationHistory: this.translationHistory
            }
        });
        
        // Dispatch the event so content script can catch it
        window.dispatchEvent(translationEvent);
        
        // Also log for debugging
        console.log(`[SignLanguageHandler] Dispatched translation event: "${data.text}"`);
    }

     /**
     * NEW: Get the most recent translation
     */
     getLastTranslation() {
        return this.lastTranslation;
    }
    
    /**
     * NEW: Get translation history
     */
    getTranslationHistory() {
        return this.translationHistory;
    }
    
    /**
     * NEW: Clear translation history
     */
    clearTranslationHistory() {
        this.translationHistory = [];
        this.lastTranslation = null;
        console.log("[SignLanguageHandler] Translation history cleared");
    }
    
    /**
     * Process performance data and update FPS display
     */
    processPerformanceData(data) {
        // Store server performance data for reference
        this.serverPerformanceData = data;
        
        // Update FPS from server data
        if (data.output_fps !== undefined) {
            this.fps = data.output_fps;
        }
        
        // Update FPS display with current data
        this.updateFPSDisplay();
        
        // Log detailed performance info to console only
        if (this.showDetailedInfo) {
            console.log(`[SignLanguageHandler] Server performance: ${data.output_fps?.toFixed(1) || 'N/A'} FPS, ${data.avg_processing_ms?.toFixed(1) || 'N/A'}ms processing, Quality: ${data.quality_score?.toFixed(2) || 'N/A'}`);
        }
    }
    
    /**
     * Update connection status in a subtle way
     */
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            switch(status) {
                case 'connected':
                    statusElement.textContent = 'Connected';
                    statusElement.style.color = '#4CAF50';
                    break;
                case 'disconnected':
                    statusElement.textContent = 'Disconnected';
                    statusElement.style.color = '#F44336';
                    break;
                default:
                    statusElement.textContent = 'Connecting...';
                    statusElement.style.color = '#FFC107';
            }
        }
    }
    
    /**
     * Update FPS display with clean styling
     */
    updateFPSDisplay() {
        const fpsElement = document.getElementById('signLanguageFPS');
        if (fpsElement) {
            const displayFPS = this.fps || 0;
            fpsElement.textContent = `${displayFPS.toFixed(1)} FPS`;
            
            // Clean color coding based on performance
            if (displayFPS >= 20) {
                fpsElement.style.color = '#4CAF50'; // Green - excellent
            } else if (displayFPS >= 10) {
                fpsElement.style.color = '#FFC107'; // Yellow - good
            } else if (displayFPS > 0) {
                fpsElement.style.color = '#FF9800'; // Orange - poor
            } else {
                fpsElement.style.color = '#F44336'; // Red - no data
            }
        }
    }
    
    /**
     * Update detection status with clean, readable format
     */
    updateDetectionStatus(data) {
        const detectionElement = document.getElementById('signLanguageDetection');
        if (detectionElement) {
            const detectedParts = [];
            if (data.has_face) detectedParts.push("Face");
            if (data.has_pose) detectedParts.push("Pose");
            if (data.has_left_hand) detectedParts.push("Left Hand");
            if (data.has_right_hand) detectedParts.push("Right Hand");
            
            if (detectedParts.length > 0) {
                detectionElement.textContent = `${detectedParts.join(" • ")}`;
                detectionElement.style.color = '#4CAF50';
            } else {
                detectionElement.textContent = 'No detection';
                detectionElement.style.color = '#999';
            }
        }
        
        // Update FPS as well since we have fresh data
        this.updateFPSDisplay();
    }
    
    /**
     * Toggle detailed information display
     */
    toggleDetailedInfo() {
        this.showDetailedInfo = !this.showDetailedInfo;
        console.log(`[SignLanguageHandler] Detailed info ${this.showDetailedInfo ? 'enabled' : 'disabled'}`);
        return this.showDetailedInfo;
    }
    
    /**
     * Create clean, minimal UI that focuses on essential information
     */
    createVideoElements() {
        let container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            document.body.removeChild(container);
        }
        
        container = document.createElement('div');
        container.id = 'signLanguageVideoContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = '300px';  // Compact width
        container.style.height = 'auto';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';  // Slightly transparent
        container.style.border = '1px solid #00BCD4';
        container.style.borderRadius = '8px';
        container.style.padding = '8px';
        container.style.zIndex = '9999';
        container.style.boxShadow = '0 2px 15px rgba(0,0,0,0.3)';
        container.style.display = 'none';
        container.style.backdropFilter = 'blur(10px)';  // Modern glass effect
        
        // Clean title bar
        const titleBar = document.createElement('div');
        titleBar.style.display = 'flex';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.alignItems = 'center';
        titleBar.style.marginBottom = '8px';
        
        const title = document.createElement('div');
        title.textContent = 'MediaPipe Detection';
        title.style.color = 'white';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '12px';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = '#999';
        closeButton.style.fontSize = '16px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0';
        closeButton.style.width = '20px';
        closeButton.style.height = '20px';
        closeButton.onclick = () => {
            container.style.display = 'none';
        };
        
        // Add hover effect to close button
        closeButton.onmouseenter = () => closeButton.style.color = 'white';
        closeButton.onmouseleave = () => closeButton.style.color = '#999';
        
        titleBar.appendChild(title);
        titleBar.appendChild(closeButton);
        container.appendChild(titleBar);
        
        // Hidden input video element
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.display = 'none';
        container.appendChild(this.videoElement);
        
        // Main display video with clean styling
        this.displayElement = document.createElement('video');
        this.displayElement.autoplay = true;
        this.displayElement.playsInline = true;
        this.displayElement.style.width = '100%';
        this.displayElement.style.borderRadius = '4px';
        this.displayElement.style.backgroundColor = '#000';
        container.appendChild(this.displayElement);
        
        // Minimal status bar with essential information only
        const statusBar = document.createElement('div');
        statusBar.style.display = 'flex';
        statusBar.style.justifyContent = 'space-between';
        statusBar.style.alignItems = 'center';
        statusBar.style.marginTop = '8px';
        statusBar.style.fontSize = '11px';
        
        // FPS display (left side)
        const fpsDisplay = document.createElement('div');
        fpsDisplay.id = 'signLanguageFPS';
        fpsDisplay.textContent = '0.0 FPS';
        fpsDisplay.style.color = '#F44336';
        fpsDisplay.style.fontWeight = 'bold';
        
        // Connection status (center)
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'connectionStatus';
        connectionStatus.textContent = 'Connecting...';
        connectionStatus.style.color = '#FFC107';
        connectionStatus.style.fontSize = '10px';
        
        // Detection status (right side)
        const detectionStatus = document.createElement('div');
        detectionStatus.id = 'signLanguageDetection';
        detectionStatus.textContent = 'Initializing...';
        detectionStatus.style.color = '#999';
        detectionStatus.style.fontSize = '10px';
        detectionStatus.style.textAlign = 'right';
        
        statusBar.appendChild(fpsDisplay);
        statusBar.appendChild(connectionStatus);
        statusBar.appendChild(detectionStatus);
        container.appendChild(statusBar);
        
        // Optional: Add a subtle toggle for detailed info (double-click to enable)
        container.addEventListener('dblclick', () => {
            this.toggleDetailedInfo();
        });
        
        document.body.appendChild(container);
    }
    
    showVideoContainer() {
        const container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            container.style.display = 'block';
        }
    }
    
    deactivate() {
        if (!this.isActive) {
            console.log("[SignLanguageHandler] Already inactive");
            return;
        }
        
        console.log("[SignLanguageHandler] Deactivating");
        
        const container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            container.style.display = 'none';
        }
        
        if (this.landmarksInterval) {
            clearInterval(this.landmarksInterval);
            this.landmarksInterval = null;
        }
        
        this.cleanupResources();
        this.isActive = false;
    }
    
    cleanupResources() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        if (this.displayElement) {
            this.displayElement.srcObject = null;
        }
        
        // Reset all state
        this.faceLandmarks = null;
        this.poseLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        this.serverPerformanceData = null;
        this.lastLandmarkUpdate = null;
        this.fps = 0;
    }
    
    async pingServer() {
        try {
            console.log('[SignLanguageHandler] Testing server connection...');
            const response = await fetch(`${this.serverUrl}/ping`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`[SignLanguageHandler] Server responded: ${data.message}`);
                return true;
            } else {
                console.log(`[SignLanguageHandler] Server returned status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error(`[SignLanguageHandler] Server connection test failed: ${error.message}`);
            return false;
        }
    }
    
    getDebugInfo() {
        return {
            isActive: this.isActive,
            connectionState: this.peerConnection ? this.peerConnection.connectionState : 'none',
            dataChannelState: this.dataChannel ? this.dataChannel.readyState : 'none',
            streamActive: this.stream !== null && 
                this.stream.getVideoTracks().some(track => track.readyState === 'live'),
            fps: this.fps,
            faceLandmarks: this.faceLandmarks !== null,
            poseLandmarks: this.poseLandmarks !== null,
            leftHandLandmarks: this.leftHandLandmarks !== null,
            rightHandLandmarks: this.rightHandLandmarks !== null,
            serverPerformanceData: this.serverPerformanceData,
            lastLandmarkUpdate: this.lastLandmarkUpdate,
            showDetailedInfo: this.showDetailedInfo
        };
    }
}