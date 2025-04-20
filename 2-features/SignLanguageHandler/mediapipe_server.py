from flask import Flask, request, jsonify
from flask_cors import CORS
import mediapipe as mp
import numpy as np
import base64
import cv2
import json
import logging
import time
import threading
from flask_sock import Sock  # For WebSocket support

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
sock = Sock(app)  # Initialize WebSocket support

# Initialize MediaPipe Holistic (integrates pose, face, and hands)
mp_holistic = mp.solutions.holistic
mp_hands = mp.solutions.hands

# Initialize processors with better performance settings
holistic = mp_holistic.Holistic(
    static_image_mode=False,
    model_complexity=1,  # Use 1 for better balance of performance and accuracy
    smooth_landmarks=True,
    enable_segmentation=False,  # Disable segmentation for better performance
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Add hand gesture recognizer
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)



@app.route('/process_frame', methods=['POST'])
def process_frame():
    try:
        startTime = time.time()
        # Check if this is just a ping
        data = request.json
        if data.get('action') == 'ping':
            return jsonify({'success': True, 'message': 'Server is running'})
        
        # Get the image data from the request
        image_b64 = data.get('image')
        if not image_b64:
            return jsonify({'success': False, 'error': 'No image data provided'})
        
        # Process the frame
        result = process_image(image_b64)
        
        endTime = time.time()
        logger.info(f"HTTP Processing time: {endTime - startTime:.4f} seconds")
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)})

@sock.route('/process_frame/ws')
def websocket_handler(sock):
    """Handle WebSocket connections."""
    logger.info("WebSocket connection established")
    while True:
        try:
            # Receive data from client
            data = sock.receive()
            message = json.loads(data)
            
            # Check if this is just a ping
            if message.get('action') == 'ping':
                sock.send(json.dumps({'success': True, 'message': 'Server is running'}))
                continue
            
            # Get the image data from the message
            image_b64 = message.get('image')
            if not image_b64:
                sock.send(json.dumps({'success': False, 'error': 'No image data provided'}))
                continue
            
            # Process the frame
            start_time = time.time()
            result = process_image(image_b64)
            end_time = time.time()
            
            logger.info(f"WebSocket Processing time: {end_time - start_time:.4f} seconds")
            
            # Send the result back to the client
            sock.send(json.dumps(result))
        
        except Exception as e:
            logger.error(f"WebSocket error: {str(e)}", exc_info=True)
            sock.send(json.dumps({'success': False, 'error': str(e)}))

def process_image(image_b64):
    """Process an image and return the landmarks and gestures."""
    # Decode the base64 image
    image_data = base64.b64decode(image_b64)
    nparr = np.frombuffer(image_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert to RGB (MediaPipe requires RGB)
    rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Process with MediaPipe Holistic
    results = holistic.process(rgb_img)
    
    # Initialize data structures for results
    keypoints = []
    gestures = []
    
    # Process pose landmarks if available
    if results.pose_landmarks:
        # Extract pose landmarks
        for i, landmark in enumerate(results.pose_landmarks.landmark):
            # Get the pose landmark name
            landmark_name = mp_holistic.PoseLandmark(i).name.lower()
            
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'visibility': landmark.visibility,
                'name': landmark_name,
                'type': 'pose'
            })
        
        # Define pose connections for visualization
        pose_connections = mp_holistic.POSE_CONNECTIONS
        for connection in pose_connections:
            start_idx = connection[0]
            end_idx = connection[1]
            
            # Add connection information to each keypoint
            if start_idx < len(keypoints):  # Ensure index is valid
                if 'connections' not in keypoints[start_idx]:
                    keypoints[start_idx]['connections'] = []
                keypoints[start_idx]['connections'].append(end_idx)
    
    # Process left hand landmarks if available
    left_hand_offset = len(keypoints)
    left_hand_landmarks = []
    if results.left_hand_landmarks:
        for i, landmark in enumerate(results.left_hand_landmarks.landmark):
            # Get the hand landmark name
            landmark_name = mp_holistic.HandLandmark(i).name.lower()
            
            # Store landmark for gesture recognition
            left_hand_landmarks.append(landmark)
            
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'name': f"left_{landmark_name}",
                'type': 'hand'
            })
        
        # Define hand connections for visualization
        hand_connections = mp_holistic.HAND_CONNECTIONS
        for connection in hand_connections:
            start_idx = connection[0] + left_hand_offset
            end_idx = connection[1] + left_hand_offset
            
            # Add connection information to each keypoint
            if start_idx < len(keypoints) and end_idx < len(keypoints):
                if 'connections' not in keypoints[start_idx]:
                    keypoints[start_idx]['connections'] = []
                keypoints[start_idx]['connections'].append(end_idx)

    # Process right hand landmarks if available
    right_hand_offset = len(keypoints)
    right_hand_landmarks = []
    if results.right_hand_landmarks:
        for i, landmark in enumerate(results.right_hand_landmarks.landmark):
            # Get the hand landmark name
            landmark_name = mp_holistic.HandLandmark(i).name.lower()
            
            # Store landmark for gesture recognition
            right_hand_landmarks.append(landmark)
            
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'name': f"right_{landmark_name}",
                'type': 'hand'
            })
        
        # Define hand connections for visualization
        hand_connections = mp_holistic.HAND_CONNECTIONS
        for connection in hand_connections:
            start_idx = connection[0] + right_hand_offset
            end_idx = connection[1] + right_hand_offset
            
            # Add connection information to each keypoint
            if start_idx < len(keypoints) and end_idx < len(keypoints):
                if 'connections' not in keypoints[start_idx]:
                    keypoints[start_idx]['connections'] = []
                keypoints[start_idx]['connections'].append(end_idx)
        
    
    # Process face landmarks if available - with optimization to reduce data size
    face_offset = len(keypoints)
    if results.face_landmarks:
        # Only use a subset of face landmarks for performance
        face_landmarks = results.face_landmarks.landmark
        # Use every 5th landmark to reduce data size
        sampled_landmarks = [face_landmarks[i] for i in range(0, len(face_landmarks), 5)]
        
        for i, landmark in enumerate(sampled_landmarks):
            original_idx = i * 5
            keypoints.append({
                'x': landmark.x,
                'y': landmark.y,
                'z': landmark.z,
                'name': f"face_{original_idx}",  # Keep original index for reference
                'type': 'face'
            })
        
        # Simplified face connections for better performance
        if len(sampled_landmarks) > 0:
            # Create a simplified connection set
            simplified_connections = []
            for connection in mp_holistic.FACEMESH_CONTOURS:
                start_idx = connection[0] // 5
                end_idx = connection[1] // 5
                
                # Only add connection if both points exist in our sampled set
                if start_idx * 5 < len(face_landmarks) and end_idx * 5 < len(face_landmarks):
                    # Check if indices are valid for our keypoints array
                    if start_idx < len(sampled_landmarks) and end_idx < len(sampled_landmarks):
                        idx_start = face_offset + start_idx
                        idx_end = face_offset + end_idx
                        
                        if idx_start < len(keypoints) and idx_end < len(keypoints):
                            if 'connections' not in keypoints[idx_start]:
                                keypoints[idx_start]['connections'] = []
                            keypoints[idx_start]['connections'].append(idx_end)
    
    # Return the processed results
    return {
        'success': True,
        'keypoints': keypoints,
        'gestures': gestures,
        'frame_width': img.shape[1],
        'frame_height': img.shape[0]
    }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    logger.info("Starting MediaPipe Holistic server on port 5000")
    # Use threaded=True for better handling of concurrent requests
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)