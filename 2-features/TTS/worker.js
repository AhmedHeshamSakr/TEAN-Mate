self.onmessage = function(event) {
	const data = event.data;
	if(data.kind === "init")
		init(data);
};

const getBlob = async (url, blobs) => new Promise(resolve => {
	const cached = blobs[url];
	if(cached)
		return resolve(cached);
	const id = new Date().getTime();
	let xContentLength;
	self.postMessage({kind:"fetch", id, url});

	const xhr = new XMLHttpRequest();
	xhr.responseType = "blob";
	xhr.onprogress = event => 
		self.postMessage({kind:"fetch", id, url, total:xContentLength ?? event.total, loaded:event.loaded})
	xhr.onreadystatechange = () => {
		if(xhr.readyState >= xhr.HEADERS_RECEIVED
			&& xContentLength === undefined
			&& xhr.getAllResponseHeaders().includes("x-content-length"))
			xContentLength = Number(xhr.getResponseHeader("x-content-length"));

		if(xhr.readyState === xhr.DONE) {
			self.postMessage({kind:"fetch", id, url, blob:xhr.response})
				resolve(xhr.response);
		}
	}
	xhr.onerror = () => {
        console.error(`Network error while fetching ${url}`);
        reject(new Error(`Network error while fetching ${url}`));
    };
	xhr.open("GET", url);
	xhr.send();
});

async function init(data) {
	console.log("Initializing worker");
	const {input, speakerId, blobs, modelUrl, modelConfigUrl} = data;
	const onnxruntimeBase = "../../../node_modules/onnxruntime-web/dist/";

	const piperPhonemizeJs = URL.createObjectURL(await getBlob(data.piperPhonemizeJsUrl, blobs));
	const piperPhonemizeWasm = URL.createObjectURL(await getBlob(data.piperPhonemizeWasmUrl, blobs));
	const piperPhonemizeData = URL.createObjectURL(await getBlob(data.piperPhonemizeDataUrl, blobs));
	const onnxruntimeJsUrl = `${onnxruntimeBase}ort.min.js`;

	importScripts(data.piperPhonemizeJsUrl, onnxruntimeJsUrl);
	ort.env.wasm.numThreads = navigator.hardwareConcurrency;
	ort.env.wasm.wasmPaths = onnxruntimeBase;


	const modelConfigBlob = await getBlob(modelConfigUrl, blobs);
	console.log("modelConfigBlob", modelConfigBlob);
	let modelConfig;
    try {
        modelConfig = JSON.parse(await modelConfigBlob.text());
    } catch (error) {
        console.error("Error parsing modelConfig JSON:", error);
        console.error("Response text:", await modelConfigBlob.text());
        return;
    }

	const phonemeIds = await new Promise(async resolve => {
		const module = await createPiperPhonemize({
			print:data => {
				resolve(JSON.parse(data).phoneme_ids);
			},
			printErr:message => {
				self.postMessage({kind:"stderr", message});
			},
			locateFile:(url, _scriptDirectory) => {
				if(url.endsWith(".wasm")) return piperPhonemizeWasm;
				if(url.endsWith(".data")) return piperPhonemizeData;
				return url;
			}
		});

		module.callMain(["-l", modelConfig.espeak.voice, "--input", JSON.stringify([{text:input}]), "--espeak_data", "/espeak-ng-data"]);
	});

	const sampleRate = modelConfig.audio.sample_rate;
	const numChannels = 1;
	const noiseScale = modelConfig.inference.noise_scale;
	const lengthScale = modelConfig.inference.length_scale;
	const noiseW = modelConfig.inference.noise_w;

	const modelBlob = await getBlob(modelUrl, blobs);
	console.log("modelBlob", URL.createObjectURL(modelBlob));
	const session = await ort.InferenceSession.create(modelUrl)
	console.log("Model loaded");
	const feeds = {
		input: new ort.Tensor("int64", phonemeIds, [1, phonemeIds.length]),
		input_lengths: new ort.Tensor("int64", [phonemeIds.length]),
		scales: new ort.Tensor("float32", [noiseScale, lengthScale, noiseW])
	}
	if(Object.keys(modelConfig.speaker_id_map).length)
		feeds.sid = new ort.Tensor("int64", [speakerId]);
	const {output:{data:pcm}} = await session.run(feeds);

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
		view.setUint16(32, numChannels * 2 , true); // BlockAlign
		view.setUint16(34, 16, true); // BitsPerSample

		view.setUint32(36, 0x61746164, true); // Subchunk2ID ("data")
		view.setUint32(40, 2 * bufferLength, true); // Subchunk2Size

		let p = headerLength;
		for(let i = 0; i < bufferLength; i++) {
			const v = buffer[i];
			if(v >= 1)
				view.setInt16(p, 0x7fff, true);
			else if(v <= -1)
				view.setInt16(p, -0x8000, true);
			else
				view.setInt16(p, (v * 0x8000) | 0, true);
			p += 2;
		}
		return view.buffer;
	}

	const file = new Blob([PCM2WAV(pcm)], {type:"audio/x-wav"});
	self.postMessage({kind:"output", input, file});
	self.postMessage({kind:"complete"});
}