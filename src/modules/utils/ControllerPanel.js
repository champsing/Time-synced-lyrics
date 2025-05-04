export const initControllerPanel = () => {
    const panelSwitch = document.getElementById("controller-panel-switch");
    const panel = document.getElementById("controller-panel");

    const show = () => (panel.style.display = "block");
    const hide = () => (panel.style.display = "none");

    panelSwitch.addEventListener("click", () => {
        const currentDisplay = window.getComputedStyle(panel).display;
        currentDisplay === "none" ? show() : hide();
    });

    return { show, hide };
};
