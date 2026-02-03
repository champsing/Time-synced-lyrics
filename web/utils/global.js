export const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index) => {
    const currentLineId = document.getElementById(`line-button-${index}`);

    if (window.screen.width < 768) {
        currentLineId?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        window.scrollBy({
            top: 100,
            behavior: "smooth",
        }); // 微調位置，避免被底部遮擋
    } else
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

export function disableScroll() {
    document.body.style.overflow = "hidden";
}

export function enableScroll() {
    document.body.style.overflow = "";
}
