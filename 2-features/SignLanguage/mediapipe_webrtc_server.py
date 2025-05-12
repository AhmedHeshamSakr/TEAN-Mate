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

# Function to create holistic model based on codec
def create_holistic_model(codec_name=None):
    """Create MediaPipe Holistic model with appropriate acceleration"""
    use_gpu = False
    
    # Check if codec is AV1 and GPU is available
    if codec_name and 'av1' in codec_name.lower() and gpu_available:
        use_gpu = True
        logger.info(f"AV1 codec detected. Using GPU acceleration.")
    else:
        logger.info(f"Using CPU processing. Codec: {codec_name or 'unknown'}")
    
    return mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=0,
        smooth_landmarks=True,
        enable_segmentation=False,
        smooth_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.4,
        use_gpu=use_gpu  # Enable GPU if available and using AV1 codec
    )

# Default holistic model (CPU)
holistic = create_holistic_model()

# Store active peer connections
pcs = set()

class HolisticLandmarksTracker:
    def __init__(self):
        # Buffer to store recent frames of landmarks
        self.landmarks_history = deque(maxlen=30)  # Store up to 30 frames (1 second at 30fps)
        self.frame_counter = 0
        
    def add_landmarks(self, results):
        """Add the current frame's landmarks to the history"""
        if not results:
            return
            
        # Extract all landmarks into a standardized format
        landmarks_frame = {
            'frame_id': self.frame_counter,
            'timestamp': time.time(),
            'face_landmarks': self._process_face_landmarks(results.face_landmarks),
            'pose_landmarks': self._process_pose_landmarks(results.pose_landmarks),
            'left_hand_landmarks': self._process_hand_landmarks(results.left_hand_landmarks),
            'right_hand_landmarks': self._process_hand_landmarks(results.right_hand_landmarks)
        }
        
        # Add to history
        self.landmarks_history.append(landmarks_frame)
        self.frame_counter += 1
        
        return landmarks_frame
    
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
    """Video track that processes frames with MediaPipe Holistic for sign language."""
    kind = "video"
    
    def __init__(self, track, pc):
        super().__init__()
        self.track = track
        self.pc = pc
        self.frame_counter = 0
        
        # Codec detection and model selection
        self.holistic_model = None
        self.codec_detected = False
        
        # FPS tracking variables
        self.fps_start_time = time.time()
        self.current_fps = 0
        self.processed_frames = 0
        
        # Landmarks tracker
        self.landmarks_tracker = HolisticLandmarksTracker()
        
        # Create data channel for sending landmarks results
        self.data_channel = pc.createDataChannel("holistic-landmarks")
        logger.info("Data channel created for sending holistic landmarks")
    
    async def recv(self):
        frame = await self.track.recv()
        self.frame_counter += 1
        
        # Detect codec on first frame and create appropriate model
        if not self.codec_detected:
            codec_name = frame.codec_name if hasattr(frame, 'codec_name') else None
            self.holistic_model = create_holistic_model(codec_name)
            self.codec_detected = True
            logger.info(f"Created holistic model for codec: {codec_name or 'unknown'}")
        
        # Update FPS tracking
        self.processed_frames += 1
        current_time = time.time()
        elapsed_time = current_time - self.fps_start_time
        
        # Update FPS every second
        if elapsed_time > 1.0:
            self.current_fps = self.processed_frames / elapsed_time
            logger.info(f"Server processing at {self.current_fps:.1f} FPS")
            
            # Send FPS info through data channel
            if self.data_channel.readyState == "open":
                self.data_channel.send(json.dumps({
                    'type': 'stats',
                    'fps': self.current_fps
                }))
            
            # Reset counters
            self.fps_start_time = current_time
            self.processed_frames = 0
        
        # Convert frame to OpenCV format
        img = frame.to_ndarray(format="bgr24")
        
        # Process with MediaPipe Holistic using the track-specific model
        results = self.process_frame(img)
        
        # Create visualization
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
        
        # Add debug info to the frame
        cv2.putText(
            viz_frame,
            f"Frame: {self.frame_counter} | FPS: {self.current_fps:.1f} | GPU: {'ON' if gpu_available and hasattr(frame, 'codec_name') and 'av1' in frame.codec_name.lower() else 'OFF'}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
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
            (10, 60), 
            cv2.FONT_HERSHEY_SIMPLEX, 
            0.7, 
            (0, 255, 0), 
            2
        )
        
        # Process landmarks and add to tracker
        landmarks_frame = self.landmarks_tracker.add_landmarks(results)
        
        # Log pose landmarks if available (every 30 frames to avoid spam)
        if results.pose_landmarks and self.frame_counter % 30 == 0:
            # Get key pose landmarks (simplified for logging)
            pose_info = self._get_key_pose_info(results.pose_landmarks)
            logger.info(f"Frame {self.frame_counter}: Pose detected - " + 
                      f"Wrists: L({pose_info['left_wrist_x']:.2f}, {pose_info['left_wrist_y']:.2f}), " +
                      f"R({pose_info['right_wrist_x']:.2f}, {pose_info['right_wrist_y']:.2f}) | " +
                      f"Elbows: L({pose_info['left_elbow_x']:.2f}, {pose_info['left_elbow_y']:.2f}), " +
                      f"R({pose_info['right_elbow_x']:.2f}, {pose_info['right_elbow_y']:.2f})")
        
        # Send landmarks data through data channel
        if self.data_channel.readyState == "open" and landmarks_frame:
            # Simplify the data for transmission (just key points, not all landmarks)
            simplified_data = {
                'type': 'holistic_landmarks',
                'frame_id': self.frame_counter,
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
        """Process a frame with MediaPipe Holistic."""
        # Convert to RGB (MediaPipe requires RGB input)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process with the track-specific holistic model
        results = self.holistic_model.process(rgb_frame)
        
        return results
    
    def _get_key_pose_info(self, pose_landmarks):
        """Extract key pose information from pose landmarks"""
        # Define key landmark indices
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

async def index(request):
    """Serve the HTML page."""
    return web.Response(text="Sign Language Detection Server Running", content_type="text/html")

async def ping(request):
    """Simple endpoint to test server connectivity."""
    return web.json_response({
        "status": "ok",
        "message": "Holistic Sign Language Detection Server is running",
        "gpu_available": gpu_available  # Add GPU status to ping response
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
            # Create Holistic processor
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
    
    # Start server
    print("Starting Holistic Sign Language Detection Server on http://localhost:8765")
    print(f"GPU acceleration: {'Available' if gpu_available else 'Not available'}")
    web.run_app(app, host="localhost", port=8765) 
