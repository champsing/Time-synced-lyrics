import { MAPPINGS_BASE_PATH, SONGLIST_PATH } from '../config.js';

export const loadSongList = async () => {
  try {
    const response = await fetch(SONGLIST_PATH);
    if (!response.ok) throw new Error("載入失敗");
    return await response.json();
  } catch (err) {
    throw new Error("歌曲列表載入失敗：" + err.message);
  }
};

export const getLyricFilePath = (songName, songVersion) => {
  return `${MAPPINGS_BASE_PATH}${songName}/${songVersion}.json`;
};