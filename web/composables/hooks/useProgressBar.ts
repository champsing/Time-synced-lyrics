import { ref, computed, type Ref } from "vue";

export function useProgressBar(
    currentTime: Ref<number>,
    songDuration: Ref<number>,
    onSeek: (ratio: number) => void,
) {
    const isDragging = ref(false);
    const isHoveringProgress = ref(false);
    const dragPercent = ref(0);
    let activeBarEl: HTMLElement | null = null;

    const durationPercent = computed(() => {
        if (songDuration.value === 0) return 0;
        return (currentTime.value / songDuration.value) * 100;
    });

    const displayPercent = computed(() => {
        if (isDragging.value) return dragPercent.value;
        return durationPercent.value;
    });

    const getSeekRatio = (clientX: number, bar: HTMLElement): number => {
        const rect = bar.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    };

    const updateSeek = (clientX: number) => {
        if (!activeBarEl) return;
        const ratio = getSeekRatio(clientX, activeBarEl);
        dragPercent.value = ratio * 100;
        onSeek(ratio);
    };

    const onBarMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        activeBarEl = event.currentTarget as HTMLElement;
        isDragging.value = true;
        updateSeek(event.clientX);
        document.addEventListener("mousemove", onBarMouseMove);
        document.addEventListener("mouseup", onBarMouseUp);
    };

    const onBarMouseMove = (event: MouseEvent) => {
        if (!isDragging.value) return;
        updateSeek(event.clientX);
    };

    const onBarMouseUp = () => {
        isDragging.value = false;
        activeBarEl = null;
        document.removeEventListener("mousemove", onBarMouseMove);
        document.removeEventListener("mouseup", onBarMouseUp);
    };

    const onBarTouchStart = (event: TouchEvent) => {
        event.preventDefault();
        activeBarEl = event.currentTarget as HTMLElement;
        isDragging.value = true;
        updateSeek(event.touches[0]!.clientX);
        document.addEventListener("touchmove", onBarTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", onBarTouchEnd);
    };

    const onBarTouchMove = (event: TouchEvent) => {
        if (!isDragging.value) return;
        event.preventDefault();
        updateSeek(event.touches[0]!.clientX);
    };

    const onBarTouchEnd = () => {
        isDragging.value = false;
        activeBarEl = null;
        document.removeEventListener("touchmove", onBarTouchMove);
        document.removeEventListener("touchend", onBarTouchEnd);
    };

    return {
        isDragging,
        isHoveringProgress,
        displayPercent,
        onBarMouseDown,
        onBarTouchStart,
    };
}
