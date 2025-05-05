import { injectPlaybackID } from "../about/injectPlaybackID.js";
import { DEBUG_INFO, VERSION } from "./config.js";
import { copyToClipboard } from "./global.js";

export const initSettingModal = () => {
    const close = document.getElementById("setting-modal-close-btn");
    const modal = document.getElementById("setting-modal-container");
    const mask = document.getElementById("setting-modal-mask");

    const show = () => (modal.style.display = "block");
    const hide = () => (modal.style.display = "none");

    document.getElementById("setting-btn").addEventListener("click", show);
    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    return { show, hide };
};

export const initCreditModal = () => {
    const close = document.getElementById("credit-modal-close-btn");
    const modal = document.getElementById("credit-modal-container");
    const mask = document.getElementById("credit-modal-mask");

    const show = () => (modal.style.display = "block");
    const hide = () => (modal.style.display = "none");

    document.getElementById("credit-btn").addEventListener("click", show);
    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    return { show, hide };
};

export const initSongModal = () => {
    const close = document.getElementById("song-modal-close-btn");
    const modal = document.getElementById("song-modal-container");
    const mask = document.getElementById("song-modal-mask");

    const show = () => (modal.style.display = "block");
    const hide = () => (modal.style.display = "none");

    document.getElementById("song-btn").addEventListener("click", show);
    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    return { show, hide };
};

export const initAboutModal = () => {
    const close = document.getElementById("about-modal-close-btn");
    const modal = document.getElementById("about-modal-container");
    const mask = document.getElementById("about-modal-mask");

    const show = () => (modal.style.display = "block");
    const hide = () => (modal.style.display = "none");

    document.getElementById("about-btn").addEventListener("click", show);

    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    document.getElementById("version").innerText = `播放器版本：${VERSION}`;
    injectPlaybackID();
    document.getElementById("copy-debug-info-btn").onclick = () => (copyToClipboard(DEBUG_INFO.trim(), '偵錯資訊'))

    return { show, hide };
};

// export const initShareModal = () => {
//     const close = document.getElementById("share-modal-close-btn");
//     const modal = document.getElementById("share-modal-container");

//     const show = () => (modal.style.display = "block");
//     const hide = () => (modal.style.display = "none");

//     document.getElementById("share-btn").addEventListener("click", show);
//     close.addEventListener("click", hide);
//     window.addEventListener("click", (e) => e.target === modal && hide());

//     return { show, hide };
// };
