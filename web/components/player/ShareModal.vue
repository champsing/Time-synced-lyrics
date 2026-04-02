<script setup lang="ts">
defineProps<{
    isOpen: boolean;
    currentSongURI: string;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "copy-link", uri: string): void;
}>();
</script>

<template>
    <div id="share-modal-container" :class="{ hidden: !isOpen }">
        <div id="share-modal-mask" class="modal-mask" @click="emit('close')" />
        <div
            id="share-modal-content"
            class="modal-mutual bg-amber-900 left-[10%] top-2/5 w-4/5 md:left-[20%] md:top-[30%] md:w-3/5"
        >
            <div class="flex flex-row">
                <span class="modal-name">分享</span>
                <div class="grow" />
                <span
                    class="close"
                    title="關閉"
                    aria-label="關閉視窗"
                    @click="emit('close')"
                    >&times;</span
                >
            </div>
            <div class="modal-view-area custom-scrollbar">
                <div class="flex flex-row gap-4">
                    <span class="material-icons p-2">link</span>
                    <div class="flex flex-row gap-2">
                        <textarea
                            id="song-link"
                            name="song-link"
                            class="resize-none h-8 w-4/5 lg:w-fit border-2 whitespace-nowrap mt-1"
                            readonly
                            rows="1"
                            cols="80"
                            wrap="off"
                            >{{ currentSongURI }}</textarea
                        >
                        <button
                            id="copy-link"
                            title="複製連結"
                            aria-label="複製連結"
                            class="outline rounded-2xl w-1/5 m-1"
                            @click="emit('copy-link', currentSongURI)"
                        >
                            <div class="sm:hidden">
                                <span class="material-icons">content_copy</span>
                            </div>
                            <span
                                class="hidden sm:flex flex-row gap-2 justify-center"
                            >
                                <span class="material-icons">content_copy</span>
                                複製
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
