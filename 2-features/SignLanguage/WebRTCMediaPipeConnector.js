/**
 * WebRTC-based connector for MediaPipe hand landmark detection
 */
export class WebRTCMediaPipeConnector {
    constructor() {
        this.serverUrl = "http://localhost:9000";
        this.pc = null; // This is null initially
        this.dataChannel = null;
        this.isConnected = false;
        this.onLandmarksDetected = null;
        this.connectionFailCallback = null;
        this.videoElement = null;
        this.localStream = null;
        this.connectionTimeout = null;
        this.pingInterval = null;
        this.visualizationStream = null;
        
        // We'll set event handlers when we create the connection, not here
    }
    
    /**
     * Connect to the MediaPipe WebRTC server
     * @returns {Promise<boolean>} Whether connection was successful
     */
    async connect() {
        return new Promise(async (resolve, reject) => {
            // Clean up any existing connection
            this.disconnect();
            
            console.log("Connecting to MediaPipe server via WebRTC...");
            
            try {
                // Create peer connection
                this.pc = new RTCPeerConnection({
                    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
                });
                
                // Now that this.pc exists, we can set up event handlers
                this.pc.onconnectionstatechange = () => {
                    console.log(`WebRTC connection state: ${this.pc.connectionState}`);
                    
                    if (this.pc.connectionState === 'connected') {
                        clearTimeout(this.connectionTimeout);
                        this.isConnected = true;
                        console.log("WebRTC connected successfully");
                        
                        // Start ping interval to keep connection alive
                        this.pingInterval = setInterval(() => {
                            if (this.isConnected && this.dataChannel && 
                                this.dataChannel.readyState === 'open') {
                                this.dataChannel.send(JSON.stringify({ type: 'ping' }));
                            }
                        }, 30000); // Ping every 30 seconds
                        
                        resolve(true);
                    } else if (this.pc.connectionState === 'failed' || 
                               this.pc.connectionState === 'disconnected' ||
                               this.pc.connectionState === 'closed') {
                        
                        clearTimeout(this.connectionTimeout);
                        this.isConnected = false;
                        
                        console.error(`WebRTC connection ${this.pc.connectionState}`);
                        
                        // Notify callback if provided
                        if (this.connectionFailCallback) {
                            this.connectionFailCallback(this.pc.connectionState);
                        }
                        
                        if (!this.isConnected) {
                            reject(new Error(`Connection ${this.pc.connectionState}`));
                        }
                    }
                };

                this.pc.oniceconnectionstatechange = () => {
                    console.log(`ICE connection state: ${this.pc.iceConnectionState}`);
                };

                this.pc.onicegatheringstatechange = () => {
                    console.log(`ICE gathering state: ${this.pc.iceGatheringState}`);
                };
                
                // Set connection timeout
                this.connectionTimeout = setTimeout(() => {
                    if (!this.isConnected) {
                        console.error("WebRTC connection timed out");
                        this.disconnect();
                        reject(new Error("Connection timeout"));
                    }
                }, 10000);
                
                // Handle ICE candidate events
                this.pc.onicecandidate = (event) => {
                    if (event.candidate === null) {
                        // ICE gathering completed
                        console.log("ICE gathering completed");
                    }
                };
                
                // Create data channel for receiving hand detection results
                this.dataChannel = this.pc.createDataChannel("mediapipe-results");
                this.dataChannel.onopen = () => {
                    console.log("Data channel opened");
                };
                
                this.dataChannel.onclose = () => {
                    console.log("Data channel closed");
                };
                
                this.dataChannel.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        
                        if (data.type === 'hand_detection') {
                            // Call callback if provided
                            if (this.onLandmarksDetected && typeof this.onLandmarksDetected === 'function') {
                                this.onLandmarksDetected(data);
                            }
                        } else if (data.type === 'error') {
                            console.error("MediaPipe server error:", data.message);
                        }
                    } catch (error) {
                        console.error("Error parsing message:", error);
                    }
                };
                
                // Handle tracks received from the server
                this.pc.ontrack = (event) => {
                    console.log(`Received ${event.track.kind} track from server`);
                    
                    if (event.track.kind === 'video') {
                        // Create a new MediaStream for the visualization
                        this.visualizationStream = new MediaStream([event.track]);
                        
                        // Emit an event that the visualization track is ready
                        const trackReadyEvent = new CustomEvent('visualizationTrackReady', {
                            detail: {
                                stream: this.visualizationStream
                            }
                        });
                        window.dispatchEvent(trackReadyEvent);
                    }
                };
                
                // Create and send offer to the server
                const offer = await this.pc.createOffer({
                    offerToReceiveVideo: true, // We want to receive video from the server
                    offerToReceiveAudio: false
                });
                await this.pc.setLocalDescription(offer);
                
                // Wait for ICE gathering to complete and then send offer
                if (this.pc.iceGatheringState === 'complete') {
                    this.sendOfferToServer();
                } else {
                    // Wait for ICE gathering to complete
                    const checkState = () => {
                        if (this.pc.iceGatheringState === 'complete') {
                            this.sendOfferToServer();
                        } else {
                            setTimeout(checkState, 500);
                        }
                    };
                    setTimeout(checkState, 500);
                }
            } catch (error) {
                console.error("Error creating WebRTC connection:", error);
                this.disconnect();
                reject(error);
            }
        });
    }
    
    /**
     * Send the offer to the server and handle the response
     */
    async sendOfferToServer() {
        try {
            console.log("Sending offer to server:", this.pc.localDescription);
            
            // Send the offer to the server
            const response = await fetch(`${this.serverUrl}/offer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                credentials: 'omit', // Don't send cookies
                body: JSON.stringify({
                    sdp: {
                        type: this.pc.localDescription.type,
                        sdp: this.pc.localDescription.sdp
                    }
                })
            });
            
            // Handle the server's response
            if (response.ok) {
                const answer = await response.json();
                console.log("Received answer from server:", answer);
                
                const remoteDesc = new RTCSessionDescription({
                    type: answer.sdp.type,
                    sdp: answer.sdp.sdp
                });
                
                await this.pc.setRemoteDescription(remoteDesc);
                console.log("Remote description set successfully");
            } else {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error("Error sending offer to server:", error);
            this.disconnect();
            throw error;
        }
    }
    
    /**
     * Start sending video stream to the server
     * @param {HTMLVideoElement} videoElement - Video element with the stream to process
     * @returns {Promise<boolean>} Success status
     */
    async startVideo(videoElement) {
        if (!this.isConnected || !this.pc) {
            console.error("Cannot start video - not connected to server");
            return false;
        }
        
        try {
            this.videoElement = videoElement;
            
            // Get the stream from the video element
            this.localStream = videoElement.srcObject;
            if (!this.localStream) {
                console.error("No stream available in video element");
                return false;
            }
            
            console.log("Adding tracks to WebRTC connection");
            console.log("Tracks:", this.localStream.getTracks());
            
            // Add tracks to the peer connection
            this.localStream.getTracks().forEach(track => {
                console.log(`Adding ${track.kind} track to peer connection:`, track);
                this.pc.addTrack(track, this.localStream);
            });
            
            return true;
        } catch (error) {
            console.error("Error starting video stream:", error);
            return false;
        }
    }
    
    /**
     * Set callback for when landmarks are detected
     * @param {Function} callback - Function to call with landmark data
     */
    setLandmarksCallback(callback) {
        if (typeof callback === 'function') {
            this.onLandmarksDetected = callback;
        }
    }
    
    /**
     * Set callback for connection failures
     * @param {Function} callback - Function to call on connection failure
     */
    setConnectionFailCallback(callback) {
        if (typeof callback === 'function') {
            this.connectionFailCallback = callback;
        }
    }
    
    /**
     * Get the visualization stream for displaying hand landmarks
     * @returns {MediaStream|null} The visualization stream or null if not available
     */
    getVisualizationStream() {
        return this.visualizationStream;
    }
    
    /**
     * Disconnect from the server and clean up resources
     */
    disconnect() {
        clearInterval(this.pingInterval);
        clearTimeout(this.connectionTimeout);
        
        // Close data channel
        if (this.dataChannel) {
            this.dataChannel.close();
            this.dataChannel = null;
        }
        
        // Close peer connection
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        this.isConnected = false;
        this.visualizationStream = null;
        console.log("WebRTC connection closed");
    }
}