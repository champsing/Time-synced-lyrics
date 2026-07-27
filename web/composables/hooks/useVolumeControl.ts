import { ref, type Ref } from "vue";

export function useVolumeControl(
    volume: Ref<number>,
    isMuted: Ref<boolean>,
    onVolumeChange?: (vol: number) => void,
) {
    const isDraggingVolume = ref(false);
    const isHoveringVolume = ref(false);
    let activeVolumeBarEl: HTMLElement | null = null;

    const changeVolume = (newVolume: number) => {
        volume.value = newVolume;
        isMuted.value = newVolume === 0;
        sessionStorage.setItem("volume", String(newVolume));
        if (onVolumeChange) onVolumeChange(newVolume);
    };

    const toggleMute = () => {
        isMuted.value = !isMuted.value;
        if (window.ytPlayer) {
            isMuted.value ? window.ytPlayer.mute() : window.ytPlayer.unMute();
        }
    };

    const getVolumeRatio = (clientX: number, bar: HTMLElement): number => {
        const rect = bar.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    };

    const updateVolumeFromEvent = (clientX: number) => {
        if (!activeVolumeBarEl) return;
        const ratio = getVolumeRatio(clientX, activeVolumeBarEl);
        changeVolume(Math.round(ratio * 100));
    };

    const onVolumeMouseDown = (event: MouseEvent) => {
        event.preventDefault();
        activeVolumeBarEl = event.currentTarget as HTMLElement;
        isDraggingVolume.value = true;
        updateVolumeFromEvent(event.clientX);
        document.addEventListener("mousemove", onVolumeMouseMove);
        document.addEventListener("mouseup", onVolumeMouseUp);
    };

    const onVolumeMouseMove = (event: MouseEvent) => {
        if (!isDraggingVolume.value) return;
        updateVolumeFromEvent(event.clientX);
    };

    const onVolumeMouseUp = () => {
        isDraggingVolume.value = false;
        activeVolumeBarEl = null;
        document.removeEventListener("mousemove", onVolumeMouseMove);
        document.removeEventListener("mouseup", onVolumeMouseUp);
    };

    const onVolumeTouchStart = (event: TouchEvent) => {
        event.preventDefault();
        activeVolumeBarEl = event.currentTarget as HTMLElement;
        isDraggingVolume.value = true;
        updateVolumeFromEvent(event.touches[0]!.clientX);
        document.addEventListener("touchmove", onVolumeTouchMove, {
            passive: false,
        });
        document.addEventListener("touchend", onVolumeTouchEnd);
    };

    const onVolumeTouchMove = (event: TouchEvent) => {
        if (!isDraggingVolume.value) return;
        event.preventDefault();
        updateVolumeFromEvent(event.touches[0]!.clientX);
    };

    const onVolumeTouchEnd = () => {
        isDraggingVolume.value = false;
        activeVolumeBarEl = null;
        document.removeEventListener("touchmove", onVolumeTouchMove);
        document.removeEventListener("touchend", onVolumeTouchEnd);
    };

    return {
        isDraggingVolume,
        isHoveringVolume,
        toggleMute,
        changeVolume,
        onVolumeMouseDown,
        onVolumeTouchStart,
    };
}
