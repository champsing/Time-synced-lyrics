export const initControllerPanel = () => {
    const panelSwitch = document.getElementById("controller-panel-switch");
    const panel = document.getElementById("controller-panel");
    const mainDisplaySection = document.getElementById("main-display-section");

    const show = () => {
        panel.style.display = "flex";
        panelSwitch.innerText = "隱藏控制介面";
        if (window.screen.width >= 768)
            mainDisplaySection.style.marginLeft = "2rem";
    };

    const hide = () => {
        panel.style.display = "none";
        panelSwitch.innerText = "顯示控制介面";
        if (window.screen.width >= 768)
            mainDisplaySection.style.marginLeft = "15rem";
    };

    panelSwitch.addEventListener("click", () => {
        const currentDisplay = window.getComputedStyle(panel).display;
        currentDisplay === "none" ? show() : hide();
    });

    return { show, hide };
};
