import { parseElement } from "../utils/parse.js";

// Prefs for the settings menu/window thingy.
const getFileCategories = UC_API.Prefs.get("zen.library.downloads.file-catagories").value;
const showFileStatus = UC_API.Prefs.get("zen.library.downloads.show-file-status").value;
const showFileSize = UC_API.Prefs.get("zen.library.downloads.show-file-size").value;
const showFileTime = UC_API.Prefs.get("zen.library.downloads.show-file-time").value;
const showFileUrl = UC_API.Prefs.get("zen.library.downloads.show-file-url").value;
const showDownloadInfo = UC_API.Prefs.get("zen.library.downloads.show-download-info").value;
const DoubleClickToOpen = UC_API.Prefs.get("zen.library.downloads.double-click-to-open").value;

export const downloadsSection = {
  id: "downloads",
  label: "Downloads",
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2ZM1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8ZM8 4V8.5L11 10L10.5 11L7 9.25V4H8Z" fill="currentColor"/>
      </svg>`,
  init: function() {
    const downloadsViewContainer = parseElement(
      `<div class="library-downloads-container"></div>`,
    );

    // --- Data Store and State ---
    let allFetchedDownloads = [];
    let filteredDisplayDownloads = [];
    let currentViewMode = "recent";
    let currentStatusFilter = "all";
    let currentCategoryFilter = "all";
    let currentSearchTerm = "";
    let categoryActiveIndicatorEl;
    let downloadsRefreshInterval = null;
    let lastDownloadsHash = null;

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

      const header = parseElement(`<div class="library-dl-header">
              <div class="library-dl-title-section">
                <h1 class="library-dl-title-text">Downloads</h1>
              </div>
            </div>`);

      const controls = parseElement(`<div class="library-dl-controls"></div>`);
      const searchFilterRow = parseElement(
        `<div class="library-dl-search-filter-row"></div>`,
      );

      const searchBox = parseElement(`<div class="library-dl-search-box">
              <span class="library-dl-search-icon-placeholder">${SEARCH_SVG}</span>
              <input type="text" class="library-dl-search-input" placeholder="Search downloads..." value="${currentSearchTerm}">
            </div>`);
      // const searchInput = searchBox.querySelector(".library-dl-search-input");
      searchFilterRow.appendChild(searchBox);

      const optionsHTML = ["all", "completed", "paused", "failed", "deleted"]
        .map(
          (val) =>
            `<option value="${val}" ${val === currentStatusFilter ? "selected" : ""
            }>${val === "paused"
              ? "Paused/Interrupted"
              : val === "deleted"
                ? "Deleted"
              : val.charAt(0).toUpperCase() + val.slice(1)
            }</option>`,
        )
        .join("");
      const statusFilter = parseElement(
        `<select class="library-dl-filter-dropdown" id="statusFilter">${optionsHTML}</select>`,
      );
      searchFilterRow.appendChild(statusFilter);

      // Remove view toggle and related logic
      // const viewToggle = parseElement(`<div class="library-dl-view-toggle">
      //         <button class="library-dl-view-btn ${currentViewMode === "recent" ? "active" : ""}"
      //   data-view="recent" title="Recent Downloads">Recent</button>
      //         <button class="library-dl-view-btn ${currentViewMode === "history" ? "active" : ""}"
      //   data-view="history" title="Download History">History</button>
      //       </div>`);
      // searchFilterRow.appendChild(viewToggle);
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
            `<button class="library-dl-category-tab ${currentCategoryFilter === cat.id ? "active" : ""
            }" data-category="${cat.id}">
                <span class="library-dl-tab-icon">${cat.svg}</span>
                <span>${cat.text}</span>
              </button>`,
        )
        .join("");
      const categoryTabsContainer =
        parseElement(`<div class="library-dl-category-tabs-container">
              <div class="library-dl-category-active-indicator"></div>
              ${categoriesHTML}
            </div>`);
      categoryActiveIndicatorEl = categoryTabsContainer.querySelector(
        ".library-dl-category-active-indicator",
      );
      controls.appendChild(categoryTabsContainer);

      const stats = parseElement(`<div class="library-dl-stats-bar">
              <div class="library-dl-stats-counts">Total: <strong id="totalCount">0</strong> Active: <strong id="activeCount">0</strong> Completed: <strong id="completedCount">0</strong></div>
              <div class="library-dl-view-info" id="viewInfoText">All downloads grouped by date</div>
            </div>`);

      downloadsViewContainer.appendChild(header);
      downloadsViewContainer.appendChild(controls);
      downloadsViewContainer.appendChild(stats);

      const listContainer = parseElement(
        `<div class="library-dl-list-container" id="downloadsListArea"></div>`,
      );
      downloadsViewContainer.appendChild(listContainer);

      updateAndRenderDownloadsList();
      attachEventListeners();

      const initialActiveTab = categoryTabsContainer.querySelector(
        `.library-dl-category-tab[data-category="${currentCategoryFilter}"]`,
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
        viewInfoTextEl.textContent = "All downloads grouped by date";
      if (filteredDisplayDownloads.length === 0) {
        const emptyState = parseElement(`<div class="library-dl-empty-state">
                <span class="library-dl-empty-icon-placeholder">📥</span>
                <p>No downloads found.</p>
              </div>`);
        listArea.appendChild(emptyState);
        return;
      }
      // Always group by date, no matter what
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
              `<div class="library-dl-date-separator">${dateKey}</div>`,
            );
            listArea.appendChild(dateSeparator);
            groupedByDate[dateKey]
              .sort((a, b) => b.timestamp - a.timestamp)
              .forEach((item) =>
                listArea.appendChild(createDownloadItemElement(item)),
              );
          });
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

      // Image preview logic
      let iconHtml = iconDetails.text;
      if (iconDetails.className === "img-icon" && item.status !== "deleted") {
        // Use previewData if available
        if (item.previewData && item.previewData.type === 'image' && item.previewData.src) {
          iconHtml = `<img src="${item.previewData.src}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" alt="preview" onerror="this.style.display='none'" />`;
        } else {
          // fallback: check file existence at render time
          let fileUrl = null;
          try {
            if (item.targetPath) {
              let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
              file.initWithPath(item.targetPath);
              if (file.exists()) {
                let Services = window.Services || (window.globalThis && window.globalThis.Services);
                if (Services && Services.io && typeof Services.io.newFileURI === "function") {
                  fileUrl = Services.io.newFileURI(file).spec;
                } else {
                  fileUrl = file.path.startsWith("/") ? "file://" + file.path : "file:///" + file.path.replace(/\\/g, "/");
                }
              }
            }
          } catch (e) {}
          if (fileUrl) {
            iconHtml = `<img src="${fileUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;" alt="preview" onerror="this.style.display='none'" />`;
          } else {
            // Fallback: show generic image icon if file is missing or not accessible
            iconHtml = iconDetails.text;
          }
        }
      }
      // NOTE: If you want previews to persist even if the file is deleted, you must cache a thumbnail at download time.
      const el = parseElement(`<div class="library-dl-item ${item.status === "failed" ? "failed-item" : ""}
        ${item.status === "paused" ? "paused-item" : ""} ${item.status === "deleted" ? "deleted-item" : ""}">
              <div class="library-dl-item-icon ${iconDetails.className}">${iconHtml}</div>
              <div class="library-dl-item-info">
                <div class="library-dl-item-name" title="${item.filename || "Unknown Filename"}
        ${item.url || "Unknown URL"}">${item.filename || "Unknown Filename"}</div>
                <div class="library-dl-item-details">
                  <span>${formatBytes(item.totalBytes)}</span>
                  <span>•</span>
                  <span>${timeAgo(new Date(item.timestamp))}</span>
                  <span class="library-dl-item-url" title="${item.url || "Unknown URL"}">${item.url || "Unknown URL"}</span>
                </div>
              </div>
              <div class="library-dl-item-status-section">
                <div class="library-dl-item-progress-bar">
                  <div class="library-dl-item-progress-fill ${statusInfo.className}" style="width: ${progressPercent}%;"></div>
                </div>
                <div class="library-dl-item-status-text ${statusInfo.className}">${item.status === "deleted" ? "Deleted" : statusInfo.text}</div>
              </div>
            </div>`);

      // Context menu event
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showXULContextMenu(item, e.screenX, e.screenY);
      });
      // Double-click to open file if completed
      el.querySelector(".library-dl-item-info").addEventListener("dblclick", (e) => {
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
        button.className = "library-dl-action-btn";
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
      // Only show 'show' button if not deleted
      if (item.status === "completed" && item.status !== "deleted")
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
      // Change 'copy' to 'open-url' and update icon/title
      buttons.push(
        createActionButton("open-url", "Open Download Link in New Tab", OPEN_ORIGIN_PATH),
      );
      buttons.push(
        createActionButton("remove", "Delete File", DELETE_FILE_PATH),
      );
      return buttons;
    }
    function handleItemAction(item, action, event) {
      event.stopPropagation();
      // Use nsIFile logic from zen-stuff.uc.js for open/show
      function getFileInstance(path) {
        try {
          const file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
          file.initWithPath(path);
          return file;
        } catch (e) {
          return null;
        }
      }
      switch (action) {
        case "open":
          try {
            if (!item.targetPath) {
              alert("File path not available.");
              return;
            }
            let file = getFileInstance(item.targetPath);
            if (file && file.exists()) file.launch();
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
            let file = getFileInstance(item.targetPath);
            if (file && file.exists()) file.reveal();
            else alert(`File not found: ${item.filename}`);
          } catch (e) {
            console.error("Error showing file:", e);
            alert(`Could not show file: ${item.filename}`);
          }
          break;
        case "retry":
          // No alert, just a placeholder for retry logic
          break;
        case "resume":
          // No alert, just a placeholder for resume logic
          break;
        case "open-url":
          try {
            if (item.url) {
              let Services = window.Services || (window.globalThis && window.globalThis.Services);
              let win = null;
              try {
                if (Services && Services.wm && typeof Services.wm.getMostRecentWindow === "function") {
                  win = Services.wm.getMostRecentWindow("navigator:browser");
                }
              } catch (e) {}
              if (
                win &&
                win.gBrowser &&
                typeof win.gBrowser.addTab === "function" &&
                Services &&
                Services.scriptSecurityManager
              ) {
                win.gBrowser.selectedTab = win.gBrowser.addTab(item.url, {
                  triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
              } else if (
                typeof gBrowser !== "undefined" &&
                gBrowser.addTab &&
                Services &&
                Services.scriptSecurityManager
              ) {
                gBrowser.selectedTab = gBrowser.addTab(item.url, {
                  triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
              } else if (typeof window.openTrustedLinkIn === "function") {
                window.openTrustedLinkIn(item.url, "tab");
              } else {
                window.open(item.url, "_blank");
              }
            }
          } catch (e) {
            console.error("Error opening URL in new tab:", e, item.url);
          }
          break;
        case "remove":
          if (!item.targetPath) {
            alert("File path not available. Cannot delete file.");
            return;
          }
          if (
            confirm(
              `Are you sure you want to permanently delete \"${item.filename}\" from your system?\n\nThis action cannot be undone.`,
            )
          ) {
            try {
              let file = getFileInstance(item.targetPath);
              if (file && file.exists()) {
                file.remove(false);
                item.deleted = true;
                alert(`File \"${item.filename}\" was successfully deleted.`);
                // Immediately refresh the downloads list from history
                if (typeof refreshDownloadsFromHistory === 'function') {
                  refreshDownloadsFromHistory();
                } else if (typeof fetchAndRenderDownloads === 'function') {
                  fetchAndRenderDownloads();
                } else {
                  // fallback: reload the section by re-running the async IIFE
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
                          let fileExists = false;
                          if (d.target && d.target.path) {
                            try {
                              let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                              file.initWithPath(d.target.path);
                              fileExists = file.exists();
                              filename = file.leafName;
                              targetPath = d.target.path;
                            } catch (e) {
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
                          if (d.target && d.target.path && !fileExists) {
                            status = "deleted";
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
                      renderUI();
                    } catch (err) {
                      console.error(
                        "[Zenlibrary Downloads] Error fetching or processing download history:",
                        err,
                      );
                      downloadsViewContainer.innerHTML = `<div class="library-dl-empty-state"><p>Error loading download history.</p><pre>${err.message}\n${err.stack}</pre></div>`;
                    }
                  })();
                }
              } else {
                alert(`File \"${item.filename}\" not found on disk.`);
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
      filteredDisplayDownloads = allFetchedDownloads.filter((item) => {
        // Hide deleted files unless filter is set to 'deleted'
        if (currentStatusFilter !== "deleted" && item.status === "deleted")
          return false;
        if (
          currentStatusFilter !== "all" &&
          currentStatusFilter !== "deleted" &&
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
        ".library-dl-search-input",
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
      // Remove all currentViewMode logic and state
      // downloadsViewContainer
      //   .querySelectorAll(".library-dl-view-btn")
      //   .forEach((btn) => {
      //     btn.addEventListener("click", (e) => {
      //       currentViewMode = e.currentTarget.dataset.view;
      //       downloadsViewContainer
      //         .querySelectorAll(".library-dl-view-btn")
      //         .forEach((b) => b.classList.remove("active"));
      //       e.currentTarget.classList.add("active");
      //       updateAndRenderDownloadsList();
      //     });
      //   });
      const categoryTabsContainerEl = downloadsViewContainer.querySelector(
        ".library-dl-category-tabs-container",
      );
      categoryTabsContainerEl
        .querySelectorAll(".library-dl-category-tab")
        .forEach((tab) => {
          tab.addEventListener("click", (e) => {
            const clickedTab = e.currentTarget;
            currentCategoryFilter = clickedTab.dataset.category;
            categoryTabsContainerEl
              .querySelectorAll(".library-dl-category-tab")
              .forEach((t) => t.classList.remove("active"));
            clickedTab.classList.add("active");
            updateCategoryIndicatorPosition(clickedTab);
            updateAndRenderDownloadsList();
          });
        });
      const initialActiveCatTab = categoryTabsContainerEl.querySelector(
        `.library-dl-category-tab[data-category="${currentCategoryFilter}"]`,
      );
      if (initialActiveCatTab) {
        updateCategoryIndicatorPosition(initialActiveCatTab);
      }
    }

    // Helper to hash downloads for change detection
    function hashDownloads(downloads) {
      return downloads.map(d => d.id + d.status + d.timestamp + d.filename).join("|");
    }

    // Function to fetch and update downloads, only update UI if changed
    async function fetchAndMaybeUpdateDownloads() {
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
        const isPrivate = PrivateBrowsingUtils.isContentWindowPrivate(window);
        const list = await DownloadHistory.getList({
          type: isPrivate ? Downloads.ALL : Downloads.PUBLIC,
        });
        const allDownloadsRaw = await list.getAll();
        let newDownloads = allDownloadsRaw
          .map((d) => {
            let filename = "Unknown Filename";
            let targetPath = "";
            let fileExists = false;
            let previewData = null;
            if (d.target && d.target.path) {
              try {
                let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                file.initWithPath(d.target.path);
                fileExists = file.exists();
                filename = file.leafName;
                targetPath = d.target.path;
                // If image, generate previewData
                const ext = filename.split('.').pop().toLowerCase();
                if (["png","jpg","jpeg","gif","bmp","svg","webp","heic","avif"].includes(ext) && fileExists) {
                  let Services = window.Services || (window.globalThis && window.globalThis.Services);
                  if (Services && Services.io && typeof Services.io.newFileURI === "function") {
                    previewData = { type: 'image', src: Services.io.newFileURI(file).spec };
                  }
                }
              } catch (e) {
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
            if (d.target && d.target.path && !fileExists) {
              status = "deleted";
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
              previewData: previewData,
            };
          })
          .filter((d) => d.timestamp);
        const newHash = hashDownloads(newDownloads);
        if (newHash !== lastDownloadsHash) {
          allFetchedDownloads = newDownloads;
          lastDownloadsHash = newHash;
          renderUI();
        }
      } catch (err) {
        console.error("[Zenlibrary Downloads] Error polling downloads:", err);
      }
    }

    // Start periodic polling
    downloadsRefreshInterval = setInterval(fetchAndMaybeUpdateDownloads, 5000);
    // Also do an initial fetch right away
    fetchAndMaybeUpdateDownloads();

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
            let fileExists = false;
            let previewData = null;
            if (d.target && d.target.path) {
              try {
                let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
                file.initWithPath(d.target.path);
                fileExists = file.exists();
                filename = file.leafName;
                targetPath = d.target.path;
                // If image, generate previewData
                const ext = filename.split('.').pop().toLowerCase();
                if (["png","jpg","jpeg","gif","bmp","svg","webp","heic","avif"].includes(ext) && fileExists) {
                  let Services = window.Services || (window.globalThis && window.globalThis.Services);
                  if (Services && Services.io && typeof Services.io.newFileURI === "function") {
                    previewData = { type: 'image', src: Services.io.newFileURI(file).spec };
                  }
                }
              } catch (e) {
                console.warn(
                  "[Zenlibrary Downloads] Error creating nsIFile or getting leafName from path:",
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
                  "[Zenlibrary Downloads] Error extracting filename from URL:",
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
            // If file is missing, mark as deleted
            if (d.target && d.target.path && !fileExists) {
              status = "deleted";
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
              previewData: previewData,
            };
          })
          .filter((d) => d.timestamp);

        console.log(
          "[Zenlibrary Downloads] Processed Download Items:",
          allFetchedDownloads.length,
        );
        renderUI();
      } catch (err) {
        console.error(
          "[Zenlibrary Downloads] Error fetching or processing download history:",
          err,
        );
        downloadsViewContainer.innerHTML = `<div class="library-dl-empty-state"><p>Error loading download history.</p><pre>${err.message}\n${err.stack}</pre></div>`;
      }
    })();

    // --- XUL Menupopup Context Menu Setup ---
    let xulContextMenu = null;
    let xulContextMenuTargetItem = null;
    function ensureXULContextMenu() {
      if (xulContextMenu) return xulContextMenu;
      const menuXML = `
        <menupopup id="library-dl-xul-context-menu">
          <menuitem label="Rename" id="dl-menu-rename"/>
          <menuitem label="Open in Folder" id="dl-menu-open-folder"/>
          <menuitem label="Open Download Link in New Tab" id="dl-menu-open-url"/>
          <menuseparator/>
          <menuitem label="Delete File" id="dl-menu-delete"/>
        </menupopup>
      `;
      const frag = window.MozXULElement.parseXULToFragment(menuXML);
      xulContextMenu = frag.firstElementChild;
      document.getElementById("mainPopupSet")?.appendChild(xulContextMenu) || document.body.appendChild(xulContextMenu);
      // Wire up menu actions
      xulContextMenu.querySelector("#dl-menu-rename").addEventListener("command", () => {
        if (xulContextMenuTargetItem) showRenameDialog(xulContextMenuTargetItem);
      });
      xulContextMenu.querySelector("#dl-menu-open-folder").addEventListener("command", (e) => {
        if (xulContextMenuTargetItem) handleItemAction(xulContextMenuTargetItem, "show", e);
      });
      xulContextMenu.querySelector("#dl-menu-open-url").addEventListener("command", (e) => {
        if (xulContextMenuTargetItem) handleItemAction(xulContextMenuTargetItem, "open-url", e);
      });
      xulContextMenu.querySelector("#dl-menu-delete").addEventListener("command", (e) => {
        if (xulContextMenuTargetItem) handleItemAction(xulContextMenuTargetItem, "remove", e);
      });
      return xulContextMenu;
    }
    function showXULContextMenu(item, x, y) {
      const menu = ensureXULContextMenu();
      xulContextMenuTargetItem = item;
      // Hide Open in Folder if deleted
      const openFolder = menu.querySelector("#dl-menu-open-folder");
      if (item.status === "deleted") openFolder.setAttribute("hidden", "true");
      else openFolder.removeAttribute("hidden");
      // Open at mouse position
      if (typeof menu.openPopupAtScreen === "function") {
        menu.openPopupAtScreen(x, y, true);
      } else {
        // fallback: open at item
        menu.openPopup(item, 'after_start', 0, 0, true, false, null);
      }
    }
    // --- End XUL Menupopup Context Menu Setup ---

    // --- Rename Dialog ---
    function showRenameDialog(item) {
      // Remove any existing dialog
      const existing = document.getElementById('library-dl-rename-dialog');
      if (existing) existing.remove();
      const overlay = parseElement(`
        <div id="library-dl-rename-dialog">
          <div class="rename-dialog">
            <div class="rename-title">Rename File</div>
            <input type="text" class="rename-input" />
            <div class="rename-btn-row">
              <button class="rename-cancel">Cancel</button>
              <button class="rename-ok">Rename</button>
            </div>
          </div>
        </div>
      `);
      const dialog = overlay.querySelector('.rename-dialog');
      const input = overlay.querySelector('.rename-input');
      const cancel = overlay.querySelector('.rename-cancel');
      const ok = overlay.querySelector('.rename-ok');
      input.value = item.filename;
      // Select filename without extension
      const lastDot = item.filename.lastIndexOf('.')
      if (lastDot > 0) {
        setTimeout(() => {
          input.setSelectionRange(0, lastDot);
          input.focus();
        }, 100);
      } else {
        setTimeout(() => {
          input.select();
          input.focus();
        }, 100);
      }
      cancel.onclick = () => overlay.remove();
      ok.onclick = async () => {
        const newName = input.value.trim();
        if (!newName || newName === item.filename) {
          overlay.remove();
          return;
        }
        try {
          // Safe rename logic (auto-increment if needed)
          let file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
          file.initWithPath(item.targetPath);
          const parentDir = file.parent;
          let base = newName, ext = '';
          const dot = newName.lastIndexOf('.');
          if (dot > 0) { base = newName.slice(0, dot); ext = newName.slice(dot); }
          let candidate = base + ext, counter = 1;
          let newFile = parentDir.clone(); newFile.append(candidate);
          while (newFile.exists()) {
            candidate = `${base} (${counter++})${ext}`;
            newFile = parentDir.clone(); newFile.append(candidate);
          }
          const oldPath = item.targetPath;
          file.moveTo(parentDir, candidate);
          // Update the item in UI state
          item.filename = candidate;
          item.targetPath = newFile.path;
          // If image, update previewData
          const extNew = candidate.split('.').pop().toLowerCase();
          if (["png","jpg","jpeg","gif","bmp","svg","webp","heic","avif"].includes(extNew)) {
            let Services = window.Services || (window.globalThis && window.globalThis.Services);
            if (Services && Services.io && typeof Services.io.newFileURI === "function") {
              item.previewData = { type: 'image', src: Services.io.newFileURI(newFile).spec };
            }
          } else {
            item.previewData = null;
          }
          // --- Update the download manager record ---
          try {
            const { Downloads } = ChromeUtils.import("resource://gre/modules/Downloads.jsm");
            let list = await Downloads.getList(Downloads.ALL);
            let downloads = await list.getAll();
            let download = downloads.find(d => d.target && d.target.path === oldPath);
            if (download && download.target) {
              download.target.path = newFile.path;
            }
          } catch (e) {
            // Ignore if we can't update the download manager
          }
          overlay.remove();
          // Refresh downloads list
          if (typeof fetchAndMaybeUpdateDownloads === 'function') fetchAndMaybeUpdateDownloads();
        } catch (e) {
          alert('Rename failed: ' + e);
        }
      };
      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') ok.click();
        if (e.key === 'Escape') cancel.click();
      });
      document.body.appendChild(overlay);
    }
    // --- End Rename Dialog ---

    return downloadsViewContainer;
  },
};
