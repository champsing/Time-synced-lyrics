export const initSettingModal = () => {
    const modal = document.getElementById("setting-modal-container");

    const show = () => (modal.style.display = "block");
    const hide = () => (modal.style.display = "none");

    document.getElementById("setting-btn").addEventListener("click", show);
    document.querySelector(".close").addEventListener("click", hide);
    window.addEventListener("click", (e) => e.target === modal && hide());

    return { show, hide };
};
