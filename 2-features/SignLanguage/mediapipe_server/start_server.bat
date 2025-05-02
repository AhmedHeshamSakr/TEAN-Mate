@echo off
echo Starting MediaPipe WebSocket Server...
cd /d %~dp0
call venv\Scripts\activate
python mediapipe_server.py
pause