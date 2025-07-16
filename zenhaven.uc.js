// ==UserScript==
// @name        Custom Toolbox UI (Safe Mode)
// @description Only injects UI when #navigator-toolbox has [haven]
// @include     main
// ==/UserScript==

(function() {
  const { document } = window;
  if (window.haven) {
    console.log("[ZenHaven] Already initialized. Aborting.");
    return;
  }
  console.log("[ZenHaven] Script loaded");

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

  class ZenHaven {
    constructor() {
      this.sections = new Map();
      this.activeSectionId = null;
      this.uiInitialized = false;
      this.elements = {
        toolbox: null,
        customToolbar: null,
        functionsContainer: null,
        havenContainer: null,
        bottomButtons: null,
        mediaToolbar: null,
      };
      console.log("[ZenHaven] Core object created");
    }

    addSection(config) {
      if (
        !config.id ||
        !config.label ||
        !config.icon ||
        typeof config.init !== "function"
      ) {
        console.error(
          "[ZenHaven] Invalid section config: id, label, icon, and init function are required.",
          config,
        );
        return;
      }
      if (this.sections.has(config.id)) {
        console.warn(
          `[ZenHaven] Section with id "${config.id}" already exists. Overwriting.`,
        );
      }

      const conditionMet =
        !config.condition ||
        (typeof config.condition === "function" && config.condition());
      if (conditionMet) {
        this.sections.set(config.id, config);
        console.log(`[ZenHaven] Section "${config.id}" registered.`);
      } else {
        console.log(
          `[ZenHaven] Condition not met for section "${config.id}". Skipping registration.`,
        );
      }
    }

    initializeUI() {
      console.log("[ZenHaven] Setting up UI...");
      this.elements.toolbox = document.getElementById("navigator-toolbox");
      if (
        !this.elements.toolbox ||
        !this.elements.toolbox.hasAttribute("haven")
      ) {
        console.log(
          "[ZenHaven] Toolbox not found or haven attribute is missing.",
        );
        return;
      }

      console.log("[ZenHaven] Haven attribute found, proceeding with UI setup");

      // Hide all children except the toolbox itself
      Array.from(this.elements.toolbox.children).forEach((child) => {
        child.style.display = "none";
      });

      // Create container for new UI elements
      const customContainer = document.createElement("div");
      customContainer.id = "custom-toolbar";
      this.elements.customToolbar = customContainer;
      this.elements.toolbox.appendChild(customContainer);

      // Create top div with header icon and text
      const topDiv = document.createElement("div");
      topDiv.id = "toolbar-header";
      const headerIcon = document.createElement("span");
      headerIcon.className = "toolbarbutton-1";
      headerIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" fill="currentColor"/>
      </svg>`;
      const headerText = document.createElement("span");
      headerText.className = "header-text";
      headerText.textContent = "Haven";
      topDiv.appendChild(headerIcon);
      topDiv.appendChild(headerText);
      customContainer.appendChild(topDiv);

      // Create middle container for function buttons
      const functionsContainer = document.createElement("div");
      functionsContainer.id = "functions-container";
      this.elements.functionsContainer = functionsContainer;
      customContainer.appendChild(functionsContainer);

      // Create buttons from registered sections
      this.sections.forEach((section) => this.createNavButton(section));

      // Handle bottom buttons
      this.elements.bottomButtons = document.getElementById(
        "zen-sidebar-bottom-buttons",
      );
      this.elements.mediaToolbar = document.getElementById(
        "zen-media-controls-toolbar",
      );
      const workspacesButton = this.elements.bottomButtons?.querySelector(
        "#zen-workspaces-button",
      );
      if (this.elements.bottomButtons && workspacesButton) {
        customContainer.appendChild(this.elements.bottomButtons);
        workspacesButton.style.display = "none";
      }

      // Create sidebar container
      const sidebarSplitter = document.getElementById("zen-sidebar-splitter");
      if (sidebarSplitter) {
        const sidebarContainer = document.createElement("div");
        sidebarContainer.id = "zen-haven-container";
        sidebarContainer.style.cssText = `height: 100%; width: 60vw; position: relative; display: none; flex-direction: column;`;
        this.elements.havenContainer = sidebarContainer;
        const tabbox = document.getElementById("tabbrowser-tabbox");
        if (tabbox) {
          tabbox.parentNode.insertBefore(sidebarContainer, tabbox);
          console.log(
            "[ZenHaven] Sidebar container added before tabbrowser-tabbox",
          );
        } else {
          sidebarSplitter.parentNode.insertBefore(
            sidebarContainer,
            sidebarSplitter.nextSibling,
          );
          console.log(
            "[ZenHaven] Tabbox not found, sidebar container added after splitter",
          );
        }
      }

      this.uiInitialized = true;
      console.log("[ZenHaven] UI setup complete");
    }

    destroyUI() {
      console.log("[ZenHaven] Restoring original UI");

      // Restore bottom buttons
      if (this.elements.bottomButtons && this.elements.mediaToolbar) {
        this.elements.mediaToolbar.parentNode.insertBefore(
          this.elements.bottomButtons,
          this.elements.mediaToolbar.nextSibling,
        );
        const workspacesButton = this.elements.bottomButtons.querySelector(
          "#zen-workspaces-button",
        );
        if (workspacesButton) {
          workspacesButton.style.display = "";
        }
        console.log("[ZenHaven] Bottom buttons restored after media controls");
      }

      // Show all original toolbox children
      if (this.elements.toolbox) {
        Array.from(this.elements.toolbox.children).forEach((child) => {
          if (child.id !== "custom-toolbar") {
            child.style.display = "";
          }
        });
      }

      // Remove our custom elements
      this.elements.customToolbar?.remove();
      this.elements.havenContainer?.remove();

      // Reset state
      this.activeSectionId = null;
      this.uiInitialized = false;
      Object.keys(this.elements).forEach((key) => (this.elements[key] = null));
    }

    createNavButton(section) {
      const customDiv = document.createElement("div");
      customDiv.className = "custom-button";
      customDiv.id = `haven-${section.id}-button`;

      const iconSpan = document.createElement("span");
      iconSpan.className = "icon";
      iconSpan.innerHTML = section.icon;

      const labelSpan = document.createElement("span");
      labelSpan.className = "label";
      labelSpan.textContent = section.label;

      customDiv.appendChild(iconSpan);
      customDiv.appendChild(labelSpan);

      customDiv.addEventListener("click", () =>
        this.activateSection(section.id),
      );
      customDiv.addEventListener("mousedown", () =>
        customDiv.classList.add("clicked"),
      );
      customDiv.addEventListener("mouseup", () =>
        customDiv.classList.remove("clicked"),
      );
      customDiv.addEventListener("mouseleave", () =>
        customDiv.classList.remove("clicked"),
      );

      this.elements.functionsContainer.appendChild(customDiv);
    }

    activateSection(id) {
      if (!this.uiInitialized) return;

      // If clicking the same button, toggle off
      if (this.activeSectionId === id) {
        this.deactivateCurrentSection();
        return;
      }

      this.deactivateCurrentSection();

      const section = this.sections.get(id);
      if (!section) {
        console.error(`[ZenHaven] No section found for id: ${id}`);
        return;
      }

      console.log(`[ZenHaven] Activating section: ${id}`);
      const contentElement = section.init();
      if (contentElement instanceof HTMLElement) {
        section.contentElement = contentElement;

        this.elements.havenContainer.setAttribute(`haven-${id}`, "");
        this.elements.havenContainer.appendChild(contentElement);
        this.elements.havenContainer.style.display = "flex";

        document.getElementById(`haven-${id}-button`)?.classList.add("active");
        this.activeSectionId = id;
      } else {
        console.error(
          `[ZenHaven] Section "${id}" init() did not return a valid DOM element.`,
        );
      }
    }

    deactivateCurrentSection() {
      if (!this.activeSectionId || !this.uiInitialized) return;

      const oldSection = this.sections.get(this.activeSectionId);

      if (oldSection && typeof oldSection.destroy === "function") {
        oldSection.destroy();
      }

      if (oldSection && oldSection.contentElement) {
        oldSection.contentElement.remove();
        delete oldSection.contentElement;
      }

      Array.from(this.elements.havenContainer.attributes)
        .filter((attr) => attr.name.startsWith("haven-"))
        .forEach((attr) =>
          this.elements.havenContainer.removeAttribute(attr.name),
        );

      this.elements.havenContainer.style.display = "none";

      document
        .getElementById(`haven-${this.activeSectionId}-button`)
        ?.classList.remove("active");
      this.activeSectionId = null;
    }
  }

  window.haven = new ZenHaven();

  // --- SECTION DEFINITIONS ---

  const downloadsSection = {
    id: "downloads",
    label: "Downloads",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8ZM8 4V8.5L11 10L10.5 11L7 9.25V4H8Z" fill="currentColor"/>
    </svg>`,
    init: function() {
      const downloadsViewContainer = document.createElement("div");
      downloadsViewContainer.className = "haven-downloads-container";

      // --- Data Store and State ---
      let allFetchedDownloads = [];
      let filteredDisplayDownloads = [];
      let currentViewMode = "recent";
      let currentStatusFilter = "all";
      let currentCategoryFilter = "all";
      let currentSearchTerm = "";
      let categoryActiveIndicatorEl;

      // --- All helper functions from original script ---
      function formatBytes(bytes, decimals = 2) {
        if (!+bytes || bytes === 0) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
      }

      function getFileIconDetails(filename) {
        const fn = filename || "";
        const extension = fn.includes(".")
          ? fn.split(".").pop().toLowerCase()
          : "file";
        switch (extension) {
          case "pdf":
            return { text: "PDF", className: "pdf-icon" };
          case "zip":
          case "rar":
          case "7z":
          case "tar":
          case "gz":
            return { text: "ZIP", className: "zip-icon" };
          case "mp4":
          case "mkv":
          case "avi":
          case "mov":
          case "webm":
            return { text: "VID", className: "vid-icon" };
          case "doc":
          case "docx":
          case "odt":
            return { text: "DOC", className: "doc-icon" };
          case "mp3":
          case "wav":
          case "ogg":
          case "aac":
          case "flac":
            return { text: "MP3", className: "mp3-icon" };
          case "png":
          case "jpg":
          case "jpeg":
          case "gif":
          case "bmp":
          case "svg":
          case "webp":
            return { text: "IMG", className: "img-icon" };
          case "txt":
            return { text: "TXT", className: "doc-icon" };
          case "xls":
          case "xlsx":
          case "csv":
            return { text: "XLS", className: "doc-icon" };
          case "ppt":
          case "pptx":
            return { text: "PPT", className: "doc-icon" };
          case "exe":
          case "msi":
          case "dmg":
            return { text: "EXE", className: "zip-icon" };
          default:
            return {
              text: extension.toUpperCase().substring(0, 3),
              className: "default-icon",
            };
        }
      }

      function getFileCategory(filename) {
        const fn = filename || "";
        const extension = fn.includes(".")
          ? fn.split(".").pop().toLowerCase()
          : "";
        if (
          [
            "png",
            "jpg",
            "jpeg",
            "gif",
            "bmp",
            "svg",
            "webp",
            "heic",
            "avif",
          ].includes(extension)
        )
          return "images";
        if (
          [
            "mp3",
            "wav",
            "ogg",
            "aac",
            "flac",
            "m4a",
            "mp4",
            "mkv",
            "avi",
            "mov",
            "webm",
            "flv",
          ].includes(extension)
        )
          return "media";
        return "documents";
      }

      function getStatusInfo(download) {
        const stat = download && download.status ? download.status : "unknown";
        switch (stat) {
          case "completed":
            return { text: "Completed", className: "status-completed" };
          case "failed":
            return { text: "Failed", className: "status-failed" };
          case "paused":
            return { text: "Paused", className: "status-paused" };
          default:
            return {
              text: stat.charAt(0).toUpperCase() + stat.slice(1),
              className: "status-unknown",
            };
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

      function renderUI() {
        downloadsViewContainer.innerHTML = "";

        const SEARCH_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21L16.66 16.66M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const ALL_FILES_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 14.0001L7.5 11.1001C7.66307 10.7762 7.91112 10.5028 8.21761 10.309C8.5241 10.1153 8.8775 10.0085 9.24 10.0001H20M20 10.0001C20.3055 9.99956 20.6071 10.069 20.8816 10.2032C21.1561 10.3373 21.3963 10.5326 21.5836 10.774C21.7709 11.0153 21.9004 11.2964 21.9622 11.5956C22.024 11.8949 22.0164 12.2043 21.94 12.5001L20.4 18.5001C20.2886 18.9317 20.0362 19.3136 19.6829 19.5854C19.3296 19.8571 18.8957 20.0031 18.45 20.0001H4C3.46957 20.0001 2.96086 19.7894 2.58579 19.4143C2.21071 19.0392 2 18.5305 2 18.0001V5.0001C2 4.46966 2.21071 3.96096 2.58579 3.58588C2.96086 3.21081 3.46957 3.0001 4 3.0001H7.9C8.23449 2.99682 8.56445 3.07748 8.8597 3.23472C9.15495 3.39195 9.40604 3.62072 9.59 3.9001L10.4 5.1001C10.5821 5.37663 10.83 5.60362 11.1215 5.7607C11.413 5.91778 11.7389 6.00004 12.07 6.0001H18C18.5304 6.0001 19.0391 6.21081 19.4142 6.58588C19.7893 6.96096 20 7.46966 20 8.0001V10.0001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const DOCS_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2V6C14 6.53043 14.2107 7.03914 14.5858 7.41421C14.9609 7.78929 15.4696 8 16 8H20M10 9H8M16 13H8M16 17H8M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const IMAGES_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15L17.914 11.914C17.5389 11.5391 17.0303 11.3284 16.5 11.3284C15.9697 11.3284 15.4611 11.5391 15.086 11.914L6 21M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3ZM11 9C11 10.1046 10.1046 11 9 11C7.89543 11 7 10.1046 7 9C7 7.89543 7.89543 7 9 7C10.1046 7 11 7.89543 11 9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        const MEDIA_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 10V13M6 6V17M10 3V21M14 8V15M18 5V18M22 10V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        const header = document.createElement("div");
        header.className = "haven-dl-header";
        const titleSection = document.createElement("div");
        titleSection.className = "haven-dl-title-section";
        const titleText = document.createElement("h1");
        titleText.className = "haven-dl-title-text";
        titleText.textContent = "Downloads";
        titleSection.appendChild(titleText);
        header.appendChild(titleSection);

        const controls = document.createElement("div");
        controls.className = "haven-dl-controls";
        const searchFilterRow = document.createElement("div");
        searchFilterRow.className = "haven-dl-search-filter-row";
        const searchBox = document.createElement("div");
        searchBox.className = "haven-dl-search-box";
        const searchIconPlaceholder = document.createElement("span");
        searchIconPlaceholder.className = "haven-dl-search-icon-placeholder";
        searchIconPlaceholder.innerHTML = SEARCH_SVG;
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.className = "haven-dl-search-input";
        searchInput.placeholder = "Search downloads...";
        searchInput.value = currentSearchTerm;
        searchBox.appendChild(searchIconPlaceholder);
        searchBox.appendChild(searchInput);
        searchFilterRow.appendChild(searchBox);

        const statusFilter = document.createElement("select");
        statusFilter.className = "haven-dl-filter-dropdown";
        statusFilter.id = "statusFilter";
        ["all", "completed", "paused", "failed"].forEach((val) => {
          const option = document.createElement("option");
          option.value = val;
          option.textContent =
            val === "paused"
              ? "Paused/Interrupted"
              : val.charAt(0).toUpperCase() + val.slice(1);
          if (val === currentStatusFilter) option.selected = true;
          statusFilter.appendChild(option);
        });
        searchFilterRow.appendChild(statusFilter);

        const viewToggle = document.createElement("div");
        viewToggle.className = "haven-dl-view-toggle";
        const recentBtn = document.createElement("button");
        recentBtn.className = `haven-dl-view-btn ${currentViewMode === "recent" ? "active" : ""}`;
        recentBtn.dataset.view = "recent";
        recentBtn.title = "Recent Downloads";
        recentBtn.textContent = "Recent";
        const historyBtn = document.createElement("button");
        historyBtn.className = `haven-dl-view-btn ${currentViewMode === "history" ? "active" : ""}`;
        historyBtn.dataset.view = "history";
        historyBtn.title = "Download History";
        historyBtn.textContent = "History";
        viewToggle.appendChild(recentBtn);
        viewToggle.appendChild(historyBtn);
        searchFilterRow.appendChild(viewToggle);
        controls.appendChild(searchFilterRow);

        const categoryTabsContainer = document.createElement("div");
        categoryTabsContainer.className = "haven-dl-category-tabs-container";
        categoryActiveIndicatorEl = document.createElement("div");
        categoryActiveIndicatorEl.className =
          "haven-dl-category-active-indicator";
        categoryTabsContainer.appendChild(categoryActiveIndicatorEl);

        const categories = [
          { id: "all", text: "All Files", svg: ALL_FILES_SVG },
          { id: "documents", text: "Documents", svg: DOCS_SVG },
          { id: "images", text: "Images", svg: IMAGES_SVG },
          { id: "media", text: "Media", svg: MEDIA_SVG },
        ];

        let firstTab = true;
        categories.forEach((cat) => {
          const tab = document.createElement("button");
          tab.className = `haven-dl-category-tab`;
          if (currentCategoryFilter === cat.id) tab.classList.add("active");
          tab.dataset.category = cat.id;
          const iconSpan = document.createElement("span");
          iconSpan.className = "haven-dl-tab-icon";
          iconSpan.innerHTML = cat.svg;
          const textSpan = document.createElement("span");
          textSpan.textContent = cat.text;
          tab.appendChild(iconSpan);
          tab.appendChild(textSpan);
          categoryTabsContainer.appendChild(tab);
          if (firstTab && currentCategoryFilter === cat.id) {
            requestAnimationFrame(() => updateCategoryIndicatorPosition(tab));
          }
          firstTab = false;
        });
        controls.appendChild(categoryTabsContainer);

        const stats = document.createElement("div");
        stats.className = "haven-dl-stats-bar";
        const statsCounts = document.createElement("div");
        statsCounts.className = "haven-dl-stats-counts";
        statsCounts.innerHTML = `Total: <strong id="totalCount">0</strong> Active: <strong id="activeCount">0</strong> Completed: <strong id="completedCount">0</strong>`;
        const viewInfoText = document.createElement("div");
        viewInfoText.className = "haven-dl-view-info";
        viewInfoText.id = "viewInfoText";
        viewInfoText.textContent = "Showing recent downloads";
        stats.appendChild(statsCounts);
        stats.appendChild(viewInfoText);

        downloadsViewContainer.appendChild(header);
        downloadsViewContainer.appendChild(controls);
        downloadsViewContainer.appendChild(stats);

        const listContainer = document.createElement("div");
        listContainer.className = "haven-dl-list-container";
        listContainer.id = "downloadsListArea";
        downloadsViewContainer.appendChild(listContainer);

        updateAndRenderDownloadsList();
        attachEventListeners();

        const initialActiveTab = categoryTabsContainer.querySelector(
          `.haven-dl-category-tab[data-category="${currentCategoryFilter}"]`,
        );
        if (initialActiveTab) {
          requestAnimationFrame(() =>
            updateCategoryIndicatorPosition(initialActiveTab),
          );
        }
      }

      function updateCategoryIndicatorPosition(activeTabElement) {
        if (!categoryActiveIndicatorEl || !activeTabElement) return;
        const tabContainer = activeTabElement.parentElement;
        if (!tabContainer) return;
        const containerRect = tabContainer.getBoundingClientRect();
        const tabRect = activeTabElement.getBoundingClientRect();
        categoryActiveIndicatorEl.style.left = `${tabRect.left - containerRect.left}px`;
        categoryActiveIndicatorEl.style.width = `${activeTabElement.offsetWidth}px`;
      }

      function updateAndRenderDownloadsList() {
        applyAllFilters();
        const listArea =
          downloadsViewContainer.querySelector("#downloadsListArea");
        if (!listArea) {
          console.error(
            "downloadsListArea not found in updateAndRenderDownloadsList",
          );
          return;
        }
        listArea.innerHTML = "";
        const totalCountEl =
          downloadsViewContainer.querySelector("#totalCount");
        const activeCountEl =
          downloadsViewContainer.querySelector("#activeCount");
        const completedCountEl =
          downloadsViewContainer.querySelector("#completedCount");
        const viewInfoTextEl =
          downloadsViewContainer.querySelector("#viewInfoText");
        if (totalCountEl) totalCountEl.textContent = allFetchedDownloads.length;
        if (activeCountEl)
          activeCountEl.textContent = allFetchedDownloads.filter(
            (d) => d.status === "paused",
          ).length;
        if (completedCountEl)
          completedCountEl.textContent = allFetchedDownloads.filter(
            (d) => d.status === "completed",
          ).length;
        if (viewInfoTextEl)
          viewInfoTextEl.textContent =
            currentViewMode === "recent"
              ? "Showing recent downloads"
              : "Showing download history";
        if (filteredDisplayDownloads.length === 0) {
          const emptyState = document.createElement("div");
          emptyState.className = "haven-dl-empty-state";
          const emptyIcon = document.createElement("span");
          emptyIcon.className = "haven-dl-empty-icon-placeholder";
          emptyIcon.textContent = "📥";
          const emptyText = document.createElement("p");
          emptyText.textContent = "No downloads found.";
          emptyState.appendChild(emptyIcon);
          emptyState.appendChild(emptyText);
          listArea.appendChild(emptyState);
          return;
        }
        if (currentViewMode === "history") {
          const groupedByDate = groupDownloadsByDate(filteredDisplayDownloads);
          Object.keys(groupedByDate)
            .sort((a, b) => {
              if (a === "Today") return -1;
              if (b === "Today") return 1;
              if (a === "Yesterday") return -1;
              if (b === "Yesterday") return 1;
              const tsA =
                groupedByDate[a] && groupedByDate[a][0]
                  ? groupedByDate[a][0].timestamp
                  : 0;
              const tsB =
                groupedByDate[b] && groupedByDate[b][0]
                  ? groupedByDate[b][0].timestamp
                  : 0;
              return tsB - tsA;
            })
            .forEach((dateKey) => {
              const dateSeparator = document.createElement("div");
              dateSeparator.className = "haven-dl-date-separator";
              dateSeparator.textContent = dateKey;
              listArea.appendChild(dateSeparator);
              groupedByDate[dateKey]
                .sort((a, b) => b.timestamp - a.timestamp)
                .forEach((item) =>
                  listArea.appendChild(createDownloadItemElement(item)),
                );
            });
        } else {
          filteredDisplayDownloads
            .sort((a, b) => b.timestamp - a.timestamp)
            .forEach((item) =>
              listArea.appendChild(createDownloadItemElement(item)),
            );
        }
      }
      function groupDownloadsByDate(downloads) {
        const groups = {};
        const now = new Date();
        downloads.forEach((download) => {
          const downloadDate = new Date(download.timestamp);
          const diffTime = now - downloadDate;
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          let dateKey;
          if (diffDays === 0 && now.getDate() === downloadDate.getDate())
            dateKey = "Today";
          else if (
            diffDays === 1 ||
            (diffDays === 0 && now.getDate() !== downloadDate.getDate())
          )
            dateKey = "Yesterday";
          else if (diffDays < 7)
            dateKey = downloadDate.toLocaleDateString(undefined, {
              weekday: "long",
            });
          else if (diffDays < 30) {
            const currentWeekStart = new Date(now);
            currentWeekStart.setDate(now.getDate() - now.getDay());
            currentWeekStart.setHours(0, 0, 0, 0);
            const downloadWeekStart = new Date(downloadDate);
            downloadWeekStart.setDate(
              downloadDate.getDate() - downloadDate.getDay(),
            );
            downloadWeekStart.setHours(0, 0, 0, 0);
            const diffWeeks = Math.floor(
              (currentWeekStart.getTime() - downloadWeekStart.getTime()) /
              (7 * 24 * 60 * 60 * 1000),
            );
            if (diffWeeks === 1) dateKey = "Last Week";
            else if (diffWeeks > 1 && diffWeeks <= 4)
              dateKey = `${diffWeeks} Weeks Ago`;
            else dateKey = "Earlier this month";
          } else if (diffDays < 365)
            dateKey = downloadDate.toLocaleDateString(undefined, {
              month: "long",
            });
          else
            dateKey = downloadDate.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            });
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(download);
        });
        return groups;
      }
      function createDownloadItemElement(item) {
        const el = document.createElement("div");
        el.className = "haven-dl-item";
        if (item.status === "failed") el.classList.add("failed-item");
        if (item.status === "paused") el.classList.add("paused-item");
        const iconDetails = getFileIconDetails(item.filename);
        const statusInfo = getStatusInfo(item);
        let progressPercent = 0;
        if (item.status === "completed") progressPercent = 100;
        else if (item.progressBytes && item.totalBytes)
          progressPercent =
            item.totalBytes > 0
              ? Math.min(
                100,
                Math.max(0, (item.progressBytes / item.totalBytes) * 100),
              )
              : 0;
        const itemIconDiv = document.createElement("div");
        itemIconDiv.className = `haven-dl-item-icon ${iconDetails.className}`;
        itemIconDiv.textContent = iconDetails.text;
        const itemInfoDiv = document.createElement("div");
        itemInfoDiv.className = "haven-dl-item-info";
        const itemNameDiv = document.createElement("div");
        itemNameDiv.className = "haven-dl-item-name";
        itemNameDiv.title = `${item.filename || "Unknown Filename"}\n${item.url || "Unknown URL"}`;
        itemNameDiv.textContent = item.filename || "Unknown Filename";
        const itemDetailsDiv = document.createElement("div");
        itemDetailsDiv.className = "haven-dl-item-details";
        const sizeSpan = document.createElement("span");
        sizeSpan.textContent = formatBytes(item.totalBytes);
        const sepSpan = document.createElement("span");
        sepSpan.textContent = "•";
        const timeSpan = document.createElement("span");
        timeSpan.textContent = timeAgo(new Date(item.timestamp));
        const urlSpan = document.createElement("span");
        urlSpan.className = "haven-dl-item-url";
        urlSpan.title = item.url || "Unknown URL";
        urlSpan.textContent = item.url || "Unknown URL";
        itemDetailsDiv.appendChild(sizeSpan);
        itemDetailsDiv.appendChild(sepSpan);
        itemDetailsDiv.appendChild(timeSpan);
        itemDetailsDiv.appendChild(urlSpan);
        itemInfoDiv.appendChild(itemNameDiv);
        itemInfoDiv.appendChild(itemDetailsDiv);
        const itemStatusSection = document.createElement("div");
        itemStatusSection.className = "haven-dl-item-status-section";
        const progressBar = document.createElement("div");
        progressBar.className = "haven-dl-item-progress-bar";
        const progressFill = document.createElement("div");
        progressFill.className = `haven-dl-item-progress-fill ${statusInfo.className}`;
        progressFill.style.width = `${progressPercent}%`;
        progressBar.appendChild(progressFill);
        const statusText = document.createElement("div");
        statusText.className = `haven-dl-item-status-text ${statusInfo.className}`;
        statusText.textContent = statusInfo.text;
        itemStatusSection.appendChild(progressBar);
        itemStatusSection.appendChild(statusText);
        const itemActionsDiv = document.createElement("div");
        itemActionsDiv.className = "haven-dl-item-actions";
        const actionButtons = getActionButtonsDOM(item);
        actionButtons.forEach((button) => itemActionsDiv.appendChild(button));
        el.appendChild(itemIconDiv);
        el.appendChild(itemInfoDiv);
        el.appendChild(itemStatusSection);
        el.appendChild(itemActionsDiv);
        itemActionsDiv.addEventListener("click", (e) => {
          const action = e.target.closest("button")?.dataset.action;
          if (action) handleItemAction(item, action, e);
        });
        itemInfoDiv.addEventListener("click", (e) => {
          if (item.status === "completed") handleItemAction(item, "open", e);
        });
        return el;
      }
      function getActionButtonsDOM(item) {
        const buttons = [];
        function createSVGIcon(pathD) {
          const svg = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg",
          );
          svg.setAttribute("width", "16");
          svg.setAttribute("height", "16");
          svg.setAttribute("viewBox", "0 0 24 24");
          svg.setAttribute("fill", "none");
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path",
          );
          path.setAttribute("d", pathD);
          path.setAttribute("stroke", "currentColor");
          path.setAttribute("stroke-width", "2");
          path.setAttribute("stroke-linecap", "round");
          path.setAttribute("stroke-linejoin", "round");
          svg.appendChild(path);
          return svg;
        }
        function createActionButton(action, title, svgPathD) {
          const button = document.createElement("button");
          button.className = "haven-dl-action-btn";
          button.dataset.action = action;
          button.title = title;
          button.appendChild(createSVGIcon(svgPathD));
          return button;
        }
        const OPEN_FOLDER_PATH =
          "M3 9H21M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z";
        const OPEN_ORIGIN_PATH =
          "M22 12C22 17.5228 17.5228 22 12 22M22 12C22 6.47715 17.5228 2 12 2M22 12H2M12 22C6.47715 22 2 17.5228 2 12M12 22C9.43223 19.3038 8 15.7233 8 12C8 8.27674 9.43223 4.69615 12 2M12 22C14.5678 19.3038 16 15.7233 16 12C16 8.27674 14.5678 4.69615 12 2M2 12C2 6.47715 6.47715 2 12 2";
        const DELETE_FILE_PATH =
          "M3 6H21M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6";
        const RETRY_DOWNLOAD_PATH =
          "M3 12C3 13.78 3.52784 15.5201 4.51677 17.0001C5.50571 18.4802 6.91131 19.6337 8.55585 20.3149C10.2004 20.9961 12.01 21.1743 13.7558 20.8271C15.5016 20.4798 17.1053 19.6226 18.364 18.364C19.6226 17.1053 20.4798 15.5016 20.8271 13.7558C21.1743 12.01 20.9961 10.2004 20.3149 8.55585C19.6337 6.91131 18.4802 5.50571 17.0001 4.51677C15.5201 3.52784 13.78 3 12 3C9.48395 3.00947 7.06897 3.99122 5.26 5.74L3 8M3 8V3M3 8H8";
        const RESUME_DOWNLOAD_PATH = "M6 3L20 12L6 21V3Z";
        if (item.status === "completed")
          buttons.push(
            createActionButton("show", "Show in Folder", OPEN_FOLDER_PATH),
          );
        else if (item.status === "failed")
          buttons.push(
            createActionButton("retry", "Retry Download", RETRY_DOWNLOAD_PATH),
          );
        else if (item.status === "paused")
          buttons.push(
            createActionButton(
              "resume",
              "Resume Download",
              RESUME_DOWNLOAD_PATH,
            ),
          );
        buttons.push(
          createActionButton("copy", "Copy Download Link", OPEN_ORIGIN_PATH),
        );
        buttons.push(
          createActionButton("remove", "Delete File", DELETE_FILE_PATH),
        );
        return buttons;
      }
      function handleItemAction(item, action, event) {
        event.stopPropagation();
        switch (action) {
          case "open":
            try {
              if (!item.targetPath) {
                alert("File path not available.");
                return;
              }
              let file = new FileUtils.File(item.targetPath);
              if (file.exists()) file.launch();
              else alert(`File not found: ${item.filename}`);
            } catch (e) {
              console.error("Error opening file:", e);
              alert(`Could not open file: ${item.filename}`);
            }
            break;
          case "show":
            try {
              if (!item.targetPath) {
                alert("File path not available.");
                return;
              }
              let file = new FileUtils.File(item.targetPath);
              if (file.exists()) file.reveal();
              else alert(`File not found: ${item.filename}`);
            } catch (e) {
              console.error("Error showing file:", e);
              alert(`Could not show file: ${item.filename}`);
            }
            break;
          case "retry":
            alert(`Retry download: ${item.filename} (Conceptual)`);
            break;
          case "resume":
            alert(`Resume download: ${item.filename} (Conceptual)`);
            break;
          case "copy":
            try {
              Cc["@mozilla.org/widget/clipboardhelper;1"]
                .getService(Ci.nsIClipboardHelper)
                .copyString(item.url);
            } catch (e) {
              console.error("Error copying link:", e);
              alert("Could not copy link.");
            }
            break;
          case "remove":
            if (!item.targetPath) {
              alert("File path not available. Cannot delete file.");
              return;
            }
            if (
              confirm(
                `Are you sure you want to permanently delete "${item.filename}" from your system?\n\nThis action cannot be undone.`,
              )
            ) {
              try {
                let file = new FileUtils.File(item.targetPath);
                if (file.exists()) {
                  file.remove(false);
                  item.deleted = true;
                  allFetchedDownloads = allFetchedDownloads.filter(
                    (d) => d.id !== item.id,
                  );
                  updateAndRenderDownloadsList();
                  alert(`File "${item.filename}" was successfully deleted.`);
                } else {
                  alert(`File "${item.filename}" not found on disk.`);
                }
              } catch (e) {
                console.error("Error deleting file:", e);
                alert(
                  `Could not delete file: ${item.filename}\n\nError: ${e.message}`,
                );
              }
            }
            break;
        }
      }
      function applyAllFilters() {
        const searchTermLower = currentSearchTerm.toLowerCase();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        filteredDisplayDownloads = allFetchedDownloads.filter((item) => {
          if (currentViewMode === "recent" && item.timestamp < sevenDaysAgo)
            return false;
          if (currentViewMode === "history" && item.timestamp >= sevenDaysAgo)
            return false;
          if (
            currentStatusFilter !== "all" &&
            item.status !== currentStatusFilter
          )
            return false;
          if (
            currentCategoryFilter !== "all" &&
            item.category !== currentCategoryFilter
          )
            return false;
          const itemFilename = item.filename || "";
          const itemUrl = item.url || "";
          if (
            searchTermLower &&
            !itemFilename.toLowerCase().includes(searchTermLower) &&
            !itemUrl.toLowerCase().includes(searchTermLower)
          )
            return false;
          return true;
        });
        filteredDisplayDownloads.sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
        );
      }
      function attachEventListeners() {
        const searchInputEl = downloadsViewContainer.querySelector(
          ".haven-dl-search-input",
        );
        if (searchInputEl)
          searchInputEl.addEventListener("input", (e) => {
            currentSearchTerm = e.target.value;
            updateAndRenderDownloadsList();
          });
        const statusFilterEl =
          downloadsViewContainer.querySelector("#statusFilter");
        if (statusFilterEl)
          statusFilterEl.addEventListener("change", (e) => {
            currentStatusFilter = e.target.value;
            updateAndRenderDownloadsList();
          });
        downloadsViewContainer
          .querySelectorAll(".haven-dl-view-btn")
          .forEach((btn) => {
            btn.addEventListener("click", (e) => {
              currentViewMode = e.currentTarget.dataset.view;
              downloadsViewContainer
                .querySelectorAll(".haven-dl-view-btn")
                .forEach((b) => b.classList.remove("active"));
              e.currentTarget.classList.add("active");
              updateAndRenderDownloadsList();
            });
          });
        const categoryTabsContainerEl = downloadsViewContainer.querySelector(
          ".haven-dl-category-tabs-container",
        );
        categoryTabsContainerEl
          .querySelectorAll(".haven-dl-category-tab")
          .forEach((tab) => {
            tab.addEventListener("click", (e) => {
              const clickedTab = e.currentTarget;
              currentCategoryFilter = clickedTab.dataset.category;
              categoryTabsContainerEl
                .querySelectorAll(".haven-dl-category-tab")
                .forEach((t) => t.classList.remove("active"));
              clickedTab.classList.add("active");
              updateCategoryIndicatorPosition(clickedTab);
              updateAndRenderDownloadsList();
            });
          });
        const initialActiveCatTab = categoryTabsContainerEl.querySelector(
          `.haven-dl-category-tab[data-category="${currentCategoryFilter}"]`,
        );
        if (initialActiveCatTab) {
          updateCategoryIndicatorPosition(initialActiveCatTab);
        }
      }

      (async () => {
        try {
          const { DownloadHistory } = ChromeUtils.importESModule(
            "resource://gre/modules/DownloadHistory.sys.mjs",
          );
          const { Downloads } = ChromeUtils.importESModule(
            "resource://gre/modules/Downloads.sys.mjs",
          );
          const { PrivateBrowsingUtils } = ChromeUtils.importESModule(
            "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
          );
          const { FileUtils } = ChromeUtils.importESModule(
            "resource://gre/modules/FileUtils.sys.mjs",
          );

          const isPrivate = PrivateBrowsingUtils.isContentWindowPrivate(window);
          const list = await DownloadHistory.getList({
            type: isPrivate ? Downloads.ALL : Downloads.PUBLIC,
          });
          const allDownloadsRaw = await list.getAll();

          allFetchedDownloads = allDownloadsRaw
            .map((d) => {
              let filename = "Unknown Filename";
              let targetPath = "";
              if (d.target && d.target.path) {
                try {
                  let file = new FileUtils.File(d.target.path);
                  filename = file.leafName;
                  targetPath = d.target.path;
                } catch (e) {
                  console.warn(
                    "[ZenHaven Downloads] Error creating FileUtils.File or getting leafName from path:",
                    d.target.path,
                    e,
                  );
                  const pathParts = String(d.target.path).split(/[\\/]/);
                  filename = pathParts.pop() || "ErrorInPathUtil";
                }
              }
              if (
                (filename === "Unknown Filename" ||
                  filename === "ErrorInPathUtil") &&
                d.source &&
                d.source.url
              ) {
                try {
                  const decodedUrl = decodeURIComponent(d.source.url);
                  let urlObj;
                  try {
                    urlObj = new URL(decodedUrl);
                    const pathSegments = urlObj.pathname.split("/");
                    filename =
                      pathSegments.pop() ||
                      pathSegments.pop() ||
                      "Unknown from URL Path";
                  } catch (urlParseError) {
                    const urlPartsDirect = String(d.source.url).split("/");
                    const lastPartDirect =
                      urlPartsDirect.pop() || urlPartsDirect.pop();
                    filename =
                      lastPartDirect.split("?")[0] || "Invalid URL Filename";
                  }
                } catch (e) {
                  console.warn(
                    "[ZenHaven Downloads] Error extracting filename from URL:",
                    d.source.url,
                    e,
                  );
                  const urlPartsDirect = String(d.source.url).split("/");
                  const lastPartDirect =
                    urlPartsDirect.pop() || urlPartsDirect.pop();
                  filename =
                    lastPartDirect.split("?")[0] || "Invalid URL Filename";
                }
              }
              let status = "unknown";
              let progressBytes = Number(d.bytesTransferredSoFar) || 0;
              let totalBytes = Number(d.totalBytes) || 0;
              if (d.succeeded) {
                status = "completed";
                if (
                  d.target &&
                  d.target.size &&
                  Number(d.target.size) > totalBytes
                ) {
                  totalBytes = Number(d.target.size);
                }
                progressBytes = totalBytes;
              } else if (d.error) {
                status = "failed";
              } else if (d.canceled) {
                status = "failed";
              } else if (
                d.stopped ||
                d.hasPartialData ||
                d.state === Downloads.STATE_PAUSED ||
                d.state === Downloads.STATE_SCANNING ||
                d.state === Downloads.STATE_BLOCKED_PARENTAL ||
                d.state === Downloads.STATE_BLOCKED_POLICY ||
                d.state === Downloads.STATE_BLOCKED_SECURITY ||
                d.state === Downloads.STATE_DIRTY
              ) {
                status = "paused";
              } else if (d.state === Downloads.STATE_DOWNLOADING) {
                status = "paused";
              }
              if (
                status === "completed" &&
                totalBytes === 0 &&
                progressBytes > 0
              ) {
                totalBytes = progressBytes;
              }
              return {
                id: d.id,
                filename: String(filename || "FN_MISSING"),
                size: formatBytes(totalBytes),
                totalBytes: totalBytes,
                progressBytes: progressBytes,
                type: getFileIconDetails(
                  String(filename || "tmp.file"),
                ).text.toLowerCase(),
                category: getFileCategory(String(filename || "tmp.file")),
                status: status,
                url: String(d.source?.url || "URL_MISSING"),
                timestamp: d.endTime || d.startTime || Date.now(),
                targetPath: String(targetPath || ""),
                historicalData: d,
              };
            })
            .filter((d) => d.timestamp);

          console.log(
            "[ZenHaven Downloads] Processed Download Items:",
            allFetchedDownloads.length,
          );
          renderUI();
        } catch (err) {
          console.error(
            "[ZenHaven Downloads] Error fetching or processing download history:",
            err,
          );
          downloadsViewContainer.innerHTML = `<div class="haven-dl-empty-state"><p>Error loading download history.</p><pre>${err.message}\n${err.stack}</pre></div>`;
        }
      })();

      return downloadsViewContainer;
    },
  };

  const workspacesSection = {
    id: "workspaces",
    label: "Workspaces",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2H13V14H3V2ZM2 2C2 1.44772 2.44772 1 3 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 0.96814 14.5523 0.96814 14V2ZM4 4H12V5H4V4ZM4 7H12V8H4V7ZM12 10H4V11H12V10Z" fill="currentColor"/>
    </svg>`,
    init: function() {
      const container = document.createElement("div");
      container.style.cssText = "display: contents;";

      const addWorkspaceButton = document.createElement("div");
      addWorkspaceButton.className = "haven-workspace-add-button";
      addWorkspaceButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 3V13M3 8H13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>`;
      addWorkspaceButton.addEventListener("click", () => {
        try {
          if (typeof ZenWorkspaces?.openSaveDialog === "function") {
            console.log(
              "[ZenHaven] Attempting to open workspace save dialog...",
            );
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
          const workspaceDiv = document.createElement("div");
          workspaceDiv.className = "haven-workspace";
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
          const contentDiv = document.createElement("div");
          contentDiv.className = "haven-workspace-content";

          // Find workspace sections using the workspace's own ID
          const sections = document.querySelectorAll(
            `.zen-workspace-tabs-section[zen-workspace-id="${workspace.getAttribute("zen-workspace-id")}"]`,
          );

          sections.forEach((section) => {
            const root = section.shadowRoot || section;
            const sectionWrapper = document.createElement("div");
            sectionWrapper.className = "haven-workspace-section";

            // Copy computed styles from original section
            const computedStyle = window.getComputedStyle(section);
            sectionWrapper.style.cssText = Array.from(computedStyle).reduce(
              (str, property) => {
                return `${str}${property}:${computedStyle.getPropertyValue(property)};`;
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
                  return `${str}${property}:${groupStyle.getPropertyValue(property)};`;
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
                    return `${str}${property}:${childStyle.getPropertyValue(property)};`;
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

  const historySection = {
    id: "history",
    label: "History",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M1 1.06567H14.9613V4.0144H1L1 1.06567ZM0 1.06567C0 0.513389 0.447715 0.0656738 1 0.0656738H14.9613C15.5136 0.0656738 15.9613 0.513389 15.9613 1.06567V4.0144C15.9613 4.55603 15.5307 4.99708 14.9932 5.01391V5.02686V13C14.9932 14.6569 13.65 16 11.9932 16H3.96814C2.31129 16 0.96814 14.6569 0.96814 13V5.02686V5.01391C0.430599 4.99708 0 4.55603 0 4.0144V1.06567ZM13.9932 5.02686H1.96814V13C1.96814 14.1046 2.86357 15 3.96814 15H11.9932C13.0977 15 13.9932 14.1046 13.9932 13V5.02686ZM9.95154 8.07495H6.01318V7.07495H9.95154V8.07495Z" fill="currentColor"/>
    </svg>`,
    init: function() {
      console.log("[ZenHaven] History init triggered");
      const historyContainer = document.createElement("div");
      historyContainer.className = "haven-history";

      const { PlacesUtils } = ChromeUtils.importESModule(
        "resource://gre/modules/PlacesUtils.sys.mjs",
      );
      const SESSION_TIMEOUT_MINUTES = 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const query = PlacesUtils.history.getNewQuery();
      query.beginTime = startDate.getTime() * 1000;
      query.endTime = Date.now() * 1000;
      const options = PlacesUtils.history.getNewQueryOptions();
      options.sortingMode = options.SORT_BY_DATE_DESCENDING;
      options.resultType = options.RESULTS_AS_VISIT;
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
          year: "numeric",
        });
        if (!visitsByDate.has(dayKey)) visitsByDate.set(dayKey, []);
        visitsByDate.get(dayKey).push({ node, time: visitTime });
      }
      root.containerOpen = false;

      visitsByDate.forEach((visits, dayKey) => {
        const daySection = createCollapsible(
          "📅 " + dayKey,
          false,
          "day-section",
        );
        historyContainer.appendChild(daySection.wrapper);
        const sessions = [];
        let currentSession = [],
          lastTime = null;
        visits.forEach(({ node, time }) => {
          if (
            lastTime &&
            (lastTime - time) / (1000 * 60) > SESSION_TIMEOUT_MINUTES
          ) {
            if (currentSession.length > 0) sessions.push(currentSession);
            currentSession = [];
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
          const sessionSection = createCollapsible(
            sessionTitle,
            false,
            "session-section",
          );
          daySection.content.appendChild(sessionSection.wrapper);
          session.forEach(({ node }) =>
            sessionSection.content.appendChild(createHistoryItem(node)),
          );
        });
      });

      function createCollapsible(title, expanded = false, className = "") {
        const wrapper = document.createElement("div");
        wrapper.className = className;
        const header = document.createElement("div");
        header.className = "collapsible-header";
        header.innerHTML = `<span class="section-toggle">${expanded ? "▼" : "▶"}</span><span class="section-title">${title}</span>`;
        const content = document.createElement("div");
        content.className = "collapsible-content";
        content.style.display = expanded ? "block" : "none";
        header.addEventListener("click", () => {
          const isOpen = content.style.display === "block";
          content.style.display = isOpen ? "none" : "block";
          header.querySelector(".section-toggle").textContent = isOpen
            ? "▶"
            : "▼";
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
        favicon.src =
          "https://www.google.com/s2/favicons?sz=32&domain_url=" +
          encodeURIComponent(node.uri);
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
            triggeringPrincipal:
              Services.scriptSecurityManager.getSystemPrincipal(),
          });
        });
        return item;
      }
      return historyContainer;
    },
  };

  const notesSection = {
    id: "notes",
    label: "Notes",
    icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5.41421C14 5.149 13.8946 4.89464 13.7071 4.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H3ZM3 3H10V5.5C10 5.77614 10.2239 6 10.5 6H13V13H3V3ZM11 3.70711L12.2929 5H11V3.70711ZM5 7H11V8H5V7ZM11 9H5V10H11V9ZM5 11H11V12H5V11Z" fill="currentColor"/>
    </svg>`,
    init: function() {
      const notesViewContainer = document.createElement("div");
      notesViewContainer.id = "haven-notes-view";
      const headerSection = document.createElement("div");
      headerSection.id = "haven-notes-header";
      const addButton = document.createElement("button");
      addButton.id = "haven-notes-add-button";
      addButton.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
      addButton.title = "Create new note";
      const searchBar = document.createElement("input");
      searchBar.type = "text";
      searchBar.id = "haven-notes-search";
      searchBar.placeholder = "Search notes...";
      headerSection.appendChild(searchBar);
      headerSection.appendChild(addButton);
      notesViewContainer.appendChild(headerSection);
      const notesGrid = document.createElement("div");
      notesGrid.id = "haven-notes-grid";
      const createNoteCard = () => {
        const noteCard = document.createElement("div");
        noteCard.className = "haven-note-card";
        noteCard.innerHTML = `<svg class="note-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2H14.1716C14.702 2 15.2107 2.21071 15.5858 2.58579L19.4142 6.41421C19.7893 6.78929 20 7.29799 20 7.82843V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4ZM6 4H14V8C14 8.55228 14.4477 9 15 9H19V20H6V4ZM16 4.41421L18.5858 7H16V4.41421Z" fill="currentColor"/></svg>
                <h1>Untitled</h1><p>Click to add page content</p>`;
        return noteCard;
      };
      addButton.addEventListener("click", () =>
        notesGrid.appendChild(createNoteCard()),
      );
      notesGrid.appendChild(createNoteCard());
      notesViewContainer.appendChild(notesGrid);
      return notesViewContainer;
    },
  };

  window.haven.addSection(downloadsSection);
  window.haven.addSection(workspacesSection);
  window.haven.addSection(historySection);
  window.haven.addSection(notesSection);

  // --- INITIALIZATION & OBSERVER LOGIC ---

  function handleHavenAttributeChange() {
    const toolbox = document.getElementById("navigator-toolbox");
    if (!toolbox) return;

    console.log("[ZenHaven] Haven attribute changed");
    if (toolbox.hasAttribute("haven")) {
      if (!window.haven.uiInitialized) {
        window.haven.initializeUI();
      }
    } else {
      if (window.haven.uiInitialized) {
        window.haven.destroyUI();
      }
    }
  }

  function createToolboxObserver() {
    console.log("[ZenHaven] Setting up toolbox observer");
    const toolbox = document.getElementById("navigator-toolbox");
    if (!toolbox) return;

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "haven"
        ) {
          handleHavenAttributeChange();
          break;
        }
      }
    });
    observer.observe(toolbox, { attributes: true });
    console.log("[ZenHaven] Toolbox observer active");

    // Initial check in case attribute is already present on load
    handleHavenAttributeChange();
  }

  function createHavenToggle() {
    const iconSVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 3C2 2.44772 2.44772 2 3 2H13C13.5523 2 14 2.44772 14 3V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V3ZM3 3H13V13H3V3ZM5 5H11V6H5V5ZM11 7H5V8H11V7ZM5 9H11V10H5V9Z" fill="white"/>
    </svg>`;
    const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}`;
    const openHaven = () => {
      const toolbox = document.getElementById("navigator-toolbox");
      if (toolbox) {
        toolbox.toggleAttribute("haven");
      }
    };

    console.log("[ZenHaven] Toggle button added to sidebar bottom buttons");
    const widget = {
      id: "zen-haven",
      type: "toolbarbutton",
      label: "Zen Haven",
      tooltip: "Zen Haven",
      class: "toolbarbutton-1",
      image,
      callback: openHaven,
    };
    UC_API.Utils.createWidget(widget);
  }

  function startup() {
    console.log("[ZenHaven] Startup sequence initiated.");
    createToolboxObserver();
    createHavenToggle();
  }

  if (gBrowserInit.delayedStartupFinished) {
    console.log("[ZenHaven] Browser already started");
    startup();
  } else {
    console.log("[ZenHaven] Waiting for browser startup");
    let observer = new MutationObserver(() => {
      if (gBrowserInit.delayedStartupFinished) {
        console.log("[ZenHaven] Browser startup detected");
        observer.disconnect();
        startup();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
})();
