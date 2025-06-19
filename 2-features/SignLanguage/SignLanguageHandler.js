// SignLanguageHandler.js - Complete implementation with video overlay captions only
// This file replaces your existing empty SignLanguageHandler.js

export default class SignLanguageHandler {
    constructor() {
        // Core system state
        this.isActive = false;
        this.serverUrl = 'http://localhost:8766';
        this.peerConnection = null;
        this.dataChannel = null;
        this.stream = null;
        
        // Video elements for MediaPipe integration
        this.videoElement = null;        // Hidden input video (receives screen share)
        this.displayElement = null;      // Visible output video (shows processed stream)
        
        // Video caption overlay system - the heart of our new approach
        this.captionContainer = null;    // Container for all caption overlays
        this.captionElement = null;      // Currently active caption element
        this.captionQueue = [];          // Queue for managing multiple captions
        this.captionDisplayTimer = null; // Timer for caption lifecycle management
        this.captionIdCounter = 0;       // Unique identifier for each caption
        
        // Caption appearance and behavior settings - fully customizable
        this.captionSettings = {
            displayDuration: 4000,    // How long each caption stays visible (4 seconds)
            fadeOutDuration: 500,     // Smooth fade-out animation duration (0.5 seconds)
            maxCaptionsVisible: 2,    // Maximum number of captions shown at once
            fontSize: '16px',         // Readable font size for accessibility
            fontFamily: 'Arial, sans-serif', // Clean, widely available font
            backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black background
            textColor: '#ffffff',     // High contrast white text
            borderRadius: '4px',      // Subtle rounded corners for modern look
            padding: '6px 12px',      // Comfortable padding around text
            maxWidth: '80%',          // Prevent captions from spanning full video width
            position: 'bottom-center' // Standard caption positioning
        };
        
        // MediaPipe landmark detection data
        this.faceLandmarks = null;       // Face detection landmarks
        this.poseLandmarks = null;       // Body pose landmarks  
        this.leftHandLandmarks = null;   // Left hand gesture landmarks
        this.rightHandLandmarks = null;  // Right hand gesture landmarks
        
        // Performance monitoring for system health
        this.lastFrameTime = 0;          // Previous frame timestamp
        this.fps = 0;                    // Current frames per second
        this.frameCount = 0;             // Total processed frames
        
        // Server communication and performance data
        this.serverPerformanceData = null; // Latest performance metrics from MediaPipe server
        this.lastLandmarkUpdate = null;    // Most recent landmark detection data
        
        // Translation data management - now exclusively for video overlays
        this.lastTranslation = null;       // Most recent translation received
        this.translationHistory = [];      // Historical translations for reference
        
        // System preferences and debug options
        this.showDetailedInfo = false;     // Toggle for detailed console logging
        this.debugModeActive = false;      // Debug visualization mode
    }
    
    /**
     * Activate the sign language detection system with video overlay captions
     * This method orchestrates the entire activation process step by step
     */
    async activate() {
        // Prevent double activation
        if (this.isActive) {
            console.log("[SignLanguageHandler] System already active - skipping activation");
            return true;
        }
        
        try {
            console.log("[SignLanguageHandler] Beginning activation sequence for video overlay system");
            
            // Step 1: Verify MediaPipe server connectivity before proceeding
            console.log("[SignLanguageHandler] Step 1: Testing MediaPipe server connectivity");
            const serverAvailable = await this.pingServer();
            
            if (!serverAvailable) {
                throw new Error("MediaPipe server is not available at " + this.serverUrl);
            }
            
            console.log("[SignLanguageHandler] MediaPipe server confirmed available");
            
            // Step 2: Create the video interface with integrated caption overlay system
            console.log("[SignLanguageHandler] Step 2: Creating video interface with caption overlay");
            this.createVideoElementsWithCaptionOverlay();
            
            // Step 3: Request screen sharing permission from user
            console.log("[SignLanguageHandler] Step 3: Requesting screen sharing permission");
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                    cursor: 'always',           // Show cursor for better user feedback
                    frameRate: { ideal: 30, max: 30 }, // Optimal frame rate for sign language
                    width: { ideal: 1280, max: 1920 },  // High quality for gesture recognition
                    height: { ideal: 720, max: 1080 }
                },
                audio: false // Audio not needed for sign language recognition
            });
            
            console.log("[SignLanguageHandler] Screen sharing permission granted successfully");
            
            // Step 4: Initialize video playback for processing
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            console.log("[SignLanguageHandler] Input video stream initialized");
            
            // Step 5: Establish WebRTC connection with MediaPipe server
            console.log("[SignLanguageHandler] Step 5: Establishing WebRTC connection");
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            // Monitor connection health for robust operation
            this.peerConnection.onconnectionstatechange = () => {
                const state = this.peerConnection.connectionState;
                console.log(`[SignLanguageHandler] WebRTC connection state: ${state}`);
                
                if (state === 'connected') {
                    console.log('[SignLanguageHandler] MediaPipe connection established successfully');
                    this.showConnectionStatus('Connected to MediaPipe Server', 'success');
                } else if (state === 'failed') {
                    console.error('[SignLanguageHandler] WebRTC connection failed');
                    this.showConnectionStatus('Connection Failed', 'error');
                    this.deactivate(); // Clean shutdown on connection failure
                }
            };
            
            // Monitor ICE connection state for troubleshooting
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log(`[SignLanguageHandler] ICE connection state: ${this.peerConnection.iceConnectionState}`);
            };
            
            // Step 6: Create data channel for receiving translation data
            console.log("[SignLanguageHandler] Step 6: Setting up translation data channel");
            this.dataChannel = this.peerConnection.createDataChannel('holistic-landmarks');
            this.setupTranslationDataChannel();
            
            // Step 7: Handle processed video stream from MediaPipe server
            this.peerConnection.ontrack = (event) => {
                console.log(`[SignLanguageHandler] Received processed video track from MediaPipe`);
                this.displayElement.srcObject = new MediaStream([event.track]);
                this.displayElement.play().catch(e => {
                    console.error("[SignLanguageHandler] Error displaying processed video:", e);
                });
            };
            
            // Step 8: Send our video stream to MediaPipe server for processing
            this.stream.getTracks().forEach(track => {
                console.log(`[SignLanguageHandler] Adding ${track.kind} track to peer connection`);
                this.peerConnection.addTrack(track, this.stream);
            });
            
            // Step 9: Create and send WebRTC offer to establish connection
            console.log("[SignLanguageHandler] Step 9: Creating WebRTC offer");
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // Step 10: Wait for ICE candidate gathering to complete
            console.log("[SignLanguageHandler] Step 10: Waiting for ICE gathering to complete");
            await new Promise(resolve => {
                if (this.peerConnection.iceGatheringState === 'complete') {
                    console.log("[SignLanguageHandler] ICE gathering already complete");
                    resolve();
                } else {
                    this.peerConnection.onicegatheringstatechange = () => {
                        console.log(`[SignLanguageHandler] ICE gathering state: ${this.peerConnection.iceGatheringState}`);
                        if (this.peerConnection.iceGatheringState === 'complete') {
                            console.log("[SignLanguageHandler] ICE gathering completed");
                            resolve();
                        }
                    };
                }
            });
            
            // Step 11: Send offer to MediaPipe server and receive answer
            console.log("[SignLanguageHandler] Step 11: Sending offer to MediaPipe server");
            const response = await fetch(`${this.serverUrl}/offer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sdp: {
                        type: this.peerConnection.localDescription.type,
                        sdp: this.peerConnection.localDescription.sdp
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`MediaPipe server responded with error status: ${response.status}`);
            }
            
            const answer = await response.json();
            console.log("[SignLanguageHandler] Received answer from MediaPipe server");
            
            // Step 12: Complete WebRTC handshake
            console.log("[SignLanguageHandler] Step 12: Completing WebRTC handshake");
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));
            
            // Step 13: Activation complete - show video interface
            console.log("[SignLanguageHandler] Activation sequence completed successfully");
            this.isActive = true;
            this.showVideoContainer();
            this.showConnectionStatus('Sign Language Detection Active - Translations shown as video overlays', 'success');
            
            return true;
            
        } catch (error) {
            console.error('[SignLanguageHandler] Activation failed:', error);
            this.cleanupResources();
            this.showConnectionStatus(`Activation Failed: ${error.message}`, 'error');
            
            // Dispatch failure event for other components to handle
            window.dispatchEvent(new CustomEvent('screenSharingFailed', {
                detail: { reason: error.message || error.name || "Unknown activation error" }
            }));
            
            return false;
        }
    }
    
    /**
     * Set up the data channel specifically for receiving translation data from MediaPipe
     * This method handles all communication with the MediaPipe server
     */
    setupTranslationDataChannel() {
        // Handle successful data channel connection
        this.dataChannel.onopen = () => {
            console.log("[SignLanguageHandler] Translation data channel opened - video overlays ready");
            this.updateConnectionStatus('connected');
            this.showConnectionStatus('Ready for Sign Language Detection', 'success');
            
            // Send initial requests to MediaPipe server
            setTimeout(() => {
                if (this.dataChannel.readyState === 'open') {
                    console.log("[SignLanguageHandler] Sending initial data requests to MediaPipe");
                    this.dataChannel.send('get_landmarks');    // Request landmark detection data
                    this.dataChannel.send('get_performance');  // Request performance metrics
                }
            }, 1000);
            
            // Set up periodic requests for translation data
            this.landmarkInterval = setInterval(() => {
                if (this.dataChannel.readyState === 'open') {
                    this.dataChannel.send('get_translation'); // Regular translation requests
                }
            }, 1000); // Check for new translations every second
        };
        
        // Handle data channel closure
        this.dataChannel.onclose = () => {
            console.log("[SignLanguageHandler] Translation data channel closed");
            this.updateConnectionStatus('disconnected');
            this.showConnectionStatus('Connection Lost', 'warning');
        };
        
        // Handle data channel errors
        this.dataChannel.onerror = (error) => {
            console.error("[SignLanguageHandler] Data channel error:", error);
            this.showConnectionStatus('Data Channel Error', 'error');
        };
        
        // Handle incoming messages from MediaPipe server
        this.dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                // Process different types of messages from the server
                if (data.type === 'holistic_landmarks') {
                    // MediaPipe landmark detection data (hands, face, pose)
                    this.processLandmarksData(data);
                } else if (data.type === 'performance_stats') {
                    // Server performance metrics (FPS, processing time, etc.)
                    this.processPerformanceData(data);
                } else if (data.type === 'translation') {
                    // SIGN LANGUAGE TRANSLATION - This is the key message type
                    // Process translation and display as video overlay caption
                    console.log("[SignLanguageHandler] Translation received for video overlay:", data.text);
                    this.processTranslationForVideoOverlay(data);
                } else if (data.type === 'stats' && data.fps !== undefined) {
                    // Real-time FPS updates
                    this.fps = data.fps;
                    this.updateFPSDisplay();
                }
                
            } catch (error) {
                console.error("[SignLanguageHandler] Error processing server message:", error);
            }
        };
    }
    
    /**
     * CORE METHOD: Process translation data and display as video overlay caption
     * This method is the heart of the video overlay system - it takes translation
     * data from MediaPipe and converts it into YouTube-style video captions
     */
    processTranslationForVideoOverlay(data) {
        const translatedText = data.text;
        const confidence = data.confidence || null;
        const timestamp = Date.now();
        
        console.log(`[SignLanguageHandler] Processing translation for video overlay: "${translatedText}"`);
        
        // Store translation data for history and debugging
        this.lastTranslation = {
            text: translatedText,
            timestamp: timestamp,
            confidence: confidence,
            words: data.words || null,
            displayMethod: 'video-overlay' // Track how this translation was displayed
        };
        
        // Maintain translation history for analytics and debugging
        this.translationHistory.push(this.lastTranslation);
        if (this.translationHistory.length > 20) {
            this.translationHistory.shift(); // Keep history manageable
        }
        
        // THE KEY FUNCTIONALITY: Display translation as video caption overlay
        this.displayTranslationAsVideoCaption(translatedText, confidence, timestamp);
        
        // Update system status to show translation activity
        this.showConnectionStatus(`Translated: "${translatedText}"`, 'translation');
        
        // Note: NO sidebar forwarding - translations are displayed exclusively as video overlays
        // This is the fundamental difference from the previous implementation
        console.log(`[SignLanguageHandler] Translation displayed as video overlay only - no sidebar forwarding`);
    }
    
    /**
     * CORE METHOD: Display translation as YouTube-style caption overlay on video
     * This method creates the actual caption elements that appear on the video
     */
    displayTranslationAsVideoCaption(text, confidence = null, timestamp = Date.now()) {
        // Validate that we have the necessary components
        if (!this.captionContainer || !text || text.trim() === '') {
            console.warn("[SignLanguageHandler] Cannot display caption - missing container or text");
            return;
        }

        // Generate unique identifier for this caption
        const captionId = `caption-${this.captionIdCounter++}`;
        
        console.log(`[SignLanguageHandler] Creating video caption: "${text}" (ID: ${captionId})`);
        
        // Create the caption element
        const captionElement = document.createElement('div');
        captionElement.className = 'sign-language-video-caption';
        captionElement.id = captionId;
        
        // Prepare the display text with optional confidence indicator
        let displayText = text.trim();
        
        // Show confidence indicator when translation uncertainty is high (below 85%)
        if (confidence !== null && confidence < 0.85) {
            const confidencePercent = Math.round(confidence * 100);
            displayText += ` [${confidencePercent}% confidence]`;
        }
        
        captionElement.textContent = displayText;
        
        // Apply professional YouTube-style styling
        this.applyVideoCaptionStyling(captionElement);
        
        // Add caption to the video overlay container
        this.captionContainer.appendChild(captionElement);
        
        // Animate caption appearance with smooth fade-in
        this.animateCaptionEntry(captionElement);
        
        // Schedule automatic removal after display duration
        this.scheduleCaptionRemoval(captionElement, captionId);
        
        // Manage the number of visible captions to prevent screen clutter
        this.limitSimultaneousCaptions();
        
        console.log(`[SignLanguageHandler] Video caption displayed successfully: "${displayText}"`);
    }
    
    /**
     * Apply professional YouTube-style styling to caption elements
     * This method ensures captions are readable and visually appealing
     */
    applyVideoCaptionStyling(captionElement) {
        const settings = this.captionSettings;
        
        // Core layout and positioning - ensures captions appear correctly on video
        captionElement.style.position = 'relative';
        captionElement.style.display = 'block';
        captionElement.style.width = 'auto';
        captionElement.style.maxWidth = settings.maxWidth;
        captionElement.style.margin = '0 auto 8px auto'; // Center horizontally with spacing
        
        // Typography optimized for video overlay readability
        captionElement.style.fontSize = settings.fontSize;
        captionElement.style.fontFamily = settings.fontFamily;
        captionElement.style.fontWeight = 'bold';        // Bold text for better visibility
        captionElement.style.lineHeight = '1.2';         // Comfortable line spacing
        captionElement.style.textAlign = 'center';       // Center-aligned like YouTube captions
        captionElement.style.wordWrap = 'break-word';    // Handle long words gracefully
        captionElement.style.whiteSpace = 'pre-wrap';    // Preserve spacing if needed
        
        // Visual styling for maximum readability over video content
        captionElement.style.color = settings.textColor;
        captionElement.style.backgroundColor = settings.backgroundColor;
        captionElement.style.padding = settings.padding;
        captionElement.style.borderRadius = settings.borderRadius;
        captionElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)'; // Subtle depth
        captionElement.style.textShadow = '1px 1px 2px rgba(0, 0, 0, 0.8)'; // Text outline effect
        
        // Interaction properties - captions should not interfere with video controls
        captionElement.style.pointerEvents = 'none'; // Allow clicks to pass through to video
        captionElement.style.userSelect = 'none';     // Prevent text selection
        
        // Initial animation state - caption starts invisible and slightly offset
        captionElement.style.opacity = '0';
        captionElement.style.transform = 'translateY(15px) scale(0.95)';
        captionElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'; // Smooth material design animation
    }
    
    /**
     * Animate caption entry with smooth, professional animation
     * Uses modern CSS transforms for hardware-accelerated performance
     */
    animateCaptionEntry(captionElement) {
        // Use double requestAnimationFrame for smooth animation timing
        // This ensures the initial styles are applied before starting the animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                captionElement.style.opacity = '1';              // Fade in
                captionElement.style.transform = 'translateY(0) scale(1)'; // Slide up and scale to normal size
            });
        });
    }
    
    /**
     * Schedule automatic caption removal with smooth fade-out animation
     * Manages caption lifecycle to prevent accumulation of old captions
     */
    scheduleCaptionRemoval(captionElement, captionId) {
        const removalTimer = setTimeout(() => {
            this.removeCaptionWithAnimation(captionElement, captionId);
        }, this.captionSettings.displayDuration);
        
        // Store timer reference for potential cleanup (if caption is removed manually)
        captionElement.dataset.removalTimer = removalTimer;
    }
    
    /**
     * Remove caption with smooth fade-out animation
     * Provides polished visual feedback when captions disappear
     */
    removeCaptionWithAnimation(captionElement, captionId) {
        // Check if element still exists (might have been removed already)
        if (!captionElement || !captionElement.parentNode) {
            console.log(`[SignLanguageHandler] Caption ${captionId} already removed`);
            return;
        }
        
        console.log(`[SignLanguageHandler] Removing video caption: ${captionId}`);
        
        // Apply smooth fade-out animation
        captionElement.style.transition = `all ${this.captionSettings.fadeOutDuration}ms cubic-bezier(0.4, 0, 0.6, 1)`;
        captionElement.style.opacity = '0';              // Fade out
        captionElement.style.transform = 'translateY(-10px) scale(0.95)'; // Slide up and shrink slightly
        
        // Remove element from DOM after animation completes
        setTimeout(() => {
            if (captionElement.parentNode) {
                captionElement.parentNode.removeChild(captionElement);
            }
        }, this.captionSettings.fadeOutDuration);
    }
    
    /**
     * Limit the number of simultaneous captions to prevent screen clutter
     * Automatically removes older captions when the limit is exceeded
     */
    limitSimultaneousCaptions() {
        if (!this.captionContainer) return;
        
        const captions = this.captionContainer.querySelectorAll('.sign-language-video-caption');
        const maxVisible = this.captionSettings.maxCaptionsVisible;
        
        if (captions.length > maxVisible) {
            // Calculate how many captions need to be removed
            const excessCount = captions.length - maxVisible;
            const captionsToRemove = Array.from(captions).slice(0, excessCount);
            
            console.log(`[SignLanguageHandler] Removing ${excessCount} excess captions to maintain limit of ${maxVisible}`);
            
            // Remove excess captions with staggered timing for smooth transition
            captionsToRemove.forEach((caption, index) => {
                setTimeout(() => {
                    this.removeCaptionWithAnimation(caption, caption.id);
                }, index * 100); // 100ms delay between each removal
            });
        }
    }
    
    /**
     * Clear all visible captions immediately
     * Useful for reset scenarios or when pausing the system
     */
    clearAllVideoCaptions() {
        if (!this.captionContainer) {
            console.log("[SignLanguageHandler] No caption container to clear");
            return;
        }
        
        const captions = this.captionContainer.querySelectorAll('.sign-language-video-caption');
        console.log(`[SignLanguageHandler] Clearing ${captions.length} video captions`);
        
        captions.forEach(caption => {
            // Clear any pending removal timers to prevent conflicts
            if (caption.dataset.removalTimer) {
                clearTimeout(caption.dataset.removalTimer);
            }
            
            // Remove immediately without animation for instant clearing
            if (caption.parentNode) {
                caption.parentNode.removeChild(caption);
            }
        });
        
        console.log("[SignLanguageHandler] All video captions cleared");
    }
    
    /**
     * Update caption display settings dynamically
     * Allows real-time customization of caption appearance and behavior
     */
    updateCaptionSettings(newSettings) {
        // Merge new settings with existing ones
        this.captionSettings = { ...this.captionSettings, ...newSettings };
        console.log("[SignLanguageHandler] Caption settings updated:", this.captionSettings);
        
        // Apply new settings to any existing captions
        if (this.captionContainer) {
            const existingCaptions = this.captionContainer.querySelectorAll('.sign-language-video-caption');
            existingCaptions.forEach(caption => {
                // Update styling properties that can be changed dynamically
                if (newSettings.fontSize) caption.style.fontSize = newSettings.fontSize;
                if (newSettings.fontFamily) caption.style.fontFamily = newSettings.fontFamily;
                if (newSettings.backgroundColor) caption.style.backgroundColor = newSettings.backgroundColor;
                if (newSettings.textColor) caption.style.color = newSettings.textColor;
            });
            
            console.log(`[SignLanguageHandler] Applied new settings to ${existingCaptions.length} existing captions`);
        }
    }
    
    /**
     * Process MediaPipe landmark detection data for system monitoring
     * Updates detection status without affecting caption display
     */
    processLandmarksData(data) {
        // Update landmark state for system monitoring
        this.faceLandmarks = data.has_face ? {} : null;
        this.poseLandmarks = data.has_pose ? (data.pose_info || {}) : null;
        this.leftHandLandmarks = data.has_left_hand ? {} : null;
        this.rightHandLandmarks = data.has_right_hand ? {} : null;
        
        // Store detection metadata for debugging and analytics
        this.lastLandmarkUpdate = {
            timestamp: Date.now(),
            frame_id: data.frame_id,
            quality_score: data.quality_score,
            processing_scale: data.processing_scale
        };
        
        // Update detection status display in video container
        this.updateDetectionStatus(data);
        
        // Dispatch event for external monitoring (sidebar, analytics, etc.)
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
     * Process performance data from MediaPipe server
     * Monitors system health and updates performance displays
     */
    processPerformanceData(data) {
        // Store comprehensive performance data
        this.serverPerformanceData = data;
        
        // Update FPS from server data
        if (data.output_fps !== undefined) {
            this.fps = data.output_fps;
        }
        
        // Update performance displays
        this.updateFPSDisplay();
        
        // Log detailed performance information in debug mode
        if (this.showDetailedInfo) {
            console.log(`[SignLanguageHandler] Performance: ${data.output_fps?.toFixed(1) || 'N/A'} FPS, ` +
                       `Processing: ${data.avg_processing_ms?.toFixed(1) || 'N/A'}ms, ` +
                       `Quality: ${data.quality_score?.toFixed(2) || 'N/A'}`);
        }
    }
    
    /**
     * Show connection status as temporary overlay message
     * Provides user feedback about system state
     */
    showConnectionStatus(message, type = 'info') {
        console.log(`[SignLanguageHandler] Status (${type}): ${message}`);
        
        // You can extend this method to show visual status indicators
        // For example, temporary overlay messages or status bar updates
    }
    
    /**
     * Update connection status indicator in video container
     * Provides real-time feedback about MediaPipe server connection
     */
    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            switch(status) {
                case 'connected':
                    statusElement.textContent = 'Connected';
                    statusElement.style.color = '#4CAF50'; // Green for success
                    break;
                case 'disconnected':
                    statusElement.textContent = 'Disconnected';
                    statusElement.style.color = '#F44336'; // Red for error
                    break;
                default:
                    statusElement.textContent = 'Connecting...';
                    statusElement.style.color = '#FFC107'; // Yellow for pending
            }
        }
    }
    
    /**
     * Update FPS display with performance-based color coding
     * Provides visual feedback about system performance
     */
    updateFPSDisplay() {
        const fpsElement = document.getElementById('signLanguageFPS');
        if (fpsElement) {
            const displayFPS = this.fps || 0;
            fpsElement.textContent = `${displayFPS.toFixed(1)} FPS`;
            
            // Color-code based on performance thresholds
            if (displayFPS >= 20) {
                fpsElement.style.color = '#4CAF50'; // Green - excellent performance
            } else if (displayFPS >= 10) {
                fpsElement.style.color = '#FFC107'; // Yellow - good performance
            } else if (displayFPS > 0) {
                fpsElement.style.color = '#FF9800'; // Orange - poor performance
            } else {
                fpsElement.style.color = '#F44336'; // Red - no data
            }
        }
    }
    
    /**
     * Update detection status display with readable format
     * Shows which body parts are being detected by MediaPipe
     */
    updateDetectionStatus(data) {
        const detectionElement = document.getElementById('signLanguageDetection');
        if (detectionElement) {
            // Build list of detected body parts
            const detectedParts = [];
            if (data.has_face) detectedParts.push("Face");
            if (data.has_pose) detectedParts.push("Pose");
            if (data.has_left_hand) detectedParts.push("Left Hand");
            if (data.has_right_hand) detectedParts.push("Right Hand");
            
            // Update display based on detection results
            if (detectedParts.length > 0) {
                detectionElement.textContent = detectedParts.join(" • ");
                detectionElement.style.color = '#4CAF50'; // Green for active detection
            } else {
                detectionElement.textContent = 'No detection';
                detectionElement.style.color = '#999'; // Gray for no detection
            }
        }
        
        // Always update FPS display when we have fresh detection data
        this.updateFPSDisplay();
    }
    
    /**
     * Toggle debug mode for detailed system information
     * Enables/disables verbose logging and detailed displays
     */
    toggleDebugMode() {
        this.debugModeActive = !this.debugModeActive;
        this.showDetailedInfo = this.debugModeActive;
        
        console.log(`[SignLanguageHandler] Debug mode ${this.debugModeActive ? 'enabled' : 'disabled'}`);
        
        return this.debugModeActive;
    }
    
    /**
     * Create video elements with integrated caption overlay system
     * This method builds the complete video interface including caption container
     */
    createVideoElementsWithCaptionOverlay() {
        // Remove any existing video container
        let container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            document.body.removeChild(container);
        }
        
        // Create main container with modern, professional styling
        container = document.createElement('div');
        container.id = 'signLanguageVideoContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = '420px';  // Wider than before for better caption display
        container.style.height = 'auto';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        container.style.border = '1px solid #00BCD4';
        container.style.borderRadius = '12px';
        container.style.padding = '12px';
        container.style.zIndex = '10000'; // Very high z-index to ensure visibility over all content
        container.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
        container.style.backdropFilter = 'blur(15px)'; // Modern glass effect
        container.style.display = 'none'; // Initially hidden
        container.style.fontFamily = 'Arial, sans-serif';
        
        // Create title bar with professional appearance and close functionality
        const titleBar = document.createElement('div');
        titleBar.style.display = 'flex';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.alignItems = 'center';
        titleBar.style.marginBottom = '12px';
        titleBar.style.paddingBottom = '8px';
        titleBar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        
        const title = document.createElement('div');
        title.textContent = 'Sign Language Detection';
        title.style.color = 'white';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '14px';
        
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.background = 'none';
        closeButton.style.border = 'none';
        closeButton.style.color = '#999';
        closeButton.style.fontSize = '18px';
        closeButton.style.cursor = 'pointer';
        closeButton.style.padding = '0';
        closeButton.style.width = '24px';
        closeButton.style.height = '24px';
        closeButton.style.borderRadius = '50%';
        closeButton.style.transition = 'all 0.2s ease';
        
        // Close button functionality
        closeButton.onclick = () => {
            container.style.display = 'none';
        };
        
        // Close button hover effects
        closeButton.onmouseenter = () => {
            closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            closeButton.style.color = 'white';
        };
        closeButton.onmouseleave = () => {
            closeButton.style.backgroundColor = 'transparent';
            closeButton.style.color = '#999';
        };
        
        titleBar.appendChild(title);
        titleBar.appendChild(closeButton);
        container.appendChild(titleBar);
        
        // Hidden input video element (receives original screen share)
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.display = 'none'; // Hidden - only used for MediaPipe processing
        container.appendChild(this.videoElement);
        
        // Create video wrapper with caption overlay capability - this is the key structure
        const videoWrapper = document.createElement('div');
        videoWrapper.style.position = 'relative'; // Critical for absolute positioning of captions
        videoWrapper.style.width = '100%';
        videoWrapper.style.borderRadius = '8px';
        videoWrapper.style.overflow = 'hidden';
        videoWrapper.style.backgroundColor = '#000';
        videoWrapper.style.minHeight = '200px'; // Ensure space for captions even with no video
        
        // Main display video (shows processed stream from MediaPipe with overlaid landmarks)
        this.displayElement = document.createElement('video');
        this.displayElement.autoplay = true;
        this.displayElement.playsInline = true;
        this.displayElement.muted = true;
        this.displayElement.style.width = '100%';
        this.displayElement.style.height = 'auto';
        this.displayElement.style.display = 'block';
        this.displayElement.style.borderRadius = '8px';
        
        // CREATE THE CAPTION OVERLAY CONTAINER - This is the heart of our video overlay system
        this.captionContainer = document.createElement('div');
        this.captionContainer.id = 'signLanguageCaptionOverlay';
        this.captionContainer.style.position = 'absolute';     // Positioned over the video
        this.captionContainer.style.bottom = '12px';           // Standard caption position from bottom
        this.captionContainer.style.left = '12px';             // Left padding
        this.captionContainer.style.right = '12px';            // Right padding
        this.captionContainer.style.zIndex = '15';             // Above video, below controls
        this.captionContainer.style.pointerEvents = 'none';    // Allow interaction with video below
        this.captionContainer.style.display = 'flex';
        this.captionContainer.style.flexDirection = 'column';  // Stack multiple captions vertically
        this.captionContainer.style.alignItems = 'center';     // Center captions horizontally
        this.captionContainer.style.gap = '4px';               // Space between multiple captions
        
        // Assemble the complete video interface
        videoWrapper.appendChild(this.displayElement);         // Video layer (bottom)
        videoWrapper.appendChild(this.captionContainer);       // Caption layer (top)
        container.appendChild(videoWrapper);
        
        // Create status bar for system information and monitoring
        const statusBar = document.createElement('div');
        statusBar.style.display = 'flex';
        statusBar.style.justifyContent = 'space-between';
        statusBar.style.alignItems = 'center';
        statusBar.style.marginTop = '12px';
        statusBar.style.paddingTop = '8px';
        statusBar.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
        statusBar.style.fontSize = '11px';
        statusBar.style.color = '#ccc';
        
        // FPS performance indicator
        const fpsDisplay = document.createElement('div');
        fpsDisplay.id = 'signLanguageFPS';
        fpsDisplay.textContent = '0.0 FPS';
        fpsDisplay.style.fontWeight = 'bold';
        
        // Connection status indicator
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'connectionStatus';
        connectionStatus.textContent = 'Connecting...';
        connectionStatus.style.fontSize = '10px';
        
        // Detection status indicator
        const detectionStatus = document.createElement('div');
        detectionStatus.id = 'signLanguageDetection';
        detectionStatus.textContent = 'Initializing...';
        detectionStatus.style.fontSize = '10px';
        detectionStatus.style.textAlign = 'right';
        
        statusBar.appendChild(fpsDisplay);
        statusBar.appendChild(connectionStatus);
        statusBar.appendChild(detectionStatus);
        container.appendChild(statusBar);
        
        // Add double-click handler for debug mode toggle
        container.addEventListener('dblclick', () => {
            this.toggleDebugMode();
        });
        
        // Add the complete video interface to the page
        document.body.appendChild(container);
        
        console.log("[SignLanguageHandler] Video interface with caption overlay system created successfully");
    }
    
    /**
     * Show the video container with caption overlay system
     * Makes the video interface visible and ready for use
     */
    showVideoContainer() {
        const container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            container.style.display = 'block';
            console.log("[SignLanguageHandler] Video overlay system interface is now visible and ready");
        }
    }
    
    /**
     * Deactivate the sign language handler and cleanup all resources
     * Ensures clean shutdown with no resource leaks
     */
    deactivate() {
        if (!this.isActive) {
            console.log("[SignLanguageHandler] System already inactive - skipping deactivation");
            return;
        }
        
        console.log("[SignLanguageHandler] Beginning deactivation sequence");
        
        // Clear all video captions before hiding interface
        this.clearAllVideoCaptions();
        
        // Hide the video container
        const container = document.getElementById('signLanguageVideoContainer');
        if (container) {
            container.style.display = 'none';
        }
        
        // Clear periodic server communication intervals
        if (this.landmarkInterval) {
            clearInterval(this.landmarkInterval);
            this.landmarkInterval = null;
        }
        
        // Perform complete resource cleanup
        this.cleanupResources();
        this.isActive = false;
        
        console.log("[SignLanguageHandler] Deactivation completed successfully");
    }
    
    /**
     * Clean up all system resources to prevent memory leaks
     * Critical for proper extension lifecycle management
     */
    cleanupResources() {
        console.log("[SignLanguageHandler] Cleaning up system resources");
        
        // Clear caption-related timers and references
        if (this.captionDisplayTimer) {
            clearTimeout(this.captionDisplayTimer);
            this.captionDisplayTimer = null;
        }
        
        // Close WebRTC connection cleanly
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        // Stop all media streams
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                console.log(`[SignLanguageHandler] Stopped ${track.kind} track`);
            });
            this.stream = null;
        }
        
        // Clear video element sources
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        
        if (this.displayElement) {
            this.displayElement.srcObject = null;
        }
        
        // Reset all detection and performance state
        this.faceLandmarks = null;
        this.poseLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        this.serverPerformanceData = null;
        this.lastLandmarkUpdate = null;
        this.fps = 0;
        
        // Reset caption system state
        this.captionContainer = null;
        this.captionElement = null;
        this.captionQueue = [];
        this.captionIdCounter = 0;
        
        console.log("[SignLanguageHandler] Resource cleanup completed");
    }
    
    /**
     * Test connectivity to MediaPipe server
     * Verifies server availability before attempting connection
     */
    async pingServer() {
        try {
            console.log('[SignLanguageHandler] Testing MediaPipe server connectivity...');
            const response = await fetch(`${this.serverUrl}/ping`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`[SignLanguageHandler] Server responded successfully: ${data.message}`);
                return true;
            } else {
                console.log(`[SignLanguageHandler] Server returned error status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.error(`[SignLanguageHandler] Server connectivity test failed: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Get the most recent translation
     * Useful for external components that need current translation data
     */
    getLastTranslation() {
        return this.lastTranslation;
    }
    
    /**
     * Get complete translation history
     * Provides access to all translations received during this session
     */
    getTranslationHistory() {
        return this.translationHistory;
    }
    
    /**
     * Clear translation history and all video captions
     * Resets the translation system to initial state
     */
    clearTranslationHistory() {
        this.translationHistory = [];
        this.lastTranslation = null;
        this.clearAllVideoCaptions();
        console.log("[SignLanguageHandler] Translation history and video captions cleared");
    }
    
    /**
     * Get comprehensive debug information about system state
     * Useful for troubleshooting and system monitoring
     */
    getDebugInfo() {
        return {
            // Core system state
            isActive: this.isActive,
            connectionState: this.peerConnection ? this.peerConnection.connectionState : 'none',
            dataChannelState: this.dataChannel ? this.dataChannel.readyState : 'none',
            
            // Media stream state
            streamActive: this.stream !== null && 
                this.stream.getVideoTracks().some(track => track.readyState === 'live'),
            
            // Performance metrics
            fps: this.fps,
            
            // Detection state
            faceLandmarks: this.faceLandmarks !== null,
            poseLandmarks: this.poseLandmarks !== null,
            leftHandLandmarks: this.leftHandLandmarks !== null,
            rightHandLandmarks: this.rightHandLandmarks !== null,
            
            // Server communication
            serverPerformanceData: this.serverPerformanceData,
            lastLandmarkUpdate: this.lastLandmarkUpdate,
            
            // Debug and display settings
            debugModeActive: this.debugModeActive,
            captionSettings: this.captionSettings,
            
            // Caption system state
            activeCaptions: this.captionContainer ? this.captionContainer.children.length : 0,
            translationHistoryCount: this.translationHistory.length,
            lastTranslation: this.lastTranslation
        };
    }
}