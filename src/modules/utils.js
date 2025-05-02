import { DEFAULT_DURATION } from "./config.js";

export const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index) => {
    const currentLineId = document.getElementById(index);
    currentLineId?.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
};

export async function copyToClipboard(text, textType) {
    try {
        await navigator.clipboard.writeText(text);
        alert(`已複製${textType}。`);
    } catch (err) {
        console.error("Failed to copy: ", err);
    }
}
