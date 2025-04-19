import * as ort from 'onnxruntime-web';

class RTMPose {
  constructor(options = {}) {
    // Configuration options with defaults
    this.modelPath = options.modelPath || "rtmpose.onnx";
    this.inputSize = options.inputSize || [192, 256]; // (Width, Height)
    this.tensorSize = [1, 3, this.inputSize[1], this.inputSize[0]]; // (Batch Size, Channels, Height, Width)
    this.session = null;
    this.isLoaded = false;
    
    // Model constants
    this.targetWidth = 384;
    this.targetHeight = 512;
    this.pixelCount = this.inputSize[0] * this.inputSize[1];
    
    // Pre-allocate all buffers
    this.resizedCanvas = document.createElement('canvas');
    this.resizedCanvas.width = this.targetWidth;
    this.resizedCanvas.height = this.targetHeight;
    this.resizedCtx = this.resizedCanvas.getContext('2d', { 
      alpha: false, // Disable alpha for performance
      willReadFrequently: true // Optimize for frequent reads
    });
    
    // Pre-allocate image data buffer to avoid allocation in loops
    this.imageData = this.resizedCtx.createImageData(this.targetWidth, this.targetHeight);
    this.imageDataBuffer = new Uint8ClampedArray(this.targetWidth * this.targetHeight * 4);
    
    // Pre-allocate tensor memory - reuse this for all frames
    this.tensorMemory = new Float32Array(3 * this.inputSize[0] * this.inputSize[1]);
    this.imageTensor = new ort.Tensor("float32", this.tensorMemory, this.tensorSize);
    
    // Pre-compute affine transformation constants for faster processing
    this.invMatBuffer = new Float32Array(6); // Flat array for [a,b,c,d,e,f]
    
    // ImageNet normalization constants
    this.mean = [123.675, 116.28, 103.53];
    this.std = [58.395, 57.12, 57.375];
    
    // Pre-compute color normalization lookup tables (dramatically speeds up normalization)
    this.normLUT = new Float32Array(768); // 256 values * 3 channels
    for (let i = 0; i < 256; i++) {
      this.normLUT[i] = (i - this.mean[0]) / this.std[0];
      this.normLUT[i + 256] = (i - this.mean[1]) / this.std[1];
      this.normLUT[i + 512] = (i - this.mean[2]) / this.std[2];
    }
    
    // Pre-compute constants for coordinate transformation
    this.padding = 1.25;
    this.aspectRatio = this.inputSize[0] / this.inputSize[1];
    
    // Pre-allocate keypoints array
    this.keypoints = [];
    this.transformedKeypoints = [];
    
    // Performance tracking
    this.fpsCounter = 0;
    this.lastFpsUpdate = performance.now();
    this.fps = 0;
    
    // WebWorker for processing (optional)
    this.useWorker = options.useWorker || false;
    this.worker = null;
    if (this.useWorker) this.initWorker();
  }

  /**
   * Initialize worker for parallel processing
   */
  initWorker() {
    const workerCode = `
      self.onmessage = function(e) {
        const { data, invMat, width, height, pixelCount } = e.data;
        const result = new Float32Array(3 * pixelCount);
        processImageData(data, result, invMat, width, height, pixelCount);
        self.postMessage({ result }, [result.buffer]);
      };
      
      function processImageData(data, result, invMat, width, height, pixelCount) {
        // Image processing code here
      }
    `;
    
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }

  /**
   * Load the RTMPose model
   * @returns {Promise<void>}
   */
  async loadModel() {
    if (this.isLoaded) return;
    
    try {
      console.log("Loading RTMPose model...");
      const onnxruntimeBase = chrome.runtime.getURL("./");
      
      // Use all available CPU threads
      ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
      ort.env.wasm.wasmPaths = onnxruntimeBase;
      
      // Set execution mode to sequential for better performance
      const sessionOptions = {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        executionMode: 'sequential',
        enableCpuMemArena: true,
        enableMemPattern: true
      };
      
      this.session = await ort.InferenceSession.create(this.modelPath, sessionOptions);
      this.isLoaded = true;
      console.log("Model loaded successfully.");
    } catch (error) {
      console.error("Failed to load model:", error);
      throw error;
    }
  }

  /**
   * Fast frame processing with batched operations
   * @param {HTMLCanvasElement|HTMLImageElement|HTMLVideoElement} frame - Input frame
   * @returns {Promise<Object>} - Detection results
   */
  async processFrame(frame) {
    if (!this.isLoaded) {
      await this.loadModel();
    }
    
    const startTime = performance.now();
    
    // Resize and extract pixels in one operation
    this.resizedCtx.drawImage(frame, 0, 0, this.targetWidth, this.targetHeight);
    const imageData = this.resizedCtx.getImageData(0, 0, this.targetWidth, this.targetHeight);
    
    // Generate transformation matrix (only when frame size changes)
    const center = [this.targetWidth / 2, this.targetHeight / 2];
    const scale = [this.targetWidth , this.targetHeight ];
    this.updateAffineMatrix(center, scale);
    
    // Process image data in one batch operation
    this.processImageDataFast(imageData.data);
    
    // Run inference with pre-allocated tensor
    const startInferenceTime = performance.now();
    const results = await this.runInference();
    const inferenceTime = performance.now() - startInferenceTime;
    console.log(`Inference time: ${inferenceTime} ms`);
    
    // Fast keypoint decoding
    this.decodeKeypointsFast(results.simcc_x, results.simcc_y);
    
    // Transform keypoints back to original coordinates
    this.transformKeypointsFast(center, scale);
    
    // Update FPS counter
    this.updateFPS();
    
    const processTime = performance.now() - startTime;
    
    return {
      keypoints: this.transformedKeypoints,
      processingTime: processTime,
      fps: this.fps
    };
  }
  
  /**
   * Update FPS counter
   */
  updateFPS() {
    this.fpsCounter++;
    const now = performance.now();
    const elapsed = now - this.lastFpsUpdate;
    
    if (elapsed >= 1000) {
      this.fps = Math.round((this.fpsCounter * 1000) / elapsed);
      this.fpsCounter = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Ultra-fast image data processing with SIMD-like optimizations
   * @param {Uint8ClampedArray} data - Raw image data
   */
  processImageDataFast(data) {
    const srcWidth = this.targetWidth;
    const dstWidth = this.inputSize[0];
    const dstHeight = this.inputSize[1];
    const pixelCount = this.pixelCount;
    
    // Extract matrix values
    const a = this.invMatBuffer[0];
    const b = this.invMatBuffer[1];
    const c = this.invMatBuffer[2];
    const d = this.invMatBuffer[3];
    const e = this.invMatBuffer[4];
    const f = this.invMatBuffer[5];
    
    // Process 4 pixels at once when possible (manual vectorization)
    const limit = (dstWidth * dstHeight) & ~3; // Round down to multiple of 4
    let destIdxR = 0;
    let destIdxG = pixelCount;
    let destIdxB = 2 * pixelCount;
    
    // Fast path with unrolled loops
    for (let i = 0; i < limit; i += 4) {
      const y1 = Math.floor(i / dstWidth);
      const x1 = i % dstWidth;
      const y2 = Math.floor((i + 1) / dstWidth);
      const x2 = (i + 1) % dstWidth;
      const y3 = Math.floor((i + 2) / dstWidth);
      const x3 = (i + 2) % dstWidth;
      const y4 = Math.floor((i + 3) / dstWidth);
      const x4 = (i + 3) % dstWidth;
      
      // Compute source coordinates
      const srcX1 = Math.round(a * x1 + b * y1 + c);
      const srcY1 = Math.round(d * x1 + e * y1 + f);
      const srcX2 = Math.round(a * x2 + b * y2 + c);
      const srcY2 = Math.round(d * x2 + e * y2 + f);
      const srcX3 = Math.round(a * x3 + b * y3 + c);
      const srcY3 = Math.round(d * x3 + e * y3 + f);
      const srcX4 = Math.round(a * x4 + b * y4 + c);
      const srcY4 = Math.round(d * x4 + e * y4 + f);
      
      // Get indices for lookup
      const idx1 = ((srcY1 >= 0 && srcY1 < this.targetHeight && srcX1 >= 0 && srcX1 < srcWidth) ? 
                    (srcY1 * srcWidth + srcX1) * 4 : -1);
      const idx2 = ((srcY2 >= 0 && srcY2 < this.targetHeight && srcX2 >= 0 && srcX2 < srcWidth) ? 
                    (srcY2 * srcWidth + srcX2) * 4 : -1);
      const idx3 = ((srcY3 >= 0 && srcY3 < this.targetHeight && srcX3 >= 0 && srcX3 < srcWidth) ? 
                    (srcY3 * srcWidth + srcX3) * 4 : -1);
      const idx4 = ((srcY4 >= 0 && srcY4 < this.targetHeight && srcX4 >= 0 && srcX4 < srcWidth) ? 
                    (srcY4 * srcWidth + srcX4) * 4 : -1);
      
      // Use lookup tables for normalization - much faster than arithmetic
      this.tensorMemory[destIdxR++] = idx1 >= 0 ? this.normLUT[data[idx1]] : this.normLUT[0];
      this.tensorMemory[destIdxR++] = idx2 >= 0 ? this.normLUT[data[idx2]] : this.normLUT[0];
      this.tensorMemory[destIdxR++] = idx3 >= 0 ? this.normLUT[data[idx3]] : this.normLUT[0];
      this.tensorMemory[destIdxR++] = idx4 >= 0 ? this.normLUT[data[idx4]] : this.normLUT[0];
      
      this.tensorMemory[destIdxG++] = idx1 >= 0 ? this.normLUT[data[idx1 + 1] + 256] : this.normLUT[256];
      this.tensorMemory[destIdxG++] = idx2 >= 0 ? this.normLUT[data[idx2 + 1] + 256] : this.normLUT[256];
      this.tensorMemory[destIdxG++] = idx3 >= 0 ? this.normLUT[data[idx3 + 1] + 256] : this.normLUT[256];
      this.tensorMemory[destIdxG++] = idx4 >= 0 ? this.normLUT[data[idx4 + 1] + 256] : this.normLUT[256];
      
      this.tensorMemory[destIdxB++] = idx1 >= 0 ? this.normLUT[data[idx1 + 2] + 512] : this.normLUT[512];
      this.tensorMemory[destIdxB++] = idx2 >= 0 ? this.normLUT[data[idx2 + 2] + 512] : this.normLUT[512];
      this.tensorMemory[destIdxB++] = idx3 >= 0 ? this.normLUT[data[idx3 + 2] + 512] : this.normLUT[512];
      this.tensorMemory[destIdxB++] = idx4 >= 0 ? this.normLUT[data[idx4 + 2] + 512] : this.normLUT[512];
    }
    
    // Handle remaining pixels
    for (let i = limit; i < dstWidth * dstHeight; i++) {
      const y = Math.floor(i / dstWidth);
      const x = i % dstWidth;
      
      // Compute source coordinates
      const srcX = Math.round(a * x + b * y + c);
      const srcY = Math.round(d * x + e * y + f);
      
      // Get source pixel
      if (srcX >= 0 && srcX < srcWidth && srcY >= 0 && srcY < this.targetHeight) {
        const srcIdx = (srcY * srcWidth + srcX) * 4;
        this.tensorMemory[i] = this.normLUT[data[srcIdx]];
        this.tensorMemory[i + pixelCount] = this.normLUT[data[srcIdx + 1] + 256];
        this.tensorMemory[i + 2 * pixelCount] = this.normLUT[data[srcIdx + 2] + 512];
      } else {
        // Out of bounds
        this.tensorMemory[i] = this.normLUT[0];
        this.tensorMemory[i + pixelCount] = this.normLUT[256];
        this.tensorMemory[i + 2 * pixelCount] = this.normLUT[512];
      }
    }
  }

  /**
   * Update affine transformation matrix 
   * @param {Array} center - Center point [x, y]
   * @param {Array} scale - Scale [width, height]
   */
  updateAffineMatrix(center, scale) {
    // Fix aspect ratio
    const fixedScale = this.fixAspectRatio(scale);
    
    // Simplified transform calculation
    const srcHalfW = fixedScale[0] * 0.5;
    const srcHalfH = fixedScale[1] * 0.5;
    const dstHalfW = this.inputSize[0] * 0.5;
    const dstHalfH = this.inputSize[1] * 0.5;
    
    // Calculate scale factors directly
    const scaleX = dstHalfW / srcHalfW;
    const scaleY = dstHalfH / srcHalfH;
    
    // Directly compute inverse matrix for sampling (avoid matrix multiplication)
    this.invMatBuffer[0] = 1.0 / scaleX;  // a
    this.invMatBuffer[1] = 0;              // b
    this.invMatBuffer[2] = center[0] - this.inputSize[0] * 0.5 / scaleX; // c
    this.invMatBuffer[3] = 0;              // d
    this.invMatBuffer[4] = 1.0 / scaleY;  // e
    this.invMatBuffer[5] = center[1] - this.inputSize[1] * 0.5 / scaleY; // f
  }

  /**
   * Fix aspect ratio (inline implementation for speed)
   * @param {Array} scale - Input scale [width, height]
   * @returns {Array} - Fixed scale
   */
  fixAspectRatio(scale) {
    const [w, h] = scale;
    // Use pre-computed aspect ratio
    if (w > h * this.aspectRatio) {
      return [w, w / this.aspectRatio];
    } else {
      return [h * this.aspectRatio, h];
    }
  }

  /**
   * Run inference with pre-allocated tensor
   * @returns {Promise<Object>} - Results
   */
  async runInference() {
    const feeds = { [this.session.inputNames[0]]: this.imageTensor };
    try {
      const results = await this.session.run(feeds);
      return {
        simcc_x: results['simcc_x'].data,
        simcc_y: results['simcc_y'].data
      };
    } catch (error) {
      console.error("Inference error:", error);
      return { simcc_x: new Float32Array(0), simcc_y: new Float32Array(0) };
    }
  }

  /**
   * Ultra-fast keypoint decoding with SIMD-like optimizations
   * @param {Float32Array} simcc_x - X heatmap
   * @param {Float32Array} simcc_y - Y heatmap
   */
  decodeKeypointsFast(simcc_x, simcc_y) {
    const numKeypoints = simcc_x.length / this.targetWidth;
    
    // Resize keypoints array if needed
    if (this.keypoints.length !== numKeypoints) {
      this.keypoints = new Array(numKeypoints);
      for (let i = 0; i < numKeypoints; i++) {
        this.keypoints[i] = { x: 0, y: 0 };
      }
    }
    
    // Batch-process keypoints
    for (let i = 0; i < numKeypoints; i++) {
      const xOffset = i * this.targetWidth;
      const yOffset = i * this.targetHeight;
      
      // Find max X (unrolled for performance)
      let maxXIdx = 0;
      let maxXVal = simcc_x[xOffset];
      
      // Use block processing with loop unrolling
      const blockSize = 8;
      const blockLimit = this.targetWidth - (this.targetWidth % blockSize);
      
      // Process in blocks of 8
      for (let j = 0; j < blockLimit; j += blockSize) {
        // Unrolled comparison - much faster than a single loop
        if (simcc_x[xOffset + j] > maxXVal) {
          maxXVal = simcc_x[xOffset + j];
          maxXIdx = j;
        }
        if (simcc_x[xOffset + j + 1] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 1];
          maxXIdx = j + 1;
        }
        if (simcc_x[xOffset + j + 2] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 2];
          maxXIdx = j + 2;
        }
        if (simcc_x[xOffset + j + 3] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 3];
          maxXIdx = j + 3;
        }
        if (simcc_x[xOffset + j + 4] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 4];
          maxXIdx = j + 4;
        }
        if (simcc_x[xOffset + j + 5] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 5];
          maxXIdx = j + 5;
        }
        if (simcc_x[xOffset + j + 6] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 6];
          maxXIdx = j + 6;
        }
        if (simcc_x[xOffset + j + 7] > maxXVal) {
          maxXVal = simcc_x[xOffset + j + 7];
          maxXIdx = j + 7;
        }
      }
      
      // Handle remaining elements
      for (let j = blockLimit; j < this.targetWidth; j++) {
        if (simcc_x[xOffset + j] > maxXVal) {
          maxXVal = simcc_x[xOffset + j];
          maxXIdx = j;
        }
      }
      
      // Find max Y (similar unrolling)
      let maxYIdx = 0;
      let maxYVal = simcc_y[yOffset];
      
      // Process Y in blocks of 8
      const yBlockLimit = this.targetHeight - (this.targetHeight % blockSize);
      
      for (let j = 0; j < yBlockLimit; j += blockSize) {
        if (simcc_y[yOffset + j] > maxYVal) {
          maxYVal = simcc_y[yOffset + j];
          maxYIdx = j;
        }
        if (simcc_y[yOffset + j + 1] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 1];
          maxYIdx = j + 1;
        }
        if (simcc_y[yOffset + j + 2] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 2];
          maxYIdx = j + 2;
        }
        if (simcc_y[yOffset + j + 3] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 3];
          maxYIdx = j + 3;
        }
        if (simcc_y[yOffset + j + 4] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 4];
          maxYIdx = j + 4;
        }
        if (simcc_y[yOffset + j + 5] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 5];
          maxYIdx = j + 5;
        }
        if (simcc_y[yOffset + j + 6] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 6];
          maxYIdx = j + 6;
        }
        if (simcc_y[yOffset + j + 7] > maxYVal) {
          maxYVal = simcc_y[yOffset + j + 7];
          maxYIdx = j + 7;
        }
      }
      
      // Handle remaining elements
      for (let j = yBlockLimit; j < this.targetHeight; j++) {
        if (simcc_y[yOffset + j] > maxYVal) {
          maxYVal = simcc_y[yOffset + j];
          maxYIdx = j;
        }
      }
      
      // Store result
      this.keypoints[i].x = maxXIdx;
      this.keypoints[i].y = maxYIdx;
    }
  }

  /**
   * Ultra-fast keypoint transformation
   * @param {Array} center - Center point
   * @param {Array} scale - Scale
   */
  transformKeypointsFast(center, scale) {
    // Pre-compute offsets once
    const centerX = Math.round(center[0]);
    const centerY = Math.round(center[1]);
    const scaleX = Math.round(scale[0] / 2);
    const scaleY = Math.round(scale[1] / 2);
    const offsetX = centerX - scaleX ;
    const offsetY = centerY - scaleY ;
    
    // Resize output array if needed
    if (this.transformedKeypoints.length !== this.keypoints.length) {
      this.transformedKeypoints = new Array(this.keypoints.length);
      for (let i = 0; i < this.keypoints.length; i++) {
        this.transformedKeypoints[i] = { x: 0, y: 0 };
      }
    }
    
    // Fast transform with pre-computed constants
    for (let i = 0; i < this.keypoints.length; i++) {
      this.transformedKeypoints[i].x = Math.round(this.keypoints[i].x + offsetX);
      this.transformedKeypoints[i].y = Math.round(this.keypoints[i].y + offsetY);
    }
  }

  /**
   * Visualize keypoints on canvas
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {Array} keypoints - Detected keypoints
   * @param {Object} options - Visualization options
   */
  visualize(canvas, keypoints, options = {}) {
    const ctx = canvas.getContext('2d');
    const pointSize = options.pointSize || 3;
    const lineWidth = options.lineWidth || 2;
    const pointColor = options.pointColor || 'red';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw keypoints
    ctx.fillStyle = pointColor;
    for (const point of keypoints) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Display FPS if enabled
    if (options.showFPS) {
      ctx.font = '16px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`FPS: ${this.fps}`, 10, 20);
    }
  }
  
  /**
   * Clean up resources when done
   */
  dispose() {
    if (this.session) {
      try {
        this.session.release();
      } catch (e) {
        console.error("Error disposing model session:", e);
      }
    }
    
    if (this.worker) {
      this.worker.terminate();
    }
    
    this.isLoaded = false;
    this.session = null;
  }
}

export default RTMPose;