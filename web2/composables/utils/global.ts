export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index: number) => {
    const currentLineId = document.getElementById(`line-button-${index}`);

    currentLineId?.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });
};

export async function copyToClipboard(text: string, textType: string) {
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
