// VideoProcessor.js
import { Pose } from "@mediapipe/pose";

export class VideoProcessor {
  constructor() {
    this.processingActive = false;
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.debugOverlay = null;
    this.debugContext = null;
    this.debugMode = false;

    this.pose = new Pose({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.pose.onResults((results) => {
      if (results.poseLandmarks) {
        console.log("Detected keypoints:", results.poseLandmarks);
        this.sendToBackend(results.poseLandmarks);
      }
    });
  }

  async startProcessing() {
    if (this.processingActive) return;
    this.processingActive = true;

    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
      });

      this.videoElement = document.createElement("video");
      this.videoElement.srcObject = this.stream;
      this.videoElement.play();

      this.canvasElement = document.createElement("canvas");
      document.body.appendChild(this.canvasElement);

      this.processVideo(this.videoElement);
    } catch (error) {
      console.error("Error accessing screen capture:", error);
    }
  }

  stopProcessing() {
    this.processingActive = false;
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
    }
    if (this.debugOverlay) {
      document.body.removeChild(this.debugOverlay.parentNode);
    }
  }

  processVideo(videoElement) {
    const ctx = this.canvasElement.getContext("2d");

    const extractFrame = () => {
      if (!this.processingActive) return;

      this.canvasElement.width = videoElement.videoWidth;
      this.canvasElement.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);

      const frame = ctx.getImageData(0, 0, this.canvasElement.width, this.canvasElement.height);
      this.processFrameWithOpenCV(frame);

      if (this.debugMode) {
        this.updateDebugOverlay(frame);
      }

      requestAnimationFrame(extractFrame);
    };

    videoElement.onloadeddata = () => extractFrame();
  }

  async processFrameWithOpenCV(frame) {
    let src = cv.matFromImageData(frame);
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);

    const imageBitmap = await createImageBitmap(frame);
    this.pose.send({ image: imageBitmap });

    src.delete();
  }

  sendToBackend(landmarks) {
    // Implement logic to send landmarks to your backend
    console.log("Sending landmarks to backend:", landmarks);
  }

  initializeDebugOverlay() {
    this.debugOverlay = document.createElement("canvas");
    this.debugOverlay.width = 320;
    this.debugOverlay.height = 240;
    this.debugOverlay.style.position = "fixed";
    this.debugOverlay.style.bottom = "20px";
    this.debugOverlay.style.right = "20px";
    this.debugOverlay.style.border = "2px solid #4CAF50";
    this.debugOverlay.style.borderRadius = "5px";
    this.debugOverlay.style.zIndex = "9999";
    this.debugOverlay.style.backgroundColor = "#000";
    this.debugContext = this.debugOverlay.getContext("2d");

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "X";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "5px";
    closeBtn.style.right = "5px";
    closeBtn.style.backgroundColor = "red";
    closeBtn.style.color = "white";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "50%";
    closeBtn.style.width = "20px";
    closeBtn.style.height = "20px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "12px";
    closeBtn.style.display = "flex";
    closeBtn.style.justifyContent = "center";
    closeBtn.style.alignItems = "center";
    closeBtn.onclick = () => {
      this.debugOverlay.style.display = "none";
      this.debugMode = false;
    };

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.bottom = "20px";
    wrapper.style.right = "20px";
    wrapper.style.zIndex = "9999";
    wrapper.appendChild(this.debugOverlay);
    wrapper.appendChild(closeBtn);
    document.body.appendChild(wrapper);
  }

  updateDebugOverlay(frame) {
    if (!this.debugContext) return;

    this.debugContext.drawImage(
      this.canvasElement,
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height,
      0,
      0,
      this.debugOverlay.width,
      this.debugOverlay.height
    );

    this.debugContext.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.debugContext.fillRect(0, 0, 150, 20);
    this.debugContext.fillStyle = "white";
    this.debugContext.font = "12px Arial";
    this.debugContext.fillText(`Frame: ${new Date().toISOString().substr(11, 8)}`, 5, 15);
  }

  toggleDebugOverlay() {
    this.debugMode = !this.debugMode;

    if (this.debugMode && !this.debugOverlay) {
      this.initializeDebugOverlay();
    } else if (this.debugOverlay) {
      this.debugOverlay.parentNode.style.display = this.debugMode ? "block" : "none";
    }
  }
}