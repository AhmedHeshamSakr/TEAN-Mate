Write-Host "Setting up MediaPipe WebRTC Server..." -ForegroundColor Green

# Check if conda is installed
if (!(Get-Command conda -ErrorAction SilentlyContinue)) {
    Write-Host "Conda not found. Please install Miniconda or Anaconda first." -ForegroundColor Red
    exit 1
}

# Create a new environment for the server
conda create -n mediapipe_webrtc python=3.9 -y

# Activate the environment
conda activate mediapipe_webrtc

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
pip install mediapipe opencv-python-headless aiohttp aiortc aiohttp_cors av

# Create a launcher script
Write-Host "Creating launcher script..." -ForegroundColor Green
@"
@echo off
echo Starting MediaPipe WebRTC Server...

REM Activate environment
call conda activate mediapipe_webrtc

REM Run the server
python mediapipe_webrtc_server.py
"@ | Out-File -FilePath "start_webrtc_server.bat" -Encoding ascii

Write-Host "Setup complete! You can start the server with:" -ForegroundColor Green
Write-Host "start_webrtc_server.bat" -ForegroundColor Cyan
Write-Host ""
Write-Host "Make sure the mediapipe_webrtc_server.py file is in the same directory."