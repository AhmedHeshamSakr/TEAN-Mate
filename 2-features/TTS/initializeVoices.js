export async function initializeVoices() {
    const voicesUrl = chrome.runtime.getURL("TTS/voices.json");

    console.log("Initializing Voices");
    console.log(`fetching ${voicesUrl}`);
    try {
        const response = await fetch(voicesUrl);
        const voices = await response.json();
        console.log("Complete");
        console.log(voices);
        return voices;
    } catch (error) {
        console.error("Error fetching voices.json:", error);
        throw error;
    }
}