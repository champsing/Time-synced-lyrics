export const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index) => {
    const currentLineId = document.getElementById(`line-button-${index}`);

    if (window.screen.width >= 960) {
        currentLineId?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    } else {
        currentLineId?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        window?.scrollBy({
            behavior: "smooth",
            top: 50,
        });
    }
};

export async function copyToClipboard(text, textType) {
    try {
        await navigator.clipboard.writeText(text);
        alert(`已複製${textType}。`);
    } catch (err) {
        console.error("Failed to copy: ", err);
    }
}
