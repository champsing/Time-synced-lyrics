<script setup lang="ts">
import { LANG_CODES, useSongSelect } from "@/composables/hooks/useSongSelect";
import type { SongListItem } from "@/types/song_select";

const { getVersionLabel } = useSongSelect();

defineProps<{
    isOpen: boolean;
    song: SongListItem | null;
    selectedVersions: Record<number, string>;
}>();

const emit = defineEmits<{
    (e: "close"): void;
    (e: "select-version", songId: number, version: string): void;
    (e: "play", song: SongListItem): void;
    (e: "prev"): void;
    (e: "next"): void;
}>();

function parseSubtitle(subtitle: string | null | undefined): string {
    return subtitle?.replace(/\\n/g, " · ") ?? "";
}
</script>

<template>
    <Teleport to="body">
        <Transition name="fade">
            <div
                v-if="isOpen && song"
                class="fixed inset-0 z-100 flex items-center justify-center p-4"
            >
                <div
                    class="absolute inset-0 bg-black/85 backdrop-blur-md"
                    @click="emit('close')"
                />

                <button
                    @click.stop="emit('prev')"
                    class="hidden md:flex absolute left-8 z-110 w-14 h-14 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
                >
                    <span class="material-icons text-4xl">chevron_left</span>
                </button>

                <div
                    class="relative bg-white/5 backdrop-blur-2xl border border-white/10 w-full max-w-3xl rounded-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row animate-[modalPop_0.3s_ease-out]"
                >
                    <div class="w-full md:w-5/12 relative group">
                        <div
                            class="md:hidden absolute top-0 left-0 w-full z-20 flex justify-between p-4 bg-linear-to-b from-black/60 to-transparent"
                        >
                            <button
                                @click="emit('prev')"
                                class="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
                            >
                                <span class="material-icons">chevron_left</span>
                                <span class="text-sm font-medium">上一首</span>
                            </button>
                            <button
                                @click="emit('next')"
                                class="flex items-center gap-1 text-white/90 hover:text-white transition-colors"
                            >
                                <span class="text-sm font-medium">下一首</span>
                                <span class="material-icons"
                                    >chevron_right</span
                                >
                            </button>
                        </div>

                        <div class="aspect-video md:hidden w-full">
                            <img
                                :src="song.art"
                                :alt="song.title"
                                class="w-full h-full object-cover"
                            />
                            <div
                                class="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]"
                            />
                        </div>

                        <img
                            :src="song.art"
                            :alt="song.title"
                            class="hidden md:block w-full h-full object-cover"
                        />
                        <div
                            class="hidden md:block absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)]"
                        />
                    </div>

                    <div
                        class="w-full md:w-7/12 p-8 flex flex-col bg-linear-to-b from-white/5 to-transparent"
                    >
                        <div class="flex justify-between items-start mb-6">
                            <div>
                                <h2
                                    class="text-3xl font-bold tracking-tight text-white mb-1"
                                >
                                    {{ song.title }}
                                </h2>
                                <p class="text-teal-400 text-lg font-medium">
                                    {{ song.displayArtist }}
                                </p>
                            </div>
                            <button
                                @click="emit('close')"
                                class="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
                            >
                                <span class="material-icons">close</span>
                            </button>
                        </div>

                        <div
                            class="space-y-6 grow overflow-y-auto custom-scrollbar pr-4 mb-6 max-h-60 md:max-h-87.5"
                        >
                            <p
                                v-if="song.subtitle"
                                class="text-sm text-gray-300 leading-relaxed border-l-2 border-teal-500/50 pl-4"
                            >
                                {{ parseSubtitle(song.subtitle) }}
                            </p>

                            <div
                                class="grid grid-cols-1 gap-3 text-sm text-gray-400"
                            >
                                <div class="flex items-center gap-2">
                                    <span class="material-icons text-xs"
                                        >album</span
                                    >
                                    <span
                                        >專輯：{{
                                            song.album?.name ?? "單曲"
                                        }}</span
                                    >
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="material-icons text-xs"
                                        >edit</span
                                    >
                                    <span
                                        >作詞：{{
                                            song.displayLyricist ?? "未提供"
                                        }}</span
                                    >
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="material-icons text-xs"
                                        >language</span
                                    >
                                    <span
                                        >語言：{{
                                            LANG_CODES[song.lang] ?? song.lang
                                        }}</span
                                    >
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="material-icons text-xs"
                                        >translate</span
                                    >
                                    <span
                                        >譯者：{{
                                            song.translation?.author ?? "未提供"
                                        }}</span
                                    >
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="material-icons text-xs"
                                        >update</span
                                    >
                                    <span
                                        >更新：{{
                                            song.updated_at?.split(" ")[0]
                                        }}</span
                                    >
                                </div>
                            </div>

                            <div class="pt-4 border-t border-white/10">
                                <h4
                                    class="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] p-2"
                                >
                                    版本選擇
                                </h4>
                                <div class="flex flex-wrap gap-2 px-2 py-2">
                                    <button
                                        v-for="ver in song.versions"
                                        :key="ver.version"
                                        class="px-5 py-1.5 text-xs rounded-full border transition-all duration-300"
                                        :class="{
                                            'bg-cyan-600/80 text-white border-cyan-400 ring-2 ring-white/50':
                                                selectedVersions[
                                                    song.song_id
                                                ] === ver.version &&
                                                ver.version === 'original',
                                            'bg-purple-600/80 text-white border-purple-400 ring-2 ring-white/50':
                                                selectedVersions[
                                                    song.song_id
                                                ] === ver.version &&
                                                ver.version === 'instrumental',
                                            'bg-zinc-900/80 text-white border-zinc-500 ring-2 ring-white/50':
                                                selectedVersions[
                                                    song.song_id
                                                ] === ver.version &&
                                                ver.version ===
                                                    'the_first_take',
                                            'bg-red-400/80 text-white border-red-300 ring-2 ring-white/50':
                                                selectedVersions[
                                                    song.song_id
                                                ] === ver.version &&
                                                ver.version === 'live',
                                            'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10':
                                                selectedVersions[
                                                    song.song_id
                                                ] !== ver.version,
                                        }"
                                        @click="
                                            emit(
                                                'select-version',
                                                song.song_id,
                                                ver.version,
                                            )
                                        "
                                    >
                                        {{ getVersionLabel(ver.version) }}
                                        <span
                                            v-if="ver.default"
                                            class="ml-1 text-[10px]"
                                            >✦</span
                                        >
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            @click="emit('play', song)"
                            class="w-full py-4 bg-rose-500 hover:bg-rose-300 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg duration-300 hover:scale-105"
                        >
                            <span class="material-icons">play_circle</span>
                            立即開唱
                        </button>
                    </div>
                </div>

                <button
                    @click.stop="emit('next')"
                    class="hidden md:flex absolute right-8 z-110 w-14 h-14 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
                >
                    <span class="material-icons text-4xl">chevron_right</span>
                </button>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
@keyframes modalPop {
    0% {
        transform: scale(0.95);
        opacity: 0;
    }
    100% {
        transform: scale(1);
        opacity: 1;
    }
}
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}
</style>
