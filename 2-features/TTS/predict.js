// const HF_BASE = `https://huggingface.co/wide-video/piper-voices-v1.0.1/resolve/main/`;
// const HF_BASE = `https://huggingface.co/rhasspy/piper-voices/resolve/v1.0.0/`
const HF_BASE = `voices_models/`

// const voicesElement = document.querySelector("#voices");
const voicesElement = "en_US-lessac-medium";
// const speakersElement = document.querySelector("#speakers");
const workerUrl = new URL("../TTSmodel/worker.js", document.location).href;

const piperPhonemizeJsUrl = new URL("../TTSmodel/piper_phonemize.js", document.location).href;
const piperPhonemizeWasmUrl = new URL("../TTSmodel/piper_phonemize.wasm", document.location).href;
const piperPhonemizeDataUrl = new URL("../TTSmodel/piper_phonemize.data", document.location).href;

const blobs = {};
let voices, worker;

function runPredict(inputText) {
	worker?.terminate();

	// const voiceFiles = Object.keys(voices[voicesElement.value].files);
    // console.log(Object.keys(voices["en_US-lessac-medium"].files));
    const voiceFiles = Object.keys(voices["en_US-lessac-medium"].files);
	// console.log(voiceFiles.find(path => path.endsWith(".onnx.json")));
	const modelUrl = `${HF_BASE}${voiceFiles.find(path => path.endsWith(".onnx"))}`;
	const modelConfigUrl = `${HF_BASE}${voiceFiles.find(path => path.endsWith(".onnx.json"))}`;
    const input = inputText;
	// const speakerId = parseInt(speakersElement.value);
    const speakerId = 0;

    console.log("init",JSON.stringify({input, speakerId}));

	worker = new Worker(workerUrl);
	worker.postMessage({kind:"init", input, speakerId, blobs,
		piperPhonemizeJsUrl, piperPhonemizeWasmUrl, piperPhonemizeDataUrl, modelUrl, modelConfigUrl});
	worker.addEventListener("message", async event => {
		const data = event.data;
		switch(data.kind) {
			case "output": {
				var audioPlayer = document.createElement("audio");
				audioPlayer.src = URL.createObjectURL(data.file);
				audioPlayer.play();

                console.log("Audio played");

				break;
			}
			case "stderr": {
                console.log("stderr",data.message);
				break;
			}
			case "complete": {
                console.log("complete");
				break;
			}
			case "fetch": {
				// const id = `fetch-${data.id}`;
				// if(data.blob)
				// 	blobs[data.url] = data.blob;
				// const div = document.querySelector(`#${id}`) ?? create("div", "fetch");
				// const progress = data.blob ? 1 : (data.total ? data.loaded / data.total : 0);
				// div.id = id;
				// div.textContent = `fetching ${data.url} ${Math.round(progress * 100)}%`;
				// div.style.setProperty("--progress", `${progress}`);
				// logElement.append(div);
                const id = `fetch-${data.id}`;
                if (data.blob) {
                    blobs[data.url] = data.blob;
                }
                const progress = data.blob ? 1 : (data.total ? data.loaded / data.total : 0);
                console.log(`fetching ${data.url} ${Math.round(progress * 100)}%`);
				break;
			}
		}
	})
}

(async () => {
	const voicesUrl = `../TTSmodel/voices.json`;

    console.log("Initializing Voices");
    console.log(`fetching ${voicesUrl}`);
    try {
        voices = await (await fetch(voicesUrl)).json();
        console.log("Complete");
        console.log(voices);
    } catch (error) {
        console.error("Error fetching voices.json:", error);
    }

	// const options = [];

	// for(const [value, voice] of Object.entries(voices)) {
	// 	let size = 0;
	// 	for(const file of Object.values(voice.files))
	// 		size += file.size_bytes;
	// 	const sizeFormatted = `${(size / 1024).toFixed(0)}MB`;

	// 	const text = `${voice.language.name_native} (${voice.language.name_english}, ${voice.language.country_english})`
	// 		+ ` Voice:${voice.name}`
	// 		+ ` Quality:${voice.quality}`
	// 		+ (voice.num_speakers > 1 ? ` Speakers:${voice.num_speakers}` : "")
	// 		+ ` Size:${sizeFormatted}`;
	// 	options.push({value, text});
	// }

	// options.sort((a, b) => a.text.localeCompare(b.text));

	// for(const {text, value} of options) {
	// 	const option = document.createElement("option");
	// 	option.text = text;
	// 	option.value = value;
	// 	voicesElement.add(option);
	// }

	function updateSpeakers() {
		const voice = voices[voicesElement.value];

		speakersElement.length = 0;
		const option = document.createElement("option");
		option.text = "Default Speaker";
		option.value = "0";
		speakersElement.add(option);

		const speakers = Object.entries(voice.speaker_id_map);
		speakersElement.classList.toggle("hasSpeakers", speakers.length > 0);
		if(speakers.length)
			for(const [speaker, speaker_id] of speakers) {
				const option = document.createElement("option");
				option.text = speaker;
				option.value = `${speaker_id}`;
				speakersElement.add(option);
			}
	}

	// voicesElement.value = "en_US-lessac-medium";
	// voicesElement.onchange = updateSpeakers;
	// updateSpeakers();
})()

export { runPredict };