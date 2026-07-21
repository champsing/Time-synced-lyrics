export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

export const scrollToLineIndex = (index: number) => {
    // There are two LyricLine instances in the DOM (desktop + mobile),
    // both with the same IDs. getElementById returns only the first one,
    // which might be hidden. Use querySelectorAll and find the visible one.
    const elements = document.querySelectorAll(
        `[id="line-button-${index}"]`,
    );

    for (const el of elements) {
        const scrollParent = el.closest(".overflow-y-auto") as HTMLElement | null;
        if (
            scrollParent &&
            scrollParent.offsetParent !== null
        ) {
            // This scroll container is visible (not display:none)
            el.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            return;
        }
    }

    // Fallback: try the old method (works when only one instance exists)
    const fallback = document.getElementById(`line-button-${index}`);
    fallback?.scrollIntoView({
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
