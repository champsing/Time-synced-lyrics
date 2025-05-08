import * as axios from "axios";
import { API_BASE_URL } from "../../utils/config";

let playback = localStorage.getItem("playbackId");
let playbackId = playback.id;

// 向後端更新設定項目的值
export const onUpdateSettings = async (settingName, setting) => {
    try {
        await axios.post(`${API_BASE_URL}/playbacks/${playbackId}/settings/update`, {
            id: playback.id,
            secret: playback.secret,
            setting: settingName, // must be string
            newVal: setting.value, // must be a ref
        });
    } catch (err) {
        console.log("無法同步設定請求：", err);
    }
};

export async function loadSettings() {
    try {
        const { settingData } = await axios.post(
            `${API_BASE_URL}/playbacks/${playbackId}/settings`,
            {
                id: playback.id,
                secret: playback.secret,
            }
        );
        return settingData;
    } catch (err) {
        console.log("無法獲取設定項目值：", err);
    }
}
