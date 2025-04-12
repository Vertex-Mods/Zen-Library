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
          const currentAttr = `haven-${config.command}`;
          const hasCurrentAttr = havenContainer.hasAttribute(currentAttr);

          // If clicking same button and container is visible, hide it
          if (hasCurrentAttr && havenContainer.style.display !== "none") {
            havenContainer.style.display = "none";
            havenContainer.removeAttribute(currentAttr);
            return;
          }

          // Remove all existing content first
          havenContainer.innerHTML = '';

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
                position: fixed;
                right: 16px;
                top: 16px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--toolbar-bgcolor);
                border-radius: 6px;
                cursor: pointer;
                transition: background 0.2s;
              }
              .haven-workspace-add-button:hover {
                background: var(--toolbar-hover-bgcolor);
              }
              .haven-workspace-add-button svg {
                color: var(--toolbar-color);
              }
            `;
            document.head.appendChild(workspaceStyles);

            // Create new workspace divs if attribute is present
            if (sidebarContainer.hasAttribute("haven-workspaces")) {
              // Create add workspace button
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

            const existingDownloadsContent = sidebarContainer.querySelector('.haven-downloads-view');
            if (existingDownloadsContent) {
              existingDownloadsContent.remove();
            }
            const existingDownloadsStyles = document.getElementById('haven-downloads-styles');
            if (existingDownloadsStyles) {
              existingDownloadsStyles.remove();
            }

            if (sidebarContainer.hasAttribute("haven-downloads")) {
              const downloadsViewContainer = document.createElement("div");
              downloadsViewContainer.className = "haven-downloads-view";

              const searchBar = document.createElement("div");
              searchBar.className = "haven-downloads-searchbar";
              const searchInput = document.createElement("input");
              searchInput.type = "text";
              searchInput.placeholder = "Search download history...";
              searchBar.appendChild(searchInput);
              downloadsViewContainer.appendChild(searchBar);

              const downloadsListArea = document.createElement("div");
              downloadsListArea.className = "haven-downloads-list-area";
              downloadsListArea.textContent = "Loading download history...";
              downloadsListArea.style.color = 'var(--toolbar-color, white)';
              downloadsViewContainer.appendChild(downloadsListArea);

              sidebarContainer.appendChild(downloadsViewContainer);

              (async () => {
                let downloadItems = [];
                try {
                  const { DownloadHistory } = ChromeUtils.importESModule("resource://gre/modules/DownloadHistory.sys.mjs");
                  const { Downloads } = ChromeUtils.importESModule("resource://gre/modules/Downloads.sys.mjs");
                  const { PrivateBrowsingUtils } = ChromeUtils.importESModule("resource://gre/modules/PrivateBrowsingUtils.sys.mjs");
                  const { FileUtils } = ChromeUtils.importESModule("resource://gre/modules/FileUtils.sys.mjs");
                  const { NetUtil } = ChromeUtils.importESModule("resource://gre/modules/NetUtil.sys.mjs");
                  const { OpenDownload } = ChromeUtils.importESModule("resource://gre/modules/DownloadsCommon.sys.mjs");

                  const isPrivate = PrivateBrowsingUtils.isContentWindowPrivate(window);
                  console.log("[ZenHaven Downloads] Fetching list. Private context:", isPrivate);

                  const list = await DownloadHistory.getList({
                    type: isPrivate ? Downloads.ALL : Downloads.PUBLIC
                  });

                  console.log("[ZenHaven Downloads] List object:", list);
                  const allDownloads = await list.getAll();
                  console.log(`[ZenHaven Downloads] Fetched ${allDownloads.length} download objects.`);

                  for (const download of allDownloads) {
                    if (!download.target || !download.target.path) {
                      continue;
                    }

                    let filename = 'Unknown Filename';
                    try {
                      let file = new FileUtils.File(download.target.path);
                      filename = file.leafName;
                    } catch (e) {
                      try {
                        filename = decodeURIComponent(download.source.url.split('/').pop().split('?')[0]);
                      } catch (urlError) {
                        console.warn("[ZenHaven Downloads] Error getting filename from path or URL:", e, urlError, download);
                      }
                    }

                    const timestamp = download.endTime || download.startTime;

                    let fileUri;
                    try {
                      let file = new FileUtils.File(download.target.path);
                      fileUri = NetUtil.newURI(file).spec;
                    } catch (e) {
                      console.warn("[ZenHaven Downloads] Error converting path to URI:", e, download.target.path);
                      continue;
                    }
                    downloadItems.push({
                      filename: filename || url?.split('/').pop() || 'Unknown Filename',
                      timestamp: timestamp,
                      url: download.source.url,
                      fileUri: fileUri
                    });
                    console.log(downloadItems)

                  }

                  console.log(`[ZenHaven Downloads] Processed ${downloadItems.length} valid download items.`);

                  downloadsListArea.textContent = '';

                  if (downloadItems.length === 0) {
                    downloadsListArea.textContent = "No downloads found in history.";
                    downloadsListArea.style.border = '1px dashed var(--error-color, red)';
                    downloadsListArea.style.color = 'var(--error-color, red)';
                  } else {
                    downloadsListArea.style.border = 'none';

                    const downloadsByDate = downloadItems.reduce((acc, download) => {
                      const date = new Date(download.timestamp);
                      const dateString = date.toISOString().split('T')[0];
                      if (!acc[dateString]) {
                        acc[dateString] = [];
                      }
                      acc[dateString].push(download);
                      return acc;
                    }, {});

                    function getDownloadCategory(filename) {
                      const name = filename || '';
                      const extension = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
                      const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'avif', 'jxl', 'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'opus'];
                      const docExtensions = ['pdf', 'epub', 'mobi', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'txt', 'log', 'csv', 'json', 'xml', 'md'];
                      const fileExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'img', 'exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm'];

                      if (mediaExtensions.includes(extension)) return 'media';
                      if (docExtensions.includes(extension)) return 'documents';
                      if (fileExtensions.includes(extension)) return 'files';
                      return 'files';
                    }

                    function escapeForHTMLAttr(str) {
                      if (!str) return '';
                      return str.toString()
                        .replace(/&/g, '&')
                        .replace(/</g, '<')
                        .replace(/>/g, '>')
                        .replace(/"/g, '"')
                        .replace(/'/g, '&#39;');
                    }

                    const sortedDates = Object.keys(downloadsByDate).sort((a, b) => b.localeCompare(a));

                    sortedDates.forEach((dateString, dateIndex) => {
                      const downloadsForDate = downloadsByDate[dateString].sort((a, b) => b.timestamp - a.timestamp);

                      const dateSection = document.createElement("div");
                      dateSection.className = "haven-downloads-date-section";
                      const dateHeader = document.createElement("div");
                      dateHeader.className = "haven-downloads-date-header";
                      const dateObj = new Date(dateString + 'T00:00:00');
                      const formattedDate = dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
                      dateHeader.innerHTML = `<span class="date-toggle">▼</span><span class="date-text">${formattedDate}</span>`;
                      dateSection.appendChild(dateHeader);

                      const dateContent = document.createElement("div");
                      dateContent.className = "haven-downloads-date-content";
                      dateSection.appendChild(dateContent);

                      const filesColumn = document.createElement("div");
                      filesColumn.className = "haven-downloads-column files-column";
                      filesColumn.innerHTML = '<div class="column-title">Files</div>';
                      const filesList = document.createElement("div");
                      filesList.className = "files-list";
                      filesColumn.appendChild(filesList);

                      const rightColumn = document.createElement("div");
                      rightColumn.className = "haven-downloads-column right-column";

                      const mediaColumn = document.createElement("div");
                      mediaColumn.className = "haven-downloads-subcolumn media-column";
                      mediaColumn.innerHTML = '<div class="column-title">Media</div>';
                      const mediaGrid = document.createElement("div");
                      mediaGrid.className = "media-grid";
                      mediaColumn.appendChild(mediaGrid);

                      const documentsColumn = document.createElement("div");
                      documentsColumn.className = "haven-downloads-subcolumn documents-column";
                      documentsColumn.innerHTML = '<div class="column-title">Documents</div>';
                      const documentsGrid = document.createElement("div");
                      documentsGrid.className = "documents-grid";
                      documentsColumn.appendChild(documentsGrid);

                      rightColumn.appendChild(mediaColumn);
                      rightColumn.appendChild(documentsColumn);

                      const separator = document.createElement("div");
                      separator.className = "column-separator";

                      dateContent.appendChild(filesColumn);
                      dateContent.appendChild(separator);
                      dateContent.appendChild(rightColumn);


                      let itemsAdded = false;
                      downloadsForDate.forEach((download) => {
                        const category = getDownloadCategory(download.filename);
                        try {
                          const safeFilenameForAttr = escapeForHTMLAttr(download.filename);
                          // const safeSourceUrlForAttr = escapeForHTMLAttr(download.url);
                          const safeFileUriForAttr = escapeForHTMLAttr(download.fileUri);
                          // const safeFilePathForAttr = escapeForHTMLAttr(download.filePath);
                          const titleAttr = `${safeFilenameForAttr}\nFile: ${safeFileUriForAttr}`;
                          const displayFilename = download.filename || 'Unknown Filename';

                          let targetElement;
                          let itemElement;
                          
                          // Opening the File
                          const handleItemClick = (event) => {
                            event.preventDefault();
                            try {
                              let filePath = download.fileUri.replace('file:///', '');
                              filePath = decodeURIComponent(filePath);

                              filePath = filePath.replace(/\//g, '\\');

                              let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);

                              if (filePath.match(/^[A-Za-z]:\\/)) {
                                file.initWithPath(filePath);
                              } else {
                                file.initWithPath(`C:\\${filePath}`);
                              }

                              if (file.exists()) {
                                try {
                                  file.launch();
                                } catch (launchError) {
                                  console.error('[ZenHaven] Error launching file:', launchError);
                                  alert(`Error opening file: ${download.filename}`);
                                }
                              } else {
                                console.error(`[ZenHaven] File not found: ${filePath}`);
                                alert(`File not found: ${download.filename}`);
                              }
                            } catch (err) {
                              console.error('[ZenHaven] Error opening file:', err);
                              alert(`Error accessing file: ${download.filename}`);
                            }
                          };

                          if (category === 'files') {
                            itemElement = document.createElement("div");
                            itemElement.className = "haven-download-file-item";
                            itemElement.innerHTML = `<div class="file-icon"></div><div class="file-details"><div class="file-name" title="${titleAttr}">${displayFilename}</div><div class="file-status">Complete</div></div>`; 
                            itemElement.addEventListener('click', handleItemClick);
                            targetElement = filesList;
                          } else if (category === 'media') {
                            itemElement = document.createElement("div");
                            itemElement.className = "haven-download-media-item";
                            itemElement.title = titleAttr;
                            itemElement.addEventListener('click', handleItemClick);
                            targetElement = mediaGrid;
                          } else if (category === 'documents') {
                            itemElement = document.createElement("div");
                            itemElement.className = "haven-download-document-item";
                            itemElement.title = titleAttr;
                            itemElement.addEventListener('click', handleItemClick);
                            targetElement = documentsGrid;
                          }

                          if (itemElement && targetElement) {
                            targetElement.appendChild(itemElement);
                            itemsAdded = true;
                          }

                        } catch (itemError) {
                          console.error("[ZenHaven Downloads] Error processing item:", itemError, download);
                          const errorItem = document.createElement('div');
                          errorItem.textContent = `Error displaying: ${download.filename || 'Unknown'}`;
                          errorItem.style.color = 'var(--error-color, red)';
                          errorItem.style.fontSize = '0.8em';
                          if (category === 'files') filesList.appendChild(errorItem);
                          else if (category === 'media') mediaGrid.appendChild(errorItem);
                          else if (category === 'documents') documentsGrid.appendChild(errorItem);
                        }
                      });

                      if (itemsAdded) {
                        dateHeader.addEventListener("click", () => {
                          const isExpanded = dateContent.style.display !== "none";
                          dateContent.style.display = isExpanded ? "none" : "";
                          dateHeader.querySelector(".date-toggle").textContent = isExpanded ? "▶" : "▼";
                        });
                        downloadsListArea.appendChild(dateSection);
                        if (dateIndex < sortedDates.length - 1) {
                          const horizontalSeparator = document.createElement("div");
                          horizontalSeparator.className = "date-separator";
                          downloadsListArea.appendChild(horizontalSeparator);
                        }
                      }
                    });
                  }

                } catch (err) {
                  console.error("[ZenHaven Downloads] Error fetching or processing download history:", err);
                  downloadsListArea.textContent = "Error loading download history.";
                  downloadsListArea.style.border = '1px dashed var(--error-color, red)';
                  downloadsListArea.style.color = 'var(--error-color, red)';
                }
              })();

              const downloadsStyles = document.createElement("style");
              downloadsStyles.id = "haven-downloads-styles";
              downloadsStyles.textContent = `
              #zen-haven-container[haven-downloads] {
                  flex-direction: column !important;
                  overflow: hidden;
                  width: 100%;
                  height: 100%;
                  padding: 0;
                  box-sizing: border-box;
              }

              .haven-downloads-view {
                  display: flex;
                  flex-direction: column;
                  height: 90vh;
                  width: 100%;
                  padding: 20px 32px 20px 40px;
                  box-sizing: border-box;
                  color: var(--toolbar-color, white);
              }

              .haven-downloads-searchbar {
                  width: 100%;
                  max-width: 500px;
                  height: 50px;
                  background-color: var(--zen-toolbar-field-background, #4B4B4B);
                  border-radius: 25px;
                  margin-bottom: 30px;
                  display: flex;
                  align-items: center;
                  padding: 0 15px;
                  box-sizing: border-box;
                  flex-shrink: 0;
              }

              .haven-downloads-searchbar input {
                  flex-grow: 1;
                  background: transparent;
                  border: none;
                  outline: none;
                  color: var(--toolbar-color, white);
                  font-size: 16px;
              }

              .haven-downloads-searchbar input::placeholder {
                  color: var(--toolbar-color, white);
                  opacity: 0.7;
              }

              .haven-downloads-list-area {
                  flex-grow: 1;
                  overflow-y: auto;
                  padding-right: 10px; /* space for scrollbar */
              }

              .haven-downloads-list-area::-webkit-scrollbar {
                  width: 8px;
              }

              .haven-downloads-list-area::-webkit-scrollbar-track {
                  background: var(--zen-sidebar-background, #2F2F2F);
                  border-radius: 4px;
              }

              .haven-downloads-list-area::-webkit-scrollbar-thumb {
                  background-color: var(--zen-tabs-border-color, #727272);
                  border-radius: 4px;
                  border: 2px solid var(--zen-sidebar-background, #2F2F2F);
              }

              /* For Firefox */
              .haven-downloads-list-area {
                  scrollbar-width: thin;
                  scrollbar-color: var(--zen-tabs-border-color, #727272) var(--zen-sidebar-background, #2F2F2F);
              }

              .haven-downloads-date-section {
                  margin-bottom: 15px;
              }

              .haven-downloads-date-header {
                  display: flex;
                  align-items: center;
                  cursor: pointer;
                  margin-bottom: 20px;
                  padding: 5px 0;
              }

              .haven-downloads-date-header .date-toggle {
                  font-size: 1.2em;
                  margin-right: 15px;
                  color: var(--toolbar-color, white);
                  width: 20px;
                  text-align: center;
                  user-select: none;
                  transition: transform 0.2s ease-in-out;
              }

              .haven-downloads-date-header .date-toggle:not(▼) {
                  transform: rotate(-90deg); /* Nicer toggle */
              }

              .haven-downloads-date-header .date-text {
                  font-size: 1.8em;
                  font-weight: 400;
                  font-family: 'Inter', sans-serif;
                  color: var(--toolbar-color, white);
              }

              .haven-downloads-date-content {
                  display: flex;
                  gap: 25px;
                  padding-left: 35px;
                  overflow: hidden; /* Needed for smooth toggle */
                  transition: all 0.3s ease-out;
              }

              .haven-downloads-date-content[style*="display: none"] {
                  max-height: 0;
                  padding-top: 0;
                  padding-bottom: 0;
                  max-height: 0;
                  padding-top: 0;
                  padding-bottom: 0;
                  margin-bottom: 0;
                  opacity: 0; /* Smooth collapse */
              }

              .haven-downloads-column {
                  display: flex;
                  flex-direction: column;
                  gap: 15px;
              }

              .files-column {
                  flex: 1;
                  min-width: 300px;
              }

              .right-column {
                  flex: 1.5;
                  min-width: 400px;
                  display: flex;
                  flex-direction: column;
                  gap: 30px;
              }

              .column-separator {
                  width: 2px;
                  background-color: var(--zen-tabs-border-color, #727272);
                  align-self: stretch;
                  flex-shrink: 0;
              }

              .haven-downloads-subcolumn {
                  display: flex;
                  flex-direction: column;
                  gap: 15px;
              }

              .column-title {
                  font-size: 1.5em;
                  font-weight: 400;
                  font-family: 'Inter', sans-serif;
                  color: var(--toolbar-color, white);
                  margin-bottom: 5px;
                  flex-shrink: 0;
              }

              .files-list {
                  display: flex;
                  flex-direction: column;
                  gap: 15px;
              }

              .haven-download-file-item {
                  display: flex;
                  align-items: center;
                  gap: 15px;
                  background-color: var(--zen-toolbar-field-background, #4B4B4B);
                  padding: 10px 12px;
                  border-radius: 4px;
                  min-height: 60px;
                  cursor: pointer;
                  transition: background-color 0.2s ease;
              }

              .haven-download-file-item:hover {
                  background-color: var(--zen-toolbar-field-background-hover, #5a5a5a);
              }

              .file-icon {
                  width: 40px;
                  height: 40px;
                  background-color: var(--zen-second-level-background, #424242);
                  border-radius: 3px;
                  flex-shrink: 0; /* Add generic file icon? */
              }

              .file-details {
                  flex-grow: 1;
                  display: flex;
                  flex-direction: column;
                  gap: 5px;
                  overflow: hidden;
              }

              .file-name {
                  font-size: 1em;
                  font-weight: 500;
                  color: var(--toolbar-color, white);
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }

              .file-status {
                  font-size: 0.85em;
                  color: var(--toolbar-color, white);
                  opacity: 0.8;
              }

              .media-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                  gap: 15px;
              }

              .haven-download-media-item {
                  width: 100%;
                  aspect-ratio: 1 / 1;
                  background-color: var(--zen-toolbar-field-background, #4B4B4B);
                  border-radius: 4px;
                  cursor: pointer;
                  background-size: cover;
                  background-position: center;
                  transition: transform 0.2s ease, box-shadow 0.2s ease;
              }

              .haven-download-media-item:hover {
                  transform: scale(1.05);
                  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
              }

              .documents-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                  gap: 20px;
              }

              .haven-download-document-item {
                  width: 100%;
                  aspect-ratio: 4 / 5;
                  background-color: var(--zen-toolbar-field-background, #4B4B4B);
                  border-radius: 4px;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center; /* Add generic doc icon? */
                  transition: background-color 0.2s ease;
              }

              .haven-download-document-item:hover {
                  background-color: var(--zen-toolbar-field-background-hover, #5a5a5a);
              }

              .date-separator {
                  height: 2px;
                  background-color: var(--zen-tabs-border-color, #727272);
                  margin: 30px 0;
                  flex-shrink: 0;
              }
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