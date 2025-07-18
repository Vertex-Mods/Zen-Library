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
    const container = parseElement(
      `<div id="haven-workspace-outer-container"><div id = "haven-workspace-inner-container" ></div></div>`,
    );
    const innerContainer = container.querySelector(
      "#haven-workspace-inner-container",
    );
    // const outerContainer = container.querySelector('#haven-workspace-outer-container')

    function getDragAfterElement(container, x) {
      const draggableElements = [
        ...container.querySelectorAll(".haven-workspace:not(.dragging)"),
      ];

      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = x - box.left - box.width / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY },
      ).element;
    }

    innerContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(innerContainer, e.clientX);
      const dragging = innerContainer.querySelector(".dragging");
      if (dragging) {
        if (afterElement == null) {
          innerContainer.appendChild(dragging);
        } else {
          innerContainer.insertBefore(dragging, afterElement);
        }
      }
    });

    innerContainer.addEventListener("drop", async (e) => {
      e.preventDefault();
      const draggedElement = innerContainer.querySelector(".dragging");
      if (!draggedElement) return;

      const draggedUuid = draggedElement.dataset.uuid;
      const workspaceElements = [
        ...innerContainer.querySelectorAll(".haven-workspace"),
      ];
      const newIndex = workspaceElements.findIndex(
        (el) => el === draggedElement,
      );

      if (newIndex !== -1) {
        await gZenWorkspaces.reorderWorkspace(draggedUuid, newIndex);
      }
    });

    const addWorkspaceButton =
      parseElement(`<div class="haven-workspace-add-button"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg></div>`);
    addWorkspaceButton.addEventListener("click", () => {
      try {
        if (typeof gZenWorkspaces?.openWorkspaceCreation === "function") {
          console.log(
            "[ZenHaven] Attempting to open workspace creation dialog...",
          );

          // close haven
          window.haven.destroyUI();

          gZenWorkspaces.openWorkspaceCreation();
        } else {
          throw new Error(
            "gZenWorkspaces.openWorkspaceCreation is not available",
          );
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

          workspaceDiv.dataset.uuid = uuid;

          // Create the drag handle early so it can be referenced by event listeners
          const dragHandle = parseElement(
            `<span class="workspace-drag-handle" draggable="true" style="cursor: grab;"></span>`
          );

          const iconEl = workspaceDiv.querySelector(".workspace-icon");
          iconEl.addEventListener("click", () => {
            gZenEmojiPicker
              .open(iconEl)
              .then(async (newIcon) => {
                console.log("Selected emoji:", newIcon);
                iconEl.innerText = newIcon;
                const currentWorkspace =
                  gZenWorkspaces.getWorkspaceFromId(uuid);
                if (currentWorkspace && newIcon && newIcon !== icon) {
                  currentWorkspace.icon = newIcon;
                  await gZenWorkspaces.saveWorkspace(currentWorkspace);
                } else {
                  workspaceNameEl.textContent = originalName;
                }
              })
              .catch((e) => console.error(e));
          });

          dragHandle.addEventListener("dragstart", (e) => {
            const workspaceElement = e.target.closest(".haven-workspace");
            workspaceElement.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
          });

          dragHandle.addEventListener("dragend", (e) => {
            const workspaceElement = e.target.closest(".haven-workspace");
            workspaceElement.classList.remove("dragging");
          });

          if (theme?.type === "gradient" && theme.gradientColors?.length) {
            workspaceDiv.style.background = getGradientCSS(theme);
          } else {
            workspaceDiv.style.background = "var(--zen-colors-border)";
          }

          const header = workspaceDiv.querySelector(".haven-workspace-header");
          const popupOpenButton = parseElement(
            `
              <toolbarbutton 
                class="toolbarbutton-1
                haven-workspace-options"
                tooltiptext="Workspace options"
                image="chrome://browser/skin/zen-icons/menu-bar.svg"
              />`,
            "xul",
          );
          const menuPopup = parseElement(
            `
              <menupopup class="haven-workspace-actions-popup">
                <menuitem class="rename" label="Rename" tooltiptext="Rename" />
                <menuitem class="switch" label="Go to workspace" tooltiptext="switch to this workspace"/>
                <menuitem class="change-theme" label="Change Theme (n)" tooltiptext="Change theme" />
                <menuitem class="delete-workspace" label="Delete" tooltiptext="Delete workspace" />
              </menupopup>
            `,
            "xul",
          );
          header.appendChild(popupOpenButton);
          container.appendChild(menuPopup);

          popupOpenButton.addEventListener("click", (event) => {
            event.stopPropagation();
            menuPopup.openPopup(popupOpenButton, "after_start");
          });

          const workspaceNameEl = workspaceDiv.querySelector(".workspace-name");

          const enableRename = () => {
            const originalName = workspace.name;
            workspaceNameEl.contentEditable = true;
            workspaceNameEl.style.cursor = "text";
            workspaceNameEl.focus();

            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(workspaceNameEl);
            selection.removeAllRanges();
            selection.addRange(range);

            const cleanup = () => {
              workspaceNameEl.removeEventListener("blur", handleBlur);
              workspaceNameEl.removeEventListener("keydown", handleKeyDown);
              workspaceNameEl.contentEditable = false;
              workspaceNameEl.style.cursor = "";
            };

            const handleBlur = async () => {
              cleanup();
              const newName = workspaceNameEl.textContent.trim();
              const currentWorkspace = gZenWorkspaces.getWorkspaceFromId(uuid);
              if (currentWorkspace && newName && newName !== originalName) {
                currentWorkspace.name = newName;
                await gZenWorkspaces.saveWorkspace(currentWorkspace);
                workspace.name = newName;
              } else {
                workspaceNameEl.textContent = originalName;
              }
            };

            const handleKeyDown = (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                workspaceNameEl.blur();
              } else if (e.key === "Escape") {
                e.preventDefault();
                workspaceNameEl.textContent = originalName;
                workspaceNameEl.blur();
              }
            };

            workspaceNameEl.addEventListener("blur", handleBlur);
            workspaceNameEl.addEventListener("keydown", handleKeyDown);
          };

          workspaceNameEl.addEventListener("dblclick", enableRename);

          menuPopup
            .querySelector(".rename")
            .addEventListener("click", enableRename);

          menuPopup
            .querySelector(".switch")
            .addEventListener("click", async () => {
              await gZenWorkspaces.changeWorkspaceWithID(uuid);

              // close haven
              window.haven.destroyUI();
            });

          menuPopup
            .querySelector(".delete-workspace")
            .addEventListener("click", async () => {
              if (
                confirm(`Are you sure you want to delete workspace "${name}"?`)
              ) {
                await gZenWorkspaces.removeWorkspace(uuid);
                workspaceDiv.remove();
              }
            });

          menuPopup
            .querySelector(".change-theme")
            .addEventListener("click", async (event) => {
              try {
                // Switch to the selected workspace first
                await gZenWorkspaces.changeWorkspaceWithID(uuid);

                // Create or select an anchor element for the popup
                let anchor = workspaceDiv.querySelector('.haven-workspace-header');
                if (!anchor) {
                  // fallback: use the menu button itself
                  anchor = popupOpenButton;
                }

                // Open the theme picker panel at the anchor
                if (typeof PanelMultiView !== "undefined" && gZenThemePicker?.panel) {
                  PanelMultiView.openPopup(gZenThemePicker.panel, anchor, {
                    position: "bottomcenter topright", // or another position as needed
                  });
                } else {
                  throw new Error("PanelMultiView or gZenThemePicker.panel is not available");
                }
              } catch (e) {
                console.error("Error opening theme picker:", e);
              }
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
              let url;
              try {
                const browser = gBrowser.getBrowserForTab(tabEl);
                url = browser.currentURI.spec;
                // save url in tab
                clonedTab.setAttribute("data-url", url);
              } catch (e) {
                console.error("Could not get tab URL", e);
              }
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
          workspaceDiv.appendChild(dragHandle);
          const closeButtons =
            workspaceDiv.querySelectorAll(".tab-close-button");
          closeButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
              e.stopPropagation();
              e.preventDefault();
              const tab = e.target.closest("tab.tabbrowser-tab");
              // get saved url
              const url = tab.getAttribute("data-url");
              if (url) {
                try {
                  navigator.clipboard.writeText(url);
                  gZenUIManager.showToast("zen-copy-current-url-confirmation");
                } catch {
                  (err) => {
                    console.error("Failed to copy URL:", err);
                  };
                }
              }
            });
          });
          innerContainer.appendChild(workspaceDiv);
        });
        // After all workspaces are rendered, append the add workspace button
        innerContainer.appendChild(addWorkspaceButton);
      })
      .catch((error) => {
        console.error("[ZenHaven] Error building workspaces section:", error);
      });

    return container;
  },
};
 