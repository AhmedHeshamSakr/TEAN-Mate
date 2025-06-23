// SignLanguageHandler.js - Complete implementation with captions on main webpage videos
export default class SignLanguageHandler {
    constructor() {
        // Core system state
        this.isActive = false;
        this.serverUrl = 'https://astrology-mel-lo-happens.trycloudflare.com';
        this.peerConnection = null;
        this.dataChannel = null;
        this.stream = null;
        
        // MediaPipe monitoring elements (smaller, optional display)
        this.videoElement = null;        // Hidden input video (receives screen share)
        this.displayElement = null;      // Optional monitoring video (can be hidden)
        this.monitoringContainer = null; // Container for MediaPipe monitoring
        
        // MAIN FEATURE: Webpage video caption system
        this.webpageVideos = new Map();      // Track all videos found on the current webpage
        this.videoCaptionContainers = new Map(); // Caption containers for each video
        this.videoObserver = null;          // Observer to detect new videos added to page
        this.activeVideoTarget = null;      // Currently targeted video for captions
        
        // Caption management
        this.captionIdCounter = 0;       // Unique identifier for each caption
        this.activeCaptions = new Set();  // Track all active caption elements
        
        // Caption appearance and behavior settings - optimized for webpage integration
        this.captionSettings = {
            displayDuration: 4000,    // How long each caption stays visible (4 seconds)
            fadeOutDuration: 500,     // Smooth fade-out animation duration (0.5 seconds)
            maxCaptionsVisible: 2,    // Maximum number of captions shown at once per video
            fontSize: '18px',         // Larger font for webpage videos (more readable)
            fontFamily: 'Arial, sans-serif, "Segoe UI", "Roboto"', // Web-safe fonts
            backgroundColor: 'rgba(0, 0, 0, 0.85)', // Slightly more opaque for webpage contrast
            textColor: '#ffffff',     // High contrast white text
            borderRadius: '6px',      // Slightly larger radius for webpage display
            padding: '8px 16px',      // More generous padding for webpage videos
            maxWidth: '85%',          // Allow wider captions on webpage videos
            position: 'bottom-center', // Standard caption positioning
            zIndex: 2147483647,       // Maximum z-index to appear above all webpage content
            marginBottom: '60px'      // Space from bottom to avoid video controls
        };
        
        // MediaPipe detection and performance tracking
        this.faceLandmarks = null;
        this.poseLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.serverPerformanceData = null;
        this.lastLandmarkUpdate = null;
        
        // Translation data management
        this.lastTranslation = null;
        this.translationHistory = [];
        this.deduplicationSystem = {
            lastDisplayedText: null,           // The actual text of the last caption shown
            lastDisplayedTime: 0,              // When the last caption was displayed (timestamp)
            lastConfidence: 0,                 // Confidence of the last displayed translation
            repetitionThreshold: 7000,         // Minimum time (ms) before showing same word again
            confidenceThreshold: 0.1,          // Minimum confidence improvement to override repetition
            similarityThreshold: 0.8,          // How similar words need to be to be considered "same"
            recentTranslations: [],            // Buffer of recent translations for context analysis
            maxRecentBuffer: 5                 // How many recent translations to remember
        };
        
        // System preferences
        this.showDetailedInfo = false;
        this.debugModeActive = false;
        this.showMonitoringWindow = true; // Toggle for MediaPipe monitoring window
    }
    
    /**
     * Activate the sign language detection system with webpage video overlay captions
     * This method sets up both MediaPipe processing and webpage video detection
     */
    async activate() {
        if (this.isActive) {
            console.log("[SignLanguageHandler] System already active - skipping activation");
            return true;
        }
        
        try {
            console.log("[SignLanguageHandler] Activating webpage video overlay system");
            
            // Step 1: Verify MediaPipe server connectivity
            console.log("[SignLanguageHandler] Step 1: Testing MediaPipe server connectivity");
            const serverAvailable = await this.pingServer();
            
            if (!serverAvailable) {
                throw new Error("MediaPipe server is not available at " + this.serverUrl);
            }
            
            // Step 2: Set up webpage video detection and caption system
            console.log("[SignLanguageHandler] Step 2: Setting up webpage video detection");
            this.initializeWebpageVideoDetection();
            
            // Step 3: Create optional MediaPipe monitoring interface
            console.log("[SignLanguageHandler] Step 3: Creating MediaPipe monitoring interface");
            this.createMediaPipeMonitoringInterface();
            
            // Step 4: Request screen sharing permission
            console.log("[SignLanguageHandler] Step 4: Requesting screen sharing permission");
            this.stream = await navigator.mediaDevices.getDisplayMedia({
                video: { 
                    cursor: 'always',
                    frameRate: { ideal: 30, max: 30 },
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 }
                },
                audio: false
            });
            
            // Step 5: Initialize MediaPipe video processing
            this.videoElement.srcObject = this.stream;
            await this.videoElement.play();
            console.log("[SignLanguageHandler] MediaPipe input video initialized");
            
            // Step 6: Establish WebRTC connection with MediaPipe server
            console.log("[SignLanguageHandler] Step 6: Establishing WebRTC connection");
            this.peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            
            // Monitor connection health
            this.peerConnection.onconnectionstatechange = () => {
                const state = this.peerConnection.connectionState;
                console.log(`[SignLanguageHandler] WebRTC connection state: ${state}`);
                
                if (state === 'connected') {
                    console.log('[SignLanguageHandler] MediaPipe connection established');
                    this.showStatus('Connected to MediaPipe - Webpage captions ready', 'success');
                } else if (state === 'failed') {
                    console.error('[SignLanguageHandler] WebRTC connection failed');
                    this.showStatus('Connection Failed', 'error');
                    this.deactivate();
                }
            };
            
            // Step 7: Set up translation data channel
            this.dataChannel = this.peerConnection.createDataChannel('holistic-landmarks');
            this.setupTranslationDataChannel();
            
            // Step 8: Handle processed video stream (for monitoring)
            this.peerConnection.ontrack = (event) => {
                console.log(`[SignLanguageHandler] Received processed video track`);
                if (this.displayElement) {
                    this.displayElement.srcObject = new MediaStream([event.track]);
                    this.displayElement.play().catch(e => {
                        console.error("[SignLanguageHandler] Error displaying processed video:", e);
                    });
                }
            };
            
            // Step 9: Send video stream to MediaPipe
            this.stream.getTracks().forEach(track => {
                this.peerConnection.addTrack(track, this.stream);
            });
            
            // Step 10: Complete WebRTC handshake
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
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
                throw new Error(`MediaPipe server error: ${response.status}`);
            }
            
            const answer = await response.json();
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer.sdp));
            
            // Step 11: Activation complete
            this.isActive = true;
            this.showMonitoringInterface();
            this.showStatus('Sign Language Detection Active - Captions will appear on webpage videos', 'success');
            
            console.log("[SignLanguageHandler] Webpage video overlay system activated successfully");
            return true;
            
        } catch (error) {
            console.error('[SignLanguageHandler] Activation failed:', error);
            this.cleanupResources();
            this.showStatus(`Activation Failed: ${error.message}`, 'error');
            return false;
        }
    }
    
    /**
     * CORE FEATURE: Initialize webpage video detection and caption overlay system
     * This method finds all videos on the current webpage and sets up caption containers
     */
    initializeWebpageVideoDetection() {
        console.log("[SignLanguageHandler] Initializing webpage video detection system");
        
        // Find all existing videos on the page
        this.detectExistingVideos();
        
        // Set up observer to detect dynamically added videos (for SPAs, lazy loading, etc.)
        this.setupVideoObserver();
        
        // Set up window resize handler to adjust caption positioning
        window.addEventListener('resize', this.handleWindowResize.bind(this));
        
        // Set up scroll handler to update caption positions
        window.addEventListener('scroll', this.handlePageScroll.bind(this), { passive: true });
        
        console.log(`[SignLanguageHandler] Video detection initialized - found ${this.webpageVideos.size} videos`);
    }
    
    /**
     * Detect all existing video elements on the current webpage
     * Supports HTML5 videos, YouTube, Vimeo, and other embedded players
     */
    detectExistingVideos() {
        // Find HTML5 video elements
        const html5Videos = document.querySelectorAll('video');
        html5Videos.forEach(video => this.registerVideo(video, 'html5'));
        
        // Find YouTube players (both iframe and div containers)
        const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
        youtubeIframes.forEach(iframe => this.registerVideo(iframe, 'youtube-iframe'));
        
        const youtubeContainers = document.querySelectorAll('#movie_player, .html5-video-container');
        youtubeContainers.forEach(container => this.registerVideo(container, 'youtube-container'));
        
        // Find Vimeo players
        const vimeoIframes = document.querySelectorAll('iframe[src*="vimeo.com"]');
        vimeoIframes.forEach(iframe => this.registerVideo(iframe, 'vimeo'));
        
        // Find other common video containers
        const videoContainers = document.querySelectorAll(
            '.video-player, .player, .video-container, .video-wrapper, ' +
            '[class*="video"], [class*="player"], [data-video], [data-player]'
        );
        videoContainers.forEach(container => {
            // Only register if it doesn't contain a video we've already found
            if (!container.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]')) {
                this.registerVideo(container, 'generic-container');
            }
        });
    }
    
    /**
     * Register a video element and create caption overlay system for it
     * Each video gets its own caption container positioned relative to the video
     */
    registerVideo(videoElement, type) {
        if (!videoElement || this.webpageVideos.has(videoElement)) {
            return; // Skip if already registered
        }
        
        console.log(`[SignLanguageHandler] Registering ${type} video:`, videoElement);
        
        // Store video information
        const videoInfo = {
            element: videoElement,
            type: type,
            id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            captionContainer: null,
            isVisible: this.isVideoVisible(videoElement),
            lastKnownBounds: null
        };
        
        this.webpageVideos.set(videoElement, videoInfo);
        
        // Create caption overlay container for this video
        this.createCaptionContainerForVideo(videoInfo);
        
        // Set up intersection observer to track when video enters/leaves viewport
        this.observeVideoVisibility(videoInfo);
        
        // If this is the first visible video, make it the active target
        if (videoInfo.isVisible && !this.activeVideoTarget) {
            this.setActiveVideoTarget(videoInfo);
        }
    }
    
    /**
     * Create a caption overlay container positioned relative to a specific video
     * This container will hold all captions for this particular video
     */
    createCaptionContainerForVideo(videoInfo) {
        const captionContainer = document.createElement('div');
        captionContainer.id = `sign-language-captions-${videoInfo.id}`;
        captionContainer.className = 'sign-language-webpage-captions';
        
        // Position the container absolutely over the video
        captionContainer.style.position = 'absolute';
        captionContainer.style.top = '0';
        captionContainer.style.left = '0';
        captionContainer.style.width = '100%';
        captionContainer.style.height = '100%';
        captionContainer.style.pointerEvents = 'none'; // Allow clicks to pass through
        captionContainer.style.zIndex = this.captionSettings.zIndex;
        captionContainer.style.display = 'flex';
        captionContainer.style.flexDirection = 'column';
        captionContainer.style.justifyContent = 'flex-end'; // Align captions to bottom
        captionContainer.style.alignItems = 'center'; // Center captions horizontally
        captionContainer.style.padding = '20px';
        captionContainer.style.boxSizing = 'border-box';
        
        // Position the container relative to the video element
        this.positionCaptionContainer(videoInfo, captionContainer);
        
        // Add to the page
        document.body.appendChild(captionContainer);
        
        // Store references
        videoInfo.captionContainer = captionContainer;
        this.videoCaptionContainers.set(videoInfo.element, captionContainer);
        
        console.log(`[SignLanguageHandler] Created caption container for ${videoInfo.type} video`);
    }
    
    /**
     * Position caption container to match the video element's position and size
     * This ensures captions appear exactly over the video content
     */
    positionCaptionContainer(videoInfo, captionContainer) {
        const videoElement = videoInfo.element;
        
        // Get video element's position and dimensions
        const rect = videoElement.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // Position container to exactly match video bounds
        captionContainer.style.position = 'absolute';
        captionContainer.style.left = `${rect.left + scrollX}px`;
        captionContainer.style.top = `${rect.top + scrollY}px`;
        captionContainer.style.width = `${rect.width}px`;
        captionContainer.style.height = `${rect.height}px`;
        
        // Store bounds for comparison in future updates
        videoInfo.lastKnownBounds = {
            left: rect.left + scrollX,
            top: rect.top + scrollY,
            width: rect.width,
            height: rect.height
        };
        
        // Special handling for different video types
        if (videoInfo.type === 'youtube-container' || videoInfo.type === 'youtube-iframe') {
            // YouTube videos might need slight adjustments for player controls
            captionContainer.style.paddingBottom = '80px'; // Extra space for YouTube controls
        } else if (videoInfo.type === 'vimeo') {
            // Vimeo videos might need different spacing
            captionContainer.style.paddingBottom = '70px';
        }
    }
    
    /**
     * Set up MutationObserver to detect dynamically added videos
     * This handles Single Page Applications and lazy-loaded content
     */
    setupVideoObserver() {
        this.videoObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the added node is a video
                        if (node.tagName === 'VIDEO') {
                            this.registerVideo(node, 'html5');
                        } else if (node.tagName === 'IFRAME') {
                            if (node.src && (node.src.includes('youtube') || node.src.includes('vimeo'))) {
                                this.registerVideo(node, node.src.includes('youtube') ? 'youtube-iframe' : 'vimeo');
                            }
                        } else {
                            // Check for videos within the added node
                            const videos = node.querySelectorAll('video');
                            videos.forEach(video => this.registerVideo(video, 'html5'));
                            
                            const iframes = node.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]');
                            iframes.forEach(iframe => {
                                this.registerVideo(iframe, iframe.src.includes('youtube') ? 'youtube-iframe' : 'vimeo');
                            });
                        }
                    }
                });
            });
        });
        
        // Start observing
        this.videoObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    /**
     * Check if a video element is currently visible in the viewport
     */
    isVideoVisible(videoElement) {
        const rect = videoElement.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        
        // Consider video visible if it's at least partially in viewport and has reasonable size
        return (
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < windowHeight &&
            rect.left < windowWidth &&
            rect.width > 100 &&  // Minimum width to be considered a real video
            rect.height > 100    // Minimum height to be considered a real video
        );
    }
    
    /**
     * Set up intersection observer to track video visibility changes
     */
    observeVideoVisibility(videoInfo) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const wasVisible = videoInfo.isVisible;
                videoInfo.isVisible = entry.isIntersecting && entry.intersectionRatio > 0.1;
                
                if (videoInfo.isVisible && !wasVisible) {
                    // Video became visible
                    console.log(`[SignLanguageHandler] Video became visible:`, videoInfo.type);
                    if (!this.activeVideoTarget) {
                        this.setActiveVideoTarget(videoInfo);
                    }
                } else if (!videoInfo.isVisible && wasVisible) {
                    // Video became hidden
                    console.log(`[SignLanguageHandler] Video became hidden:`, videoInfo.type);
                    if (this.activeVideoTarget === videoInfo) {
                        this.findNextActiveVideo();
                    }
                }
            });
        }, {
            threshold: [0, 0.1, 0.5, 1.0] // Multiple thresholds for better tracking
        });
        
        observer.observe(videoInfo.element);
        videoInfo.visibilityObserver = observer;
    }
    
    /**
     * Set the active video target for caption display
     * Captions will appear on this video when translations are received
     */
    setActiveVideoTarget(videoInfo) {
        if (this.activeVideoTarget === videoInfo) return;
        
        console.log(`[SignLanguageHandler] Setting active video target:`, videoInfo.type);
        this.activeVideoTarget = videoInfo;
        
        // Update visual indicator (if monitoring window is shown)
        this.updateActiveVideoIndicator();
    }
    
    /**
     * Find the next best video to target for captions when current target becomes unavailable
    */
    findNextActiveVideo() {
        // Find the largest visible video as the new target
        let bestVideo = null;
        let bestSize = 0;
        
        for (const [element, videoInfo] of this.webpageVideos) {
            if (videoInfo.isVisible) {
                const rect = element.getBoundingClientRect();
                const size = rect.width * rect.height;
                if (size > bestSize) {
                    bestSize = size;
                    bestVideo = videoInfo;
                }
            }
        }
        
        if (bestVideo) {
            this.setActiveVideoTarget(bestVideo);
        } else {
            this.activeVideoTarget = null;
            console.log("[SignLanguageHandler] No visible videos found for caption target");
        }
    }
    
    /**
     * Handle window resize events to update caption container positions
     */
    handleWindowResize() {
        // Debounce resize events
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.updateAllCaptionContainerPositions();
        }, 100);
    }
    
    /**
     * Handle page scroll events to update caption container positions
     */
    handlePageScroll() {
        // Throttle scroll events for performance
        if (!this.scrollThrottled) {
            this.scrollThrottled = true;
            requestAnimationFrame(() => {
                this.updateAllCaptionContainerPositions();
                this.scrollThrottled = false;
            });
        }
    }
    
    /**
     * Update positions of all caption containers to match their video elements
     */
    updateAllCaptionContainerPositions() {
        for (const [element, videoInfo] of this.webpageVideos) {
            if (videoInfo.captionContainer && videoInfo.isVisible) {
                this.positionCaptionContainer(videoInfo, videoInfo.captionContainer);
            }
        }
    }
    
    /**
     * Set up translation data channel for receiving MediaPipe translations
     */
    setupTranslationDataChannel() {
        this.dataChannel.onopen = () => {
            console.log("[SignLanguageHandler] Translation data channel opened");
            this.updateConnectionStatus('connected');
            this.showStatus('Ready for Sign Language Detection on Webpage Videos', 'success');
            
            setTimeout(() => {
                if (this.dataChannel.readyState === 'open') {
                    this.dataChannel.send('get_landmarks');
                    this.dataChannel.send('get_performance');
                }
            }, 1000);
            
            this.landmarkInterval = setInterval(() => {
                if (this.dataChannel.readyState === 'open') {
                    this.dataChannel.send('get_translation');
                }
            }, 1000);
        };
        
        this.dataChannel.onclose = () => {
            console.log("[SignLanguageHandler] Translation data channel closed");
            this.updateConnectionStatus('disconnected');
        };
        
        this.dataChannel.onerror = (error) => {
            console.error("[SignLanguageHandler] Data channel error:", error);
        };
        
        this.dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'holistic_landmarks') {
                    this.processLandmarksData(data);
                } else if (data.type === 'performance_stats') {
                    this.processPerformanceData(data);
                } else if (data.type === 'translation') {
                    // CORE FUNCTIONALITY: Display translation on active webpage video
                    console.log("[SignLanguageHandler] Translation received for webpage video:", data.text);
                    this.processTranslationForWebpageVideo(data);
                } else if (data.type === 'stats' && data.fps !== undefined) {
                    this.fps = data.fps;
                    this.updateFPSDisplay();
                }
                
            } catch (error) {
                console.error("[SignLanguageHandler] Error processing server message:", error);
            }
        };
    }
    
    /**
     * CORE METHOD: Process translation and display on active webpage video
     * This is the main method that creates captions on the user's video content
     */
   processTranslationForWebpageVideo(data) {
        const translatedText = data.text;
        const confidence = data.confidence || 0.8; // Default confidence if not provided
        const timestamp = Date.now();
        
        console.log(`[SignLanguageHandler] Raw translation received: "${translatedText}" (confidence: ${confidence})`);
        
        // STEP 1: Apply intelligent deduplication filter
        const shouldDisplay = this.shouldDisplayTranslation(translatedText, confidence, timestamp);
        
        if (!shouldDisplay.display) {
            console.log(`[SignLanguageHandler] Translation filtered out: ${shouldDisplay.reason}`);
            // Still store the translation for history, but don't display it
            this.updateTranslationHistory(translatedText, confidence, timestamp, false);
            return; // Early return - don't display this caption
        }
        
        console.log(`[SignLanguageHandler] Translation approved for display: "${translatedText}" (${shouldDisplay.reason})`);
        
        // STEP 2: Store translation data (now includes deduplication metadata)
        this.lastTranslation = {
            text: translatedText,
            timestamp: timestamp,
            confidence: confidence,
            words: data.words || null,
            displayMethod: 'webpage-video-overlay',
            wasDisplayed: true,
            deduplicationReason: shouldDisplay.reason
        };
        
        // STEP 3: Update deduplication tracking
        this.updateDeduplicationTracking(translatedText, confidence, timestamp);
        
        // STEP 4: Add to history
        this.updateTranslationHistory(translatedText, confidence, timestamp, true);
        
        // STEP 5: Display translation on the active webpage video
        if (this.activeVideoTarget && this.activeVideoTarget.captionContainer) {
            this.displayCaptionOnWebpageVideo(this.activeVideoTarget, translatedText, confidence, timestamp);
        } else {
            console.warn("[SignLanguageHandler] No active video target available for caption display");
            this.findNextActiveVideo();
            if (this.activeVideoTarget) {
                this.displayCaptionOnWebpageVideo(this.activeVideoTarget, translatedText, confidence, timestamp);
            }
        }
        
        // STEP 6: Update status with deduplication info
        this.showStatus(`Displayed: "${translatedText}" (filtered duplicates)`, 'translation');
    }
    
 /**
     * NEW: Intelligent deduplication decision engine
     * This method implements sophisticated logic to determine whether a translation should be displayed
     * It considers exact matches, timing, confidence improvements, and contextual factors
     */
    shouldDisplayTranslation(newText, newConfidence, currentTime) {
        const dedup = this.deduplicationSystem;
        
        // RULE 1: Always show the first translation
        if (!dedup.lastDisplayedText) {
            return {
                display: true,
                reason: "First translation of session"
            };
        }
        
        // RULE 2: Always show if text is completely different
        if (!this.areTranslationsSimilar(newText, dedup.lastDisplayedText)) {
            return {
                display: true,
                reason: "New word/phrase detected"
            };
        }
        
        // RULE 3: Check if enough time has passed for legitimate repetition
        const timeSinceLastDisplay = currentTime - dedup.lastDisplayedTime;
        if (timeSinceLastDisplay >= dedup.repetitionThreshold) {
            return {
                display: true,
                reason: `Sufficient time elapsed (${timeSinceLastDisplay}ms > ${dedup.repetitionThreshold}ms)`
            };
        }
        
        // RULE 4: Show if confidence has improved significantly
        const confidenceImprovement = newConfidence - dedup.lastConfidence;
        if (confidenceImprovement >= dedup.confidenceThreshold) {
            return {
                display: Fals,
                reason: `Significant confidence improvement (+${(confidenceImprovement * 100).toFixed(1)}%)`
            };
        }
        
        // RULE 5: Context-based filtering - check if this fits a pattern
        const contextualDecision = this.analyzeTranslationContext(newText, newConfidence);
        if (contextualDecision.display) {
            return contextualDecision;
        }
        
        // DEFAULT: Filter out as duplicate
        return {
            display: false,
            reason: `Duplicate filtered - same as "${dedup.lastDisplayedText}" from ${timeSinceLastDisplay}ms ago`
        };
    }
    
    /**
     * NEW: Determine if two translations are similar enough to be considered duplicates
     * This method handles exact matches, case differences, and minor variations
     */
    areTranslationsSimilar(text1, text2) {
        if (!text1 || !text2) return false;
        
        // Normalize both texts for comparison
        const normalized1 = this.normalizeTextForComparison(text1);
        const normalized2 = this.normalizeTextForComparison(text2);
        
        // Exact match after normalization
        if (normalized1 === normalized2) {
            return true;
        }
        
        // Calculate similarity ratio for fuzzy matching
        const similarity = this.calculateTextSimilarity(normalized1, normalized2);
        return similarity >= this.deduplicationSystem.similarityThreshold;
    }
    
    /**
     * NEW: Normalize text for consistent comparison
     * This handles common variations that should be treated as the same word
     */
    normalizeTextForComparison(text) {
        return text
            .toLowerCase()                    // Handle case differences
            .trim()                          // Remove leading/trailing whitespace
            .replace(/[^\w\s]/g, '')         // Remove punctuation
            .replace(/\s+/g, ' ')            // Normalize whitespace
            .replace(/\b(a|an|the)\b/g, ''); // Remove common articles that might vary
    }
    
    /**
     * NEW: Calculate similarity between two text strings
     * Uses a combination of techniques to handle minor variations in recognition
     */
    calculateTextSimilarity(text1, text2) {
        // Handle identical strings
        if (text1 === text2) return 1.0;
        
        // Handle empty strings
        if (!text1 || !text2) return 0.0;
        
        // Use Levenshtein distance for similarity calculation
        const maxLength = Math.max(text1.length, text2.length);
        const distance = this.calculateLevenshteinDistance(text1, text2);
        return 1.0 - (distance / maxLength);
    }
    
    /**
     * NEW: Calculate Levenshtein distance between two strings
     * This measures the minimum number of single-character edits needed to transform one string into another
     */
    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];
        
        // Initialize the matrix
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        // Fill the matrix
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]; // No operation needed
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // Substitution
                        matrix[i][j - 1] + 1,     // Insertion
                        matrix[i - 1][j] + 1      // Deletion
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    /**
     * NEW: Analyze translation context to make smarter filtering decisions
     * This method looks at patterns in recent translations to make contextual decisions
     */
    analyzeTranslationContext(newText, newConfidence) {
        const recent = this.deduplicationSystem.recentTranslations;
        
        // PATTERN 1: Alternating words (A-B-A-B pattern)
        if (recent.length >= 3) {
            const isAlternatingPattern = this.detectAlternatingPattern(newText, recent);
            if (isAlternatingPattern) {
                return {
                    display: true,
                    reason: "Alternating word pattern detected (legitimate repetition)"
                };
            }
        }
        
        // PATTERN 2: Progressive confidence improvement
        if (recent.length >= 2) {
            const isProgressiveImprovement = this.detectProgressiveImprovement(newConfidence, recent);
            if (isProgressiveImprovement) {
                return {
                    display: true,
                    reason: "Progressive confidence improvement pattern"
                };
            }
        }
        
        // PATTERN 3: Phrase completion (word is part of a longer phrase)
        const isPhraseCompletion = this.detectPhraseCompletion(newText, recent);
        if (isPhraseCompletion) {
            return {
                display: true,
                reason: "Word completes a phrase pattern"
            };
        }
        
        // No special contextual pattern detected
        return {
            display: false,
            reason: "No contextual pattern justifies display"
        };
    }
    
    /**
     * NEW: Detect alternating word patterns (legitimate back-and-forth)
     */
    detectAlternatingPattern(newText, recentTranslations) {
        if (recentTranslations.length < 3) return false;
        
        const lastText = recentTranslations[recentTranslations.length - 1].text;
        const beforeLastText = recentTranslations[recentTranslations.length - 2].text;
        const beforeBeforeLastText = recentTranslations[recentTranslations.length - 3].text;
        
        // Check if we have an A-B-A pattern and new text would continue it
        return (
            this.areTranslationsSimilar(newText, beforeLastText) &&
            !this.areTranslationsSimilar(lastText, beforeLastText) &&
            this.areTranslationsSimilar(beforeLastText, beforeBeforeLastText)
        );
    }
    
    /**
     * NEW: Detect progressive confidence improvement
     */
    detectProgressiveImprovement(newConfidence, recentTranslations) {
        if (recentTranslations.length < 2) return false;
        
        // Check if confidence has been steadily improving
        const recentConfidences = recentTranslations.slice(-2).map(t => t.confidence);
        const isImproving = recentConfidences.every((conf, index) => {
            return index === 0 || conf >= recentConfidences[index - 1];
        });
        
        return isImproving && newConfidence > recentConfidences[recentConfidences.length - 1];
    }
    
    /**
     * NEW: Detect phrase completion patterns
     */
    detectPhraseCompletion(newText, recentTranslations) {
        if (recentTranslations.length < 2) return false;
        
        // Look for patterns where words build into common phrases
        const recentWords = recentTranslations.slice(-2).map(t => t.text.toLowerCase());
        const newWord = newText.toLowerCase();
        
        // Check for common phrase patterns
        const commonPhrases = [
            ['thank', 'you'],
            ['good', 'morning'],
            ['good', 'evening'],
            ['how', 'are', 'you'],
            ['nice', 'to', 'meet', 'you']
        ];
        
        for (const phrase of commonPhrases) {
            if (this.matchesPhrasePattern([...recentWords, newWord], phrase)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * NEW: Check if recent words match a known phrase pattern
     */
    matchesPhrasePattern(recentWords, phrasePattern) {
        if (recentWords.length > phrasePattern.length) return false;
        
        // Check if recent words match the beginning of the phrase pattern
        for (let i = 0; i < recentWords.length; i++) {
            if (recentWords[i] !== phrasePattern[i]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * NEW: Update deduplication tracking after displaying a caption
     */
    updateDeduplicationTracking(displayedText, confidence, timestamp) {
        const dedup = this.deduplicationSystem;
        
        // Update last displayed information
        dedup.lastDisplayedText = displayedText;
        dedup.lastDisplayedTime = timestamp;
        dedup.lastConfidence = confidence;
        
        // Add to recent translations buffer
        dedup.recentTranslations.push({
            text: displayedText,
            confidence: confidence,
            timestamp: timestamp
        });
        
        // Maintain buffer size
        if (dedup.recentTranslations.length > dedup.maxRecentBuffer) {
            dedup.recentTranslations.shift(); // Remove oldest entry
        }
        
        console.log(`[SignLanguageHandler] Deduplication tracking updated. Recent buffer size: ${dedup.recentTranslations.length}`);
    }
    
    /**
     * NEW: Update translation history with display status
     */
    updateTranslationHistory(text, confidence, timestamp, wasDisplayed) {
        const historyEntry = {
            text: text,
            confidence: confidence,
            timestamp: timestamp,
            wasDisplayed: wasDisplayed,
            displayMethod: wasDisplayed ? 'webpage-video-overlay' : 'filtered-duplicate'
        };
        
        this.translationHistory.push(historyEntry);
        
        // Keep history manageable (store more entries since some are filtered)
        if (this.translationHistory.length > 50) {
            this.translationHistory.shift();
        }
    }
    
    /**
     * NEW: Configure deduplication settings
     * This method allows fine-tuning of the deduplication behavior
     */
    updateDeduplicationSettings(newSettings) {
        this.deduplicationSystem = { 
            ...this.deduplicationSystem, 
            ...newSettings 
        };
        
        console.log("[SignLanguageHandler] Deduplication settings updated:", this.deduplicationSystem);
    }
    
    /**
     * NEW: Get deduplication statistics for monitoring and debugging
     */
    getDeduplicationStats() {
        const totalTranslations = this.translationHistory.length;
        const displayedTranslations = this.translationHistory.filter(t => t.wasDisplayed).length;
        const filteredTranslations = totalTranslations - displayedTranslations;
        const filteringRate = totalTranslations > 0 ? (filteredTranslations / totalTranslations) * 100 : 0;
        
        return {
            totalReceived: totalTranslations,
            displayed: displayedTranslations,
            filtered: filteredTranslations,
            filteringRate: filteringRate.toFixed(1) + '%',
            lastDisplayedText: this.deduplicationSystem.lastDisplayedText,
            timeSinceLastDisplay: Date.now() - this.deduplicationSystem.lastDisplayedTime,
            recentBufferSize: this.deduplicationSystem.recentTranslations.length
        };
    }
    
    /**
     * Enhanced: Clear translation history and reset deduplication system
     */
    clearTranslationHistory() {
        this.translationHistory = [];
        this.lastTranslation = null;
        
        // Reset deduplication tracking
        this.deduplicationSystem.lastDisplayedText = null;
        this.deduplicationSystem.lastDisplayedTime = 0;
        this.deduplicationSystem.lastConfidence = 0;
        this.deduplicationSystem.recentTranslations = [];
        
        this.clearAllWebpageVideoCaptions();
        console.log("[SignLanguageHandler] Translation history and deduplication system reset");
    }
    

    /**
     * CORE METHOD: Display caption on a specific webpage video
     * Creates and animates caption overlays on the actual video content the user is watching
     */
    displayCaptionOnWebpageVideo(videoInfo, text, confidence = null, timestamp = Date.now()) {
        if (!videoInfo.captionContainer || !text || text.trim() === '') {
            console.warn("[SignLanguageHandler] Cannot display webpage caption - missing container or text");
            return;
        }
        
        // Update caption container position before adding new caption
        this.positionCaptionContainer(videoInfo, videoInfo.captionContainer);
        
        const captionId = `webpage-caption-${this.captionIdCounter++}`;
        console.log(`[SignLanguageHandler] Creating webpage video caption: "${text}" (ID: ${captionId})`);
        
        // Create caption element
        const captionElement = document.createElement('div');
        captionElement.className = 'sign-language-webpage-caption';
        captionElement.id = captionId;
        
        // Prepare display text with confidence indicator
        let displayText = text.trim();
        if (confidence !== null && confidence < 0.85) {
            const confidencePercent = Math.round(confidence * 100);
            displayText += ` [${confidencePercent}% confidence]`;
        }
        
        captionElement.textContent = displayText;
        
        // Apply webpage-optimized styling
        this.applyWebpageCaptionStyling(captionElement);
        
        // Add to the video's caption container
        videoInfo.captionContainer.appendChild(captionElement);
        
        // Track active caption
        this.activeCaptions.add(captionElement);
        
        // Animate appearance
        this.animateCaptionEntry(captionElement);
        
        // Schedule removal
        this.scheduleCaptionRemoval(captionElement, captionId, videoInfo);
        
        // Manage caption count for this video
        this.limitCaptionsForVideo(videoInfo);
        
        console.log(`[SignLanguageHandler] Webpage video caption displayed: "${displayText}"`);
    }
    
    /**
     * Apply styling optimized for webpage video captions
     * These styles are designed to work well over any webpage video content
     */
    applyWebpageCaptionStyling(captionElement) {
        const settings = this.captionSettings;
        
        // Core positioning and layout
        captionElement.style.position = 'relative';
        captionElement.style.display = 'block';
        captionElement.style.width = 'auto';
        captionElement.style.maxWidth = settings.maxWidth;
        captionElement.style.margin = '0 auto';
        captionElement.style.marginBottom = '12px'; // Space between multiple captions
        
        // Typography optimized for webpage videos
        captionElement.style.fontSize = settings.fontSize;
        captionElement.style.fontFamily = settings.fontFamily;
        captionElement.style.fontWeight = 'bold';
        captionElement.style.lineHeight = '1.3';
        captionElement.style.textAlign = 'center';
        captionElement.style.wordWrap = 'break-word';
        captionElement.style.whiteSpace = 'pre-wrap';
        
        // Visual styling for maximum readability over video content
        captionElement.style.color = settings.textColor;
        captionElement.style.backgroundColor = settings.backgroundColor;
        captionElement.style.padding = settings.padding;
        captionElement.style.borderRadius = settings.borderRadius;
        captionElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)'; // Stronger shadow for webpage
        captionElement.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 1)'; // Stronger text shadow
        captionElement.style.border = '1px solid rgba(255, 255, 255, 0.2)'; // Subtle border for definition
        
        // Interaction properties
        captionElement.style.pointerEvents = 'none';
        captionElement.style.userSelect = 'none';
        captionElement.style.zIndex = settings.zIndex;
        
        // Animation setup
        captionElement.style.opacity = '0';
        captionElement.style.transform = 'translateY(20px) scale(0.9)';
        captionElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    }
    
    /**
     * Animate caption entry with smooth appearance
     */
    animateCaptionEntry(captionElement) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                captionElement.style.opacity = '1';
                captionElement.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
    
    /**
     * Schedule caption removal with cleanup
     */
    scheduleCaptionRemoval(captionElement, captionId, videoInfo) {
        const removalTimer = setTimeout(() => {
            this.removeCaptionWithAnimation(captionElement, captionId);
        }, this.captionSettings.displayDuration);
        
        captionElement.dataset.removalTimer = removalTimer;
        captionElement.dataset.videoId = videoInfo.id;
    }
    
    /**
     * Remove caption with smooth animation
     */
    removeCaptionWithAnimation(captionElement, captionId) {
        if (!captionElement || !captionElement.parentNode) {
            return;
        }
        
        console.log(`[SignLanguageHandler] Removing webpage caption: ${captionId}`);
        
        // Remove from tracking
        this.activeCaptions.delete(captionElement);
        
        // Animate removal
        captionElement.style.transition = `all ${this.captionSettings.fadeOutDuration}ms cubic-bezier(0.4, 0, 0.6, 1)`;
        captionElement.style.opacity = '0';
        captionElement.style.transform = 'translateY(-15px) scale(0.9)';
        
        // Remove from DOM
        setTimeout(() => {
            if (captionElement.parentNode) {
                captionElement.parentNode.removeChild(captionElement);
            }
        }, this.captionSettings.fadeOutDuration);
    }
    
    /**
     * Limit number of captions per video to prevent overcrowding
     */
    limitCaptionsForVideo(videoInfo) {
        if (!videoInfo.captionContainer) return;
        
        const captions = videoInfo.captionContainer.querySelectorAll('.sign-language-webpage-caption');
        const maxVisible = this.captionSettings.maxCaptionsVisible;
        
        if (captions.length > maxVisible) {
            const excessCount = captions.length - maxVisible;
            const captionsToRemove = Array.from(captions).slice(0, excessCount);
            
            captionsToRemove.forEach((caption, index) => {
                setTimeout(() => {
                    this.removeCaptionWithAnimation(caption, caption.id);
                }, index * 150);
            });
        }
    }
    
    /**
     * Clear all captions from all webpage videos
     */
    clearAllWebpageVideoCaptions() {
        console.log("[SignLanguageHandler] Clearing all webpage video captions");
        
        this.activeCaptions.forEach(caption => {
            if (caption.dataset.removalTimer) {
                clearTimeout(caption.dataset.removalTimer);
            }
            if (caption.parentNode) {
                caption.parentNode.removeChild(caption);
            }
        });
        
        this.activeCaptions.clear();
        console.log("[SignLanguageHandler] All webpage video captions cleared");
    }
    
    /**
     * Create optional MediaPipe monitoring interface
     * This is a smaller window for system monitoring, separate from main video captions
     */
    createMediaPipeMonitoringInterface() {
        if (!this.showMonitoringWindow) return;
        
        // Remove any existing monitoring container
        let container = document.getElementById('signLanguageMonitoringContainer');
        if (container) {
            document.body.removeChild(container);
        }
        
        // Create compact monitoring container
        container = document.createElement('div');
        container.id = 'signLanguageMonitoringContainer';
        container.style.position = 'fixed';
        container.style.bottom = '20px';
        container.style.right = '20px';
        container.style.width = '280px';
        container.style.height = 'auto';
        container.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        container.style.border = '1px solid #00BCD4';
        container.style.borderRadius = '8px';
        container.style.padding = '10px';
        container.style.zIndex = '2147483646'; // Just below captions
        container.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        container.style.backdropFilter = 'blur(10px)';
        container.style.display = 'none';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.fontSize = '12px';
        container.style.color = 'white';
        
        // Title bar
        const titleBar = document.createElement('div');
        titleBar.style.display = 'flex';
        titleBar.style.justifyContent = 'space-between';
        titleBar.style.alignItems = 'center';
        titleBar.style.marginBottom = '8px';
        titleBar.style.paddingBottom = '5px';
        titleBar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        
        const title = document.createElement('div');
        title.textContent = 'MediaPipe Monitor';
        title.style.fontWeight = 'bold';
        title.style.fontSize = '13px';
        
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
        closeButton.onclick = () => container.style.display = 'none';
        
        titleBar.appendChild(title);
        titleBar.appendChild(closeButton);
        container.appendChild(titleBar);
        
        // Hidden processing video
        this.videoElement = document.createElement('video');
        this.videoElement.autoplay = true;
        this.videoElement.muted = true;
        this.videoElement.playsInline = true;
        this.videoElement.style.display = 'none';
        container.appendChild(this.videoElement);
        
        // Optional: Small display video for monitoring
        this.displayElement = document.createElement('video');
        this.displayElement.autoplay = true;
        this.displayElement.playsInline = true;
        this.displayElement.muted = true;
        this.displayElement.style.width = '100%';
        this.displayElement.style.height = '120px';
        this.displayElement.style.borderRadius = '4px';
        this.displayElement.style.backgroundColor = '#000';
        container.appendChild(this.displayElement);
        
        // Status information
        const statusContainer = document.createElement('div');
        statusContainer.style.marginTop = '8px';
        statusContainer.style.paddingTop = '5px';
        statusContainer.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
        
        const statusRow1 = document.createElement('div');
        statusRow1.style.display = 'flex';
        statusRow1.style.justifyContent = 'space-between';
        statusRow1.style.marginBottom = '4px';
        
        const fpsDisplay = document.createElement('div');
        fpsDisplay.id = 'signLanguageFPS';
        fpsDisplay.textContent = '0.0 FPS';
        fpsDisplay.style.fontWeight = 'bold';
        
        const connectionStatus = document.createElement('div');
        connectionStatus.id = 'connectionStatus';
        connectionStatus.textContent = 'Connecting...';
        connectionStatus.style.fontSize = '10px';
        
        statusRow1.appendChild(fpsDisplay);
        statusRow1.appendChild(connectionStatus);
        
        const statusRow2 = document.createElement('div');
        const detectionStatus = document.createElement('div');
        detectionStatus.id = 'signLanguageDetection';
        detectionStatus.textContent = 'Initializing...';
        detectionStatus.style.fontSize = '10px';
        detectionStatus.style.textAlign = 'center';
        
        statusRow2.appendChild(detectionStatus);
        
        const activeVideoDisplay = document.createElement('div');
        activeVideoDisplay.id = 'activeVideoDisplay';
        activeVideoDisplay.textContent = 'No active video target';
        activeVideoDisplay.style.fontSize = '10px';
        activeVideoDisplay.style.textAlign = 'center';
        activeVideoDisplay.style.marginTop = '4px';
        activeVideoDisplay.style.color = '#ccc';
        
        statusContainer.appendChild(statusRow1);
        statusContainer.appendChild(statusRow2);
        statusContainer.appendChild(activeVideoDisplay);
        container.appendChild(statusContainer);
        
        // Add double-click for debug mode
        container.addEventListener('dblclick', () => {
            this.toggleDebugMode();
        });
        
        document.body.appendChild(container);
        this.monitoringContainer = container;
        
        console.log("[SignLanguageHandler] MediaPipe monitoring interface created");
    }
    
    /**
     * Show the monitoring interface
     */
    showMonitoringInterface() {
        if (this.monitoringContainer && this.showMonitoringWindow) {
            this.monitoringContainer.style.display = 'block';
        }
    }
    
    /**
     * Update active video indicator in monitoring interface
     */
    updateActiveVideoIndicator() {
        const activeVideoDisplay = document.getElementById('activeVideoDisplay');
        if (activeVideoDisplay) {
            if (this.activeVideoTarget) {
                activeVideoDisplay.textContent = `Active: ${this.activeVideoTarget.type} video`;
                activeVideoDisplay.style.color = '#4CAF50';
            } else {
                activeVideoDisplay.textContent = 'No active video target';
                activeVideoDisplay.style.color = '#ccc';
            }
        }
    }
    
    /**
     * Process MediaPipe landmark data for monitoring
     */
    processLandmarksData(data) {
        this.faceLandmarks = data.has_face ? {} : null;
        this.poseLandmarks = data.has_pose ? (data.pose_info || {}) : null;
        this.leftHandLandmarks = data.has_left_hand ? {} : null;
        this.rightHandLandmarks = data.has_right_hand ? {} : null;
        
        this.lastLandmarkUpdate = {
            timestamp: Date.now(),
            frame_id: data.frame_id,
            quality_score: data.quality_score,
            processing_scale: data.processing_scale
        };
        
        this.updateDetectionStatus(data);
        
        // Dispatch for external monitoring
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
     * Process performance data from MediaPipe
     */
    processPerformanceData(data) {
        this.serverPerformanceData = data;
        
        if (data.output_fps !== undefined) {
            this.fps = data.output_fps;
        }
        
        this.updateFPSDisplay();
        
        if (this.showDetailedInfo) {
            console.log(`[SignLanguageHandler] Performance: ${data.output_fps?.toFixed(1) || 'N/A'} FPS`);
        }
    }
    
    /**
     * Show status message
     */
    showStatus(message, type = 'info') {
        console.log(`[SignLanguageHandler] Status (${type}): ${message}`);
    }
    
    /**
     * Update connection status
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
     * Update FPS display
     */
    updateFPSDisplay() {
        const fpsElement = document.getElementById('signLanguageFPS');
        if (fpsElement) {
            const displayFPS = this.fps || 0;
            fpsElement.textContent = `${displayFPS.toFixed(1)} FPS`;
            
            if (displayFPS >= 20) {
                fpsElement.style.color = '#4CAF50';
            } else if (displayFPS >= 10) {
                fpsElement.style.color = '#FFC107';
            } else if (displayFPS > 0) {
                fpsElement.style.color = '#FF9800';
            } else {
                fpsElement.style.color = '#F44336';
            }
        }
    }
    
    /**
     * Update detection status
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
                detectionElement.textContent = detectedParts.join(" • ");
                detectionElement.style.color = '#4CAF50';
            } else {
                detectionElement.textContent = 'No detection';
                detectionElement.style.color = '#999';
            }
        }
        
        this.updateFPSDisplay();
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.debugModeActive = !this.debugModeActive;
        this.showDetailedInfo = this.debugModeActive;
        console.log(`[SignLanguageHandler] Debug mode ${this.debugModeActive ? 'enabled' : 'disabled'}`);
        return this.debugModeActive;
    }
    
    /**
     * Update caption settings dynamically
     */
    updateCaptionSettings(newSettings) {
        this.captionSettings = { ...this.captionSettings, ...newSettings };
        console.log("[SignLanguageHandler] Caption settings updated:", this.captionSettings);
        
        // Apply to existing captions
        this.activeCaptions.forEach(caption => {
            if (newSettings.fontSize) caption.style.fontSize = newSettings.fontSize;
            if (newSettings.fontFamily) caption.style.fontFamily = newSettings.fontFamily;
            if (newSettings.backgroundColor) caption.style.backgroundColor = newSettings.backgroundColor;
            if (newSettings.textColor) caption.style.color = newSettings.textColor;
        });
    }
    
    /**
     * Deactivate the system and cleanup
     */
    deactivate() {
        if (!this.isActive) {
            console.log("[SignLanguageHandler] Already inactive");
            return;
        }
        
        console.log("[SignLanguageHandler] Deactivating webpage video overlay system");
        
        // Clear all captions
        this.clearAllWebpageVideoCaptions();
        
        // Hide monitoring interface
        if (this.monitoringContainer) {
            this.monitoringContainer.style.display = 'none';
        }
        
        // Stop video observer
        if (this.videoObserver) {
            this.videoObserver.disconnect();
            this.videoObserver = null;
        }
        
        // Stop visibility observers
        for (const [element, videoInfo] of this.webpageVideos) {
            if (videoInfo.visibilityObserver) {
                videoInfo.visibilityObserver.disconnect();
            }
        }
        
        // Remove caption containers
        for (const [element, container] of this.videoCaptionContainers) {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
        
        // Clear data structures
        this.webpageVideos.clear();
        this.videoCaptionContainers.clear();
        this.activeCaptions.clear();
        this.activeVideoTarget = null;
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleWindowResize.bind(this));
        window.removeEventListener('scroll', this.handlePageScroll.bind(this));
        
        // Clear intervals
        if (this.landmarkInterval) {
            clearInterval(this.landmarkInterval);
            this.landmarkInterval = null;
        }
        
        // Cleanup MediaPipe resources
        this.cleanupMediaPipeResources();
        this.isActive = false;
        
        console.log("[SignLanguageHandler] Webpage video overlay system deactivated");
    }
    
    /**
     * Cleanup MediaPipe-specific resources
     */
    cleanupMediaPipeResources() {
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
        
        // Reset state
        this.faceLandmarks = null;
        this.poseLandmarks = null;
        this.leftHandLandmarks = null;
        this.rightHandLandmarks = null;
        this.serverPerformanceData = null;
        this.lastLandmarkUpdate = null;
        this.fps = 0;
        
        console.log("[SignLanguageHandler] MediaPipe resources cleaned up");
    }
    
    /**
     * Test MediaPipe server connectivity
     */
    async pingServer() {
        try {
            const response = await fetch(`${this.serverUrl}/ping`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`[SignLanguageHandler] Server available: ${data.message}`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[SignLanguageHandler] Server connectivity failed: ${error.message}`);
            return false;
        }
    }
    
    // Public API methods for external access
    getLastTranslation() {
        return this.lastTranslation;
    }
    
    getTranslationHistory() {
        return this.translationHistory;
    }
    
   
    
    toggleMonitoringWindow() {
        this.showMonitoringWindow = !this.showMonitoringWindow;
        if (this.monitoringContainer) {
            this.monitoringContainer.style.display = this.showMonitoringWindow ? 'block' : 'none';
        }
        return this.showMonitoringWindow;
    }
    
    getDebugInfo() {

        const deduplicationStats = this.getDeduplicationStats();
        
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
            debugModeActive: this.debugModeActive,
            captionSettings: this.captionSettings,
            webpageVideosCount: this.webpageVideos.size,
            activeCaptionsCount: this.activeCaptions.size,
            activeVideoTarget: this.activeVideoTarget ? this.activeVideoTarget.type : 'none',
            translationHistoryCount: this.translationHistory.length,
            lastTranslation: this.lastTranslation,
            showMonitoringWindow: this.showMonitoringWindow,
            deduplication: {
                settings: this.deduplicationSystem,
                statistics: deduplicationStats
            }
        };


    }
}