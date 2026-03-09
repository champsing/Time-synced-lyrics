<template>
    <div id="about-modal-container" :class="{ hidden: !isOpen }">
        <div id="about-modal-mask" class="modal-mask" @click="emit('close')" />
        <div
            id="about-modal-content"
            class="modal-mutual bg-[#545425] left-[10%] top-2/5 w-4/5 md:left-[30%] md:top-[30%] md:w-2/5"
        >
            <div class="flex flex-row">
                <span class="modal-name">關於</span>
                <div class="grow" />
                <span
                    class="close"
                    id="about-modal-close-btn"
                    title="關閉"
                    aria-label="關閉視窗"
                    @click="emit('close')"
                    >&times;</span
                >
            </div>

            <div class="flex flex-col gap-4 items-center">
                <div class="flex flex-col">
                    <div id="champsing-banner" class="text-center">
                        <span id="champsing">網站作者</span>
                        <div class="text-2xl font-bold">香榭 Champsing</div>
                    </div>
                </div>

                <div
                    id="debug-info"
                    class="custom-scrollbar overflow-y-scroll max-h-20 font-poppins"
                >
                    <div class="m-4">
                        <div id="version">播放器版本：{{ playerVersion }}</div>
                    </div>
                </div>

                <div
                    id="copy-debug-info"
                    class="text-center rounded-md bg-[#1d94a1] px-4 py-2 text-sm font-semibold text-white duration-300 ease-in-out hover:scale-125 w-40"
                >
                    <button
                        type="button"
                        id="copy-debug-info-btn"
                        aria-label="複製偵錯資訊"
                        @click="emit('copy-debug-info')"
                    >
                        <span class="text-center">複製偵錯資訊</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    isOpen: boolean;
    playerVersion: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "copy-debug-info"): void;
}>();
</script>
