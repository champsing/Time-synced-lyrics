import { injectPlaybackID } from "../player/about/injectPlaybackID.js";
import { DEBUG_INFO, PLAYER_VERSION } from "./config.js";
import { copyToClipboard, disableScroll, enableScroll } from "./global.js";

export const initSettingModal = () => {
    const close = document.getElementById("setting-modal-close-btn");
    const modal = document.getElementById("setting-modal-container");
    const mask = document.getElementById("setting-modal-mask");

    const show = () => {
        modal.style.display = "block";
        disableScroll();
    };
    const hide = () => {
        modal.style.display = "none";
        enableScroll();
    };

    document.getElementById("setting-btn").addEventListener("click", show);
    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    return { show, hide };
};

export const initCreditModal = () => {
    const close = document.getElementById("credit-modal-close-btn");
    const modal = document.getElementById("credit-modal-container");
    const mask = document.getElementById("credit-modal-mask");

    const show = () => {
        modal.style.display = "block";
        disableScroll();
    };
    const hide = () => {
        modal.style.display = "none";
        enableScroll();
    };

    document.getElementById("credit-btn").addEventListener("click", show);
    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    return { show, hide };
};

export const initAboutModal = () => {
    const close = document.getElementById("about-modal-close-btn");
    const modal = document.getElementById("about-modal-container");
    const mask = document.getElementById("about-modal-mask");

    const show = () => {
        modal.style.display = "block";
        disableScroll();
    };
    const hide = () => {
        modal.style.display = "none";
        enableScroll();
    };

    if (window.screen.width >= 768)
        document.getElementById("about-btn-sm").addEventListener("click", show);
    else
        document
            .getElementById("about-btn-below-sm")
            .addEventListener("click", show);

    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    document.getElementById(
        "version"
    ).innerText = `播放器版本：${PLAYER_VERSION}`;
    injectPlaybackID();
    document.getElementById("copy-debug-info-btn").onclick = () =>
        copyToClipboard(DEBUG_INFO.trim(), "偵錯資訊");

    return { show, hide };
};

export const initShareModal = () => {
    const close = document.getElementById("share-modal-close-btn");
    const modal = document.getElementById("share-modal-container");
    const mask = document.getElementById("share-modal-mask");

    const show = () => {
        modal.style.display = "block";
        disableScroll();
    };
    const hide = () => {
        modal.style.display = "none";
        enableScroll();
    };

    document.getElementById("share-btn").addEventListener("click", show);
    close.addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === mask && hide());

    return { show, hide };
};
