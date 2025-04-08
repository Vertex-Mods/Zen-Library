// ==UserScript==
// @name        Custom Toolbox UI (Safe Mode)
// @description Only injects UI when #navigator-toolbox has [haven]
// @include     main
// ==/UserScript==

(function () {
  const { document } = window;
  let toolboxObserver; // Declare at top level
  console.log("[ZenHaven] Script loaded");

  function setupCustomUI() {
    console.log("[ZenHaven] Setting up UI...");
    const toolbox = document.getElementById("navigator-toolbox");
    if (!toolbox) {
      console.log("[ZenHaven] Toolbox not found!");
      return;
    }

    // Only activate if [haven] attribute is present
    if (!toolbox.hasAttribute("haven")) {
      console.log("[ZenHaven] Haven attribute not present");
      return;
    }

    console.log("[ZenHaven] Haven attribute found, proceeding with UI setup");

    // Hide all children except the toolbox itself
    Array.from(toolbox.children).forEach((child) => {
      child.style.display = "none";
    });

    // Check if custom toolbar already exists
    if (document.getElementById("custom-toolbar")) {
      console.log("[ZenHaven] Custom toolbar already exists");
      return;
    }

    // Create container for new UI elements
    const customContainer = document.createElement("div");
    customContainer.id = "custom-toolbar";
    toolbox.appendChild(customContainer);

    // Create top div with header icon and text
    const topDiv = document.createElement("div");
    topDiv.id = "toolbar-header";

    // Add header icon
    const headerIcon = document.createElement("span");
    headerIcon.className = "header-icon";
    headerIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" fill="currentColor"/>
    </svg>`;

    // For header icon
    headerIcon.className = "toolbarbutton-1";

    const headerText = document.createElement("span");
    headerText.className = "header-text";
    headerText.textContent = "Haven";

    topDiv.appendChild(headerIcon);
    topDiv.appendChild(headerText);
    customContainer.appendChild(topDiv);

    // Create middle container for function buttons
    const functionsContainer = document.createElement("div");
    functionsContainer.id = "functions-container";
    customContainer.appendChild(functionsContainer);

    // Define button configs with labels and SVG placeholders
    const buttonConfigs = [
      {
        id: "haven-downloads-button",
        label: "Downloads",
        command: "downloads",
        svgContent: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8ZM8 4V8.5L11 10L10.5 11L7 9.25V4H8Z" fill="currentColor"/>
        </svg>`,
      },
      {
        id: "haven-workspaces-button",
        label: "Workspaces",
        command: "workspaces",
        svgContent: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2H13V14H3V2ZM2 2C2 1.44772 2.44772 1 3 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 0.96814 14.5523 0.96814 14V2ZM4 4H12V5H4V4ZM4 7H12V8H4V7ZM12 10H4V11H12V10Z" fill="currentColor"/>
        </svg>`,
      },
      {
        id: "haven-history-button",
        label: "History",
        command: "history",
        svgContent: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M1 1.06567H14.9613V4.0144H1L1 1.06567ZM0 1.06567C0 0.513389 0.447715 0.0656738 1 0.0656738H14.9613C15.5136 0.0656738 15.9613 0.513389 15.9613 1.06567V4.0144C15.9613 4.55603 15.5307 4.99708 14.9932 5.01391V5.02686V13C14.9932 14.6569 13.65 16 11.9932 16H3.96814C2.31129 16 0.96814 14.6569 0.96814 13V5.02686V5.01391C0.430599 4.99708 0 4.55603 0 4.0144V1.06567ZM13.9932 5.02686H1.96814V13C1.96814 14.1046 2.86357 15 3.96814 15H11.9932C13.0977 15 13.9932 14.1046 13.9932 13V5.02686ZM9.95154 8.07495H6.01318V7.07495H9.95154V8.07495Z" fill="currentColor"/>
        </svg>`,
      },
    ];

    // Modify the button creation code
    buttonConfigs.forEach((config) => {
      const customDiv = document.createElement("div");
      customDiv.className = "custom-button";
      customDiv.setAttribute("id", config.id);

      // Create icon span
      const iconSpan = document.createElement("span");
      iconSpan.className = "icon";
      iconSpan.innerHTML = config.svgContent;

      // Create label span
      const labelSpan = document.createElement("span");
      labelSpan.className = "label";
      labelSpan.textContent = config.label;

      customDiv.appendChild(iconSpan);
      customDiv.appendChild(labelSpan);

      // Add click handler for haven container attributes
      customDiv.addEventListener("click", (event) => {
        // Handle haven container attributes
        const havenContainer = document.getElementById("zen-haven-container");
        if (havenContainer) {
          const attrs = havenContainer.getAttributeNames();
          attrs.forEach((attr) => {
            if (attr.startsWith("haven-")) {
              havenContainer.removeAttribute(attr);
            }
          });
          const attrName = `haven-${config.command}`;
          havenContainer.setAttribute(attrName, "");
        }

        // Trigger original button click
        const originalButton = document.getElementById(config.command + "-button");
        if (originalButton) {
          originalButton.click();
          event.stopPropagation(); // Prevent double triggers
        }
      });

      // Add click animation class
      customDiv.addEventListener("mousedown", () => {
        customDiv.classList.add("clicked");
      });
      customDiv.addEventListener("mouseup", () => {
        customDiv.classList.remove("clicked");
      });
      customDiv.addEventListener("mouseleave", () => {
        customDiv.classList.remove("clicked");
      });

      functionsContainer.appendChild(customDiv);
    });

    // Handle bottom buttons
    const sidebarBottomButtons = document.getElementById("zen-sidebar-bottom-buttons");
    const workspacesButton = sidebarBottomButtons?.querySelector("#zen-workspaces-button");
    
    if (sidebarBottomButtons && workspacesButton) {
        // Count workspaces and store in variable
        const workspaceCount = workspacesButton.children.length;
        console.log(`[ZenHaven] Found ${workspaceCount} workspaces`);
        
        // Move the original buttons to our container
        customContainer.appendChild(sidebarBottomButtons);
        
        // Hide workspace button
        workspacesButton.style.display = "none";
        
        // Add CSS to style the bottom buttons
        const customStyles = document.createElement("style");
        customStyles.textContent = `
            #zen-sidebar-bottom-buttons {
                display: flex !important;
                justify-content: space-between;
                height: min-content;
                width: 100%;
                padding: 8px;
            }

            #zen-sidebar-bottom-buttons > * {
                margin: 0 5px;
                -moz-context-properties: fill, fill-opacity !important;
            }

            #zen-sidebar-bottom-buttons toolbarbutton {
                -moz-appearance: none !important;
            }
        `;
        document.head.appendChild(customStyles);
    }

    // Create sidebar container
    const sidebarSplitter = document.getElementById("zen-sidebar-splitter");
    if (sidebarSplitter) {
      const sidebarContainer = document.createElement("div");
      sidebarContainer.id = "zen-haven-container";
      sidebarContainer.style.cssText = `
            height: 100%;
            width: 60vw;
            position: relative;
            display: flex;
            flex-direction: column;
        `;

      // Insert directly after the splitter
      sidebarSplitter.parentNode.insertBefore(
        sidebarContainer,
        sidebarSplitter.nextSibling
      );
      console.log("[ZenHaven] Sidebar container added after splitter");

      // Create workspace observer
      const workspaceObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName === "haven-workspaces") {
            console.log("[ZenHaven] Workspace observer triggered");
            
            // Clear existing workspace divs
            const existingWorkspaces = sidebarContainer.querySelectorAll('[workspace-id]');
            existingWorkspaces.forEach(ws => ws.remove());

            // Create new workspace divs if attribute is present
            if (sidebarContainer.hasAttribute("haven-workspaces")) {
              const workspacesButton = document.getElementById("zen-workspaces-button");
              if (workspacesButton) {
                console.log("[ZenHaven] Found workspace button:", workspacesButton);
                
                // Get all workspace elements directly
                const workspaceElements = Array.from(workspacesButton.children);
                console.log("[ZenHaven] Workspace elements:", workspaceElements);

                workspaceElements.forEach((workspace) => {
                  // Create base workspace div
                  const workspaceDiv = document.createElement("div");
                  workspaceDiv.className = "haven-workspace";
                  
                  // Create content container
                  const contentDiv = document.createElement("div");
                  contentDiv.className = "haven-workspace-content";
                  
                  // Find workspace sections using the workspace's own ID
                  const sections = document.querySelectorAll(
                    `.zen-workspace-tabs-section[zen-workspace-id="${workspace.getAttribute('zen-workspace-id')}"]`
                  );
                  
                  // For each section, copy its internal content exactly
                  sections.forEach(section => {
                    // Copy all child nodes directly into content div
                    Array.from(section.childNodes).forEach(child => {
                      const clone = child.cloneNode(true);
                      contentDiv.appendChild(clone);
                    });
                  });
                  
                  // Assemble workspace
                  workspaceDiv.appendChild(contentDiv);
                  sidebarContainer.appendChild(workspaceDiv);
                });
              }
            }
          }
        });
      });

      workspaceObserver.observe(sidebarContainer, { attributes: true });

      // Add styles for workspaces
      const workspaceStyles = document.createElement("style");
      workspaceStyles.textContent = `
        .haven-workspace {
          width: 100%;
          height: 100%;
          display: none;
          padding: 16px;
        }

        .haven-workspace-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .workspace-icon {
          font-size: 24px;
          margin: 0;
          color: var(--toolbar-color);
        }

        .workspace-title {
          font-size: 24px;
          margin: 0;
          color: var(--toolbar-color);
        }

        #zen-haven-container[haven-workspaces] .haven-workspace {
          display: block;
        }

        .haven-workspace-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          overflow-y: auto;
        }

        .haven-workspace-content > * {
          width: 100%;
        }
      `;
      document.head.appendChild(workspaceStyles);
    } else {
      console.log("[ZenHaven] Sidebar splitter not found!");
    }

    // Update the CSS
    const customStyles = document.createElement("style");
    customStyles.textContent += `
      :root:has(#navigator-toolbox[haven]) {
        #navigator-toolbox {
          padding: 0 !important;
          box-shadow: 10px 0 10px rgba(0, 0, 0, 0.3);
          border-radius: 0 12px 12px 0 !important;
          width: min-content !important;
        }

        #custom-toolbar {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        #toolbar-header {
          font-size: 20px;
          display: flex !important;
          align-items: center;
          margin-top: 5px;
          margin-left: 5px;
          margin-right: 50px;
          height: 24px;
        }

        #toolbar-header .header-icon {
          display: flex;
          width: 24px;
          height: 24px;
          align-items: center;
          justify-content: center;
          margin-right: 5px;
        }

        #toolbar-header .header-icon svg {
          width: 20px !important;
          height: 20px !important;
        }

        #functions-container {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .custom-button {
          display: flex;
          flex-direction: column;
          width: 100px;
          height: 100px;
          margin-top: auto;
          margin-bottom: auto;
          align-items: center;
          justify-content: center;
        }

        .custom-button .icon svg {
          height: 24px !important;
        }

        .custom-button .label {
          display: block;
          margin-top: 8px;
          text-align: center;
        }

        .custom-button,
        .toolbarbutton-1 {
          transition: transform 0.1s ease-in-out, background-color 0.2s ease;
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          position: relative;
        }

      . custom-button:hover,
        .toolbarbutton-1:hover {
          background-color: var(--toolbarbutton-hover-background);
          transform: translateY(-1px);
        } 

        .custom-button.clicked {
          transform: translateY(1px);
          background-color: var(--toolbarbutton-active-background);
        } 
    }
    `;
    document.head.appendChild(customStyles);

    console.log("[ZenHaven] UI setup complete");
  }

  // Create an observer for the [haven] attribute
  function createToolboxObserver() {
    console.log("[ZenHaven] Setting up toolbox observer");
    const toolbox = document.getElementById("navigator-toolbox");
    if (!toolbox) return;

    const toolboxObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "haven"
        ) {
          console.log("[ZenHaven] Haven attribute changed");

          if (toolbox.hasAttribute("haven")) {
            // Haven mode activated
            setupCustomUI();
          } else {
            // Haven mode deactivated - restore original UI
            console.log("[ZenHaven] Restoring original UI");

            // Restore bottom buttons after media controls toolbar
            const bottomButtons = document.getElementById("zen-sidebar-bottom-buttons");
            const mediaToolbar = document.getElementById("zen-media-controls-toolbar");
            
            if (bottomButtons && mediaToolbar) {
                // Insert after media toolbar
                mediaToolbar.parentNode.insertBefore(bottomButtons, mediaToolbar.nextSibling);
                
                // Show workspaces button again
                const workspacesButton = bottomButtons.querySelector("#zen-workspaces-button");
                if (workspacesButton) {
                    workspacesButton.style.display = "";
                }
                console.log("[ZenHaven] Bottom buttons restored after media controls");
            } else {
                console.log("[ZenHaven] Could not find media controls toolbar or bottom buttons");
            }

            // Show all original children
            Array.from(toolbox.children).forEach((child) => {
                if (child.id !== "custom-toolbar") {
                    child.style.display = "";
                }
            });

            // Remove custom elements
            const customToolbar = document.getElementById("custom-toolbar");
            const havenContainer = document.getElementById("zen-haven-container");

            if (customToolbar) {
                customToolbar.remove();
            }

            if (havenContainer) {
                havenContainer.remove();
            }
          }
        }
      });
    });

    toolboxObserver.observe(toolbox, { attributes: true });
    console.log("[ZenHaven] Toolbox observer active");
  }

  // After document ready, create and inject the haven toggle button
  // Modify the createHavenToggle function to insert after new tab button
  function createHavenToggle() {
    const sidebarBottomButtons = document.getElementById("zen-sidebar-bottom-buttons");
    if (!sidebarBottomButtons) {
        console.log('[ZenHaven] Bottom buttons container not found');
        return;
    }

    // Create the button with correct XUL structure
    const toolbarButton = document.createXULElement('toolbarbutton');
    toolbarButton.setAttribute('xmlns', 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul');
    toolbarButton.className = 'toolbarbutton-1 chromeclass-toolbar-additional subviewbutton-nav';
    toolbarButton.id = 'haven-toggle-button';
    toolbarButton.setAttribute('delegatesanchor', 'true');
    toolbarButton.setAttribute('removable', 'true');
    toolbarButton.setAttribute('overflows', 'true');
    toolbarButton.setAttribute('label', 'Toggle Haven');
    toolbarButton.setAttribute('tooltiptext', 'Toggle Haven Mode');

    // Add icon
    const iconSVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3ZM3 3H13V13H3V3ZM5 5H11V6H5V5ZM11 7H5V8H11V7ZM5 9H11V10H5V9Z" fill="currentColor"/>
    </svg>`;

    const image = document.createXULElement('image');
    image.className = 'toolbarbutton-icon';
    image.style.listStyleImage = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}")`;
    image.setAttribute('label', 'Toggle Haven');

    const label = document.createXULElement('label');
    label.className = 'toolbarbutton-text';
    label.setAttribute('crop', 'end');
    label.setAttribute('flex', '1');
    label.setAttribute('value', 'Toggle Haven');

    // Add click handler
    toolbarButton.addEventListener('click', () => {
        const toolbox = document.getElementById('navigator-toolbox');
        if (toolbox) {
            if (toolbox.hasAttribute('haven')) {
                toolbox.removeAttribute('haven');
            } else {
                toolbox.setAttribute('haven', '');
            }
        }
    });

    // Assemble the button
    toolbarButton.appendChild(image);
    toolbarButton.appendChild(label);

    // Add to sidebar bottom buttons
    sidebarBottomButtons.appendChild(toolbarButton);
    console.log('[ZenHaven] Toggle button added to sidebar bottom buttons');
  }

  // Wait for startup before injecting UI
  if (gBrowserInit.delayedStartupFinished) {
    console.log("[ZenHaven] Browser already started");
    setupCustomUI();
    createToolboxObserver();
    createHavenToggle();
  } else {
    console.log("[ZenHaven] Waiting for browser startup");
    let observer = new MutationObserver(() => {
      if (gBrowserInit.delayedStartupFinished) {
        console.log("[ZenHaven] Browser startup detected");
        observer.disconnect();
        setupCustomUI();
        createToolboxObserver();
        createHavenToggle();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
})();
