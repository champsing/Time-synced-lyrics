import { API_BASE_URL } from "/web/utils/config.js";

export const loadSongList = async () => {
    try {
        console.log("獲取歌曲列表中...");
        const response = await fetch(API_BASE_URL + "/songs/");
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err) {
        throw new Error("歌曲列表載入失敗：" + err.message);
    } finally {
        console.log("歌曲列表獲取成功。");
    }
};

export const loadSongData = async (songId) => {
    try {
        console.log("獲取歌曲中..." + `(${songId})`);
        const response = await fetch(API_BASE_URL + `/songs/${songId}`);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err) {
        throw new Error("歌曲載入失敗：" + err.message);
    } finally {
        console.log("歌曲獲取成功。");
    }
};

export const getLyricResponsefromFile = async (folder, songVersion) => {
    try {
        console.log("獲取歌詞檔案中...(File)");
        const response = await fetch(
            `/src/mappings/${folder}/${songVersion}.json`
        );
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err) {
        throw new Error("歌詞載入失敗：" + err.message);
    } finally {
        console.log("歌詞檔案獲取成功。");
    }
};

export const getLyricResponsefromAPI = async (songId, songVersion) => {
    try {
        console.log("獲取歌詞檔案中...(API)");
        const response = await fetch(
            API_BASE_URL + `/mappings/${songId}/${songVersion}`
        );
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err) {
        throw new Error("歌詞載入失敗：" + err.message);
    } finally {
        console.log("歌詞檔案獲取成功。");
    }
};

export const getDefaultVersion = (currentSong) =>
    currentSong.value.versions.find((v) => v.default === true).version;
