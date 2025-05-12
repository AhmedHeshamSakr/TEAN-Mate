// SignLanguageHandler.js - With visual display of processed video
export default class SignLanguageHandler {
    constructor() {
        this.isActive = false;
        this.serverUrl = 'http://localhost:8765';
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
    }
    
    // Activate screen sharing and WebRTC connection
    async activate() {
        if (this.isActive) {
            console.log("[SignLanguageHandler] Already active");
            return true;
        }
        
        try {
            console.log("[SignLanguageHandler] Step 1: Testing server connectivity");
            // Check server connectivity
            const serverAvailable = await this.pingServer();
            if (!serverAvailable) {
                throw new Error("Python MediaPipe server is not available");
            }
            
            console.log("[SignLanguageHandler] Step 2: Creating video elements");
            // Create video elements for display
            this.createVideoElements();
            
            console.log("[SignLanguageHandler] Step 3: Requesting screen sharing permission");
            // Request screen sharing
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                    cursor: 'always',
                    frameRate: { ideal: 30 }
                },
                audio: false
            });
            
            // Display local stream
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            
            // Handle stream ending (user stops sharing)
            this.stream.getVideoTracks()[0].onended = () => {
                console.log("[SignLanguageHandler] Screen sharing stopped by user");
                this.deactivate();
                window.dispatchEvent(new CustomEvent('screenSharingEnded'));
            };
            
            console.log("[SignLanguageHandler] Step 4: Creating WebRTC connection");
            // Create RTCPeerConnection
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log(`[SignLanguageHandler] Connection state: ${this.peerConnection.connectionState}`);
                
                if (this.peerConnection.connectionState === 'disconnected' || 
                    this.peerConnection.connectionState === 'failed' ||
                    this.peerConnection.connectionState === 'closed') {
                    this.deactivate();
                }
            };
            
            // Create data channel
            this.dataChannel = this.peerConnection.createDataChannel('holistic-landmarks');
            
            // Set up data channel handlers
            this.dataChannel.onopen = () => {
                console.log("[SignLanguageHandler] Data channel opened");
            };
            
            this.dataChannel.onclose = () => {
                console.log("[SignLanguageHandler] Data channel closed");
            };
            
            this.dataChannel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'holistic_landmarks') {
                        // Process landmarks data
                        this.processLandmarks(data);
                    } else if (data.type === 'stats' && data.fps !== undefined) {
                        // Update FPS
                        this.fps = data.fps;
                    }
                } catch (error) {
                    console.error("[SignLanguageHandler] Error parsing data channel message:", error);
                }
            };
            
            // Handle incoming processed video
            this.peerConnection.ontrack = (event) => {
                console.log(`[SignLanguageHandler] Received ${event.track.kind} track from server`);
                
                // Display the processed video with landmarks
                this.displayElement.srcObject = new MediaStream([event.track]);
                this.displayElement.play().catch(e => {
                    console.error("[SignLanguageHandler] Error playing display video:", e);
                });
            };
            
            // Add stream tracks to peer connection
            this.stream.getTracks().forEach(track => {
                console.log(`[SignLanguageHandler] Adding ${track.kind} track to peer connection`);
                this.peerConnection.addTrack(track, this.stream);
            });
            
            console.log("[SignLanguageHandler] Step 5: Creating and sending offer");
            // Create offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // Wait for ICE gathering to complete
            await new Promise(resolve => {
                if (this.peerConnection.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    this.peerConnection.onicegatheringstatechange = () => {
                        if (this.peerConnection.iceGatheringState === 'complete') {
                            resolve();
                        }
                    };
                }
            });
            
            // Send offer to server
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
            
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            
            const answer = await response.json();
            
            // Set remote description
            await this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer.sdp)
            );
            
            console.log("[SignLanguageHandler] WebRTC connection established");
            this.isActive = true;
            
            // Show the video display container
            this.showVideoContainer();
            
            // Request landmarks periodically
            this.landmarksInterval = setInterval(() => {
                if (this.dataChannel && this.dataChannel.readyState === 'open') {
                    this.dataChannel.send('get_landmarks');
                }
            }, 5000); // Every 5 seconds
            
            return true;
            
        } catch (error) {
            console.error('[SignLanguageHandler] Error activating screen sharing:', error);
            
            // Clean up resources
            this.cleanupResources();
            
            // Dispatch error event
            window.dispatchEvent(new CustomEvent('screenSharingFailed', {
                detail: {
                    reason: error.message || error.name || "Unknown error"
                }
            }));
            
            return false;
        }
    }
    
    // Create video elements for display
    createVideoElements() {
        // Check if container already exists
        let container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            // Remove existing container
            document.body.removeChild(container);
        }
        
        // Create container
        container = document.createElement('div');
        container.id = 'signLanguageVideoContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = '320px';
        container.style.height = 'auto';
        container.style.backgroundColor = '#000';
        container.style.border = '2px solid #00BCD4';
        container.style.borderRadius = '8px';
        container.style.padding = '10px';
        container.style.zIndex = '9999';
        container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
        container.style.display = 'none'; // Hidden initially
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'MediaPipe Holistic Detection';
        title.style.color = 'white';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '5px';
        title.style.display = 'flex';
        title.style.justifyContent = 'space-between';
        title.style.alignItems = 'center';
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = 'white';
        closeButton.style.fontSize = '20px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.marginLeft = '10px';
        closeButton.onclick = () => {
            container.style.display = 'none';
        };
        
        title.appendChild(closeButton);
        container.appendChild(title);
        
        // Create the input video (hidden)
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.display = 'none';
        container.appendChild(this.videoElement);
        
        // Create the display video
        this.displayElement = document.createElement('video');
        this.displayElement.autoplay = true;
        this.displayElement.playsInline = true;
        this.displayElement.style.width = '100%';
        this.displayElement.style.borderRadius = '4px';
        container.appendChild(this.displayElement);
        
        // Add FPS counter
        const fpsCounter = document.createElement('div');
        fpsCounter.id = 'signLanguageFPS';
        fpsCounter.textContent = 'FPS: 0.0';
        fpsCounter.style.color = 'white';
        fpsCounter.style.fontSize = '12px';
        fpsCounter.style.margin = '5px 0';
        container.appendChild(fpsCounter);
        
        // Add detection status
        const detectionStatus = document.createElement('div');
        detectionStatus.id = 'signLanguageDetection';
        detectionStatus.textContent = 'No landmarks detected';
        detectionStatus.style.color = 'white';
        detectionStatus.style.fontSize = '12px';
        detectionStatus.style.margin = '5px 0';
        container.appendChild(detectionStatus);
        
        // Add to document
        document.body.appendChild(container);
    }
    
    // Show the video container
    showVideoContainer() {
        const container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            container.style.display = 'block';
        }
    }
    
    // Deactivate screen sharing and close WebRTC connection
    deactivate() {
        if (!this.isActive) {
            console.log("[SignLanguageHandler] Already inactive");
            return;
        }
        
        console.log("[SignLanguageHandler] Deactivating");
        
        // Hide video container
        const container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            container.style.display = 'none';
        }
        
        // Clear landmarks interval
        if (this.landmarksInterval) {
            clearInterval(this.landmarksInterval);
            this.landmarksInterval = null;
        }
        
        // Clean up resources
        this.cleanupResources();
        
        this.isActive = false;
    }
    
    // Clean up resources
    cleanupResources() {
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // Stop stream tracks
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Clean up video elements
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        if (this.displayElement) {
            this.displayElement.srcObject = null;
        }
        
        // Reset landmarks data
        this.faceLandmarks = null;
        this.poseLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
    }
    
    // Process landmarks data from server
    processLandmarks(data) {
        // Update landmarks status
        this.faceLandmarks = data.has_face ? {} : null;
        this.poseLandmarks = data.has_pose ? data.pose_info : null;
        this.leftHandLandmarks = data.has_left_hand ? {} : null;
        this.rightHandLandmarks = data.has_right_hand ? {} : null;
        
        // Update UI
        this.updateDetectionUI(data);
        
        // Dispatch event with detection results
        const event = new CustomEvent('handLandmarksDetected', {
            detail: {
                leftHand: this.leftHandLandmarks,
                rightHand: this.rightHandLandmarks,
                face: this.faceLandmarks,
                pose: this.poseLandmarks,
                fps: this.fps,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
    }
    
    // Update detection UI
    updateDetectionUI(data) {
        // Update FPS counter
        const fpsElement = document.getElementById('signLanguageFPS');
        if (fpsElement) {
            fpsElement.textContent = `FPS: ${this.fps.toFixed(1)}`;
            
            // Color code based on performance
            if (this.fps >= 20) {
                fpsElement.style.color = '#4CAF50'; // Green
            } else if (this.fps >= 10) {
                fpsElement.style.color = '#FFC107'; // Yellow
            } else {
                fpsElement.style.color = '#F44336'; // Red
            }
        }
        
        // Update detection status
        const detectionElement = document.getElementById('signLanguageDetection');
        if (detectionElement) {
            // Build detection text
            const detectedParts = [];
            if (data.has_face) detectedParts.push("Face");
            if (data.has_pose) detectedParts.push("Pose");
            if (data.has_left_hand) detectedParts.push("Left Hand");
            if (data.has_right_hand) detectedParts.push("Right Hand");
            
            if (detectedParts.length > 0) {
                detectionElement.textContent = `Detected: ${detectedParts.join(", ")}`;
                detectionElement.style.color = '#4CAF50'; // Green
            } else {
                detectionElement.textContent = 'No landmarks detected';
                detectionElement.style.color = '#F44336'; // Red
            }
        }
    }
    
    // Ping server to test connectivity
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
    
    // Get debug information
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
            rightHandLandmarks: this.rightHandLandmarks !== null
        };
    }
}