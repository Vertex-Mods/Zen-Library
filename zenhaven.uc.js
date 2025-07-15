// ==UserScript==
// @name        Custom Toolbox UI (Safe Mode)
// @description Only injects UI when #navigator-toolbox has [haven]
// @include     main
// ==/UserScript==

(function () {
  const { document } = window;
  let toolboxObserver; // Declare at top level
  console.log("[ZenHaven] Script loaded");

  function getGradientCSS(theme) {
    if (!theme || theme.type !== "gradient" || !theme.gradientColors?.length) return "transparent";

    const angle = Math.round(theme.rotation || 0);
    const stops = theme.gradientColors.map(({ c }) => {
      const [r, g, b] = c;
      return `rgb(${r}, ${g}, ${b})`;
    }).join(", ");

    return `linear-gradient(${angle}deg, ${stops})`;
  }


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
      {
        id: "haven-notes-button",
        label: "Notes",
        command: "notes",
        svgContent: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5.41421C14 5.149 13.8946 4.89464 13.7071 4.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H3ZM3 3H10V5.5C10 5.77614 10.2239 6 10.5 6H13V13H3V3ZM11 3.70711L12.2929 5H11V3.70711ZM5 7H11V8H5V7ZM11 9H5V10H11V9ZM5 11H11V12H5V11Z" fill="currentColor"/>
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
        const havenContainer = document.getElementById("zen-haven-container");
        if (havenContainer) {
          const currentAttr = `haven-${config.command}`;
          const hasCurrentAttr = havenContainer.hasAttribute(currentAttr);

          
          // Remove active state from all buttons
          document.querySelectorAll('.custom-button').forEach(btn => {
            btn.classList.remove('active');
          });
          
          // If clicking same button and container is visible, hide it
          if (hasCurrentAttr && havenContainer.style.display !== "none") {
            havenContainer.style.display = "none";
            havenContainer.removeAttribute(currentAttr);
            return;
          }

          
          // Add active state to clicked button
          customDiv.classList.add('active');
          
          // Remove all existing content first
          while (havenContainer.firstChild) {
            havenContainer.removeChild(havenContainer.firstChild);
          }
          

          // Remove all haven- attributes
          const attrs = havenContainer.getAttributeNames();
          attrs.forEach((attr) => {
            if (attr.startsWith("haven-")) {
              havenContainer.removeAttribute(attr);
            }
          });

          // Set new attribute for current view and ensure visibility
          havenContainer.setAttribute(currentAttr, "");
          havenContainer.style.display = "flex";
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
            display: none;
            flex-direction: column;
        `;

      // Find the tabbox and inject before it
      const tabbox = document.getElementById("tabbrowser-tabbox");
      if (tabbox) {
        // Insert before the tabbox
        tabbox.parentNode.insertBefore(sidebarContainer, tabbox);
        console.log("[ZenHaven] Sidebar container added before tabbrowser-tabbox");
      } else {
        // Fallback to original placement after splitter
        sidebarSplitter.parentNode.insertBefore(
          sidebarContainer,
          sidebarSplitter.nextSibling
        );
        console.log("[ZenHaven] Tabbox not found, sidebar container added after splitter");
      }

      // Create workspace observer
      const workspaceObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "attributes" && mutation.attributeName === "haven-workspaces") {
            console.log("[ZenHaven] Workspace observer triggered");

            // Toggle behavior - if workspaces are already shown, hide them
            const existingWorkspaces = sidebarContainer.querySelectorAll('.haven-workspace');
            if (existingWorkspaces.length > 0) {
              existingWorkspaces.forEach(ws => ws.remove());
              sidebarContainer.removeAttribute("haven-workspaces");
              return;
            }

            // Add styles for workspace button
            const workspaceStyles = document.createElement("style");
            workspaceStyles.textContent = `
              .haven-workspace-add-button {
                position: sticky;
                bottom: 16px;
                right: 16px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--toolbar-bgcolor);
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s;
                margin-left: auto;
                z-index: 100;
              }
            `;
            document.head.appendChild(workspaceStyles);

            // Create new workspace divs if attribute is present
            if (sidebarContainer.hasAttribute("haven-workspaces")) {
              // Create add workspace button and append it last
              const addWorkspaceButton = document.createElement("div");
              addWorkspaceButton.className = "haven-workspace-add-button";
              addWorkspaceButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>`;
              addWorkspaceButton.addEventListener("click", () => {
                try {
                  if (typeof ZenWorkspaces === "undefined") {
                    throw new Error("ZenWorkspaces is not defined");
                  }
                  if (typeof ZenWorkspaces.openSaveDialog !== "function") {
                    throw new Error("openSaveDialog function is not available");
                  }
                  console.log("[ZenHaven] Attempting to open workspace save dialog...");
                  ZenWorkspaces.openSaveDialog();
                } catch (error) {
                  console.error("[ZenHaven] Error opening workspace dialog:", error);
                }
              });
              sidebarContainer.appendChild(addWorkspaceButton);

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

                  // Get the workspace object using the UUID from the element
                  const uuid = workspace.getAttribute("zen-workspace-id");
                  ZenWorkspacesStorage.getWorkspaces().then((allWorkspaces) => {
                    const data = allWorkspaces.find(ws => ws.uuid === uuid);
                    if (data?.theme?.type === "gradient" && data.theme.gradientColors?.length) {
                      workspaceDiv.style.background = getGradientCSS(data.theme);
                      workspaceDiv.style.opacity = data.theme.opacity ?? 1;
                    } else {
                      // Fallback: use a solid neutral background
                      workspaceDiv.style.background = "var(--zen-colors-border)";
                      workspaceDiv.style.opacity = 1;
                    }
                  });


                  // Create content container
                  const contentDiv = document.createElement("div");
                  contentDiv.className = "haven-workspace-content";

                  // Find workspace sections using the workspace's own ID
                  const sections = document.querySelectorAll(
                    `.zen-workspace-tabs-section[zen-workspace-id="${workspace.getAttribute('zen-workspace-id')}"]`
                  );

                  sections.forEach(section => {
                    const root = section.shadowRoot || section;

                    // Create wrapper with same class
                    const sectionWrapper = document.createElement('div');
                    sectionWrapper.className = 'haven-workspace-section';

                    // Copy computed styles from original section
                    const computedStyle = window.getComputedStyle(section);
                    const cssText = Array.from(computedStyle).reduce((str, property) => {
                      return `${str}${property}:${computedStyle.getPropertyValue(property)};`;
                    }, '');
                    sectionWrapper.style.cssText = cssText;

                    // Move tab groups query inside the loop where root is defined
                    const tabGroups = root.querySelectorAll('tab-group');
                    // Clone tab groups with their styles
                    tabGroups.forEach(group => {
                      const groupClone = group.cloneNode(true);
                      // Copy computed styles from original group
                      const groupStyle = window.getComputedStyle(group);
                      const groupCssText = Array.from(groupStyle).reduce((str, property) => {
                        return `${str}${property}:${groupStyle.getPropertyValue(property)};`;
                      }, '');
                      groupClone.style.cssText = groupCssText;
                      sectionWrapper.appendChild(groupClone);
                    });

                    // Clone remaining children with their styles 
                    Array.from(root.children).forEach(child => {
                      if (!child.classList.contains('zen-tab-group')) {
                        const clone = child.cloneNode(true);
                        // Copy computed styles from original child
                        const childStyle = window.getComputedStyle(child);
                        const childCssText = Array.from(childStyle).reduce((str, property) => {
                          return `${str}${property}:${childStyle.getPropertyValue(property)};`;
                        }, '');
                        clone.style.cssText = childCssText;
                        sectionWrapper.appendChild(clone);
                      }
                    });

                    contentDiv.appendChild(sectionWrapper);
                  });

                  // Assemble workspace
                  workspaceDiv.appendChild(contentDiv);
                  sidebarContainer.appendChild(workspaceDiv);
                });
              }
            }
          }

          if (mutation.type === "attributes" && mutation.attributeName === "haven-downloads") {
            const sidebarContainer = document.getElementById("zen-haven-container");

            // --- 1. Cleanup Existing Elements ---
            const existingDownloadsContent = sidebarContainer.querySelector('.haven-downloads-container');
            if (existingDownloadsContent) {
              existingDownloadsContent.remove();
            }
            const existingDownloadsStyles = document.getElementById('haven-downloads-styles');
            if (existingDownloadsStyles) {
              existingDownloadsStyles.remove();
            }

            // --- 2. Check if Attribute Exists and Build Base UI ---
            if (sidebarContainer.hasAttribute("haven-downloads")) {
              const downloadsViewContainer = document.createElement("div");
              downloadsViewContainer.className = "haven-downloads-container";

              // --- Data Store and State ---
              let allFetchedDownloads = [];
              let filteredDisplayDownloads = [];
              let currentViewMode = 'recent';
              let currentStatusFilter = 'all';
              let currentCategoryFilter = 'all';
              let currentSearchTerm = '';
              let categoryActiveIndicatorEl; // --- NEW: For animation

              // --- Helper Functions ---
              function formatBytes(bytes, decimals = 2) {
                if (!+bytes || bytes === 0) return '0 Bytes';
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
              }

              function getFileIconDetails(filename) {
                const fn = filename || "";
                const extension = fn.includes('.') ? fn.split('.').pop().toLowerCase() : 'file';
                switch (extension) {
                  case 'pdf': return { text: 'PDF', className: 'pdf-icon' };
                  case 'zip': case 'rar': case '7z': case 'tar': case 'gz': return { text: 'ZIP', className: 'zip-icon' };
                  case 'mp4': case 'mkv': case 'avi': case 'mov': case 'webm': return { text: 'VID', className: 'vid-icon' };
                  case 'doc': case 'docx': case 'odt': return { text: 'DOC', className: 'doc-icon' };
                  case 'mp3': case 'wav': case 'ogg': case 'aac': case 'flac': return { text: 'MP3', className: 'mp3-icon' };
                  case 'png': case 'jpg': case 'jpeg': case 'gif': case 'bmp': case 'svg': case 'webp': return { text: 'IMG', className: 'img-icon' };
                  case 'txt': return { text: 'TXT', className: 'doc-icon' };
                  case 'xls': case 'xlsx': case 'csv': return { text: 'XLS', className: 'doc-icon' };
                  case 'ppt': case 'pptx': return { text: 'PPT', className: 'doc-icon' };
                  case 'exe': case 'msi': case 'dmg': return { text: 'EXE', className: 'zip-icon' };
                  default: return { text: extension.toUpperCase().substring(0, 3), className: 'default-icon' };
                }
              }

              function getFileCategory(filename) {
                const fn = filename || "";
                const extension = fn.includes('.') ? fn.split('.').pop().toLowerCase() : '';

                if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'heic', 'avif'].includes(extension)) return 'images';
                if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'mp4', 'mkv', 'avi', 'mov', 'webm', 'flv'].includes(extension)) return 'media';
                return 'documents';
              }


              function getStatusInfo(download) {
                const stat = download && download.status ? download.status : "unknown";
                switch (stat) {
                  case 'completed': return { text: 'Completed', className: 'status-completed' };
                  case 'failed': return { text: 'Failed', className: 'status-failed' };
                  case 'paused': return { text: 'Paused', className: 'status-paused' };
                  default: return { text: stat.charAt(0).toUpperCase() + stat.slice(1), className: 'status-unknown' };
                }
              }

              function timeAgo(timestamp) {
                const now = new Date();
                const then = new Date(timestamp);
                const seconds = Math.round((now - then) / 1000);
                const minutes = Math.round(seconds / 60);
                const hours = Math.round(minutes / 60);
                const days = Math.round(hours / 24);
                const weeks = Math.round(days / 7);
                const months = Math.round(days / 30.44);
                const years = Math.round(days / 365.25);

                if (seconds < 5) return "Just now";
                if (seconds < 60) return `${seconds} seconds ago`;
                if (minutes < 60) return `${minutes} minutes ago`;
                if (hours < 24) return `${hours} hours ago`;
                if (days === 1) return "Yesterday";
                if (days < 7) return `${days} days ago`;
                if (weeks === 1) return "1 week ago";
                if (weeks < 4) return `${weeks} weeks ago`;
                if (months === 1) return "1 month ago";
                if (months < 12) return `${months} months ago`;
                if (years === 1) return "1 year ago";
                return `${years} years ago`;
              }

              // --- UI Rendering ---
              function renderUI() {
                downloadsViewContainer.innerHTML = '';

                const SEARCH_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L16.66 16.66M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                const ALL_FILES_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 14.0001L7.5 11.1001C7.66307 10.7762 7.91112 10.5028 8.21761 10.309C8.5241 10.1153 8.8775 10.0085 9.24 10.0001H20M20 10.0001C20.3055 9.99956 20.6071 10.069 20.8816 10.2032C21.1561 10.3373 21.3963 10.5326 21.5836 10.774C21.7709 11.0153 21.9004 11.2964 21.9622 11.5956C22.024 11.8949 22.0164 12.2043 21.94 12.5001L20.4 18.5001C20.2886 18.9317 20.0362 19.3136 19.6829 19.5854C19.3296 19.8571 18.8957 20.0031 18.45 20.0001H4C3.46957 20.0001 2.96086 19.7894 2.58579 19.4143C2.21071 19.0392 2 18.5305 2 18.0001V5.0001C2 4.46966 2.21071 3.96096 2.58579 3.58588C2.96086 3.21081 3.46957 3.0001 4 3.0001H7.9C8.23449 2.99682 8.56445 3.07748 8.8597 3.23472C9.15495 3.39195 9.40604 3.62072 9.59 3.9001L10.4 5.1001C10.5821 5.37663 10.83 5.60362 11.1215 5.7607C11.413 5.91778 11.7389 6.00004 12.07 6.0001H18C18.5304 6.0001 19.0391 6.21081 19.4142 6.58588C19.7893 6.96096 20 7.46966 20 8.0001V10.0001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                const DOCS_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2V6C14 6.53043 14.2107 7.03914 14.5858 7.41421C14.9609 7.78929 15.4696 8 16 8H20M10 9H8M16 13H8M16 17H8M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                const IMAGES_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15L17.914 11.914C17.5389 11.5391 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.5391 15.086 11.914L6 21M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3ZM11 9C11 10.1046 10.1046 11 9 11C7.89543 11 7 10.1046 7 9C7 7.89543 7.89543 7 9 7C10.1046 7 11 7.89543 11 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
                const MEDIA_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 10V13M6 6V17M10 3V21M14 8V15M18 5V18M22 10V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;


                const header = document.createElement('div');
                header.className = 'haven-dl-header';
                const titleSection = document.createElement('div');
                titleSection.className = 'haven-dl-title-section';
                // --- MODIFIED: Removed title icon placeholder content ---
                // const titleIconPlaceholder = document.createElement('span');
                // titleIconPlaceholder.className = 'haven-dl-title-icon-placeholder';
                // titleIconPlaceholder.textContent = '⬇'; // Removed emoji
                const titleText = document.createElement('h1');
                titleText.className = 'haven-dl-title-text';
                titleText.textContent = 'Downloads';
                // titleSection.appendChild(titleIconPlaceholder); // Not appending if empty
                titleSection.appendChild(titleText);
                header.appendChild(titleSection);

                const controls = document.createElement('div');
                controls.className = 'haven-dl-controls';

                const searchFilterRow = document.createElement('div');
                searchFilterRow.className = 'haven-dl-search-filter-row';

                const searchBox = document.createElement('div');
                searchBox.className = 'haven-dl-search-box';
                const searchIconPlaceholder = document.createElement('span');
                searchIconPlaceholder.className = 'haven-dl-search-icon-placeholder';
                searchIconPlaceholder.innerHTML = SEARCH_SVG;
                const searchInput = document.createElement('input');
                searchInput.type = 'text';
                searchInput.className = 'haven-dl-search-input';
                searchInput.placeholder = 'Search downloads...';
                searchInput.value = currentSearchTerm;
                searchBox.appendChild(searchIconPlaceholder);
                searchBox.appendChild(searchInput);
                searchFilterRow.appendChild(searchBox);

                const statusFilter = document.createElement('select');
                statusFilter.className = 'haven-dl-filter-dropdown';
                statusFilter.id = 'statusFilter';
                ['all', 'completed', 'paused', 'failed'].forEach(val => {
                  const option = document.createElement('option');
                  option.value = val;
                  option.textContent = val === 'paused' ? 'Paused/Interrupted' : val.charAt(0).toUpperCase() + val.slice(1);
                  if (val === currentStatusFilter) option.selected = true;
                  statusFilter.appendChild(option);
                });
                searchFilterRow.appendChild(statusFilter);

                const viewToggle = document.createElement('div');
                viewToggle.className = 'haven-dl-view-toggle';
                const recentBtn = document.createElement('button');
                recentBtn.className = `haven-dl-view-btn ${currentViewMode === 'recent' ? 'active' : ''}`;
                recentBtn.dataset.view = 'recent';
                recentBtn.title = 'Recent Downloads';
                recentBtn.textContent = 'Recent';
                const historyBtn = document.createElement('button');
                historyBtn.className = `haven-dl-view-btn ${currentViewMode === 'history' ? 'active' : ''}`;
                historyBtn.dataset.view = 'history';
                historyBtn.title = 'Download History';
                historyBtn.textContent = 'History';
                viewToggle.appendChild(recentBtn);
                viewToggle.appendChild(historyBtn);
                searchFilterRow.appendChild(viewToggle);
                controls.appendChild(searchFilterRow);

                const categoryTabsContainer = document.createElement('div'); // Renamed for clarity
                categoryTabsContainer.className = 'haven-dl-category-tabs-container'; // --- NEW class for positioning context

                // --- NEW: Create the active indicator element ---
                categoryActiveIndicatorEl = document.createElement('div');
                categoryActiveIndicatorEl.className = 'haven-dl-category-active-indicator';
                categoryTabsContainer.appendChild(categoryActiveIndicatorEl);


                const categories = [
                  { id: 'all', text: 'All Files', svg: ALL_FILES_SVG },
                  { id: 'documents', text: 'Documents', svg: DOCS_SVG },
                  { id: 'images', text: 'Images', svg: IMAGES_SVG },
                  { id: 'media', text: 'Media', svg: MEDIA_SVG }
                ];

                let firstTab = true;
                categories.forEach(cat => {
                  const tab = document.createElement('button');
                  tab.className = `haven-dl-category-tab`; // Removed active class from here initially
                  if (currentCategoryFilter === cat.id) {
                     tab.classList.add('active'); // Add active for text color
                  }
                  tab.dataset.category = cat.id;

                  const iconSpan = document.createElement('span');
                  iconSpan.className = 'haven-dl-tab-icon';
                  iconSpan.innerHTML = cat.svg;

                  const textSpan = document.createElement('span');
                  textSpan.textContent = cat.text;

                  tab.appendChild(iconSpan);
                  tab.appendChild(textSpan);
                  categoryTabsContainer.appendChild(tab); // Append tab to the container

                  // --- MODIFIED: Set initial position for indicator (after tabs are in DOM) ---
                  // This will be called again fully in attachEventListeners / updateCategoryIndicatorPosition
                  if (firstTab && currentCategoryFilter === cat.id) {
                    // Delay slightly to ensure tab is rendered for offsetWidth/offsetLeft
                    requestAnimationFrame(() => updateCategoryIndicatorPosition(tab));
                  }
                  firstTab = false;
                });
                controls.appendChild(categoryTabsContainer); // Append the whole container to controls

                const stats = document.createElement('div');
                stats.className = 'haven-dl-stats-bar';
                const statsCounts = document.createElement('div');
                statsCounts.className = 'haven-dl-stats-counts';
                statsCounts.innerHTML = `Total: <strong id="totalCount">0</strong> Active: <strong id="activeCount">0</strong> Completed: <strong id="completedCount">0</strong>`;
                const viewInfoText = document.createElement('div');
                viewInfoText.className = 'haven-dl-view-info';
                viewInfoText.id = 'viewInfoText';
                viewInfoText.textContent = 'Showing recent downloads';
                stats.appendChild(statsCounts);
                stats.appendChild(viewInfoText);

                downloadsViewContainer.appendChild(header);
                downloadsViewContainer.appendChild(controls);
                downloadsViewContainer.appendChild(stats);

                const listContainer = document.createElement('div');
                listContainer.className = 'haven-dl-list-container';
                listContainer.id = 'downloadsListArea';
                downloadsViewContainer.appendChild(listContainer);

                updateAndRenderDownloadsList();
                attachEventListeners();

                // --- NEW: Ensure indicator is correctly positioned after initial render ---
                const initialActiveTab = categoryTabsContainer.querySelector(`.haven-dl-category-tab[data-category="${currentCategoryFilter}"]`);
                if (initialActiveTab) {
                    requestAnimationFrame(() => updateCategoryIndicatorPosition(initialActiveTab));
                }
              }

              // --- NEW: Function to update category indicator position ---
              function updateCategoryIndicatorPosition(activeTabElement) {
                if (!categoryActiveIndicatorEl || !activeTabElement) return;
                const tabContainer = activeTabElement.parentElement; // Should be categoryTabsContainer
                if (!tabContainer) return;

                // Calculate position relative to the container
                const containerRect = tabContainer.getBoundingClientRect();
                const tabRect = activeTabElement.getBoundingClientRect();

                categoryActiveIndicatorEl.style.left = `${tabRect.left - containerRect.left}px`;
                categoryActiveIndicatorEl.style.width = `${activeTabElement.offsetWidth}px`;
                // Height and top are set by CSS to match the tab design
              }


              function updateAndRenderDownloadsList() {
                applyAllFilters();

                const listArea = downloadsViewContainer.querySelector('#downloadsListArea');
                if (!listArea) { console.error("downloadsListArea not found in updateAndRenderDownloadsList"); return; }
                listArea.innerHTML = '';

                const totalCountEl = downloadsViewContainer.querySelector('#totalCount');
                const activeCountEl = downloadsViewContainer.querySelector('#activeCount');
                const completedCountEl = downloadsViewContainer.querySelector('#completedCount');
                const viewInfoTextEl = downloadsViewContainer.querySelector('#viewInfoText');

                if (totalCountEl) totalCountEl.textContent = allFetchedDownloads.length;
                if (activeCountEl) activeCountEl.textContent = allFetchedDownloads.filter(d => d.status === 'paused').length;
                if (completedCountEl) completedCountEl.textContent = allFetchedDownloads.filter(d => d.status === 'completed').length;
                if (viewInfoTextEl) viewInfoTextEl.textContent = currentViewMode === 'recent' ? 'Showing recent downloads' : 'Showing download history';

                if (filteredDisplayDownloads.length === 0) {
                  const emptyState = document.createElement('div');
                  emptyState.className = 'haven-dl-empty-state';
                  const emptyIcon = document.createElement('span');
                  emptyIcon.className = 'haven-dl-empty-icon-placeholder';
                  emptyIcon.textContent = '📥';
                  const emptyText = document.createElement('p');
                  emptyText.textContent = 'No downloads found.';
                  emptyState.appendChild(emptyIcon);
                  emptyState.appendChild(emptyText);
                  listArea.appendChild(emptyState);
                  return;
                }

                if (currentViewMode === 'history') {
                  const groupedByDate = groupDownloadsByDate(filteredDisplayDownloads);
                  Object.keys(groupedByDate).sort((a, b) => {
                    if (a === "Today") return -1; if (b === "Today") return 1;
                    if (a === "Yesterday") return -1; if (b === "Yesterday") return 1;
                    const tsA = groupedByDate[a] && groupedByDate[a][0] ? groupedByDate[a][0].timestamp : 0;
                    const tsB = groupedByDate[b] && groupedByDate[b][0] ? groupedByDate[b][0].timestamp : 0;
                    return tsB - tsA;
                  })
                    .forEach(dateKey => {
                      const dateSeparator = document.createElement('div');
                      dateSeparator.className = 'haven-dl-date-separator';
                      dateSeparator.textContent = dateKey;
                      listArea.appendChild(dateSeparator);
                      groupedByDate[dateKey]
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .forEach(item => listArea.appendChild(createDownloadItemElement(item)));
                    });
                } else {
                  filteredDisplayDownloads
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .forEach(item => listArea.appendChild(createDownloadItemElement(item)));
                }
              }

              function groupDownloadsByDate(downloads) {
                const groups = {};
                const now = new Date();

                downloads.forEach(download => {
                  const downloadDate = new Date(download.timestamp);
                  const diffTime = now - downloadDate;
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                  let dateKey;
                  if (diffDays === 0 && now.getDate() === downloadDate.getDate()) {
                    dateKey = 'Today';
                  } else if (diffDays === 1 || (diffDays === 0 && now.getDate() !== downloadDate.getDate())) {
                    dateKey = 'Yesterday';
                  } else if (diffDays < 7) {
                    dateKey = downloadDate.toLocaleDateString(undefined, { weekday: 'long' });
                  } else if (diffDays < 30) {
                    const currentWeekStart = new Date(now);
                    currentWeekStart.setDate(now.getDate() - now.getDay());
                    currentWeekStart.setHours(0, 0, 0, 0);

                    const downloadWeekStart = new Date(downloadDate);
                    downloadWeekStart.setDate(downloadDate.getDate() - downloadDate.getDay());
                    downloadWeekStart.setHours(0, 0, 0, 0);

                    const diffWeeks = Math.floor((currentWeekStart.getTime() - downloadWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));

                    if (diffWeeks === 1) dateKey = "Last Week";
                    else if (diffWeeks > 1 && diffWeeks <= 4) dateKey = `${diffWeeks} Weeks Ago`;
                    else dateKey = "Earlier this month";
                  } else if (diffDays < 365) {
                    dateKey = downloadDate.toLocaleDateString(undefined, { month: 'long' });
                  } else {
                    dateKey = downloadDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
                  }

                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(download);
                });
                return groups;
              }

              function createDownloadItemElement(item) {
                const el = document.createElement('div');
                el.className = 'haven-dl-item';
                if (item.status === 'failed') el.classList.add('failed-item');
                if (item.status === 'paused') el.classList.add('paused-item');

                const iconDetails = getFileIconDetails(item.filename);
                const statusInfo = getStatusInfo(item);

                let progressPercent = 0;
                if (item.status === 'completed') {
                  progressPercent = 100;
                } else if (item.progressBytes && item.totalBytes) {
                  progressPercent = item.totalBytes > 0 ? Math.min(100, Math.max(0, (item.progressBytes / item.totalBytes) * 100)) : 0;
                }

                const itemIconDiv = document.createElement('div');
                itemIconDiv.className = `haven-dl-item-icon ${iconDetails.className}`;
                itemIconDiv.textContent = iconDetails.text;

                const itemInfoDiv = document.createElement('div');
                itemInfoDiv.className = 'haven-dl-item-info';
                const itemNameDiv = document.createElement('div');
                itemNameDiv.className = 'haven-dl-item-name';
                itemNameDiv.title = `${item.filename || 'Unknown Filename'}\n${item.url || 'Unknown URL'}`;
                itemNameDiv.textContent = item.filename || 'Unknown Filename';
                const itemDetailsDiv = document.createElement('div');
                itemDetailsDiv.className = 'haven-dl-item-details';
                const sizeSpan = document.createElement('span');
                sizeSpan.textContent = formatBytes(item.totalBytes);
                const sepSpan = document.createElement('span');
                sepSpan.textContent = '•';
                const timeSpan = document.createElement('span');
                timeSpan.textContent = timeAgo(new Date(item.timestamp));
                const urlSpan = document.createElement('span');
                urlSpan.className = 'haven-dl-item-url';
                urlSpan.title = item.url || 'Unknown URL';
                urlSpan.textContent = item.url || 'Unknown URL';
                itemDetailsDiv.appendChild(sizeSpan);
                itemDetailsDiv.appendChild(sepSpan);
                itemDetailsDiv.appendChild(timeSpan);
                itemDetailsDiv.appendChild(urlSpan);
                itemInfoDiv.appendChild(itemNameDiv);
                itemInfoDiv.appendChild(itemDetailsDiv);

                const itemStatusSection = document.createElement('div');
                itemStatusSection.className = 'haven-dl-item-status-section';
                const progressBar = document.createElement('div');
                progressBar.className = 'haven-dl-item-progress-bar';
                const progressFill = document.createElement('div');
                progressFill.className = `haven-dl-item-progress-fill ${statusInfo.className}`;
                progressFill.style.width = `${progressPercent}%`;
                progressBar.appendChild(progressFill);
                const statusText = document.createElement('div');
                statusText.className = `haven-dl-item-status-text ${statusInfo.className}`;
                statusText.textContent = statusInfo.text;
                itemStatusSection.appendChild(progressBar);
                itemStatusSection.appendChild(statusText);

                const itemActionsDiv = document.createElement('div');
                itemActionsDiv.className = 'haven-dl-item-actions';
                
                const actionButtons = getActionButtonsDOM(item);
                actionButtons.forEach(button => itemActionsDiv.appendChild(button));

                el.appendChild(itemIconDiv);
                el.appendChild(itemInfoDiv);
                el.appendChild(itemStatusSection);
                el.appendChild(itemActionsDiv);

                itemActionsDiv.addEventListener('click', (e) => {
                  const action = e.target.closest('button')?.dataset.action;
                  if (action) handleItemAction(item, action, e);
                });

                itemInfoDiv.addEventListener('click', (e) => {
                  if (item.status === 'completed') {
                    handleItemAction(item, 'open', e);
                  }
                });
                return el;
              }

              function getActionButtonsDOM(item) {
                const buttons = [];
                
                function createSVGIcon(pathD) {
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("width", "16");
                  svg.setAttribute("height", "16");
                  svg.setAttribute("viewBox", "0 0 24 24");
                  svg.setAttribute("fill", "none");
                  
                  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                  path.setAttribute("d", pathD);
                  path.setAttribute("stroke", "currentColor");
                  path.setAttribute("stroke-width", "2");
                  path.setAttribute("stroke-linecap", "round");
                  path.setAttribute("stroke-linejoin", "round");
                  
                  svg.appendChild(path);
                  return svg;
                }
                
                function createActionButton(action, title, svgPathD) {
                  const button = document.createElement('button');
                  button.className = 'haven-dl-action-btn';
                  button.dataset.action = action;
                  button.title = title;
                  button.appendChild(createSVGIcon(svgPathD));
                  return button;
                }
                
                const OPEN_FOLDER_PATH = "M3 9H21M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z";
                const OPEN_ORIGIN_PATH = "M22 12C22 17.5228 17.5228 22 12 22M22 12C22 6.47715 17.5228 2 12 2M22 12H2M12 22C6.47715 22 2 17.5228 2 12M12 22C9.43223 19.3038 8 15.7233 8 12C8 8.27674 9.43223 4.69615 12 2M12 22C14.5678 19.3038 16 15.7233 16 12C16 8.27674 14.5678 4.69615 12 2M2 12C2 6.47715 6.47715 2 12 2";
                const DELETE_FILE_PATH = "M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6";
                const RETRY_DOWNLOAD_PATH = "M3 12C3 13.78 3.52784 15.5201 4.51677 17.0001C5.50571 18.4802 6.91131 19.6337 8.55585 20.3149C10.2004 20.9961 12.01 21.1743 13.7558 20.8271C15.5016 20.4798 17.1053 19.6226 18.364 18.364C19.6226 17.1053 20.4798 15.5016 20.8271 13.7558C21.1743 12.01 20.9961 10.2004 20.3149 8.55585C19.6337 6.91131 18.4802 5.50571 17.0001 4.51677C15.5201 3.52784 13.78 3 12 3C9.48395 3.00947 7.06897 3.99122 5.26 5.74L3 8M3 8V3M3 8H8";
                const RESUME_DOWNLOAD_PATH = "M6 3L20 12L6 21V3Z";
                
                if (item.status === 'completed') {
                  // Replace the two buttons with just one that uses the folder icon
                  buttons.push(createActionButton("show", "Show in Folder", OPEN_FOLDER_PATH));
                } else if (item.status === 'failed') {
                  buttons.push(createActionButton("retry", "Retry Download", RETRY_DOWNLOAD_PATH));
                } else if (item.status === 'paused') {
                  buttons.push(createActionButton("resume", "Resume Download", RESUME_DOWNLOAD_PATH));
                }
                
                buttons.push(createActionButton("copy", "Copy Download Link", OPEN_ORIGIN_PATH));
                buttons.push(createActionButton("remove", "Delete File", DELETE_FILE_PATH));
                
                return buttons;
              }

              function handleItemAction(item, action, event) {
                event.stopPropagation();
                switch (action) {
                  case 'open':
                    try {
                      if (!item.targetPath) { alert("File path not available."); return; }
                      let file = new FileUtils.File(item.targetPath);
                      if (file.exists()) file.launch();
                      else alert(`File not found: ${item.filename}`);
                    } catch (e) { console.error("Error opening file:", e); alert(`Could not open file: ${item.filename}`); }
                    break;
                  case 'show':
                    try {
                      if (!item.targetPath) { alert("File path not available."); return; }
                      let file = new FileUtils.File(item.targetPath);
                      if (file.exists()) file.reveal();
                      else alert(`File not found: ${item.filename}`);
                    } catch (e) { console.error("Error showing file:", e); alert(`Could not show file: ${item.filename}`); }
                    break;
                  case 'retry': alert(`Retry download: ${item.filename} (Conceptual)`); break;
                  case 'resume': alert(`Resume download: ${item.filename} (Conceptual)`); break;
                  case 'copy':
                    try { Cc["@mozilla.org/widget/clipboardhelper;1"].getService(Ci.nsIClipboardHelper).copyString(item.url); }
                    catch (e) { console.error("Error copying link:", e); alert("Could not copy link."); }
                    break;
                  case 'remove':
                    // Replace history removal with file deletion
                    if (!item.targetPath) {
                      alert("File path not available. Cannot delete file.");
                      return;
                    }

                    // Show confirmation popup
                    if (confirm(`Are you sure you want to permanently delete "${item.filename}" from your system?\n\nThis action cannot be undone.`)) {
                      try {
                        let file = new FileUtils.File(item.targetPath);
                        if (file.exists()) {
                          file.remove(false); // false = don't recursively delete directories
                          
                          // Mark the download as deleted in the UI without trying to remove from history
                          item.deleted = true;
                          
                          // Remove from our local list to update the UI
                          allFetchedDownloads = allFetchedDownloads.filter(d => d.id !== item.id);
                          updateAndRenderDownloadsList();
                          alert(`File "${item.filename}" was successfully deleted.`);
                        } else {
                          alert(`File "${item.filename}" not found on disk.`);
                        }
                      } catch (e) { 
                        console.error("Error deleting file:", e); 
                        alert(`Could not delete file: ${item.filename}\n\nError: ${e.message}`); 
                      }
                    }
                    break;
                }
              }

              function applyAllFilters() {
                const searchTermLower = currentSearchTerm.toLowerCase();
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

                filteredDisplayDownloads = allFetchedDownloads.filter(item => {
                  if (currentViewMode === 'recent' && item.timestamp < sevenDaysAgo) return false;
                  if (currentViewMode === 'history' && item.timestamp >= sevenDaysAgo) return false;
                  if (currentStatusFilter !== 'all' && item.status !== currentStatusFilter) return false;
                  
                  if (currentCategoryFilter !== 'all' && item.category !== currentCategoryFilter) {
                      return false;
                  }

                  const itemFilename = item.filename || "";
                  const itemUrl = item.url || "";

                  if (searchTermLower &&
                    !itemFilename.toLowerCase().includes(searchTermLower) &&
                    !itemUrl.toLowerCase().includes(searchTermLower)) {
                    return false;
                  }
                  return true;
                });
                filteredDisplayDownloads.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              }


              function attachEventListeners() {
                const searchInputEl = downloadsViewContainer.querySelector('.haven-dl-search-input');
                if (searchInputEl) searchInputEl.addEventListener('input', (e) => {
                  currentSearchTerm = e.target.value;
                  updateAndRenderDownloadsList();
                });

                const statusFilterEl = downloadsViewContainer.querySelector('#statusFilter');
                if (statusFilterEl) statusFilterEl.addEventListener('change', (e) => {
                  currentStatusFilter = e.target.value;
                  updateAndRenderDownloadsList();
                });

                downloadsViewContainer.querySelectorAll('.haven-dl-view-btn').forEach(btn => {
                  btn.addEventListener('click', (e) => {
                    currentViewMode = e.currentTarget.dataset.view;
                    downloadsViewContainer.querySelectorAll('.haven-dl-view-btn').forEach(b => b.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    updateAndRenderDownloadsList();
                  });
                });

                // --- MODIFIED: Event listener for category tabs for animation ---
                const categoryTabsContainerEl = downloadsViewContainer.querySelector('.haven-dl-category-tabs-container');
                categoryTabsContainerEl.querySelectorAll('.haven-dl-category-tab').forEach(tab => {
                  tab.addEventListener('click', (e) => {
                    const clickedTab = e.currentTarget;
                    currentCategoryFilter = clickedTab.dataset.category;

                    // Update active class for text color
                    categoryTabsContainerEl.querySelectorAll('.haven-dl-category-tab').forEach(t => t.classList.remove('active'));
                    clickedTab.classList.add('active');
                    
                    updateCategoryIndicatorPosition(clickedTab); // Animate indicator
                    updateAndRenderDownloadsList();
                  });
                });

                // Ensure initial indicator position is set after UI is fully ready
                const initialActiveCatTab = categoryTabsContainerEl.querySelector(`.haven-dl-category-tab[data-category="${currentCategoryFilter}"]`);
                if (initialActiveCatTab) {
                    updateCategoryIndicatorPosition(initialActiveCatTab);
                }
              }

              (async () => {
                try {
                  const { DownloadHistory } = ChromeUtils.importESModule("resource://gre/modules/DownloadHistory.sys.mjs");
                  const { Downloads } = ChromeUtils.importESModule("resource://gre/modules/Downloads.sys.mjs");
                  const { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
                  const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");

                  const isPrivate = PrivateBrowsingUtils.isContentWindowPrivate(window);
                  const list = await DownloadHistory.getList({ type: isPrivate ? Downloads.ALL : Downloads.PUBLIC });
                  const allDownloadsRaw = await list.getAll();

                  allFetchedDownloads = allDownloadsRaw.map(d => {
                    let filename = 'Unknown Filename';
                    let targetPath = '';

                    if (d.target && d.target.path) {
                      try {
                        let file = new FileUtils.File(d.target.path);
                        filename = file.leafName;
                        targetPath = d.target.path;
                      } catch (e) {
                        console.warn("[ZenHaven Downloads] Error creating FileUtils.File or getting leafName from path:", d.target.path, e);
                        const pathParts = String(d.target.path).split(/[\\/]/);
                        filename = pathParts.pop() || "ErrorInPathUtil";
                      }
                    }

                    if ((filename === 'Unknown Filename' || filename === "ErrorInPathUtil") && d.source && d.source.url) {
                      try {
                        const decodedUrl = decodeURIComponent(d.source.url);
                        let urlObj;
                        try {
                            urlObj = new URL(decodedUrl);
                            const pathSegments = urlObj.pathname.split('/');
                            filename = pathSegments.pop() || pathSegments.pop() || 'Unknown from URL Path';
                        } catch (urlParseError) { 
                            const urlPartsDirect = String(d.source.url).split('/');
                            const lastPartDirect = urlPartsDirect.pop() || urlPartsDirect.pop();
                            filename = (lastPartDirect.split('?')[0]) || 'Invalid URL Filename';
                        }
                      }
                      catch (e) {
                        console.warn("[ZenHaven Downloads] Error extracting filename from URL:", d.source.url, e);
                        const urlPartsDirect = String(d.source.url).split('/');
                        const lastPartDirect = urlPartsDirect.pop() || urlPartsDirect.pop();
                        filename = (lastPartDirect.split('?')[0]) || 'Invalid URL Filename';
                      }
                    }

                    let status = 'unknown';
                    let progressBytes = Number(d.bytesTransferredSoFar) || 0;
                    let totalBytes = Number(d.totalBytes) || 0;

                    if (d.succeeded) {
                      status = 'completed';
                      if (d.target && d.target.size && Number(d.target.size) > totalBytes) {
                        totalBytes = Number(d.target.size);
                      }
                      progressBytes = totalBytes;
                    } else if (d.error) { status = 'failed'; }
                    else if (d.canceled) { status = 'failed'; }
                    else if (d.stopped || d.hasPartialData || d.state === Downloads.STATE_PAUSED || d.state === Downloads.STATE_SCANNING || d.state === Downloads.STATE_BLOCKED_PARENTAL || d.state === Downloads.STATE_BLOCKED_POLICY || d.state === Downloads.STATE_BLOCKED_SECURITY || d.state === Downloads.STATE_DIRTY) {
                      status = 'paused';
                    } else if (d.state === Downloads.STATE_DOWNLOADING) { status = 'paused'; }

                    if (status === 'completed' && totalBytes === 0 && progressBytes > 0) {
                      totalBytes = progressBytes;
                    }

                    return {
                      id: d.id,
                      filename: String(filename || "FN_MISSING"),
                      size: formatBytes(totalBytes),
                      totalBytes: totalBytes,
                      progressBytes: progressBytes,
                      type: getFileIconDetails(String(filename || "tmp.file")).text.toLowerCase(),
                      category: getFileCategory(String(filename || "tmp.file")),
                      status: status,
                      url: String(d.source?.url || 'URL_MISSING'),
                      timestamp: d.endTime || d.startTime || Date.now(),
                      targetPath: String(targetPath || ""),
                      historicalData: d,
                    };
                  }).filter(d => d.timestamp);

                  const loggableDownloads = allFetchedDownloads.map(item => {
                    const { historicalData, ...rest } = item;
                    return { ...rest, historicalDataId: historicalData.id };
                  });
                  console.log("[ZenHaven Downloads] Processed Download Items (for logging):", JSON.parse(JSON.stringify(loggableDownloads)));

                  renderUI();
                } catch (err) {
                  console.error("[ZenHaven Downloads] Error fetching or processing download history:", err);
                  if (downloadsViewContainer) {
                    downloadsViewContainer.innerHTML = `<div class="haven-dl-empty-state"><p>Error loading download history (async init).</p><pre>${err.message}\n${err.stack}</pre></div>`;
                  }
                }
              })();

              sidebarContainer.appendChild(downloadsViewContainer);

              const downloadsStyles = document.createElement("style");
              downloadsStyles.id = "haven-downloads-styles";
              downloadsStyles.textContent = `
                :root {
                  --haven-dl-bg: #202020; --haven-dl-surface-bg: #2a2a2a; --haven-dl-text-primary: #E0E0E0;
                  --haven-dl-text-secondary: #A0A0A0; --haven-dl-text-disabled: #666666; --haven-dl-border-color: #404040;
                  --haven-dl-accent-color: #7B68EE; --haven-dl-accent-hover: #9370DB; --haven-dl-success-color: #5CB85C;
                  --haven-dl-warning-color: #F0AD4E; --haven-dl-error-color: #D9534F;
                  --haven-dl-icon-bg-pdf: linear-gradient(135deg, #D9534F, #CD5C5C); --haven-dl-icon-bg-zip: linear-gradient(135deg, #7B68EE, #6A5ACD);
                  --haven-dl-icon-bg-vid: linear-gradient(135deg, #F0AD4E, #EE9A2E); --haven-dl-icon-bg-doc: linear-gradient(135deg, #5BC0DE, #46B8DA);
                  --haven-dl-icon-bg-mp3: linear-gradient(135deg, #DB7093, #D86087); --haven-dl-icon-bg-img: linear-gradient(135deg, #5CB85C, #4CAF50);
                  --haven-dl-icon-bg-default: linear-gradient(135deg, #6c757d, #5a6268);
                }
                /* --- MODIFIED: Overall container background to transparent --- */
                .haven-downloads-container { display: flex; flex-direction: column; height: 100%; width: 100%; background-color: transparent; color: var(--haven-dl-text-primary); padding: 16px; box-sizing: border-box; overflow: hidden; font-family: system-ui, sans-serif; max-height: 100vh; }
                .haven-dl-header { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding: 0 8px; }
                .haven-dl-title-section { display: flex; align-items: center; gap: 10px; }
                /* .haven-dl-title-icon-placeholder { font-size: 24px; color: var(--haven-dl-accent-color); } */ /* Style removed as icon is removed */
                .haven-dl-title-text { font-size: 22px; font-weight: 600; margin: 0; line-height: 1; }
                .haven-dl-controls { flex-shrink: 0; display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; padding: 0 8px; }
                .haven-dl-search-filter-row { display: flex; gap: 10px; align-items: center; }
                .haven-dl-search-box { position: relative; flex-grow: 1; }
                .haven-dl-search-icon-placeholder { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--haven-dl-text-secondary); pointer-events: none; display: flex; align-items: center; justify-content: center; }
                .haven-dl-search-icon-placeholder svg { width: 16px; height: 16px; display: block; }
                .haven-dl-search-input { width: 100%; padding: 8px 10px 8px 34px; border: 1px solid var(--haven-dl-border-color); border-radius: 6px; background-color: var(--haven-dl-surface-bg); color: var(--haven-dl-text-primary); font-size: 14px; box-sizing: border-box; height: 36px; }
                .haven-dl-search-input:focus { outline: none; border-color: var(--haven-dl-accent-color); box-shadow: 0 0 0 2px rgba(123, 104, 238, 0.3); }
                .haven-dl-filter-dropdown { padding: 0 12px; border: 1px solid var(--haven-dl-border-color); border-radius: 6px; background-color: var(--haven-dl-surface-bg); color: var(--haven-dl-text-primary); font-size: 13px; cursor: pointer; box-sizing: border-box; height: 36px; -moz-appearance: none; background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23${"A0A0A0".substring(1)}%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.4-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 10px top 50%; background-size: .65em auto; padding-right: 30px; }
                .haven-dl-filter-dropdown:focus { outline: none; }
                .haven-dl-view-toggle { display: flex; background-color: var(--haven-dl-surface-bg); border-radius: 6px; border: 1px solid var(--haven-dl-border-color); overflow: hidden; height: 36px; }
                .haven-dl-view-btn { background-color: transparent; border: none; border-radius: 0; padding: 0 12px; color: var(--haven-dl-text-secondary); font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-grow: 1; }
                .haven-dl-view-btn:not(:last-child) { border-right: 1px solid var(--haven-dl-border-color); }
                .haven-dl-view-btn.active { background-color: var(--haven-dl-accent-color); color: white; }
                .haven-dl-view-btn:hover:not(.active) { background-color: var(--haven-dl-border-color); }
                
                /* --- MODIFIED: Styles for category tabs animation --- */
                .haven-dl-category-tabs-container { overflow: hidden; display: flex; gap: 4px; background-color: var(--haven-dl-surface-bg); padding: 4px; border-radius: 6px; border: 1px solid var(--haven-dl-border-color); position: relative; /* For absolute positioning of indicator */ }
                .haven-dl-category-active-indicator {
                  position: absolute;
                  top: 4px; /* Matches container padding */
                  height: 30px; /* Matches tab height */
                  background-color: var(--haven-dl-accent-color);
                  border-radius: 4px; /* Matches tab border-radius */
                  transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); /* Bouncy animation */
                  z-index: 0; /* Behind tab content */
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                .haven-dl-category-tab {
                  flex-grow: 1; padding: 6px 10px; border: none; background-color: transparent; /* No background on tab itself */
                  border-radius: 4px; font-size: 12px; font-weight: 500; color: var(--haven-dl-text-secondary);
                  cursor: pointer; transition: color 0.2s; /* Only color transition */
                  display: flex; align-items: center; justify-content: center; gap: 5px;
                  height: 30px; box-sizing: border-box;
                  position: relative; z-index: 1; /* Tab content above indicator */
                }
                .haven-dl-category-tab.active {
                  color: white; /* Active tab text color */
                  /* No background change here, indicator handles it */
                }
                .haven-dl-category-tab:hover:not(.active) {
                  color: var(--haven-dl-text-primary);
                  /* background-color: var(--haven-dl-border-color); */ /* Optional hover, consider if it clashes with indicator */
                }
                .haven-dl-category-tab .haven-dl-tab-icon { display: flex; align-items: center; justify-content: center; }
                .haven-dl-category-tab .haven-dl-tab-icon svg { width: 14px; height: 14px; }
                
                .haven-dl-stats-bar { flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--haven-dl-text-secondary); padding: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--haven-dl-border-color); }
                .haven-dl-stats-bar strong { color: var(--haven-dl-text-primary); font-weight: 500; }
                .haven-dl-list-container { flex: 1 1 0; overflow-y: auto; overflow-x: hidden; padding-right: 5px; scrollbar-width: thin; scrollbar-color: var(--haven-dl-border-color) var(--haven-dl-surface-bg); min-height: 0; height: 0; border: 1px solid transparent; }
                .haven-dl-list-container::-webkit-scrollbar { width: 8px; } .haven-dl-list-container::-webkit-scrollbar-track { background: var(--haven-dl-surface-bg); } .haven-dl-list-container::-webkit-scrollbar-thumb { background-color: var(--haven-dl-border-color); border-radius: 4px; }
                .haven-dl-date-separator { padding: 10px 8px; font-size: 11px; font-weight: 600; color: var(--haven-dl-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--haven-dl-border-color); margin: 16px 0 8px 0; position: sticky; top: -1px; background: var(--haven-dl-bg); /* This background might need to be transparent too if main one is */ z-index: 1; }
                .haven-dl-item { display: flex; align-items: center; padding: 12px 8px; border-bottom: 1px solid var(--haven-dl-border-color); transition: background-color 0.15s ease; cursor: default; }
                .haven-dl-item:hover { background-color: var(--haven-dl-surface-bg); } .haven-dl-item:last-child { border-bottom: none; }
                .haven-dl-item-icon { width: 36px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 13px; color: white; font-weight: bold; flex-shrink: 0; text-transform: uppercase; }
                .pdf-icon { background: var(--haven-dl-icon-bg-pdf); } .zip-icon { background: var(--haven-dl-icon-bg-zip); } .vid-icon { background: var(--haven-dl-icon-bg-vid); } .doc-icon { background: var(--haven-dl-icon-bg-doc); } .mp3-icon { background: var(--haven-dl-icon-bg-mp3); } .img-icon { background: var(--haven-dl-icon-bg-img); } .default-icon { background: var(--haven-dl-icon-bg-default); }
                .haven-dl-item-info { flex-grow: 1; min-width: 0; cursor: pointer; }
                .haven-dl-item-name { font-weight: 500; font-size: 14px; color: var(--haven-dl-text-primary); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .haven-dl-item-details { font-size: 12px; color: var(--haven-dl-text-secondary); display: flex; gap: 6px; align-items: center; }
                .haven-dl-item-url { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 1; max-width: 150px; }
                .haven-dl-item-status-section { min-width: 100px; text-align: right; margin-left: 12px; flex-shrink: 0; }
                .haven-dl-item-progress-bar { width: 100%; height: 4px; background-color: var(--haven-dl-border-color); border-radius: 2px; overflow: hidden; margin-bottom: 4px; }
                .haven-dl-item-progress-fill { height: 100%; border-radius: 2px; } .haven-dl-item-status-text { font-size: 11px; font-weight: 500; }
                .status-completed { color: var(--haven-dl-success-color); } .haven-dl-item-progress-fill.status-completed { background-color: var(--haven-dl-success-color); }
                .status-paused { color: var(--haven-dl-warning-color); } .haven-dl-item-progress-fill.status-paused { background-color: var(--haven-dl-warning-color); }
                .status-failed { color: var(--haven-dl-error-color); } .haven-dl-item-progress-fill.status-failed { background-color: var(--haven-dl-error-color); }
                .haven-dl-item-actions { display: flex; gap: 6px; margin-left: 16px; flex-shrink: 0; }
                .haven-dl-action-btn { width: 30px; height: 30px; border: none; border-radius: 4px; background-color: var(--haven-dl-surface-bg); color: var(--haven-dl-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color 0.2s, color 0.2s; font-size: 16px; }
                .haven-dl-action-btn:hover { background-color: var(--haven-dl-border-color); color: var(--haven-dl-text-primary); }
                .haven-dl-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--haven-dl-text-secondary); text-align: center; }
                .haven-dl-empty-icon-placeholder { font-size: 48px; color: var(--haven-dl-text-disabled); margin-bottom: 16px; }
                .haven-dl-empty-state p { font-size: 16px; }
              `;
              document.head.appendChild(downloadsStyles);
            }
          }

          if (mutation.type === "attributes" && mutation.attributeName === "haven-history") {
            console.log("[ZenHaven] History observer triggered");

            const existingHistory = sidebarContainer.querySelectorAll(".haven-history");
            existingHistory.forEach((el) => el.remove());

            if (sidebarContainer.hasAttribute("haven-history")) {
              const historyContainer = document.createElement("div");
              historyContainer.className = "haven-history";
              sidebarContainer.appendChild(historyContainer);

              const { PlacesUtils } = ChromeUtils.importESModule("resource://gre/modules/PlacesUtils.sys.mjs");
              const SESSION_TIMEOUT_MINUTES = 30;

              const startDate = new Date();
              startDate.setDate(startDate.getDate() - 7);

              const query = PlacesUtils.history.getNewQuery();
              query.beginTimeReference = query.TIME_RELATIVE_EPOCH;
              query.beginTime = startDate.getTime() * 1000;
              query.endTime = Date.now() * 1000;
              query.endTimeReference = query.TIME_RELATIVE_EPOCH;

              const options = PlacesUtils.history.getNewQueryOptions();
              options.sortingMode = options.SORT_BY_DATE_DESCENDING;
              options.resultType = options.RESULTS_AS_VISIT;
              options.includeHidden = false;

              const result = PlacesUtils.history.executeQuery(query, options);
              const root = result.root;
              root.containerOpen = true;

              const visitsByDate = new Map();

              for (let i = 0; i < root.childCount; i++) {
                const node = root.getChild(i);
                const visitTime = new Date(node.time / 1000);
                const dayKey = visitTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                if (!visitsByDate.has(dayKey)) visitsByDate.set(dayKey, []);
                visitsByDate.get(dayKey).push({ node, time: visitTime });
              }

              root.containerOpen = false;

              visitsByDate.forEach((visits, dayKey, index) => {
                const daySection = createCollapsible("📅 " + dayKey, false, "day-section");
                historyContainer.appendChild(daySection.wrapper);

                // Group by session within the day
                const sessions = [];
                let currentSession = [];
                let lastTime = null;

                visits.forEach(({ node, time }) => {
                  if (lastTime) {
                    const gap = (lastTime - time) / (1000 * 60);
                    if (gap > SESSION_TIMEOUT_MINUTES) {
                      if (currentSession.length > 0) {
                        sessions.push(currentSession);
                        currentSession = [];
                      }
                    }
                  }
                  currentSession.push({ node, time });
                  lastTime = time;
                });

                if (currentSession.length > 0) sessions.push(currentSession);

                sessions.forEach((session, idx) => {
                  const sessionStart = session[session.length - 1].time;
                  const sessionEnd = session[0].time;

                  const timeRange = `${sessionStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${sessionEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
                  const sessionTitle = `🕓 Session ${idx + 1} • ${timeRange}`;

                  const sessionSection = createCollapsible(sessionTitle, false, "session-section");
                  daySection.content.appendChild(sessionSection.wrapper);

                  session.forEach(({ node }) => {
                    const item = createHistoryItem(node);
                    sessionSection.content.appendChild(item);
                  });
                });
              });

              function createCollapsible(title, expanded = false, className = "") {
                const wrapper = document.createElement("div");
                wrapper.className = className;

                const header = document.createElement("div");
                header.className = "collapsible-header";
                header.innerHTML = `
                  <span class="section-toggle">${expanded ? "▼" : "▶"}</span>
                  <span class="section-title">${title}</span>
                `;

                const content = document.createElement("div");
                content.className = "collapsible-content";
                content.style.display = expanded ? "block" : "none";

                header.addEventListener("click", () => {
                  const isOpen = content.style.display === "block";
                  content.style.display = isOpen ? "none" : "block";
                  header.querySelector(".section-toggle").textContent = isOpen ? "▶" : "▼";
                });

                wrapper.appendChild(header);
                wrapper.appendChild(content);
                return { wrapper, content };
              }

              function createHistoryItem(node) {
                const item = document.createElement("div");
                item.className = "haven-history-item";

                const favicon = document.createElement("img");
                favicon.className = "history-icon";
                favicon.src = "https://www.google.com/s2/favicons?sz=32&domain_url=" + encodeURIComponent(node.uri);

                const content = document.createElement("div");
                content.className = "history-item-content";

                const title = document.createElement("div");
                title.className = "history-title";
                title.textContent = node.title || node.uri;

                const time = document.createElement("div");
                time.className = "history-time";
                time.textContent = new Date(node.time / 1000).toLocaleTimeString();

                content.appendChild(title);
                content.appendChild(time);

                item.appendChild(favicon);
                item.appendChild(content);

                item.addEventListener("click", () => {
                  gBrowser.selectedTab = gBrowser.addTab(node.uri, {
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal()
                  });
                });

                return item;

              }



              const style = document.createElement("style");
              style.textContent = `
                .haven-history {
                  padding: 16px;
                  height: 90vh;
                  width: 50vw;
                  overflow-y: auto;
                  background: var(--zen-background);
                }
          
                .day-section, .session-section {
                  margin-bottom: 12px;
                }
          
                .collapsible-header {
                  background: var(--zen-themed-toolbar-bg);
                  border-radius: 6px;
                  padding: 12px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  cursor: pointer;
                }
          
                .collapsible-header:hover {
                  background: var(--toolbarbutton-hover-background);
                }
          
                .section-toggle {
                  font-family: monospace;
                  font-size: 12px;
                  width: 16px;
                  text-align: center;
                  font-family: monospace;
                  font-size: 12px;
                  width: 16px;
                  text-align: center;
                  color: var(--toolbar-color);
                }
          
                .section-title {
                  font-weight: 600;
                  color: var(--toolbar-color);
                }
          
                .collapsible-content {
                  padding: 8px 12px;
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
                }
          
                .haven-history-item {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  padding: 8px;
                  border-radius: 4px;
                  transition: background-color 0.2s;
                  cursor: pointer;
                }
          
                .haven-history-item:hover {
                  background-color: var(--toolbarbutton-hover-background);
                }
          
                .history-icon {
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: var(--zen-colors-border);
                }
          
                .history-item-content {
                  display: flex;
                  flex-direction: column;
                  gap: 2px;
                }
          
                .history-title {
                  font-weight: 500;
                  color: var(--toolbar-color);
                }
          
                .history-time {
                  font-size: 0.85em;
                  color: var(--toolbar-color);
                  opacity: 0.75;
                }
              `;
              document.head.appendChild(style);
            }
          }


          if (mutation.type === "attributes" && mutation.attributeName === "haven-notes") {
            const sidebarContainer = document.getElementById("zen-haven-container");
            
            if (sidebarContainer.hasAttribute("haven-notes")) {
              // Only create new content if it doesn't exist
              if (!sidebarContainer.querySelector('#haven-notes-view')) {
                const notesViewContainer = document.createElement("div");
                notesViewContainer.id = "haven-notes-view";
            
                // Create header section with search and add button
                const headerSection = document.createElement("div");
                headerSection.id = "haven-notes-header";
            
                // Add button
                const addButton = document.createElement("button");
                addButton.id = "haven-notes-add-button";
                addButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>`;
                addButton.title = "Create new note";
            
                // Search bar
                const searchBar = document.createElement("input");
                searchBar.type = "text";
                searchBar.id = "haven-notes-search";
                searchBar.placeholder = "Search notes...";
            
                headerSection.appendChild(searchBar);
                headerSection.appendChild(addButton);
                notesViewContainer.appendChild(headerSection);
            
                // Notes grid container
                const notesGrid = document.createElement("div");
                notesGrid.id = "haven-notes-grid";
            
                // Create default note template
                const createNoteCard = () => {
                  const noteCard = document.createElement("div");
                  noteCard.className = "haven-note-card"; // Keep as class since multiple cards
                  noteCard.innerHTML = `
                    <svg class="note-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2H14.1716C14.702 2 15.2107 2.21071 15.5858 2.58579L19.4142 6.41421C19.7893 6.78929 20 7.29799 20 7.82843V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4ZM6 4H14V8C14 8.55228 14.4477 9 15 9H19V20H6V4ZM16 4.41421L18.5858 7H16V4.41421Z" fill="currentColor"/>
                    </svg>
                    <h1>Untitled</h1>
                    <p>Click to add page content</p>
                  `;
                  return noteCard;
                };
            
                addButton.addEventListener("click", () => {
                  const newNote = createNoteCard();
                  notesGrid.appendChild(newNote);
                });
            
                notesGrid.appendChild(createNoteCard());
                notesViewContainer.appendChild(notesGrid);
                sidebarContainer.appendChild(notesViewContainer);
            
                const notesStyles = document.createElement("style");
                notesStyles.id = "haven-notes-styles";
                notesStyles.textContent = `
                  #zen-haven-container[haven-notes] {
                    flex-direction: column !important;
                    overflow: hidden;
                    width: 100%;
                    height: 100%;
                    padding: 0;
                    box-sizing: border-box;
                  }
            
                  #haven-notes-view {
                    width: 100% !important;
                    height: 90vh;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    background: var(--zen-background);
                    overflow-y: auto !important;  /* Enable vertical scrolling */
                    scrollbar-width: thin;
                    scrollbar-color: var(--zen-tabs-border-color) var(--zen-sidebar-background);
                  }
            
                  #haven-notes-header {
                    position: sticky !important;  /* Keep header visible when scrolling */
                    top: 0 !important;
                    z-index: 10 !important;
                    background: var(--zen-background);
                    padding: 20px !important;
                    border-bottom: 1px solid var(--zen-tabs-border-color);
                    display: flex !important;
                    gap: 16px;
                    flex-direction: row-reverse !important; /* Reverse the order */
                  }
            
                  #haven-notes-add-button {
                    width: 40px;
                    height: 40px;
                    border: none;
                    border-radius: 8px;
                    background: var(--zen-toolbar-field-background);
                    color: var(--toolbar-color);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    flex-shrink: 0; /* Prevent button from shrinking */
                  }
            
                  #haven-notes-add-button:hover {
                    background: var(--toolbarbutton-hover-background);
                  }
            
                  #haven-notes-search {
                    flex: 1;
                    height: 40px;
                    border: none;
                    border-radius: 20px;
                    background: var(--zen-toolbar-field-background);
                    color: var(--toolbar-color);
                    padding: 0 16px;
                    font-size: 14px;
                  }
            
                  #haven-notes-search::placeholder {
                    color: var(--toolbar-color);
                    opacity: 0.7;
                  }
            
                  #haven-notes-grid {
                    flex: 1;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                    gap: 16px;
                    padding: 16px;
                    overflow-y: visible; /* Allow grid to scroll within parent */
                  }
            
                  /* Scrollbar styling */
                  #haven-notes-view::-webkit-scrollbar {
                    width: 8px;
                  }
            
                  #haven-notes-view::-webkit-scrollbar-track {
                    background: var(--zen-sidebar-background);
                    border-radius: 4px;
                  }
            
                  #haven-notes-view::-webkit-scrollbar-thumb {
                    background-color: var(--zen-tabs-border-color);
                    border-radius: 4px;
                    border: 2px solid var(--zen-sidebar-background);
                  }
            
                  .haven-note-card {
                    width: 150px;
                    height: 150px;
                    background: var(--zen-toolbar-field-background);
                    border-radius: 8px;
                    padding: 16px;
                    cursor: pointer;
                    transition: transform 0.2s, background 0.2s;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                  }
            
                  .haven-note-card:hover {
                    background: var(--toolbarbutton-hover-background);
                    transform: translateY(-2px);
                  }
            
                  .haven-note-card .note-icon {
                    color: var(--toolbar-color);
                    opacity: 0.8;
                  }
            
                  .haven-note-card h1 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--toolbar-color);
                  }
            
                  .haven-note-card p {
                    margin: 0;
                    font-size: 12px;
                    color: var(--toolbar-color);
                    opacity: 0.7;
                  }
                `;
                document.head.appendChild(notesStyles);
              }
            } else {
              // Clear content when attribute is removed
              while (sidebarContainer.firstChild) {
                sidebarContainer.removeChild(sidebarContainer.firstChild);
              }
            }
          }
        });
      });

      workspaceObserver.observe(sidebarContainer, { attributes: true });

      // Add styles for workspaces
      const workspaceStyles = document.createElement("style");
      workspaceStyles.textContent = `
        :root:has(#navigator-toolbox[haven]) {
          #zen-haven-container {
            display: flex !important;
            flex-direction: row !important;
            align-items: center;
            overflow-x: scroll;
            overflow-y: hidden;
              box-shadow:
                inset 10px 0 20px rgba(0, 0, 0, 0.5),  /* left */
                inset 0 0 20px rgba(0, 0, 0, 0.5),  /* bottom */
                inset 0 0 20px rgba(0, 0, 0, 0.5);   /* top */
            
            .haven-workspace {
              height: 85% !important;
              min-width: 20%;
              background-color: var(--zen-primary-color);
              margin-left: 30px;
              margin-right: 30px;
              border-radius: 8px;
              border: 2px solid var(--zen-colors-border);
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 10px !important;

              .tab-reset-pin-button {
                display: none;
              }

              .tab-icon-image {
                margin-right: 10px;
              }
              
              .haven-workspace-header {
                margin: 2px !important;
                
                .workspace-icon {
                  font-size: 16px;
                }
                
                .workspace-title {
                  font-size: 16px !important;
                  margin-right: 10px !important;
                }
              }
              
              .haven-workspace-content {
                margin: 0 !important;
                padding: 10px !important;
                display: flex !important;
                align-items: center !important;
                height: fit-content !important;
                width: 100% !important;
                overflow: hidden !important;
                align-items: flex-start;
                
                .haven-workspace-section {
                  display: flex !important;
                  position: relative !important;
                  min-height: 70px !important;
                  margin: 0 !important;
                  padding-inline: 2px !important;
                  transform: translateX(0) !important;
                }
              }
            }
          }
        }

        .haven-workspace {
          width: 20%;
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
        #custom-toolbar {
          width: 15vw;
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

        .custom-button:hover,
        .toolbarbutton-1:hover {
          background-color: var(--toolbarbutton-hover-background);
          transform: translateY(-1px);
        } 

        .custom-button.clicked {
          transform: translateY(1px);
          background-color: var(--toolbarbutton-active-background);
        } 

        .custom-button.active {
          background-color: var(--toolbarbutton-active-background);
          box-shadow: inset 0 0 0 1px var(--toolbar-bgcolor);
          transform: translateY(1px);
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
    const iconSVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3ZM3 3H13V13H3V3ZM5 5H11V6H5V5ZM11 7H5V8H11V7ZM5 9H11V10H5V9Z" fill="currentColor"/>
    </svg>`;
    const imageURL = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}")`;
    const openHaven = () => {
      const toolbox = document.getElementById('navigator-toolbox');
      if (toolbox) {
        if (toolbox.hasAttribute('haven')) {
          toolbox.removeAttribute('haven');
        } else {
          toolbox.setAttribute('haven', '');
        }
      }
    }

    console.log('[ZenHaven] Toggle button added to sidebar bottom buttons');
    const widget = {
      id: "zen-heven",
      type: "toolbarbutton",
      label: "Zen Heven",
      tooltip: "Zen Heven",
      class: "toolbarbutton-1 chromeclass-toolbar-additional",
      image: imageURL,
      callback: openHaven,
    }
    UC_API.Utils.createWidget(widget);
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
})()
