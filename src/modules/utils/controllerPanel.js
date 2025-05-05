export const initControllerPanel = () => {
    const panelSwitch = document.getElementById("controller-panel-switch");
    const panel = document.getElementById("controller-panel");
    const lyricsContainer = document.getElementById("lyrics-container");

    const show = () => {
        panel.style.display = "flex";
        panelSwitch.innerText = "隱藏控制介面";
        if (window.screen.width >= 768) lyricsContainer.style.left = "2rem";
    };

    const hide = () => {
        panel.style.display = "none";
        panelSwitch.innerText = "顯示控制介面";
        if (window.screen.width >= 768) lyricsContainer.style.left = "15%";
    };

    panelSwitch.addEventListener("click", () => {
        const currentDisplay = window.getComputedStyle(panel).display;
        currentDisplay === "none" ? show() : hide();
    });

    return { show, hide };
};
