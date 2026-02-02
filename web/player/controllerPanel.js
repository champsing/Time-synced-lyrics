export const initControllerPanel = () => {
    let panelSwitch = document.getElementById(
        "controller-panel-switch-below-md",
    );
    let panelSwitchIcon = document.getElementById(
        "controller-panel-switch-icon-below-md",
    );
    let panelSwitchState = document.getElementById(
        "controller-panel-switch-state-below-md",
    );

    if (window.screen.width >= 768) {
        panelSwitch = document.getElementById("controller-panel-switch-md");
        panelSwitchIcon = document.getElementById(
            "controller-panel-switch-icon-md",
        );
    }

    const panel = document.getElementById("controller-panel");
    const mainDisplaySection = document.getElementById("main-display-section");

    const show = () => {
        panel.style.display = "block";
        panelSwitchIcon.innerText = "keyboard_arrow_down";
        panelSwitchState.innerText = "CLOSE";

        if (window.screen.width >= 768) {
            mainDisplaySection.style.marginLeft = "2rem";
            mainDisplaySection.style.width = "68%";
        }
    };

    const hide = () => {
        panel.style.display = "none";
        panelSwitchIcon.innerText = "keyboard_arrow_up";
        panelSwitchState.innerText = "OPEN";

        if (window.screen.width >= 768) {
            let margin = window.screen.width / 10 - 32;
            mainDisplaySection.style.marginLeft = `${margin}px`;
            mainDisplaySection.style.width = "80%";
        }
    };

    panelSwitch?.addEventListener("click", () => {
        const currentDisplay = window.getComputedStyle(panel).display;
        currentDisplay === "none" ? show() : hide();
    });

    return { show, hide };
};
