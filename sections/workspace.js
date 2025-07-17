import { parseElement } from "../utils/parse.js";

function getGradientCSS(theme) {
  if (!theme || theme.type !== "gradient" || !theme.gradientColors?.length)
    return "transparent";

  const angle = Math.round(theme.rotation || 0);
  const opacity = theme.opacity ?? 1;
  const stops = theme.gradientColors
    .map(({ c }) => {
      const [r, g, b] = c;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    })
    .join(", ");

  return `linear-gradient(${angle}deg, ${stops})`;
}

export const workspacesSection = {
  id: "workspaces",
  label: "Workspaces",
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2H13V14H3V2ZM2 2C2 1.44772 2.44772 1 3 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 0.96814 14.5523 0.96814 14V2ZM4 4H12V5H4V4ZM4 7H12V8H4V7ZM12 10H4V11H12V10Z" fill="currentColor"/>
      </svg>`,
  init: function() {
    const container = parseElement(`<div id="haven-workspace-outer-container"><div id = "haven-workspace-inner-container" ></div></div>`);
    const innerContainer = container.querySelector('#haven-workspace-inner-container')
    // const outerContainer = container.querySelector('#haven-workspace-outer-container')

    const addWorkspaceButton =
      parseElement(`<div class="haven-workspace-add-button"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg></div>`);
    addWorkspaceButton.addEventListener("click", () => {
      try {
        if (typeof ZenWorkspaces?.openSaveDialog === "function") {
          console.log("[ZenHaven] Attempting to open workspace save dialog...");
          ZenWorkspaces.openSaveDialog();
        } else {
          throw new Error("ZenWorkspaces.openSaveDialog is not available");
        }
      } catch (error) {
        console.error("[ZenHaven] Error opening workspace dialog:", error);
      }
    });

    if (typeof gZenWorkspaces === "undefined") {
      console.error("[ZenHaven] gZenWorkspaces is not available.");
      innerContainer.appendChild(addWorkspaceButton);
      return container;
    }

    gZenWorkspaces
      ._workspaces()
      .then(({ workspaces: allWorkspaces }) => {
        const allTabs = gZenWorkspaces.allStoredTabs || [];

        allWorkspaces.forEach((workspace) => {
          const { uuid, theme, name, icon } = workspace;
          const workspaceDiv = parseElement(
            `<div class="haven-workspace">
                <div class="haven-workspace-header">
                  <span class="workspace-icon">${icon}</span>
                  <span class="workspace-name">${name}</span>
                </div>
              </div>`,
          );

          if (theme?.type === "gradient" && theme.gradientColors?.length) {
            workspaceDiv.style.background = getGradientCSS(theme);
          } else {
            workspaceDiv.style.background = "var(--zen-colors-border)";
          }

          const header = workspaceDiv.querySelector(".haven-workspace-header");
          const popupOpenButton = parseElement(`
            <toolbarbutton 
              class="toolbarbutton-1
              haven-workspace-options"
              tooltiptext="Workspace options"
              image="chrome://browser/skin/zen-icons/menu-bar.svg"
            />`, 'xul');
          const menuPopup = parseElement(`
            <menupopup class="haven-workspace-actions-popup">
              <menuitem class="rename" label="Rename (n)" tooltiptext="Rename" />
              <menuitem class="switch" label="Go to workspace (n)" tooltiptext="switch to this workspace"/>
              <menuitem class="change-theme" label="Change Theme (n)" tooltiptext="Change theme" />
              <menuitem class="delete-workspace" label="Delete (n)" tooltiptext="Delete workspace" />
            </menupopup>
          `, 'xul');
          header.appendChild(popupOpenButton);
          container.appendChild(menuPopup);

          popupOpenButton.addEventListener("click", (event) => {
            event.stopPropagation();
            menuPopup.openPopup(popupOpenButton, "after_start");
          });

          const contentDiv = parseElement(
            `<div class="haven-workspace-content"></div>`,
          );
          const pinnedTabsContainer = parseElement(
            `<div class="haven-workspace-pinned-tabs"></div>`,
          );
          const regularTabsContainer = parseElement(
            `<div class="haven-workspace-regular-tabs"></div>`,
          );

          allTabs
            .filter(
              (tabEl) =>
                tabEl &&
                tabEl.getAttribute("zen-workspace-id") === uuid &&
                !tabEl.hasAttribute("zen-essential"),
            )
            .forEach((tabEl) => {
              const clonedTab = tabEl.cloneNode(true);
              if (clonedTab.hasAttribute("pinned")) {
                pinnedTabsContainer.appendChild(clonedTab);
              } else {
                regularTabsContainer.appendChild(clonedTab);
              }
            });

          if (pinnedTabsContainer.hasChildNodes()) {
            contentDiv.appendChild(pinnedTabsContainer);
          }
          if (regularTabsContainer.hasChildNodes()) {
            contentDiv.appendChild(regularTabsContainer);
          }

          workspaceDiv.appendChild(contentDiv);
          innerContainer.appendChild(workspaceDiv);
        });
      })
      .catch((error) => {
        console.error("[ZenHaven] Error building workspaces section:", error);
      });

    innerContainer.appendChild(addWorkspaceButton);
    return container;
  },
};

