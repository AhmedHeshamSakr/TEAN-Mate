#!/bin/bash
echo "Starting MediaPipe WebRTC Server..."

# Source conda
source "$(conda info --base)/etc/profile.d/conda.sh"

# Activate environment
conda activate mediapipe_webrtc

# Run the server
python mediapipe_webrtc_server.py
