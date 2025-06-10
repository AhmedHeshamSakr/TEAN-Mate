// VideoOverlayManager.js - Handles displaying speech text overlays on videos

class VideoOverlayManager {
    constructor() {
        // Overlay configuration
        this.config = {
            active: false,
            fontSize: '16px',
            textColor: '#FFFFFF',
            bgColor: 'rgba(0, 0, 0, 0.7)',
            position: 'bottom', // Keep this as 'bottom'
            duration: Infinity, // This change makes the text stay until cleared
            maxLines: 5
        };
        
        this.overlays = new Map(); // Map to track overlays for each video
        this.textQueue = []; // Queue of text segments to display
        this.processingQueue = false; // Flag to prevent multiple queue processors
        this.currentText = null;

    }
    
    // Activate or deactivate overlay system
    setActive(active) {
        console.log(`VideoOverlayManager: Setting active state to ${active}`);
        this.config.active = active;
        
        if (!active) {
            // Remove all overlays when deactivating
            this.removeAllOverlays();
            console.log('All video overlays removed');
        } else {
            console.log('Looking for videos to overlay...');
            // Find videos and create overlays when activating
            // Use a slight delay to ensure content is loaded
            setTimeout(() => this.setupOverlaysForVisibleVideos(), 500);
            
            // Also periodically check for new videos
            this.videoCheckInterval = setInterval(() => {
                this.setupOverlaysForVisibleVideos();
            }, 2000);
        }
    }
    
    // Find videos on the page and create overlays for them
    setupOverlaysForVisibleVideos() {
        if (!this.config.active) return;
        
        const videos = document.querySelectorAll('video');
        console.log(`Found ${videos.length} video elements on page`);
        
        if (videos.length === 0) {
            // If no videos found with standard query, try iframe videos
            const iframes = document.querySelectorAll('iframe');
            console.log(`Looking for videos in ${iframes.length} iframes`);
            
            iframes.forEach(iframe => {
                try {
                    // Try to access iframe content if from same origin
                    const iframeVideos = iframe.contentDocument?.querySelectorAll('video');
                    if (iframeVideos && iframeVideos.length > 0) {
                        console.log(`Found ${iframeVideos.length} videos in iframe`);
                        iframeVideos.forEach(video => {
                            if (this.isElementVisible(video) && !this.overlays.has(video)) {
                                this.createOverlayForVideo(video);
                            }
                        });
                    }
                } catch (e) {
                    // Cross-origin iframe, can't access content
                    console.log('Cannot access cross-origin iframe content');
                }
            });
        }
        
        videos.forEach(video => {
            // Check if video is visible
            if (this.isElementVisible(video) && !this.overlays.has(video)) {
                console.log('Creating overlay for visible video:', video);
                this.createOverlayForVideo(video);
            }
        });
    }
    
    // Create an overlay container for a specific video
    createOverlayForVideo(video) {
        if (!video || !this.isElementVisible(video)) return;
        
        console.log('Creating overlay for video:', video);
        
        // Create overlay container that positions over the video
        const overlay = document.createElement('div');
        const videoRect = video.getBoundingClientRect();
        
        // Style the overlay to position it at the bottom of the video
        overlay.className = 'speech-text-overlay';
        overlay.style.cssText = `
            position: fixed;
            left: ${videoRect.left}px;
            bottom: ${window.innerHeight - videoRect.bottom + 10}px; // Correctly position at bottom
            width: ${videoRect.width}px;
            padding: 10px;
            background-color: ${this.config.bgColor};
            color: ${this.config.textColor};
            font-size: ${this.config.fontSize};
            text-align: center;
            z-index: 2147483647;
            pointer-events: none;
            opacity: 1;
            transition: color 0.2s ease; // Smooth transition for color changes
        `;
        
        // Add the overlay directly to the document body
        document.body.appendChild(overlay);
        console.log('Overlay added to DOM:', overlay);
        
        // Store reference to the overlay
        this.overlays.set(video, overlay);
        
        // Add resize listener to keep overlay positioned correctly
        this.addResizeListener(video, overlay);
        
        return overlay;
    }
    
    // Add listener to update overlay position when window is resized
    addResizeListener(video, overlay) {
        const updatePosition = () => {
            if (!video || !overlay) return;
            
            const videoRect = video.getBoundingClientRect();
            overlay.style.left = `${videoRect.left + window.scrollX}px`;
            overlay.style[this.config.position] = `${this.config.position === 'top' ? 
                videoRect.top + window.scrollY + 10 : 
                videoRect.bottom + window.scrollY - 60}px`;
            overlay.style.width = `${videoRect.width}px`;
        };
        
        // Update on scroll and resize
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        
        // Store the update function for potential future removal
        overlay.updatePosition = updatePosition;
    }
    
    // Display text on all active video overlays
    displayText(text, isFinal = false) {
        if (!this.config.active || !text.trim()) return;
        
        console.log('VideoOverlayManager: Displaying text on overlay:', text);
        
        // Update the current text
        this.currentText = text;
        
        // Display the text on all overlays
        for (const [video, overlay] of this.overlays.entries()) {
            if (!this.isElementVisible(video)) {
                // Skip if video is not visible
                continue;
            }
            
            // Update text content
            overlay.textContent = text;
            
            // Apply different styles for interim vs final results
            if (isFinal) {
                overlay.style.color = this.config.textColor;
            } else {
                // Use a slightly different color for interim results
                overlay.style.color = '#cccccc';
            }
        }
    }
    
    // Add listener to update overlay position when window is resized
    addResizeListener(video, overlay) {
        const updatePosition = () => {
            if (!video || !overlay) return;
            
            const videoRect = video.getBoundingClientRect();
            overlay.style.left = `${videoRect.left + window.scrollX}px`;
            overlay.style.bottom = `${videoRect.bottom + window.scrollY - 50}px`;
            overlay.style.width = `${videoRect.width}px`;
        };
        
        // Update on scroll and resize
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);
        
        // Store the update function for potential future removal
        overlay.updatePosition = updatePosition;
    }
    
    // Process text queue sequentially
    async processTextQueue() {
        this.processingQueue = true;
        
        while (this.textQueue.length > 0) {
            const text = this.textQueue.shift();
            
            // If there are no active overlays, check for new videos
            if (this.overlays.size === 0) {
                this.setupOverlaysForVisibleVideos();
            }
            
            // Show text on all overlays
            for (const [video, overlay] of this.overlays.entries()) {
                if (!this.isElementVisible(video)) {
                    // Skip if video is not visible
                    continue;
                }
                
                // Update text content
                overlay.textContent = text;
                overlay.style.opacity = '1';
            }
            
            // Wait for duration before showing next text
            await new Promise(resolve => setTimeout(resolve, this.config.duration));
            
            // Hide overlays
            for (const overlay of this.overlays.values()) {
                overlay.style.opacity = '0';
            }
            
            // Small delay between text segments
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        this.processingQueue = false;
    }
    
    // Remove a specific overlay
    removeOverlay(video) {
        const overlay = this.overlays.get(video);
        if (overlay) {
            // Remove the overlay element
            document.body.removeChild(overlay);
            this.overlays.delete(video);
        }
    }
    
    // Remove all overlays
    removeAllOverlays() {
        for (const [video, overlay] of this.overlays.entries()) {
            document.body.removeChild(overlay);
        }
        this.overlays.clear();
        this.textQueue = [];
    }

    // Check if element is visible
    isElementVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               rect.width > 0 &&
               rect.height > 0;
    }
}

export default VideoOverlayManager;