import { computed, createApp, onMounted, ref, watch } from "vue";

import {
    generatePhraseStyle,
    isActivePhrase,
} from "./player/handles/phrasesHandle.js";
import {
    getDefaultVersion,
    getLyricResponse,
    loadSongData,
} from "./player/handles/songsHandle.js";
import { useTransation } from "./player/handles/translationHandle.js";
import { initYouTubePlayer } from "./player/yt/onReadyPlayer.js";
import {
    ALBUM_GOOGLE_LINK_BASE,
    DEBUG_INFO,
    INSTRUMENTAL,
    LIVE,
    MERCURY_TSL,
    ORIGINAL,
    THE_FIRST_TAKE,
    TSL_PLAYER_LINK_BASE,
} from "./utils/config.js";
import { initControllerPanel } from "./player/controllerPanel.js";
import {
    copyToClipboard,
    formatTime,
    scrollToLineIndex,
} from "./utils/global.js";
import {
    initAboutModal,
    initCreditModal,
    initSettingModal,
    initShareModal,
} from "./utils/modal.js";
import { parseLyrics } from "./player/handles/lyricsHandle.js";
import { getArtistDisplay } from "./player/handles/artistsHandle.js";





    return {
        ALBUM_GOOGLE_LINK_BASE,
        THE_FIRST_TAKE,
        INSTRUMENTAL,
        ORIGINAL,
        LIVE,
        jsonMappingContent,
        currentTime,
        currentLineIndex,
        songDuration,
        songVersion,
        enablePronounciation,
        enableLyricBackground,
        enableTranslation,
        currentSong,
        currentSongURI,
        scrollToCurrentLine,
        formattedCurrentTime,
        formattedSongDuration,
        translationText,
        backgroundTranslationText,
        translationAuthor,
        bodyBackgroundColor,
        colorOptions,
        bgColorName,
        isPaused,
        isMuted,
        isLoading,
        isError,
        errorMessage,
        debugInfo: DEBUG_INFO,
        fetchColors,
        parseSubtitle,
        playVideo,
        pauseVideo,
        rewind10Sec,
        moveForward10Sec,
        toggleMute,
        changeVolume,
        initYouTubePlayer,
        copyToClipboard,
        jumpToCurrentLine,
        getArtistDisplay,
        getPhraseStyle,
        getBackgroundPhraseStyle,
        isCurrentLine,
        isActivePhrase,
        isKiai: (line, phraseIndex) => line.text[phraseIndex].kiai,
        isBackgroundKiai: (line, phraseIndex) =>
            line.background_voice.text[phraseIndex].kiai,
    };
}

const app = createApp({
    setup() {
        return main();
    },
});

app.mount("#app");
