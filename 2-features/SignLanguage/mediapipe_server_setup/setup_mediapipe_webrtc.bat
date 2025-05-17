@echo off
echo Setting up MediaPipe WebRTC Server...

REM Check if conda is installed
where conda >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Conda not found. Please install Miniconda or Anaconda first.
    exit /b 1
)

REM Create a new environment for the server
call conda create -n mediapipe_webrtc python=3.9 -y

REM Activate the environment
call conda activate mediapipe_webrtc

REM Install dependencies
echo Installing dependencies...
pip install mediapipe opencv-python-headless aiohttp aiortc aiohttp_cors av

REM Create a launcher script
echo Creating launcher script...
(
echo @echo off
echo echo Starting MediaPipe WebRTC Server...
echo.
echo REM Activate environment
echo call conda activate mediapipe_webrtc
echo.
echo REM Run the server
echo python mediapipe_webrtc_server.py
) > start_webrtc_server.bat

echo Setup complete! You can start the server with:
echo start_webrtc_server.bat
echo.
echo Make sure the mediapipe_webrtc_server.py file is in the same directory.