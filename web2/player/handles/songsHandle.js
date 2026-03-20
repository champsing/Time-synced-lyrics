import { API_BASE_URL } from "/web/utils/config.js";

export const loadSongList = async () => {
    try {
        console.log("獲取歌曲列表中...");
        const response = await fetch(`${API_BASE_URL}/songs/list`);
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
        const response = await fetch(`${API_BASE_URL}/songs/${songId}`);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err) {
        throw new Error("歌曲載入失敗：" + err.message);
    } finally {
        console.log("歌曲獲取成功。");
    }
};

export const getLyricResponse = async (songId, folder, songVersion) => {
    try {
        const address = `https://lyric.timesl.online/${songId}_${folder}/${songVersion}.json`;
        console.log(`獲取歌詞檔案中...(URL: ${address})`);

        const response = await fetch(address);
        if (!response.ok) throw new Error("載入失敗");
        return await response.json();
    } catch (err) {
        throw new Error("歌詞載入失敗：" + err.message);
    } finally {
        console.log("歌詞檔案獲取成功。");
    }
};
