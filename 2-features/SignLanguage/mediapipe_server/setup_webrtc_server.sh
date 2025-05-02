#!/bin/bash
echo "Setting up MediaPipe WebRTC Server..."

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Conda not found. Please install Miniconda or Anaconda first."
    exit 1
fi

# Source the conda.sh script to enable conda commands in this script
source "$(conda info --base)/etc/profile.d/conda.sh"

# Create a new environment for the server
conda create -n mediapipe_webrtc python=3.9 -y

# Activate the environment
conda activate mediapipe_webrtc

# Install dependencies
echo "Installing dependencies..."
pip install mediapipe opencv-python-headless aiohttp aiortc aiohttp_cors av

# Create a launcher script
echo "Creating launcher script..."
cat > start_webrtc_server.sh << 'EOL'
#!/bin/bash
echo "Starting MediaPipe WebRTC Server..."

# Source conda
source "$(conda info --base)/etc/profile.d/conda.sh"

# Activate environment
conda activate mediapipe_webrtc

# Run the server
python mediapipe_webrtc_server.py
EOL

chmod +x start_webrtc_server.sh

echo "Setup complete! You can start the server with:"
echo "./start_webrtc_server.sh"