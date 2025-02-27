// VideoProcessor.js
import { Pose } from "@mediapipe/pose";

export class VideoProcessor {
  constructor() {
    this.processingActive = false;
    this.stream = null;
    this.videoElement = null;

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
  }

  processVideo(videoElement) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const extractFrame = () => {
      if (!this.processingActive) return;

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      this.processFrameWithOpenCV(frame);

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
}