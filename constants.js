// Centralized action and command definitions
export const ACTIONS = {
    EXTRACT_TEXT: "extractText",
    SKIP_NEXT: "skipToNext",
    SKIP_PREVIOUS: "skipToPrevious",
    TOGGLE_READING: "toggleReading",
    ACCESS_LINK: "accessLink",
    TOGGLE_STT: "toggleSTT"
  };
  
  // Only the essential command that needs manifest registration
  export const MANIFEST_COMMAND = "access-link";