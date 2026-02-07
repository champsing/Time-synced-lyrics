

<template>
    <div
        class="p-4 flex flex-col justify-center items-center gap-2 bg-[#231f1f] rounded-xl w-fit select-none"
    >
        
        <div class="flex flex-row gap-7 items-center">
            <div class="flex flex-row gap-7">
                <button
                    id="player-rewind-10sec"
                    @click="rewind10Sec()"
                    type="button"
                    title="後退10秒"
                    aria-label="後退10秒"
                >
                    <span class="material-icons mt-2"> fast_rewind </span>
                </button>
                <button
                    id="player-play"
                    v-if="isPaused"
                    @click="playVideo()"
                    type="button"
                    title="播放"
                    aria-label="播放"
                >
                    <span class="material-icons mt-2"> play_arrow </span>
                </button>
                <button
                    id="player-pause"
                    v-else
                    @click="pauseVideo()"
                    type="button"
                    title="暫停"
                    aria-label="暫停"
                >
                    <span class="material-icons mt-2"> pause </span>
                </button>
                <button
                    id="player-mf-10sec"
                    @click="moveForward10Sec()"
                    type="button"
                    title="前進10秒"
                    aria-label="前進10秒"
                >
                    <span class="material-icons mt-2"> fast_forward </span>
                </button>
            </div>
            <span
                class="text-xl font-bold text-center text-[#94a4cb] font-[Source_Sans_Pro]"
            >
                {{ formattedCurrentTime }} / {{ formattedSongDuration }}
            </span>
        </div>

        <div class="flex flex-row gap-4">
            <button
                id="player-mute-unmute"
                @click="toggleMute()"
                type="button"
                title="靜音/取消靜音"
                aria-label="靜音/取消靜音"
            >
                <span v-if="volume == 0 || isMuted" class="material-icons mt-2">
                    volume_off
                </span>
                <span v-else class="material-icons mt-2"> volume_up </span>
            </button>
            <div class="flex flex-row gap-2 items-center">
                <div class="relative flex items-center space-x-2">
                    <div class="relative flex items-center w-48">
                        <input
                            id="player-volume-slider"
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            v-model="volume"
                            @input="changeVolume($event.target.value)"
                            aria-label="音量調整滑桿"
                            title="音量調整滑桿"
                            class="volume-slider"
                            :style="{ '--fill': bodyBackgroundColor }"
                        />
                    </div>
                </div>
                <span>{{ volume || 70 }}</span>
            </div>
        </div>
    </div>
</template>
