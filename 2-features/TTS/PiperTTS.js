import * as ort from 'onnxruntime-web';
import createPiperPhonemize from './piper_phonemize.js';

class PiperTTS {
    constructor() {
        this.blobs = {};
        this.voices = null;
        this.abortController = null;
        this.session = null;
    }

    setVoices(voices) {
        this.voices = voices;
    }

    async initializeVoices() {
        const voicesUrl = chrome.runtime.getURL("TTS/voices.json");

        console.log("Initializing Voices");
        console.log(`fetching ${voicesUrl}`);
        try {
            this.voices = await (await fetch(voicesUrl)).json();
            console.log("Complete");
            console.log(this.voices);
            return this.voices;
        } catch (error) {
            console.error("  fetching voices.json:", error);
            throw error;
        }
    }

    async getBlob(url) {
        const cached = this.blobs[url];
        if (cached) return cached;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Network error while fetching ${url}`);
            }
            const blob = await response.blob();
            this.blobs[url] = blob;
            return blob;
        } catch (error) {
            console.error(`Network error while fetching ${url}:`, error);
            throw error;
        }
    }

    async init(data, signal) {
        const { input, speakerId, modelUrl, modelConfigUrl } = data;
        const onnxruntimeBase = chrome.runtime.getURL("./");

        // import(data.piperPhonemizeJsUrl);
        // const ort = import(`${onnxruntimeBase}ort.min.js`);

        ort.env.wasm.numThreads = navigator.hardwareConcurrency;
        ort.env.wasm.wasmPaths = onnxruntimeBase;

        const modelConfigBlob = await this.getBlob(modelConfigUrl);
        let modelConfig;
        try {
            modelConfig = JSON.parse(await modelConfigBlob.text());
        } catch (error) {
            console.error("Error parsing modelConfig JSON:", error);
            console.error("Response text:", await modelConfigBlob.text());
            return;
        }

        if (signal.aborted) {
            throw new Error("Prediction aborted");
        }

        const phonemeIds = await new Promise(async resolve => {
            const module = await createPiperPhonemize({
                print: data => {
                    resolve(JSON.parse(data).phoneme_ids);
                },
                printErr: message => {
                    return { kind: "stderr", message };
                },
                locateFile: (url, _scriptDirectory) => {
                    if (url.endsWith(".wasm")) return data.piperPhonemizeWasmUrl;
                    if (url.endsWith(".data")) return data.piperPhonemizeDataUrl;
                    return url;
                }
            });

            module.callMain(["-l", modelConfig.espeak.voice, "--input", JSON.stringify([{ text: input }]), "--espeak_data", "/espeak-ng-data"]);
        });

        if (signal.aborted) {
            throw new Error("Prediction aborted");
        }

        const sampleRate = modelConfig.audio.sample_rate;
        const numChannels = 1;
        const noiseScale = modelConfig.inference.noise_scale;
        const lengthScale = modelConfig.inference.length_scale;
        const noiseW = modelConfig.inference.noise_w;

        if(!this.session){
            this.session = await ort.InferenceSession.create(modelUrl);
        }

        if (signal.aborted) {
            throw new Error("Prediction aborted");
        }

        const session = this.session;
        console.log("Model loaded");
        const feeds = {
            input: new ort.Tensor("int64", phonemeIds, [1, phonemeIds.length]),
            input_lengths: new ort.Tensor("int64", [phonemeIds.length]),
            scales: new ort.Tensor("float32", [noiseScale, lengthScale, noiseW])
        }
        if (Object.keys(modelConfig.speaker_id_map).length)
            feeds.sid = new ort.Tensor("int64", [speakerId]);
        const { output: { data: pcm } } = await session.run(feeds);

        if (signal.aborted) {
            throw new Error("Prediction aborted");
        }

        // Float32Array (PCM) to ArrayBuffer (WAV)
        function PCM2WAV(buffer) {
            const bufferLength = buffer.length;
            const headerLength = 44;
            const view = new DataView(new ArrayBuffer(bufferLength * numChannels * 2 + headerLength));

            view.setUint32(0, 0x46464952, true); // "RIFF"
            view.setUint32(4, view.buffer.byteLength - 8, true); // RIFF size
            view.setUint32(8, 0x45564157, true); // "WAVE"

            view.setUint32(12, 0x20746d66, true); // Subchunk1ID ("fmt ")
            view.setUint32(16, 0x10, true); // Subchunk1Size
            view.setUint16(20, 0x0001, true); // AudioFormat
            view.setUint16(22, numChannels, true); // NumChannels
            view.setUint32(24, sampleRate, true); // SampleRate
            view.setUint32(28, numChannels * 2 * sampleRate, true); // ByteRate
            view.setUint16(32, numChannels * 2, true); // BlockAlign
            view.setUint16(34, 16, true); // BitsPerSample

            view.setUint32(36, 0x61746164, true); // Subchunk2ID ("data")
            view.setUint32(40, 2 * bufferLength, true); // Subchunk2Size

            let p = headerLength;
            for (let i = 0; i < bufferLength; i++) {
                const v = buffer[i];
                if (v >= 1)
                    view.setInt16(p, 0x7fff, true);
                else if (v <= -1)
                    view.setInt16(p, -0x8000, true);
                else
                    view.setInt16(p, (v * 0x8000) | 0, true);
                p += 2;
            }
            return view.buffer;
        }

        const file = new Blob([PCM2WAV(pcm)], { type: "audio/x-wav" });
        return file;
    }

    async runPredict(inputText, signal) {
        this.abortController = new AbortController();
        const HF_BASE = `/TTS/voices_models/`;
        const voicesElement = "en_US-lessac-medium";
        const piperPhonemizeJsUrl = chrome.runtime.getURL("TTS/piper_phonemize.js");
        const piperPhonemizeWasmUrl = chrome.runtime.getURL("TTS/piper_phonemize.wasm");
        const piperPhonemizeDataUrl = chrome.runtime.getURL("TTS/piper_phonemize.data");

        const voiceFiles = Object.keys(this.voices[voicesElement].files);
        const modelUrl = `${chrome.runtime.getURL(HF_BASE)}${voiceFiles.find(path => path.endsWith(".onnx"))}`;
        const modelConfigUrl = `${chrome.runtime.getURL(HF_BASE)}${voiceFiles.find(path => path.endsWith(".onnx.json"))}`;
        const input = inputText;
        const speakerId = 0;

        console.log("init", JSON.stringify({ input, speakerId }));

        const data = {
            input,
            speakerId,
            blobs: this.blobs,
            piperPhonemizeJsUrl,
            piperPhonemizeWasmUrl,
            piperPhonemizeDataUrl,
            modelUrl,
            modelConfigUrl
        };

        if (signal.aborted) {
            throw new Error("Prediction aborted");
        }

        return this.init(data, signal);
    }
    async abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }
}
export default PiperTTS;