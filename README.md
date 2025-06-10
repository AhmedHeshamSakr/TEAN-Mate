# TEAN Mate
#### The Ease of Accsess and Navigation Mate

A comprehensive AI-powered Browser Extension designed to improve web accessibility for individuals with disabilities. TEAN Mate offers text-to-speech, speech-to-text, image captioning, and sign language detection features to make web browsing more accessible.

## Features

### Text-to-Speech (TTS)
- Extracts and reads webpage content aloud using Piper TTS
- Highlights currently spoken text for better tracking
- Skip forward/backward between text sections
- Pause and resume reading functionality
- Keyboard shortcuts for navigation (Ctrl+Right, Ctrl+Left, Ctrl+Space)
- Visual highlighting of currently read content

### Speech-to-Text (STT)
- Voice command recognition using Artyom.js
- Supports both push-to-talk and continuous listening modes
- Displays recognized text in the sidebar
- Option to overlay speech captions on videos
- Copy, save, or clear transcribed text
- Word count tracking

### Image Captioning
- AI-powered image description using Florence-2 model
- Multiple caption detail levels (basic, detailed, more detailed)
- Visual indicators when processing images
- Automatic alt-text generation for images without descriptions

### Sign Language Detection
- MediaPipe Holistic integration for hand, face, and pose tracking
- Screen sharing to detect and interpret hand movements 
- Real-time visualization of detected landmarks
- Supports webcam-based sign language interpretation

## Project Structure

```
extension/
├── manifest.json           # Extension configuration
├── package.json            # Project dependencies
├── webpack.config.js       # Build configuration
├── 1-sidebar/              # Sidebar UI components
│   ├── sidebar.css         # Sidebar styles
│   ├── sidebar.html        # Sidebar HTML interface
│   └── sidebar.js          # Sidebar functionality
├── 2-features/             # Feature modules
│   ├── ImageCaptioning/    # Image description generation
│   ├── SignLanguage/       # Sign language detection
│   ├── STT/                # Speech-to-text features
│   └── TTS/                # Text-to-speech features
├── 3-background/           # Background scripts
│   └── background.js       # Extension background processes
├── 4-content/              # Content scripts
│   └── content.js          # DOM interaction and feature integration
├── 6-settings/             # Settings & options page
└── dist/                   # Build output
```

## Installation Guide

### For Development

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AhmedHeshamSakr/TEAN-Mate
   cd tean-mate
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Extension**
   ```bash
   # For development with hot reload
   npm run dev
   
   # For production build
   npm run build
   ```

4. **Load the Extension in Edge**
   - Open Edge browser and navigate to `edge://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from your project

### For Sign Language Detection

The sign language detection feature requires a local MediaPipe server:

1. **Set Up Python Environment**
   ```bash
   # Create a virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install mediapipe opencv-python aiohttp aiohttp_cors aiortc av torch numpy
   ```

2. **Run the MediaPipe Server**
   ```bash
   # Navigate to the server directory
   cd 2-features/SignLanguage/mediapipe_server_setup
   
   # Start the server
   python mediapipe_webrtc_server.py
   ```

3. The server runs on `http://localhost:8765`

## Usage Guide

### Text-to-Speech
- Click the "Text to Speech" button in the sidebar to start reading the current page
- Use keyboard shortcuts to navigate:
  - `Ctrl+Right`: Skip to next section
  - `Ctrl+Left`: Skip to previous section
  - `Ctrl+Space`: Pause/resume reading
  - `Ctrl+Up`: Access current link

### Speech-to-Text
- Select mode (Push-to-Talk or Continuous) from the dropdown
- For Push-to-Talk: Hold `Space` key while speaking
- For Continuous: Click the button to start/stop listening
- Use the copy, save, or clear buttons to manage transcribed text
- Enable "Display text overlay on videos" to show captions on video content

### Image Captioning
- Click the "Image Captioning" button
- Select caption detail level and click "Activate"
- Hover over images to see processing indicators
- AI-generated captions will be read aloud when using TTS

### Sign Language Detection
- Ensure the MediaPipe server is running
- Click the "Sign Language" button to activate
- Grant screen sharing permission
- View detected landmarks in the overlay window
- Double-click the button to toggle debug visualization mode

## Voice Commands

TEAN Mate supports the following voice commands:

- "Text to speech" or "Start reading" - Activates TTS
- "Stop" or "Pause" - Pauses reading
- "Sign language" or "Show sign language" - Activates sign language detection
- "Image caption" or "Describe image" - Activates image captioning
- "Next" or "Skip next" - Moves to next section
- "Back" or "Skip back" - Moves to previous section
- "Open link" or "Open this link" - Opens focused link
- "Search for [query]" or "Find [query]" - Performs web search
- "Copy text" or "Copy speech" - Copies transcribed text
- "Save text" or "Save speech" - Saves transcribed text as file
- "Clear text" or "Clear speech" - Clears transcribed text

## Technical Details

- **Text-to-Speech**: Uses Piper TTS with custom voice models
- **Speech-to-Text**: Implements Artyom.js for voice recognition
- **Image Captioning**: Utilizes Florence-2 model for image understanding
- **Sign Language**: Leverages MediaPipe Holistic for landmark detection
- **Video Overlay**: Provides real-time caption display on video content

## Browser Support

Currently, TEAN Mate is designed for Microsoft Edge with Manifest V3 support.

## Contributors

- [Add contributor information here]

## License

[Add license information here]

## Support

For issues, feature requests, or questions, please [open an issue](https://github.com/AhmedHeshamSakr/TEAN-Mate/issues) on our GitHub repository.