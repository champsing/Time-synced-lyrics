export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
};

// ── Smooth scroll animation ────────────────────────────────────────────────
// Replaces scrollIntoView with a custom easeOutCubic animation so the lyric
// scroll feels organic rather than robotic. The animation restarts smoothly
// when the target changes mid-flight (e.g. fast-tempo songs).

let scrollAnimation: {
    container: HTMLElement;
    rafId: number;
    startScrollTop: number;
    targetScrollTop: number;
    startTime: number;
    duration: number;
} | null = null;

function animateScrollTo(container: HTMLElement, targetScrollTop: number) {
    // Cancel any in-progress animation so we can redirect smoothly
    if (scrollAnimation) {
        cancelAnimationFrame(scrollAnimation.rafId);
    }

    const startScrollTop = container.scrollTop;
    const distance = Math.abs(targetScrollTop - startScrollTop);
    // Dynamic duration proportional to distance (200–600 ms)
    const duration = Math.min(Math.max(distance * 1.2, 200), 600);

    scrollAnimation = {
        container,
        rafId: 0,
        startScrollTop,
        targetScrollTop,
        startTime: performance.now(),
        duration,
    };

    function step(currentTime: number) {
        if (!scrollAnimation) return;

        const elapsed = currentTime - scrollAnimation.startTime;
        const progress = Math.min(elapsed / scrollAnimation.duration, 1);

        // easeOutCubic — starts fast, gently decelerates
        const eased = 1 - Math.pow(1 - progress, 3);

        scrollAnimation.container.scrollTop =
            scrollAnimation.startScrollTop +
            (scrollAnimation.targetScrollTop -
                scrollAnimation.startScrollTop) *
                eased;

        if (progress < 1) {
            scrollAnimation.rafId = requestAnimationFrame(step);
        } else {
            scrollAnimation = null;
        }
    }

    scrollAnimation.rafId = requestAnimationFrame(step);
}

export const scrollToLineIndex = (index: number) => {
    // There are two LyricLine instances in the DOM (desktop + mobile),
    // both with the same IDs. getElementById returns only the first one,
    // which might be hidden. Use querySelectorAll and find the visible one.
    const elements = document.querySelectorAll(`[id="line-button-${index}"]`);

    for (const el of elements) {
        const scrollParent = el.closest(
            ".overflow-y-auto",
        ) as HTMLElement | null;
        if (scrollParent && scrollParent.offsetParent !== null) {
            // Calculate target scroll position to centre the line
            const elRect = el.getBoundingClientRect();
            const parentRect = scrollParent.getBoundingClientRect();
            const targetScrollTop =
                scrollParent.scrollTop +
                elRect.top -
                parentRect.top -
                parentRect.height / 2 +
                elRect.height / 2;

            animateScrollTo(scrollParent, targetScrollTop);
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
