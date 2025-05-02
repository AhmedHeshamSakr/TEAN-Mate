import asyncio
import websockets
import json
import cv2
import numpy as np
import base64
import logging
import os
import time
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

# Create necessary directories
os.makedirs("logs", exist_ok=True)
os.makedirs("debug_frames", exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f"logs/hand_server_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("HandServer")

# Configuration
MAX_WORKERS = 4  # Number of parallel workers
BATCH_SIZE = 30  # Process this many frames at once
MAX_QUEUE_SIZE = 60  # Maximum frames to queue
RESIZE_FACTOR = 0.5  # Resize images to 50% for faster processing
DETECTION_TIMEOUT = 0.1  # Max time allowed for processing a single frame
FRAME_SKIP_THRESHOLD = 15  # If queue grows beyond this, start skipping frames
DEBUG_EVERY_N_FRAMES = 60  # Save debug frames every N frames
QUALITY_FACTOR = 50  # JPEG compression quality (0-100)

# Statistics
process_count = 0
skipped_count = 0
last_log_time = time.time()
save_debug_frames = True
processing_times = []  # Track processing times

# Global frame queue
frame_queue = []
queue_lock = threading.Lock()

# Global flag for MediaPipe availability
use_mediapipe = False
hands = None

# Thread pool executor
executor = ThreadPoolExecutor(max_workers=MAX_WORKERS)

# Try to import and initialize MediaPipe
try:
    import mediapipe as mp
    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=2,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    logger.info("MediaPipe Hands initialized successfully")
    use_mediapipe = True
except Exception as e:
    logger.error(f"MediaPipe initialization failed: {e}")
    logger.info("Will use OpenCV-based fallback for hand detection")

def resize_image(image, factor=RESIZE_FACTOR):
    """Resize image for faster processing"""
    if factor == 1.0:
        return image
    
    h, w = image.shape[:2]
    new_h, new_w = int(h * factor), int(w * factor)
    return cv2.resize(image, (new_w, new_h))

def detect_hands_opencv(frame, original_shape=None):
    """Optimized OpenCV-based hand detection"""
    # Convert to grayscale and apply blur
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Apply thresholding using OTSU for adaptive performance
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    
    # Find contours - use RETR_EXTERNAL for faster processing
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Sort contours by area (largest first) and limit to top 2
    sorted_contours = sorted(contours, key=cv2.contourArea, reverse=True)[:2]
    
    # Calculate scale factors if image was resized
    if original_shape is not None:
        scale_x = original_shape[1] / frame.shape[1]
        scale_y = original_shape[0] / frame.shape[0]
    else:
        scale_x, scale_y = 1.0, 1.0
    
    # Filter contours by size to find potential hands
    hand_contours = []
    for contour in sorted_contours:
        area = cv2.contourArea(contour)
        if area > 1000:  # Lower threshold for faster processing
            # Get convex hull
            hull = cv2.convexHull(contour)
            
            # Get bounding rect
            x, y, w, h = cv2.boundingRect(contour)
            
            # Create landmark-like points (simplified to 21 key points)
            landmarks = []
            
            # Add central palm point
            M = cv2.moments(contour)
            cx, cy = x + w//2, y + h//2  # Default to bounding box center
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
            
            # Normalize coordinates based on original image size
            landmarks.append({
                'x': (cx * scale_x) / (frame.shape[1] * scale_x),
                'y': (cy * scale_y) / (frame.shape[0] * scale_y),
                'z': 0.0
            })
            
            # Instead of sampling contour points (which is slow),
            # create a grid of points within the bounding box
            # to simulate a hand with fingers
            grid_size = min(w, h) // 5
            if grid_size < 1:
                grid_size = 1
                
            for i in range(5):  # 5 "fingers"
                for j in range(4):  # 4 points per finger
                    px = x + (i * w // 5) + (w // 10)
                    py = y + (j * h // 4) + (h // 8)
                    
                    # Add normalized point
                    landmarks.append({
                        'x': (px * scale_x) / (frame.shape[1] * scale_x),
                        'y': (py * scale_y) / (frame.shape[0] * scale_y),
                        'z': 0.0
                    })
            
            # Ensure we have exactly 21 landmarks
            while len(landmarks) < 21:
                landmarks.append(landmarks[0])  # Duplicate center point if needed
            
            # Create debug visualization (only if saving debug frames)
            debug_frame = None
            if save_debug_frames:
                debug_frame = frame.copy()
                cv2.drawContours(debug_frame, [contour], 0, (0, 255, 0), 2)
                cv2.drawContours(debug_frame, [hull], 0, (0, 0, 255), 2)
                cv2.circle(debug_frame, (cx, cy), 8, (255, 0, 0), -1)
                cv2.rectangle(debug_frame, (x, y), (x+w, y+h), (255, 255, 0), 2)
            
            # Determine if left or right hand based on position in frame
            handedness = "Right" if cx < frame.shape[1]/2 else "Left"
            
            hand_contours.append({
                'landmarks': landmarks,
                'handedness': {
                    'label': handedness,
                    'score': 0.8  # Fixed confidence score
                },
                'debugFrame': debug_frame
            })
    
    return hand_contours

def process_single_frame(frame_data, frame_id, timestamp):
    """Process a single frame and return results"""
    start_time = time.time()
    
    try:
        # Decode base64 image
        img_data = base64.b64decode(frame_data)
        np_arr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {
                'frame_id': frame_id,
                'type': 'error',
                'message': 'Could not decode image',
                'timestamp': timestamp
            }
        
        # Store original size
        original_shape = frame.shape
        
        # Resize for faster processing
        frame_resized = resize_image(frame, RESIZE_FACTOR)
        
        # Prepare default response
        response = {
            'frame_id': frame_id,
            'type': 'hand_detection',
            'results': {
                'multiHandLandmarks': [],
                'multiHandedness': []
            },
            'timestamp': timestamp,
            'processing_time': 0
        }
        
        debug_frame = None
        mediapipe_detected = False
        
        # Try MediaPipe detection if available
        if use_mediapipe and hands:
            try:
                # Set a timeout for MediaPipe detection
                detection_complete = threading.Event()
                mp_results = [None]
                
                def run_mediapipe():
                    try:
                        # Convert to RGB for MediaPipe
                        frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
                        
                        # Process with MediaPipe
                        mp_results[0] = hands.process(frame_rgb)
                        detection_complete.set()
                    except Exception as e:
                        logger.warning(f"MediaPipe detection error: {e}")
                        detection_complete.set()
                
                # Run MediaPipe detection in a separate thread with timeout
                mp_thread = threading.Thread(target=run_mediapipe)
                mp_thread.start()
                if detection_complete.wait(DETECTION_TIMEOUT):
                    # MediaPipe detection completed within timeout
                    results = mp_results[0]
                    
                    # Extract landmarks if hands detected
                    if results and results.multi_hand_landmarks:
                        mediapipe_detected = True
                        for idx, hand_landmarks in enumerate(results.multi_hand_landmarks):
                            landmarks = []
                            for landmark in hand_landmarks.landmark:
                                landmarks.append({
                                    'x': landmark.x,
                                    'y': landmark.y,
                                    'z': landmark.z
                                })
                            
                            response['results']['multiHandLandmarks'].append(landmarks)
                            
                            # Get handedness (left or right hand)
                            if results.multi_handedness and idx < len(results.multi_handedness):
                                handedness = {
                                    'label': results.multi_handedness[idx].classification[0].label,
                                    'score': float(results.multi_handedness[idx].classification[0].score)
                                }
                                response['results']['multiHandedness'].append(handedness)
                        
                        # Create debug frame for successful detection
                        if save_debug_frames and (frame_id % DEBUG_EVERY_N_FRAMES == 0):
                            debug_frame = frame.copy()
                            debug_rgb = cv2.cvtColor(debug_frame, cv2.COLOR_BGR2RGB)
                            for hand_landmarks in results.multi_hand_landmarks:
                                # Draw landmarks on the original size image
                                mp_drawing.draw_landmarks(
                                    debug_rgb,
                                    hand_landmarks,
                                    mp_hands.HAND_CONNECTIONS
                                )
                            debug_frame = cv2.cvtColor(debug_rgb, cv2.COLOR_RGB2BGR)
                else:
                    # MediaPipe detection timed out
                    logger.warning(f"MediaPipe detection timed out for frame {frame_id}")
                    if mp_thread.is_alive():
                        # Cannot kill thread in Python, but we can continue anyway
                        pass
            except Exception as mp_error:
                logger.error(f"MediaPipe processing error: {mp_error}")
        
        # Use OpenCV fallback if MediaPipe is unavailable or failed
        if not mediapipe_detected:
            detected_hands = detect_hands_opencv(frame_resized, original_shape)
            
            if detected_hands:
                for hand in detected_hands:
                    response['results']['multiHandLandmarks'].append(hand['landmarks'])
                    response['results']['multiHandedness'].append(hand['handedness'])
                    
                    # Use the OpenCV debug frame for the first detected hand
                    if debug_frame is None and save_debug_frames and (frame_id % DEBUG_EVERY_N_FRAMES == 0):
                        debug_frame = hand.get('debugFrame')
        
        # Save debug frame if we have detections
        if debug_frame is not None and save_debug_frames and (frame_id % DEBUG_EVERY_N_FRAMES == 0):
            timestamp_str = int(time.time())
            cv2.imwrite(f"debug_frames/hand_detection_{timestamp_str}_{frame_id}.jpg", 
                       cv2.resize(debug_frame, (640, 480)), 
                       [cv2.IMWRITE_JPEG_QUALITY, QUALITY_FACTOR])
        
        # Calculate processing time
        processing_time = time.time() - start_time
        response['processing_time'] = processing_time
        
        return response
    
    except Exception as e:
        logger.error(f"Error processing frame {frame_id}: {str(e)}")
        return {
            'frame_id': frame_id,
            'type': 'error',
            'message': str(e),
            'timestamp': timestamp
        }

async def process_batch(batch, websocket):
    """Process a batch of frames and send back results"""
    global process_count, processing_times
    
    if not batch:
        return
    
    # Submit all frames for processing in parallel
    futures = []
    for i, frame_item in enumerate(batch):
        futures.append(executor.submit(
            process_single_frame, 
            frame_item['data'], 
            frame_item['frame_id'], 
            frame_item['timestamp']
        ))
    
    # Collect and send results as they complete
    for future in futures:
        result = future.result()
        
        # Update statistics
        process_count += 1
        if 'processing_time' in result:
            processing_times.append(result['processing_time'])
            # Keep only the last 100 processing times
            if len(processing_times) > 100:
                processing_times.pop(0)
        
        # Send result back to client
        await websocket.send(json.dumps(result))

async def process_frames(websocket, path):
    """Process incoming WebSocket messages and handle frames"""
    global process_count, skipped_count, last_log_time, frame_queue
    client_address = websocket.remote_address
    logger.info(f"New connection from {client_address}")
    
    # Create a task to process the frame queue periodically
    batch_processor_task = None
    
    async def batch_processor():
        global frame_queue  # Important: Declare frame_queue as global
        while True:
            try:
                # Get frames from queue
                batch = []
                with queue_lock:
                    batch_size = min(BATCH_SIZE, len(frame_queue))
                    if batch_size > 0:
                        batch = frame_queue[:batch_size]
                        frame_queue = frame_queue[batch_size:]
                
                # Process batch if any frames
                if batch:
                    await process_batch(batch, websocket)
                
                # Sleep briefly to allow other tasks to run
                await asyncio.sleep(0.01)
            except Exception as e:
                logger.error(f"Batch processor error: {e}")
                await asyncio.sleep(1)  # Sleep longer on error
    
    try:
        # Start batch processor
        batch_processor_task = asyncio.create_task(batch_processor())
        
        frame_id = 0
        
        async for message in websocket:
            try:
                # Parse the message
                data = json.loads(message)
                
                if data['type'] == 'hand_frame':
                    frame_id += 1
                    current_time = time.time()
                    
                    # Log stats periodically
                    if current_time - last_log_time > 5:
                        # Calculate statistics
                        duration = current_time - last_log_time
                        fps = process_count / duration if duration > 0 else 0
                        avg_time = sum(processing_times) / max(1, len(processing_times))
                        
                        with queue_lock:
                            queue_size = len(frame_queue)
                        
                        logger.info(f"Processing at {fps:.2f} FPS | Processed: {process_count} frames | "
                                    f"Skipped: {skipped_count} frames | Queue: {queue_size} | "
                                    f"Avg time: {avg_time*1000:.1f}ms")
                        
                        # Reset counters
                        process_count = 0
                        skipped_count = 0
                        last_log_time = current_time
                    
                    # Check if we should skip this frame
                    skip_frame = False
                    with queue_lock:
                        if len(frame_queue) > FRAME_SKIP_THRESHOLD:
                            skip_frame = frame_id % 2 == 0  # Skip every other frame
                    
                    if skip_frame:
                        skipped_count += 1
                    else:
                        # Add to processing queue
                        with queue_lock:
                            # If queue is full, remove oldest frame
                            if len(frame_queue) >= MAX_QUEUE_SIZE:
                                frame_queue.pop(0)
                            
                            # Add frame to queue
                            frame_queue.append({
                                'frame_id': frame_id,
                                'data': data['data'],
                                'timestamp': data.get('timestamp', int(time.time() * 1000))
                            })
                    
                elif data['type'] == 'ping':
                    # Simple ping to check connection
                    await websocket.send(json.dumps({'type': 'pong'}))
                    
            except Exception as e:
                logger.error(f"Error handling message: {str(e)}")
                await websocket.send(json.dumps({
                    'type': 'error',
                    'message': str(e)
                }))
    except websockets.exceptions.ConnectionClosed:
        logger.info(f"Connection closed from {client_address}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
    finally:
        # Cancel batch processor task
        if batch_processor_task:
            batch_processor_task.cancel()
            try:
                await batch_processor_task
            except asyncio.CancelledError:
                pass

async def main():
    """Start the WebSocket server."""
    server = await websockets.serve(process_frames, "localhost", 8765)
    logger.info(f"Optimized {'MediaPipe' if use_mediapipe else 'OpenCV'} Hand Detection server running on ws://localhost:8765")
    logger.info(f"Batch processing: {BATCH_SIZE} frames at a time with {MAX_WORKERS} workers")
    await server.wait_closed()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopping due to keyboard interrupt")
        # Shutdown thread pool
        executor.shutdown(wait=False)
    except Exception as e:
        logger.error(f"Server error: {str(e)}")