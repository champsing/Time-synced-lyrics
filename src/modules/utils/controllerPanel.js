export const initControllerPanel = () => {
    const panelSwitch = document.getElementById("controller-panel-switch");
    const panel = document.getElementById("controller-panel");

    const show = () => {
        panel.style.display = "flex";
        panelSwitch.innerText = "隱藏控制介面";
    };

    const hide = () => {
        panel.style.display = "none";
        panelSwitch.innerText = "顯示控制介面";
    };

    panelSwitch.addEventListener("click", () => {
        const currentDisplay = window.getComputedStyle(panel).display;
        currentDisplay === "none" ? show() : hide();
    });

    return { show, hide };
};
