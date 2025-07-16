import { parseElement } from "../utils/parse.js";

export const downloadsSection = {
  id: "downloads",
  label: "Downloads",
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8ZM8 4V8.5L11 10L10.5 11L7 9.25V4H8Z" fill="currentColor"/>
      </svg>`,
  init: function() {
    const downloadsViewContainer = parseElement(
      `<div class="haven-downloads-container"></div>`,
    );

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

      const header = parseElement(`<div class="haven-dl-header">
              <div class="haven-dl-title-section">
                <h1 class="haven-dl-title-text">Downloads</h1>
              </div>
            </div>`);

      const controls = parseElement(`<div class="haven-dl-controls"></div>`);
      const searchFilterRow = parseElement(
        `<div class="haven-dl-search-filter-row"></div>`,
      );

      const searchBox = parseElement(`<div class="haven-dl-search-box">
              <span class="haven-dl-search-icon-placeholder">${SEARCH_SVG}</span>
              <input type="text" class="haven-dl-search-input" placeholder="Search downloads..." value="${currentSearchTerm}">
            </div>`);
      // const searchInput = searchBox.querySelector(".haven-dl-search-input");
      searchFilterRow.appendChild(searchBox);

      const optionsHTML = ["all", "completed", "paused", "failed"]
        .map(
          (val) =>
            `<option value="${val}" ${val === currentStatusFilter ? "selected" : ""
            }>${val === "paused"
              ? "Paused/Interrupted"
              : val.charAt(0).toUpperCase() + val.slice(1)
            }</option>`,
        )
        .join("");
      const statusFilter = parseElement(
        `<select class="haven-dl-filter-dropdown" id="statusFilter">${optionsHTML}</select>`,
      );
      searchFilterRow.appendChild(statusFilter);

      const viewToggle = parseElement(`<div class="haven-dl-view-toggle">
              <button class="haven-dl-view-btn ${currentViewMode === "recent" ? "active" : ""
        }" data-view="recent" title="Recent Downloads">Recent</button>
              <button class="haven-dl-view-btn ${currentViewMode === "history" ? "active" : ""
        }" data-view="history" title="Download History">History</button>
            </div>`);
      searchFilterRow.appendChild(viewToggle);
      controls.appendChild(searchFilterRow);

      const categories = [
        { id: "all", text: "All Files", svg: ALL_FILES_SVG },
        { id: "documents", text: "Documents", svg: DOCS_SVG },
        { id: "images", text: "Images", svg: IMAGES_SVG },
        { id: "media", text: "Media", svg: MEDIA_SVG },
      ];
      const categoriesHTML = categories
        .map(
          (cat) =>
            `<button class="haven-dl-category-tab ${currentCategoryFilter === cat.id ? "active" : ""
            }" data-category="${cat.id}">
                <span class="haven-dl-tab-icon">${cat.svg}</span>
                <span>${cat.text}</span>
              </button>`,
        )
        .join("");
      const categoryTabsContainer =
        parseElement(`<div class="haven-dl-category-tabs-container">
              <div class="haven-dl-category-active-indicator"></div>
              ${categoriesHTML}
            </div>`);
      categoryActiveIndicatorEl = categoryTabsContainer.querySelector(
        ".haven-dl-category-active-indicator",
      );
      controls.appendChild(categoryTabsContainer);

      const stats = parseElement(`<div class="haven-dl-stats-bar">
              <div class="haven-dl-stats-counts">Total: <strong id="totalCount">0</strong> Active: <strong id="activeCount">0</strong> Completed: <strong id="completedCount">0</strong></div>
              <div class="haven-dl-view-info" id="viewInfoText">Showing recent downloads</div>
            </div>`);

      downloadsViewContainer.appendChild(header);
      downloadsViewContainer.appendChild(controls);
      downloadsViewContainer.appendChild(stats);

      const listContainer = parseElement(
        `<div class="haven-dl-list-container" id="downloadsListArea"></div>`,
      );
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
      categoryActiveIndicatorEl.style.left = `${tabRect.left - containerRect.left
        }px`;
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
      const totalCountEl = downloadsViewContainer.querySelector("#totalCount");
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
        const emptyState = parseElement(`<div class="haven-dl-empty-state">
                <span class="haven-dl-empty-icon-placeholder">📥</span>
                <p>No downloads found.</p>
              </div>`);
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
            const dateSeparator = parseElement(
              `<div class="haven-dl-date-separator">${dateKey}</div>`,
            );
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

      const el = parseElement(`<div class="haven-dl-item ${item.status === "failed" ? "failed-item" : ""
        } ${item.status === "paused" ? "paused-item" : ""}">
              <div class="haven-dl-item-icon ${iconDetails.className}">${iconDetails.text
        }</div>
              <div class="haven-dl-item-info">
                <div class="haven-dl-item-name" title="${item.filename || "Unknown Filename"
        }\n${item.url || "Unknown URL"}">${item.filename || "Unknown Filename"
        }</div>
                <div class="haven-dl-item-details">
                  <span>${formatBytes(item.totalBytes)}</span>
                  <span>•</span>
                  <span>${timeAgo(new Date(item.timestamp))}</span>
                  <span class="haven-dl-item-url" title="${item.url || "Unknown URL"
        }">${item.url || "Unknown URL"}</span>
                </div>
              </div>
              <div class="haven-dl-item-status-section">
                <div class="haven-dl-item-progress-bar">
                  <div class="haven-dl-item-progress-fill ${statusInfo.className
        }" style="width: ${progressPercent}%;"></div>
                </div>
                <div class="haven-dl-item-status-text ${statusInfo.className
        }">${statusInfo.text}</div>
              </div>
              <div class="haven-dl-item-actions"></div>
            </div>`);

      const itemActionsDiv = el.querySelector(".haven-dl-item-actions");
      const actionButtons = getActionButtonsDOM(item);
      actionButtons.forEach((button) => itemActionsDiv.appendChild(button));

      const itemInfoDiv = el.querySelector(".haven-dl-item-info");

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
        return parseElement(`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="${pathD}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`);
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
          createActionButton("resume", "Resume Download", RESUME_DOWNLOAD_PATH),
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
