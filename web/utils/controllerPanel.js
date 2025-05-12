export const initControllerPanel = () => {
    const panelSwitchIcon = document.getElementById(
        "controller-panel-switch-icon"
    );
    const panel = document.getElementById("controller-panel");
    const mainDisplaySection = document.getElementById("main-display-section");

    const show = () => {
        panel.style.display = "flex";
        panelSwitchIcon.innerText = "keyboard_arrow_down";
        if (window.screen.width >= 768)
            mainDisplaySection.style.marginLeft = "2rem";
    };

    const hide = () => {
        panel.style.display = "none";
        panelSwitchIcon.innerText = "keyboard_arrow_up";
        if (window.screen.width >= 768) {
            let margin = window.screen.width / 8;
            mainDisplaySection.style.marginLeft = `${margin}px`;
        }
    };

    panelSwitchIcon.addEventListener("click", () => {
        const currentDisplay = window.getComputedStyle(panel).display;
        currentDisplay === "none" ? show() : hide();
    });

    return { show, hide };
};
