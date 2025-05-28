import asyncio
import json
import cv2
import numpy as np
import logging
import os
import time
from collections import deque
from aiohttp import web
from aiohttp_cors import setup as cors_setup, ResourceOptions
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
import av
import torch  # Added for GPU availability check

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("sign_language_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("HolisticSignLanguage")

# Check if GPU is available
gpu_available = torch.cuda.is_available()
logger.info(f"GPU available: {gpu_available}")

# Initialize MediaPipe Holistic
import mediapipe as mp
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

def create_holistic_model(codec_name=None, performance_mode=True):
    """
    Create MediaPipe Holistic model with intelligent performance optimization.
    
    Think of this as tuning a sports car - we're adjusting the engine settings
    to get the best performance for our specific track (sign language detection).
    
    Note: MediaPipe handles GPU acceleration automatically based on your system
    configuration and build. We focus on the parameters we can actually control.
    
    Args:
        codec_name: Video codec being used (for logging purposes)
        performance_mode: True for speed optimization, False for maximum accuracy
    """
    # Log GPU availability for monitoring purposes
    if gpu_available:
        logger.info(f"GPU available for potential MediaPipe acceleration. Codec: {codec_name or 'unknown'}")
    else:
        logger.info(f"GPU not available. Processing will use CPU. Codec: {codec_name or 'unknown'}")
    
    if performance_mode:
        # Performance-optimized configuration
        # These settings prioritize speed while maintaining detection quality
        # for sign language applications where major gestures are more important
        # than micro-expressions
        return mp_holistic.Holistic(
            static_image_mode=False,        # Video mode - much faster than image mode
            model_complexity=0,             # Lightest model - 3x faster than complexity=2
            smooth_landmarks=False,         # Disable smoothing - reduces processing lag
            enable_segmentation=False,      # Skip background segmentation - not needed for poses
            smooth_segmentation=False,      
            min_detection_confidence=0.6,   # Slightly higher threshold - fewer false positives
            min_tracking_confidence=0.5     # Balanced - maintains tracking without being too strict
        )
    else:
        # Quality-optimized configuration
        # Use this for comparison or when accuracy is more critical than speed
        return mp_holistic.Holistic(
            static_image_mode=False,
            model_complexity=1,             # Higher quality model
            smooth_landmarks=True,          # Better temporal stability
            enable_segmentation=False,      # Still disabled - not needed
            smooth_segmentation=False,
            min_detection_confidence=0.5,   # More sensitive detection
            min_tracking_confidence=0.4     # More sensitive tracking
        )

# Store active peer connections
pcs = set()

class PerformanceMonitor:
    """
    A performance monitoring system that helps us understand how our optimizations
    are performing in real-time. Think of this as the dashboard in your car that
    shows speed, fuel efficiency, and engine temperature.
    """
    
    def __init__(self):
        self.processing_times = deque(maxlen=100)  # Store last 100 processing times
        self.resolution_stats = deque(maxlen=50)   # Track resolution changes
        self.quality_scores = deque(maxlen=100)    # Track detection quality
        
    def record_processing_time(self, processing_time):
        """Record how long frame processing took"""
        self.processing_times.append(processing_time)
        
    def record_resolution_change(self, original_size, processed_size, scale_factor):
        """Record when we change processing resolution"""
        self.resolution_stats.append({
            'timestamp': time.time(),
            'original': original_size,
            'processed': processed_size,
            'scale_factor': scale_factor
        })
        
    def record_quality_score(self, score):
        """Record detection quality metrics"""
        self.quality_scores.append(score)
        
    def get_performance_summary(self):
        """Get current performance statistics"""
        if not self.processing_times:
            return {"status": "no_data"}
            
        avg_processing_time = sum(self.processing_times) / len(self.processing_times)
        max_processing_time = max(self.processing_times)
        
        return {
            "avg_processing_ms": avg_processing_time * 1000,
            "max_processing_ms": max_processing_time * 1000,
            "estimated_fps": 1.0 / avg_processing_time if avg_processing_time > 0 else 0,
            "quality_score": sum(self.quality_scores) / len(self.quality_scores) if self.quality_scores else 0,
            "resolution_changes": len(self.resolution_stats)
        }

class HolisticLandmarksTracker:
    """
    Enhanced landmarks tracker with quality assessment.
    
    This class not only stores landmark history but also evaluates
    the quality of detections to help us monitor accuracy.
    """
    
    def __init__(self):
        # Buffer to store recent frames of landmarks
        self.landmarks_history = deque(maxlen=30)  # Store up to 30 frames (1 second at 30fps)
        self.frame_counter = 0
        self.quality_threshold = 0.7  # Minimum quality score to consider detection reliable
        
    def add_landmarks(self, results, quality_score=None):
        """
        Add the current frame's landmarks to the history with quality assessment.
        
        Args:
            results: MediaPipe detection results
            quality_score: Optional quality assessment score
        """
        if not results:
            return None
            
        # Extract all landmarks into a standardized format
        landmarks_frame = {
            'frame_id': self.frame_counter,
            'timestamp': time.time(),
            'quality_score': quality_score,
            'face_landmarks': self._process_face_landmarks(results.face_landmarks),
            'pose_landmarks': self._process_pose_landmarks(results.pose_landmarks),
            'left_hand_landmarks': self._process_hand_landmarks(results.left_hand_landmarks),
            'right_hand_landmarks': self._process_hand_landmarks(results.right_hand_landmarks)
        }
        
        # Add to history
        self.landmarks_history.append(landmarks_frame)
        self.frame_counter += 1
        
        return landmarks_frame
    
    def assess_detection_quality(self, results):
        """
        Evaluate the quality of current detection results.
        
        This helps us understand if our performance optimizations are
        affecting detection accuracy. Higher scores indicate better quality.
        """
        if not results:
            return 0.0
            
        quality_components = []
        
        # Assess pose detection quality
        if results.pose_landmarks:
            # Calculate average visibility of key pose landmarks
            key_pose_indices = [11, 12, 13, 14, 15, 16]  # Shoulders, elbows, wrists
            if len(results.pose_landmarks.landmark) > max(key_pose_indices):
                pose_visibility = sum(
                    results.pose_landmarks.landmark[i].visibility 
                    for i in key_pose_indices
                ) / len(key_pose_indices)
                quality_components.append(pose_visibility)
        
        # Assess hand detection quality (binary - either detected or not)
        if results.left_hand_landmarks:
            quality_components.append(1.0)
        if results.right_hand_landmarks:
            quality_components.append(1.0)
            
        # Assess face detection quality
        if results.face_landmarks:
            quality_components.append(0.8)  # Face detection contributes to overall quality
        
        # Return average quality score
        return sum(quality_components) / len(quality_components) if quality_components else 0.0
    
    def _process_face_landmarks(self, landmarks):
        """Process face landmarks into a list format"""
        if not landmarks:
            return None
            
        processed_landmarks = []
        for landmark in landmarks.landmark:
            processed_landmarks.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility if hasattr(landmark, 'visibility') else 1.0
            })
        return processed_landmarks
    
    def _process_pose_landmarks(self, landmarks):
        """Process pose landmarks into a list format"""
        if not landmarks:
            return None
            
        processed_landmarks = []
        for landmark in landmarks.landmark:
            processed_landmarks.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility
            })
        return processed_landmarks
    
    def _process_hand_landmarks(self, landmarks):
        """Process hand landmarks into a list format"""
        if not landmarks:
            return None
            
        processed_landmarks = []
        for landmark in landmarks.landmark:
            processed_landmarks.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z
            })
        return processed_landmarks
    
    def get_recent_landmarks(self, num_frames=10):
        """Get the most recent frames of landmarks"""
        return list(self.landmarks_history)[-num_frames:] if self.landmarks_history else []

class HolisticVideoTrack(MediaStreamTrack):
    """
    Enhanced video track with intelligent resolution scaling and performance optimization.
    
    This is the heart of our optimization system. Think of it as an intelligent
    image processing pipeline that automatically adjusts its settings based on
    the input size and system performance.
    """
    kind = "video"
    
    def __init__(self, track, pc):
        super().__init__()
        self.track = track
        self.pc = pc
        self.frame_counter = 0
        
        # Codec detection and model selection
        self.holistic_model = None
        self.codec_detected = False
        
        # Performance optimization settings
        # These parameters control how aggressively we optimize for performance
        self.target_processing_width = 640    # Ideal width for processing
        self.min_processing_width = 320       # Never go smaller than this
        self.max_processing_width = 1280      # Don't process larger than this
        self.adaptive_scaling = True          # Enable intelligent scaling
        self.quality_threshold = 0.6          # Minimum acceptable quality
        
        # Performance monitoring
        self.performance_monitor = PerformanceMonitor()
        self.last_quality_check = time.time()
        self.quality_check_interval = 5.0     # Check quality every 5 seconds
        
        # FPS tracking variables
        self.fps_start_time = time.time()
        self.current_fps = 0
        self.processed_frames = 0
        self.current_processing_fps = 0
        
        # Landmarks tracker with quality assessment
        self.landmarks_tracker = HolisticLandmarksTracker()
        
        # Create data channel for sending landmarks results
        self.data_channel = pc.createDataChannel("holistic-landmarks")
        logger.info("Enhanced data channel created for holistic landmarks with performance monitoring")
    
    def calculate_optimal_processing_size(self, original_width, original_height):
        """
        Calculate the optimal processing size that balances performance and accuracy.
        
        This is like a GPS system that finds the best route - it considers both
        speed and safety to get you to your destination efficiently.
        
        Args:
            original_width: Width of the original frame
            original_height: Height of the original frame
            
        Returns:
            tuple: (scale_factor, new_width, new_height, should_scale)
        """
        # If image is already small enough, don't scale
        if original_width <= self.target_processing_width:
            return 1.0, original_width, original_height, False
        
        # If image is extremely large, cap the processing size
        if original_width > self.max_processing_width:
            scale_factor = self.max_processing_width / original_width
            new_width = self.max_processing_width
            new_height = int(original_height * scale_factor)
            return scale_factor, new_width, new_height, True
        
        # Calculate scale factor to reach target width
        scale_factor = self.target_processing_width / original_width
        new_width = int(original_width * scale_factor)
        new_height = int(original_height * scale_factor)
        
        # Ensure we don't go too small (would hurt accuracy too much)
        if new_width < self.min_processing_width:
            scale_factor = self.min_processing_width / original_width
            new_width = self.min_processing_width
            new_height = int(original_height * scale_factor)
        
        return scale_factor, new_width, new_height, True
    
    def adaptive_quality_adjustment(self, current_quality, processing_time):
        """
        Automatically adjust processing parameters based on quality and performance.
        
        This is like an automatic transmission that shifts gears based on
        driving conditions - it optimizes for both performance and smooth operation.
        """
        if not self.adaptive_scaling:
            return
        
        # If quality is too low, reduce scaling (increase processing resolution)
        if current_quality < self.quality_threshold and self.target_processing_width < self.max_processing_width:
            self.target_processing_width = min(
                self.target_processing_width + 80,  # Increase by small steps
                self.max_processing_width
            )
            logger.info(f"Quality below threshold ({current_quality:.2f}), increasing processing width to {self.target_processing_width}")
        
        # If processing is too slow, increase scaling (decrease processing resolution)
        elif processing_time > 0.1 and self.target_processing_width > self.min_processing_width:  # More than 100ms per frame
            self.target_processing_width = max(
                self.target_processing_width - 40,  # Decrease by small steps
                self.min_processing_width
            )
            logger.info(f"Processing too slow ({processing_time*1000:.1f}ms), decreasing processing width to {self.target_processing_width}")
    
    async def recv(self):
        """
        Enhanced frame processing with intelligent scaling and quality monitoring.
        
        This method is like a smart factory assembly line that automatically
        adjusts its speed and quality controls based on demand and output quality.
        """
        frame = await self.track.recv()
        self.frame_counter += 1
        
        # Record frame processing start time
        processing_start = time.time()
        
        # Detect codec on first frame and create appropriate model
        if not self.codec_detected:
            codec_name = frame.codec_name if hasattr(frame, 'codec_name') else None
            self.holistic_model = create_holistic_model(codec_name, performance_mode=True)
            self.codec_detected = True
            logger.info(f"Created optimized holistic model for codec: {codec_name or 'unknown'}")
        
        # Convert frame to OpenCV format
        img = frame.to_ndarray(format="bgr24")
        original_height, original_width = img.shape[:2]
        
        # Calculate optimal processing size
        scale_factor, proc_width, proc_height, should_scale = self.calculate_optimal_processing_size(
            original_width, original_height
        )
        
        # Process the frame with appropriate scaling
        if should_scale:
            # Scale down for processing - this is where the magic happens
            # We use INTER_AREA which is optimal for downscaling as it properly
            # anti-aliases the image to prevent important details from being lost
            processing_img = cv2.resize(
                img, 
                (proc_width, proc_height), 
                interpolation=cv2.INTER_AREA
            )
            
            # Process landmarks on the smaller image
            results = self.process_frame(processing_img)
            
            # Record resolution statistics
            self.performance_monitor.record_resolution_change(
                (original_width, original_height),
                (proc_width, proc_height),
                scale_factor
            )
        else:
            # Process at original size
            results = self.process_frame(img)
        
        # Assess detection quality
        quality_score = self.landmarks_tracker.assess_detection_quality(results)
        self.performance_monitor.record_quality_score(quality_score)
        
        # Create visualization on original size image
        # Note: MediaPipe landmarks are normalized (0-1), so they automatically
        # scale correctly to the original image size
        viz_frame = img.copy()
        
        # Draw landmarks if available
        if results.face_landmarks:
            mp_drawing.draw_landmarks(
                viz_frame,
                results.face_landmarks,
                mp_holistic.FACEMESH_CONTOURS,
                landmark_drawing_spec=None,
                connection_drawing_spec=mp_drawing_styles.get_default_face_mesh_contours_style()
            )
        
        if results.pose_landmarks:
            mp_drawing.draw_landmarks(
                viz_frame,
                results.pose_landmarks,
                mp_holistic.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
            )
            
        if results.left_hand_landmarks:
            mp_drawing.draw_landmarks(
                viz_frame,
                results.left_hand_landmarks,
                mp_holistic.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style()
            )
            
        if results.right_hand_landmarks:
            mp_drawing.draw_landmarks(
                viz_frame,
                results.right_hand_landmarks,
                mp_holistic.HAND_CONNECTIONS,
                mp_drawing_styles.get_default_hand_landmarks_style(),
                mp_drawing_styles.get_default_hand_connections_style()
            )
        
        # Record processing time
        processing_time = time.time() - processing_start
        self.performance_monitor.record_processing_time(processing_time)
        
        # Update FPS tracking
        self.processed_frames += 1
        current_time = time.time()
        elapsed_time = current_time - self.fps_start_time
        
        # Update FPS every second and perform adaptive adjustments
        if elapsed_time > 1.0:
            self.current_fps = self.processed_frames / elapsed_time
            self.current_processing_fps = 1.0 / processing_time if processing_time > 0 else 0
            
            # Log performance information
            perf_summary = self.performance_monitor.get_performance_summary()
            logger.info(
                f"Performance: {self.current_fps:.1f} output FPS, "
                f"{perf_summary['avg_processing_ms']:.1f}ms avg processing, "
                f"Quality: {perf_summary['quality_score']:.2f}"
            )
            
            # Send comprehensive performance info through data channel
            if self.data_channel.readyState == "open":
                self.data_channel.send(json.dumps({
                    'type': 'performance_stats',
                    'output_fps': self.current_fps,
                    'processing_fps': self.current_processing_fps,
                    'avg_processing_ms': perf_summary['avg_processing_ms'],
                    'quality_score': perf_summary['quality_score'],
                    'resolution_scale': scale_factor if should_scale else 1.0,
                    'processing_size': f"{proc_width}x{proc_height}",
                    'original_size': f"{original_width}x{original_height}"
                }))
            
            # Perform adaptive quality adjustment
            self.adaptive_quality_adjustment(quality_score, processing_time)
            
            # Reset counters
            self.fps_start_time = current_time
            self.processed_frames = 0
        
        # Add enhanced debug info to the frame
        debug_info = [
            f"Frame: {self.frame_counter} | FPS: {self.current_fps:.1f}",
            f"Processing: {proc_width}x{proc_height} ({scale_factor:.2f}x)" if should_scale else f"Original: {original_width}x{original_height}",
            f"Quality: {quality_score:.2f} | GPU: {'Available' if gpu_available else 'N/A'}",
            f"Proc Time: {processing_time*1000:.1f}ms | Target: {self.target_processing_width}px"
        ]
        
        for i, info in enumerate(debug_info):
            cv2.putText(
                viz_frame,
                info,
                (10, 30 + i * 25),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2
            )
        
        # Add detection status
        detection_text = []
        if results.face_landmarks:
            detection_text.append("Face")
        if results.pose_landmarks:
            detection_text.append("Pose")
        if results.left_hand_landmarks:
            detection_text.append("Left Hand")
        if results.right_hand_landmarks:
            detection_text.append("Right Hand")
            
        status_text = "Detected: " + ", ".join(detection_text) if detection_text else "No landmarks detected"
        cv2.putText(
            viz_frame, 
            status_text, 
            (10, 30 + len(debug_info) * 25), 
            cv2.FONT_HERSHEY_SIMPLEX, 
            0.6, 
            (0, 255, 255),  # Yellow color for detection status
            2
        )
        
        # Process landmarks and add to tracker with quality score
        landmarks_frame = self.landmarks_tracker.add_landmarks(results, quality_score)
        
        # Log pose landmarks periodically with quality information
        if results.pose_landmarks and self.frame_counter % 30 == 0:
            pose_info = self._get_key_pose_info(results.pose_landmarks)
            logger.info(
                f"Frame {self.frame_counter}: Pose detected (Quality: {quality_score:.2f}) - " + 
                f"Wrists: L({pose_info['left_wrist_x']:.2f}, {pose_info['left_wrist_y']:.2f}), " +
                f"R({pose_info['right_wrist_x']:.2f}, {pose_info['right_wrist_y']:.2f})"
            )
        
        # Send enhanced landmarks data through data channel
        if self.data_channel.readyState == "open" and landmarks_frame:
            simplified_data = {
                'type': 'holistic_landmarks',
                'frame_id': self.frame_counter,
                'quality_score': quality_score,
                'processing_scale': scale_factor if should_scale else 1.0,
                'has_face': results.face_landmarks is not None,
                'has_pose': results.pose_landmarks is not None,
                'has_left_hand': results.left_hand_landmarks is not None, 
                'has_right_hand': results.right_hand_landmarks is not None
            }
            
            # Add pose info if available
            if results.pose_landmarks:
                simplified_data['pose_info'] = self._get_key_pose_info(results.pose_landmarks)
                
            self.data_channel.send(json.dumps(simplified_data))
        
        # Create new video frame with visualization
        new_frame = av.VideoFrame.from_ndarray(viz_frame, format="bgr24")
        new_frame.pts = frame.pts
        new_frame.time_base = frame.time_base
        
        return new_frame
    
    def process_frame(self, frame):
        """
        Process a frame with MediaPipe Holistic.
        
        This method handles the core MediaPipe processing. The frame passed here
        might be scaled down for performance, but MediaPipe doesn't need to know that.
        """
        # Convert to RGB (MediaPipe requires RGB input)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with the track-specific holistic model
        results = self.holistic_model.process(rgb_frame)
        
        return results
    
    def _get_key_pose_info(self, pose_landmarks):
        """Extract key pose information from pose landmarks"""
        # Define key landmark indices (MediaPipe pose model)
        NOSE = 0
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_ELBOW = 13
        RIGHT_ELBOW = 14
        LEFT_WRIST = 15
        RIGHT_WRIST = 16
        
        # Extract key point coordinates
        return {
            'nose_x': pose_landmarks.landmark[NOSE].x,
            'nose_y': pose_landmarks.landmark[NOSE].y,
            'left_shoulder_x': pose_landmarks.landmark[LEFT_SHOULDER].x,
            'left_shoulder_y': pose_landmarks.landmark[LEFT_SHOULDER].y,
            'right_shoulder_x': pose_landmarks.landmark[RIGHT_SHOULDER].x,
            'right_shoulder_y': pose_landmarks.landmark[RIGHT_SHOULDER].y,
            'left_elbow_x': pose_landmarks.landmark[LEFT_ELBOW].x,
            'left_elbow_y': pose_landmarks.landmark[LEFT_ELBOW].y,
            'right_elbow_x': pose_landmarks.landmark[RIGHT_ELBOW].x,
            'right_elbow_y': pose_landmarks.landmark[RIGHT_ELBOW].y,
            'left_wrist_x': pose_landmarks.landmark[LEFT_WRIST].x,
            'left_wrist_y': pose_landmarks.landmark[LEFT_WRIST].y,
            'right_wrist_x': pose_landmarks.landmark[RIGHT_WRIST].x,
            'right_wrist_y': pose_landmarks.landmark[RIGHT_WRIST].y
        }

# Web server endpoints (unchanged from original)
async def index(request):
    """Serve the HTML page."""
    return web.Response(text="Optimized Sign Language Detection Server Running", content_type="text/html")

async def ping(request):
    """Enhanced ping endpoint with performance information."""
    return web.json_response({
        "status": "ok",
        "message": "Optimized Holistic Sign Language Detection Server is running",
        "gpu_available": gpu_available,
        "performance_mode": "enabled",
        "features": ["resolution_scaling", "adaptive_quality", "performance_monitoring"]
    })

async def offer(request):
    """Handle WebRTC offer from client."""
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"]["sdp"], type=params["sdp"]["type"])
    
    # Create a new peer connection
    pc = RTCPeerConnection()
    pcs.add(pc)
    
    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        logger.info(f"Connection state changed to {pc.connectionState}")
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)
    
    @pc.on("track")
    def on_track(track):
        logger.info(f"Track received: {track.kind}")
        if track.kind == "video":
            # Create optimized Holistic processor
            pc.addTrack(HolisticVideoTrack(track, pc))
    
    # Handle data channels
    @pc.on("datachannel")
    def on_datachannel(channel):
        logger.info(f"Data channel created: {channel.label}")
        
        @channel.on("message")
        def on_message(message):
            if message == "ping":
                channel.send("pong")
            elif message.startswith("get_landmarks"):
                # Request to get recent landmarks
                try:
                    # Find the track
                    for sender in pc.getSenders():
                        if sender.track and isinstance(sender.track, HolisticVideoTrack):
                            # Get landmarks from the track
                            recent_landmarks = sender.track.landmarks_tracker.get_recent_landmarks(5)
                            # Send back to client
                            channel.send(json.dumps({
                                'type': 'landmarks_history',
                                'landmarks': recent_landmarks
                            }))
                            break
                except Exception as e:
                    logger.error(f"Error handling get_landmarks request: {e}")
            elif message.startswith("get_performance"):
                # Request performance statistics
                try:
                    for sender in pc.getSenders():
                        if sender.track and isinstance(sender.track, HolisticVideoTrack):
                            perf_summary = sender.track.performance_monitor.get_performance_summary()
                            channel.send(json.dumps({
                                'type': 'performance_summary',
                                'stats': perf_summary
                            }))
                            break
                except Exception as e:
                    logger.error(f"Error handling get_performance request: {e}")
    
    # Set remote description
    await pc.setRemoteDescription(offer)
    
    # Create answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    return web.json_response({
        "sdp": {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
    })

async def on_shutdown(app):
    """Close all peer connections when shutting down."""
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()

if __name__ == "__main__":
    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    
    # Set up CORS
    cors = cors_setup(app, defaults={
        "*": ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods=["GET", "POST", "OPTIONS"]
        )
    })

    # Set up routes
    resource = cors.add(app.router.add_resource("/"))
    cors.add(resource.add_route("GET", index))
    
    resource = cors.add(app.router.add_resource("/ping"))
    cors.add(resource.add_route("GET", ping))
    
    resource = cors.add(app.router.add_resource("/offer"))
    cors.add(resource.add_route("POST", offer))
    
    # Start server with enhanced logging
    print("=" * 60)
    print("🚀 Starting OPTIMIZED Holistic Sign Language Detection Server")
    print("=" * 60)
    print(f"🖥️  Server URL: http://localhost:8765")
    print(f"⚡ GPU acceleration: {'✅ Available' if gpu_available else '❌ Not available'}")
    print(f"🎯 Performance mode: ✅ Enabled")
    print(f"📏 Resolution scaling: ✅ Adaptive")
    print(f"📊 Quality monitoring: ✅ Active")
    print("=" * 60)
    print("📝 Performance tips:")
    print("   • Large screens will automatically scale down for processing")
    print("   • Quality scores above 0.6 indicate good detection")
    print("   • GPU usage improves performance significantly")
    print("   • Monitor the logs for adaptive adjustments")
    print("=" * 60)
    
    web.run_app(app, host="localhost", port=8765)