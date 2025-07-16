import { parseElement } from "../utils/parse.js";

function getGradientCSS(theme) {
  if (!theme || theme.type !== "gradient" || !theme.gradientColors?.length)
    return "transparent";

  const angle = Math.round(theme.rotation || 0);
  const stops = theme.gradientColors
    .map(({ c }) => {
      const [r, g, b] = c;
      return `rgb(${r}, ${g}, ${b})`;
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
    const container = parseElement(`<div style="display: contents;"></div>`);

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

    const workspacesButton = document.getElementById("zen-workspaces-button");
    if (workspacesButton) {
      console.log("[ZenHaven] Found workspace button:", workspacesButton);
      const workspaceElements = Array.from(workspacesButton.children);
      console.log("[ZenHaven] Workspace elements:", workspaceElements);

      workspaceElements.forEach((workspace) => {
        // Create base workspace div
        const workspaceDiv = parseElement(
          `<div class="haven-workspace"></div>`,
        );
        const uuid = workspace.getAttribute("zen-workspace-id");

        ZenWorkspacesStorage.getWorkspaces().then((allWorkspaces) => {
          const data = allWorkspaces.find((ws) => ws.uuid === uuid);
          if (
            data?.theme?.type === "gradient" &&
            data.theme.gradientColors?.length
          ) {
            workspaceDiv.style.background = getGradientCSS(data.theme);
            workspaceDiv.style.opacity = data.theme.opacity ?? 1;
          } else {
            workspaceDiv.style.background = "var(--zen-colors-border)";
            workspaceDiv.style.opacity = 1;
          }
        });

        // Create content container
        const contentDiv = parseElement(
          `<div class="haven-workspace-content"></div>`,
        );

        // Find workspace sections using the workspace's own ID
        const sections = document.querySelectorAll(
          `.zen-workspace-tabs-section[zen-workspace-id="${workspace.getAttribute(
            "zen-workspace-id",
          )}"]`,
        );

        sections.forEach((section) => {
          const root = section.shadowRoot || section;
          const sectionWrapper = parseElement(
            `<div class="haven-workspace-section"></div>`,
          );

          // Copy computed styles from original section
          const computedStyle = window.getComputedStyle(section);
          sectionWrapper.style.cssText = Array.from(computedStyle).reduce(
            (str, property) => {
              return `${str}${property}:${computedStyle.getPropertyValue(
                property,
              )};`;
            },
            "",
          );

          // Clone tab groups with their styles
          const tabGroups = root.querySelectorAll("tab-group");
          tabGroups.forEach((group) => {
            const groupClone = group.cloneNode(true);
            const groupStyle = window.getComputedStyle(group);
            groupClone.style.cssText = Array.from(groupStyle).reduce(
              (str, property) => {
                return `${str}${property}:${groupStyle.getPropertyValue(
                  property,
                )};`;
              },
              "",
            );
            sectionWrapper.appendChild(groupClone);
          });

          // Clone remaining children with their styles
          Array.from(root.children).forEach((child) => {
            if (!child.classList.contains("zen-tab-group")) {
              const clone = child.cloneNode(true);
              const childStyle = window.getComputedStyle(child);
              clone.style.cssText = Array.from(childStyle).reduce(
                (str, property) => {
                  return `${str}${property}:${childStyle.getPropertyValue(
                    property,
                  )};`;
                },
                "",
              );
              sectionWrapper.appendChild(clone);
            }
          });
          contentDiv.appendChild(sectionWrapper);
        });

        workspaceDiv.appendChild(contentDiv);
        container.appendChild(workspaceDiv);
      });
    }

    container.appendChild(addWorkspaceButton);
    return container;
  },
};
