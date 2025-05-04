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
