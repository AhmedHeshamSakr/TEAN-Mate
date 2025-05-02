import asyncio
import json
import cv2
import numpy as np
import logging
import os
import time
import threading
import base64
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from aiohttp import web
from aiohttp_cors import setup as cors_setup, ResourceOptions
from aiortc import MediaStreamTrack, RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole, MediaRecorder
import av

# Create necessary directories
os.makedirs("logs", exist_ok=True)
os.makedirs("debug_frames", exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"logs/webrtc_server_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("MediaPipeWebRTC")

# Configuration
MAX_WORKERS = 4
RESIZE_FACTOR = 1.0  # Process at full resolution for better visualization
DETECTION_TIMEOUT = 0.1
DEBUG_EVERY_N_FRAMES = 60
QUALITY_FACTOR = 90  # Higher quality for visualization

# Statistics
process_count = 0
last_log_time = time.time()
frame_times = []  # Track frame processing times
fps_value = 0  # Current FPS value

# Thread pool executor
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

# Initialize MediaPipe
import mediapipe as mp
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Initialize pose detection
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    smooth_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

logger.info("MediaPipe models initialized successfully")

# Peer connections
pcs = set()

def calculate_fps():
    """Calculate the average FPS based on recent frame times"""
    global frame_times, fps_value
    if len(frame_times) < 2:
        return 0
    
    # Calculate average time between frames
    time_diffs = [frame_times[i] - frame_times[i-1] for i in range(1, len(frame_times))]
    avg_time = sum(time_diffs) / len(time_diffs)
    
    # Calculate FPS
    if avg_time > 0:
        fps_value = 1.0 / avg_time
    
    return fps_value

def process_frame(frame, frame_id):
    """Process a frame using MediaPipe and return results with visualization"""
    start_time = time.time()
    
    try:
        if frame is None:
            return {
                'type': 'error',
                'message': 'Empty frame'
            }
        
        # Record the frame time for FPS calculation
        global frame_times
        frame_times.append(time.time())
        if len(frame_times) > 30:  # Keep only the last 30 frames
            frame_times.pop(0)
        
        # Calculate current FPS
        fps = calculate_fps()
        
        # Store original frame for visualization
        original_frame = frame.copy()
        
        # Convert to RGB for MediaPipe
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Prepare response structure
        response = {
            'frame_id': frame_id,
            'type': 'hand_detection',
            'results': {
                'multiHandLandmarks': [],
                'multiHandedness': [],
                'poseLandmarks': None
            },
            'fps': round(fps, 1),
            'timestamp': int(time.time() * 1000),
            'processing_time': 0
        }
        
        # Process hands
        hands_results = hands.process(frame_rgb)
        
        # Process pose (full body landmarks)
        pose_results = pose.process(frame_rgb)
        
        # Create visualization image
        visualization_frame = original_frame.copy()
        
        # Draw hand landmarks on visualization frame
        if hands_results.multi_hand_landmarks:
            for idx, hand_landmarks in enumerate(hands_results.multi_hand_landmarks):
                # Extract landmarks for response
                landmarks = []
                for landmark in hand_landmarks.landmark:
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z
                    })
                
                response['results']['multiHandLandmarks'].append(landmarks)
                
                # Get handedness (left or right hand)
                if hands_results.multi_handedness and idx < len(hands_results.multi_handedness):
                    handedness = {
                        'label': hands_results.multi_handedness[idx].classification[0].label,
                        'score': float(hands_results.multi_handedness[idx].classification[0].score)
                    }
                    response['results']['multiHandedness'].append(handedness)
                
                # Draw landmarks on visualization frame
                mp_drawing.draw_landmarks(
                    visualization_frame,
                    hand_landmarks,
                    mp_hands.HAND_CONNECTIONS,
                    mp_drawing_styles.get_default_hand_landmarks_style(),
                    mp_drawing_styles.get_default_hand_connections_style()
                )
        
        # Draw pose landmarks if detected
        if pose_results.pose_landmarks:
            # Extract pose landmarks for response
            pose_landmarks = []
            for landmark in pose_results.pose_landmarks.landmark:
                pose_landmarks.append({
                    'x': landmark.x,
                    'y': landmark.y,
                    'z': landmark.z,
                    'visibility': landmark.visibility
                })
            
            response['results']['poseLandmarks'] = pose_landmarks
            
            # Draw pose landmarks on visualization frame
            mp_drawing.draw_landmarks(
                visualization_frame,
                pose_results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style()
            )
        
        # Add frame info text
        cv2.putText(visualization_frame, 
                    f"FPS: {round(fps, 1)}", 
                    (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        # Log FPS and detections
        hands_detected = len(response['results']['multiHandLandmarks'])
        pose_detected = 1 if response['results']['poseLandmarks'] else 0
        
        # Convert visualization frame to JPEG for transmission
        _, jpeg_data = cv2.imencode('.jpg', visualization_frame, 
                                   [cv2.IMWRITE_JPEG_QUALITY, QUALITY_FACTOR])
        
        # Add visualization frame to response
        response['visualization'] = base64.b64encode(jpeg_data).decode('utf-8')
        
        # Calculate processing time
        processing_time = time.time() - start_time
        response['processing_time'] = processing_time
        
        # Update statistics
        global process_count
        process_count += 1
        
        # Log statistics periodically
        global last_log_time
        current_time = time.time()
        if current_time - last_log_time > 5:
            logger.info(f"Processing at {fps:.1f} FPS | Hands: {hands_detected} | Pose: {pose_detected}")
            last_log_time = current_time
        
        return response
    
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return {
            'type': 'error',
            'message': str(e)
        }

class MediaPipeVideoTrack(MediaStreamTrack):
    """Simplified video track that guarantees a visual output"""
    kind = "video"
    
    def __init__(self, track, pc):
        super().__init__()
        self.track = track
        self.pc = pc
        self.frame_counter = 0
        
        # Create data channel for sending detection results
        self.data_channel = pc.createDataChannel("mediapipe-results")
        self.data_channel.on("open", self._on_data_channel_open)
        
        # For debugging
        logger.info("MediaPipeVideoTrack created")
    
    def _on_data_channel_open(self):
        logger.info("Data channel opened for sending detection results")
    
    async def recv(self):
        try:
            # Get frame from the original track
            frame = await self.track.recv()
            self.frame_counter += 1
            
            # Convert to OpenCV format
            img = frame.to_ndarray(format="bgr24")
            
            # Process the frame with MediaPipe
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                executor,
                process_frame,
                img.copy(),
                self.frame_counter
            )
            
            # Send landmark data via data channel
            if self.data_channel.readyState == "open":
                data_to_send = {
                    'frame_id': result.get('frame_id', 0),
                    'type': result.get('type', 'unknown'),
                    'results': result.get('results', {}),
                    'fps': result.get('fps', 0),
                    'timestamp': result.get('timestamp', 0),
                    'processing_time': result.get('processing_time', 0)
                }
                self.data_channel.send(json.dumps(data_to_send))
            
            # Create visualization frame
            visualization_frame = img.copy()
            
            # Draw hand landmarks directly
            if 'results' in result and 'multiHandLandmarks' in result['results']:
                for landmarks in result['results']['multiHandLandmarks']:
                    for i, landmark in enumerate(landmarks):
                        # Draw each landmark point
                        x = int(landmark['x'] * visualization_frame.shape[1])
                        y = int(landmark['y'] * visualization_frame.shape[0])
                        cv2.circle(visualization_frame, (x, y), 5, (0, 255, 0), -1)
                        
                        # Connect landmarks with lines for fingers
                        if i > 0 and i % 4 != 0:
                            prev_x = int(landmarks[i-1]['x'] * visualization_frame.shape[1])
                            prev_y = int(landmarks[i-1]['y'] * visualization_frame.shape[0])
                            cv2.line(visualization_frame, (prev_x, prev_y), (x, y), (0, 255, 0), 2)
            
            # Add FPS text if available
            if 'fps' in result:
                fps_text = f"FPS: {result['fps']:.1f}"
                cv2.putText(visualization_frame, fps_text, (10, 30), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            # Add frame counter for debugging
            cv2.putText(visualization_frame, f"Frame: {self.frame_counter}", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
            
            # Create a new video frame from the visualization
            new_frame = av.VideoFrame.from_ndarray(visualization_frame, format="bgr24")
            new_frame.pts = frame.pts
            new_frame.time_base = frame.time_base
            
            logger.info(f"Created visualization frame {self.frame_counter}")
            
            return new_frame
            
        except Exception as e:
            logger.error(f"Error in video track: {str(e)}")
            
            # Create an error frame
            error_img = np.zeros((480, 640, 3), np.uint8)
            cv2.putText(error_img, f"Error: {str(e)}", (50, 240), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
            cv2.putText(error_img, f"Frame: {self.frame_counter}", 
                       (50, 280), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
            
            error_frame = av.VideoFrame.from_ndarray(error_img, format="bgr24")
            if 'frame' in locals() and frame is not None:
                error_frame.pts = frame.pts
                error_frame.time_base = frame.time_base
            
            return error_frame

async def index(request):
    """Serve the client-side HTML."""
    content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MediaPipe WebRTC Server</title>
        <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        video { width: 100%; max-width: 640px; background-color: #ddd; }
        .container { display: flex; flex-direction: column; align-items: center; }
        .status { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        .results { width: 100%; max-width: 640px; height: 200px; overflow-y: auto; background-color: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin-top: 10px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>MediaPipe WebRTC Server</h1>
            <div id="status" class="status disconnected">Disconnected</div>
            <video id="video" autoplay playsinline controls></video>
            <div>
                <button id="start">Start</button>
                <button id="stop" disabled>Stop</button>
            </div>
            <h3>Detection Results:</h3>
            <div id="results" class="results">Waiting for hand detections...</div>
        </div>
        <script>
            const video = document.getElementById('video');
            const resultsDiv = document.getElementById('results');
            const statusDiv = document.getElementById('status');
            const startButton = document.getElementById('start');
            const stopButton = document.getElementById('stop');
            
            let pc;
            let dataChannel;
            
            function showStatus(connected) {
                statusDiv.className = connected ? 'status connected' : 'status disconnected';
                statusDiv.textContent = connected ? 'Connected' : 'Disconnected';
                startButton.disabled = connected;
                stopButton.disabled = !connected;
            }
            
            function addResult(result) {
                const resultEl = document.createElement('div');
                resultEl.textContent = JSON.stringify(result);
                resultsDiv.appendChild(resultEl);
                
                // Limit the number of displayed results
                if (resultsDiv.children.length > 50) {
                    resultsDiv.removeChild(resultsDiv.firstChild);
                }
                
                // Auto-scroll to bottom
                resultsDiv.scrollTop = resultsDiv.scrollHeight;
            }
            
            async function start() {
                try {
                    // Create peer connection
                    pc = new RTCPeerConnection();
                    
                    // Create data channel for receiving detection results
                    dataChannel = pc.createDataChannel('mediapipe-results');
                    dataChannel.onmessage = (event) => {
                        const result = JSON.parse(event.data);
                        addResult(result);
                    };
                    
                    // Handle ICE candidates
                    pc.onicecandidate = (e) => {
                        if (e.candidate === null) {
                            document.getElementById('offer-sdp').textContent = JSON.stringify(pc.localDescription);
                        }
                    };
                    
                    // Get user media
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    video.srcObject = stream;
                    
                    // Add tracks to peer connection
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                    
                    // Create offer
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    
                    // Send offer to server
                    const response = await fetch('/offer', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ sdp: pc.localDescription })
                    });
                    
                    const answer = await response.json();
                    await pc.setRemoteDescription(answer.sdp);
                    
                    showStatus(true);
                } catch (error) {
                    console.error('Error starting WebRTC:', error);
                    stop();
                }
            }
            
            function stop() {
                if (pc) {
                    pc.close();
                    pc = null;
                }
                
                if (video.srcObject) {
                    video.srcObject.getTracks().forEach(track => track.stop());
                    video.srcObject = null;
                }
                
                showStatus(false);
            }
            
            startButton.addEventListener('click', start);
            stopButton.addEventListener('click', stop);
        </script>
    </body>
    </html>
    """
    return web.Response(content_type="text/html", text=content)

async def offer(request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"]["sdp"], type=params["sdp"]["type"])
    
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
            # Create a processor track that will process frames with MediaPipe
            processor = MediaPipeVideoTrack(track, pc)
            pc.addTrack(processor)
    
    # Handle data channels
    @pc.on("datachannel")
    def on_datachannel(channel):
        logger.info(f"Data channel created: {channel.label}")
        
        @channel.on("message")
        def on_message(message):
            if message == "ping":
                channel.send("pong")
    
    # Set the remote description
    await pc.setRemoteDescription(offer)
    
    # Create answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    
    return web.json_response({
        "sdp": {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
    })

async def on_shutdown(app):
    # Close all peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()

if __name__ == "__main__":
    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    
    # Setup CORS
    cors = cors_setup(app, defaults={
        "*": ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
            allow_methods=["GET", "POST", "OPTIONS"]
        )
    })
    
    # Configure CORS on routes
    resource = cors.add(app.router.add_resource("/"))
    cors.add(resource.add_route("GET", index))
    
    resource = cors.add(app.router.add_resource("/offer"))
    cors.add(resource.add_route("POST", offer))
    
    # REMOVE THIS LINE - it's causing the conflict
    # app.router.add_route("OPTIONS", "/offer", preflight)
    
    web.run_app(app, host="localhost", port=9000)