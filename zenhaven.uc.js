import { parseElement } from "../utils/parse.js";

export const historySection = {
  id: "history",
  label: "History",
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1 1.06567H14.9613V4.0144H1L1 1.06567ZM0 1.06567C0 0.513389 0.447715 0.0656738 1 0.0656738H14.9613C15.5136 0.0656738 15.9613 0.513389 15.9613 1.06567V4.0144C15.9613 4.55603 15.5307 4.99708 14.9932 5.01391V5.02686V13C14.9932 14.6569 13.65 16 11.9932 16H3.96814C2.31129 16 0.96814 14.6569 0.96814 13V5.02686V5.01391C0.430599 4.99708 0 4.55603 0 4.0144V1.06567ZM13.9932 5.02686H1.96814V13C1.96814 14.1046 2.86357 15 3.96814 15H11.9932C13.0977 15 13.9932 14.1046 13.9932 13V5.02686ZM9.95154 8.07495H6.01318V7.07495H9.95154V8.07495Z" fill="currentColor"/>
      </svg>`,
  init: function() {
    console.log("[ZenHaven] History init triggered");

    // Create main container with loading message
    const historyContainer = parseElement(
      `<div class="haven-history">
          <div class="history-search-container">
            <div class="search-input-wrapper">
              <input type="text" class="history-search-input" placeholder="Search history...">
            </div>
            <button class="history-filter-btn" title="Filter options">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.5 2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H13.5C14.0523 1.5 14.5 1.94772 14.5 2.5V4.5C14.5 4.77614 14.2761 5 14 5H2C1.72386 5 1.5 4.77614 1.5 4.5V2.5Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M4.5 6.5C4.5 5.94772 4.94772 5.5 5.5 5.5H10.5C11.0523 5.5 11.5 5.94772 11.5 6.5V8.5C11.5 8.77614 11.2761 9 11 9H5C4.72386 9 4.5 8.77614 4.5 8.5V6.5Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M7.5 10.5C7.5 9.94772 7.94772 9.5 8.5 9.5H13.5C14.0523 9.5 14.5 9.94772 14.5 10.5V12.5C14.5 12.7761 14.2761 13 14 13H8C7.72386 13 7.5 12.7761 7.5 12.5V10.5Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
            </button>
          </div>
          <div class="haven-history-loading-initial" style="text-align: center; padding: 20px;">
            <div class="loading-spinner"></div>
            <div>Loading history...</div>
          </div>
        </div>`,
    );

    const loadingIndicator = parseElement(
      `<div class="haven-history-loading" style="display: none; text-align: center; padding: 20px;">
          <div class="loading-spinner"></div>
          <div>Loading more history...</div>
        </div>`,
    );

    // Create filter menupopup (XUL, then inject HTML slider)
    console.log('[ZenHaven] Creating filter menupopup...');
    const filterPopup = parseElement(`<menupopup id="history-filter-popup" width="340"></menupopup>`, "xul");
    document.getElementById("mainPopupSet")?.appendChild(filterPopup);
    console.log('[ZenHaven] Filter menupopup appended:', filterPopup);

    // Helper to append HTML into XUL
    const appendXUL = (parentElement, htmlString, insertBefore = null) => {
      const element = new DOMParser().parseFromString(htmlString, "text/html").body.children[0];
      if (insertBefore) {
        parentElement.insertBefore(element, insertBefore);
      } else {
        parentElement.appendChild(element);
      }
      return element;
    };

    // HTML slider UI as a string (no inline styles)
    const sliderHTML = `
      <div id="history-time-filter">
        <h1>Time</h1>
        <h2>When was the tab open?</h2>
        <div id="history-slider-labels">
          <span id="history-slider-min-label">Start</span>
          <span id="history-slider-max-label">End</span>
        </div>
        <div id="history-slider-container">
          <input type="range" id="history-slider-min" min="0" max="100" value="0">
          <input type="range" id="history-slider-max" min="0" max="100" value="100">
          <div id="history-slider-track"></div>
          <div id="history-slider-range"></div>
          <div class="slider-tooltip" id="slider-tooltip-min"></div>
          <div class="slider-tooltip" id="slider-tooltip-max"></div>
        </div>
      </div>
    `;
    appendXUL(filterPopup, sliderHTML);

    // Select slider elements after HTML is injected (must be before any function uses them)
    const sliderMin = filterPopup.querySelector('#history-slider-min');
    const sliderMax = filterPopup.querySelector('#history-slider-max');
    const sliderRange = filterPopup.querySelector('#history-slider-range');
    const sliderTrack = filterPopup.querySelector('#history-slider-track');
    const minLabel = filterPopup.querySelector('#history-slider-min-label');
    const maxLabel = filterPopup.querySelector('#history-slider-max-label');
    const sliderContainer = filterPopup.querySelector('#history-slider-container');
    const tooltipMin = filterPopup.querySelector('#slider-tooltip-min');
    const tooltipMax = filterPopup.querySelector('#slider-tooltip-max');

    // --- Time slider logic ---
    // We'll use days since epoch for the slider range
    // Select slider elements after HTML is injected
    // Helper to get date from slider value (days ago)
    function daysAgoToDate(daysAgo) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - daysAgo);
      return d;
    }
    // Helper to format date as dd/mm/yy
    function formatDateDMY(d) {
      return d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: '2-digit' });
    }

    // Store the current filter range (in days ago)
    let filterMinDays = 0;
    let filterMaxDays = 0;

    let earliestHistoryDate = null;
    let maxDays = 365; // default, will update after fetching history

    let allHistoryItems = [];

    // Helper: check if a date is within the slider's selected range
    function isDateInSliderRange(date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysAgo = Math.floor((today - date) / (1000 * 60 * 60 * 24));
      return daysAgo >= filterMinDays && daysAgo <= filterMaxDays;
    }

    // Fetch and render history for the current slider range
    async function renderFilteredHistory() {
      const historyContent = historyContainer.querySelector('.haven-history-content') || historyContainer;
      const searchContainer = historyContainer.querySelector('.history-search-container');
      const loadingIndicator = historyContainer.querySelector('.haven-history-loading');
      Array.from(historyContent.children).forEach(child => {
        if (child !== searchContainer && child !== loadingIndicator) {
          child.remove();
        }
      });

      // Calculate date range from slider
      const startDate = daysAgoToDate(filterMaxDays); // older
      const endDate = daysAgoToDate(filterMinDays);   // newer

      // Show loading
      if (loadingIndicator) loadingIndicator.style.display = 'block';

      try {
        const { PlacesUtils } = ChromeUtils.importESModule("resource://gre/modules/PlacesUtils.sys.mjs");
        const query = PlacesUtils.history.getNewQuery();
        query.beginTime = startDate.getTime() * 1000;
        query.endTime = endDate.getTime() * 1000;
        const options = PlacesUtils.history.getNewQueryOptions();
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        options.resultType = options.RESULTS_AS_URI;
        options.maxResults = 200; // Limit to 200 items max
        const result = PlacesUtils.history.executeQuery(query, options);
        const root = result.root;
        root.containerOpen = true;
        const items = [];
        for (let i = 0; i < root.childCount; i++) {
          const node = root.getChild(i);
          items.push(node);
        }
        root.containerOpen = false;

        // Filter items to be strictly within the slider range (by date, not time)
        const filteredItems = items.filter(node => {
          const nodeDate = new Date(node.time / 1000);
          nodeDate.setHours(0, 0, 0, 0);
          return nodeDate >= startDate && nodeDate <= endDate;
        });

        if (loadingIndicator) loadingIndicator.style.display = 'none';

        if (filteredItems.length > 0) {
          const filteredSections = renderHistoryBatch(filteredItems, endDate);
          historyContainer.insertBefore(filteredSections, loadingIndicator);
        } else {
          const noResults = parseElement(
            `<div style="text-align: center; padding: 20px; color: #666;">No history in selected range</div>`
          );
          historyContainer.insertBefore(noResults, loadingIndicator);
        }
      } catch (e) {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        const errorMsg = parseElement(
          `<div style="text-align: center; padding: 20px; color: #c00;">Error loading history</div>`
        );
        historyContainer.insertBefore(errorMsg, loadingIndicator);
      }
    }

    // Update slider visuals and label
    function updateSliderUI() {
      let minVal = Math.min(Number(sliderMin.value), Number(sliderMax.value));
      let maxVal = Math.max(Number(sliderMin.value), Number(sliderMax.value));
      sliderMin.value = minVal;
      sliderMax.value = maxVal;
      const minDate = daysAgoToDate(minVal); // Correct: min handle
      const maxDate = daysAgoToDate(maxVal); // Correct: max handle

      minLabel.textContent = 'Today';
      maxLabel.textContent = earliestHistoryDate ? formatDateDMY(earliestHistoryDate) : formatDateDMY(maxDate);
      // Update range highlight
      const percentMin = (minVal / maxDays) * 100;
      const percentMax = (maxVal / maxDays) * 100;
      sliderRange.style.left = `${percentMin}%`;
      sliderRange.style.width = `${percentMax - percentMin}%`;

      // Tooltip logic (fix: show correct date for each handle)
      updateTooltip(sliderMin, tooltipMin, minVal, minDate);
      updateTooltip(sliderMax, tooltipMax, maxVal, maxDate);

      // Update filter range and re-render history
      filterMinDays = minVal;
      filterMaxDays = maxVal;
      renderFilteredHistory();
    }

    // On initial load, set filter range to full range
    function setSliderToHistoryRange() {
      try {
        const { PlacesUtils } = ChromeUtils.importESModule("resource://gre/modules/PlacesUtils.sys.mjs");
        // Query for the oldest history entry
        const query = PlacesUtils.history.getNewQuery();
        const options = PlacesUtils.history.getNewQueryOptions();
        options.sortingMode = options.SORT_BY_DATE_ASCENDING;
        options.maxResults = 1;
        const result = PlacesUtils.history.executeQuery(query, options);
        const root = result.root;
        root.containerOpen = true;
        if (root.childCount > 0) {
          const node = root.getChild(0);
          earliestHistoryDate = new Date(node.time / 1000);
          earliestHistoryDate.setHours(0, 0, 0, 0);
          // Calculate days between today and earliest history
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          maxDays = Math.max(1, Math.floor((today - earliestHistoryDate) / (1000 * 60 * 60 * 24)));
        } else {
          // No history, fallback to 365 days
          earliestHistoryDate = daysAgoToDate(365);
          maxDays = 365;
        }
        root.containerOpen = false;
      } catch (e) {
        console.error('[ZenHaven] Failed to get earliest history date:', e);
        earliestHistoryDate = daysAgoToDate(365);
        maxDays = 365;
      }
      // Update slider attributes
      sliderMin.min = 0;
      sliderMin.max = maxDays;
      sliderMax.min = 0;
      sliderMax.max = maxDays;
      sliderMin.value = 0;
      sliderMax.value = maxDays;
      updateSliderUI();
      filterMinDays = 0;
      filterMaxDays = maxDays;
      renderFilteredHistory();
    }

    function bringToFront(slider, otherSlider) {
      slider.style.zIndex = 3;
      otherSlider.style.zIndex = 2;
    }

    function resetZIndexes() {
      sliderMin.style.zIndex = 2;
      sliderMax.style.zIndex = 2;
    }

    // On mousedown/touchstart, bring the active slider to the front
    sliderMin.addEventListener('mousedown', () => bringToFront(sliderMin, sliderMax));
    sliderMax.addEventListener('mousedown', () => bringToFront(sliderMax, sliderMin));
    sliderMin.addEventListener('touchstart', () => bringToFront(sliderMin, sliderMax));
    sliderMax.addEventListener('touchstart', () => bringToFront(sliderMax, sliderMin));

    // On mouseup/touchend anywhere, reset both z-indexes
    window.addEventListener('mouseup', resetZIndexes);
    window.addEventListener('touchend', resetZIndexes);

    // Blur both sliders on mouseup/touchend to remove focus
    function blurSliders() {
      sliderMin.blur();
      sliderMax.blur();
    }
    window.addEventListener('mouseup', blurSliders);
    window.addEventListener('touchend', blurSliders);

    // Initialize both sliders to the same z-index
    sliderMin.style.zIndex = 2;
    sliderMax.style.zIndex = 2;

    sliderMin.addEventListener('input', updateSliderUI);
    sliderMax.addEventListener('input', updateSliderUI);
    setSliderToHistoryRange();

    const DAYS_PER_BATCH = 2; // Smaller batch size - 2 days instead of 7 to prevent overloading Zen
    let isLoading = false;
    let noMoreHistory = false;
    let currentStartDate = new Date();
    let scrollThrottleTimer = null;
    let searchQuery = "";

    function getSectionLabel(date, referenceDate) {
      const diffMs = referenceDate - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return "1 week ago";
      if (diffDays < 28) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 60) return "1 month ago";
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      if (diffDays < 730) return "1 year ago";
      return `${Math.floor(diffDays / 365)} years ago`;
    }

    // Helper: create history item row
    function createHistoryItem(node) {
      const url = node.uri;
      const title = node.title || url;
      const time = new Date(node.time / 1000);
      const item = parseElement(`
        <div class="haven-history-item">
          <img class="history-icon" src="https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}">
          <div class="history-item-content">
            <div class="history-title">${title}</div>
            <div class="history-url">${url}</div>
          </div>
          <div class="history-time">${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      `);
      item.addEventListener("click", () => {
        gBrowser.selectedTab = gBrowser.addTab(url, {
          triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
        });
      });
      return item;
    }

    // Load a batch of history items for a specific date range
    function loadHistoryBatch(startDate, endDate) {
      return new Promise((resolve, reject) => {
        try {
          const { PlacesUtils } = ChromeUtils.importESModule(
            "resource://gre/modules/PlacesUtils.sys.mjs",
          );
          const query = PlacesUtils.history.getNewQuery();
          query.beginTime = startDate.getTime() * 1000;
          query.endTime = endDate.getTime() * 1000;
          
          console.log(`[ZenHaven] Loading history from ${startDate.toISOString()} to ${endDate.toISOString()}`);
          
          const options = PlacesUtils.history.getNewQueryOptions();
          options.sortingMode = options.SORT_BY_DATE_DESCENDING;
          options.resultType = options.RESULTS_AS_URI;
          const result = PlacesUtils.history.executeQuery(query, options);
          const root = result.root;
          root.containerOpen = true;
          const items = [];
          for (let i = 0; i < root.childCount; i++) {
            const node = root.getChild(i);
            items.push(node);
          }
          root.containerOpen = false;
          console.log(`[ZenHaven] Loaded ${items.length} items`);
          resolve(items);
        } catch (error) {
          console.error("[ZenHaven] Error loading history batch:", error);
          reject(error);
        }
      });
    }

    // Function to filter history items based on search query
    function filterHistoryItems(items, query) {
      if (!query.trim()) return items;
      
      const searchTerm = query.toLowerCase();
      return items.filter(item => {
        const title = (item.title || "").toLowerCase();
        const url = item.uri.toLowerCase();
        return title.includes(searchTerm) || url.includes(searchTerm);
      });
    }

    // Function to perform search
    function performSearch() {
      const searchInput = historyContainer.querySelector('.history-search-input');
      searchQuery = searchInput.value;
      
      // Clear current display
      const historyContent = historyContainer.querySelector('.haven-history-content') || historyContainer;
      const searchContainer = historyContainer.querySelector('.history-search-container');
      const loadingIndicator = historyContainer.querySelector('.haven-history-loading');
      
      // Remove all content except search container and loading indicator
      Array.from(historyContent.children).forEach(child => {
        if (child !== searchContainer && child !== loadingIndicator) {
          child.remove();
        }
      });
      
      if (searchQuery.trim()) {
        // Filter and display search results
        const filteredItems = filterHistoryItems(allHistoryItems, searchQuery);
        if (filteredItems.length > 0) {
          const searchResults = renderHistoryBatch(filteredItems, new Date()); // Pass current date as reference
          historyContainer.insertBefore(searchResults, loadingIndicator);
        } else {
          const noResults = parseElement(
            `<div style="text-align: center; padding: 20px; color: #666;">No results found for "${searchQuery}"</div>`
          );
          historyContainer.insertBefore(noResults, loadingIndicator);
        }
      } else {
        // Show all items
        const allResults = renderHistoryBatch(allHistoryItems, new Date()); // Pass current date as reference
        historyContainer.insertBefore(allResults, loadingIndicator);
      }
    }

    // Update renderHistoryBatch to accept referenceDate
    function renderHistoryBatch(nodes, referenceDate) {
      const fragment = document.createDocumentFragment();
      // Use the referenceDate (endDate from slider) for section headers
      const refDate = new Date(referenceDate);
      refDate.setHours(0, 0, 0, 0);

      // Group nodes by day
      const visitsByDate = new Map();
      for (const node of nodes) {
        const visitTime = new Date(node.time / 1000);
        visitTime.setHours(0, 0, 0, 0);
        const dayKey = visitTime.getTime();
        if (!visitsByDate.has(dayKey)) {
          visitsByDate.set(dayKey, []);
        }
        visitsByDate.get(dayKey).push(node);
      }

      // Sort by most recent day first
      const sortedDays = Array.from(visitsByDate.keys()).sort((a, b) => b - a);

      for (const dayKey of sortedDays) {
        const dayDate = new Date(Number(dayKey));
        const label = getSectionLabel(dayDate, refDate);
        const header = parseElement(`<div class="history-section-header">${label}</div>`);
        fragment.appendChild(header);
        // Sort visits in descending order (most recent first)
        const visits = visitsByDate.get(dayKey).sort((a, b) => b.time - a.time);
        for (const node of visits) {
          fragment.appendChild(createHistoryItem(node));
        }
      }
      return fragment;
    }

    // Update getSectionLabel to use referenceDate for 'Today'
    function getSectionLabel(date, referenceDate) {
      const diffMs = referenceDate - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 14) return "1 week ago";
      if (diffDays < 28) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 60) return "1 month ago";
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      if (diffDays < 730) return "1 year ago";
      return `${Math.floor(diffDays / 365)} years ago`;
    }

    // Load more history
    function loadMoreHistory() {
      if (isLoading || noMoreHistory) return;
      isLoading = true;
      loadingIndicator.style.display = "block";
      
      // Calculate date range for next batch
      const endDate = new Date(currentStartDate);
      currentStartDate = new Date(currentStartDate);
      currentStartDate.setDate(currentStartDate.getDate() - DAYS_PER_BATCH);
      
      console.log(`[ZenHaven] Loading more history from ${currentStartDate.toISOString()} to ${endDate.toISOString()}`);
      
      loadHistoryBatch(currentStartDate, endDate)
        .then((nodes) => {
          if (nodes.length === 0) {
            noMoreHistory = true;
            loadingIndicator.style.display = "none";
            const endMessage = parseElement(
              `<div class="haven-history-end-message">No more history available</div>`,
            );
            historyContainer.appendChild(endMessage);
            return;
          }
          
          // Render the new batch
          const newSections = renderHistoryBatch(nodes, new Date()); // Pass current date as reference
          historyContainer.insertBefore(newSections, loadingIndicator);
          isLoading = false;
        })
        .catch((error) => {
          console.error("[ZenHaven] Error loading more history:", error);
          isLoading = false;
          loadingIndicator.innerHTML = `
              <div>Error loading history. <a href="#" id="retry-history-load">Retry</a></div>
            `;
          const retryLink = loadingIndicator.querySelector(
            "#retry-history-load",
          );
          if (retryLink) {
            retryLink.addEventListener("click", (e) => {
              e.preventDefault();
              loadingIndicator.innerHTML = `
                  <div class="loading-spinner"></div>
                  <div>Loading more history...</div>
                `;
              loadMoreHistory();
            });
          }
        });
    }

    // Scroll event handler with throttling
    function handleScroll() {
      if (scrollThrottleTimer !== null) {
        clearTimeout(scrollThrottleTimer);
      }
      scrollThrottleTimer = setTimeout(() => {
        if (isLoading || noMoreHistory) return;
        const containerHeight = historyContainer.clientHeight;
        const scrollPosition = historyContainer.scrollTop;
        const scrollHeight = historyContainer.scrollHeight;
        // Load more when user scrolls near the bottom (within 200px)
        if (scrollHeight - scrollPosition - containerHeight < 200) {
          loadMoreHistory();
        }
      }, 100);
    }

    // Initialize history view
    setTimeout(() => {
      try {
        // Clear only the history content, preserve search container
        const searchContainer = historyContainer.querySelector('.history-search-container');
        historyContainer.innerHTML = "";
        
        // Re-add the search container at the top
        if (searchContainer) {
          historyContainer.appendChild(searchContainer);
        }
        
        historyContainer.appendChild(loadingIndicator);
        historyContainer.addEventListener("scroll", handleScroll);
        
        // Initial load
        const endDate = new Date();
        currentStartDate = new Date();
        currentStartDate.setDate(currentStartDate.getDate() - DAYS_PER_BATCH);
        
        loadHistoryBatch(currentStartDate, endDate)
          .then((nodes) => {
            if (nodes.length === 0) {
              const noHistoryMessage = parseElement(
                '<div style="text-align: center; padding: 20px;">No browsing history found</div>'
              );
              historyContainer.appendChild(noHistoryMessage);
              return;
            }
            
            // Render the initial history sections
            const initialSections = renderHistoryBatch(nodes, new Date()); // Pass current date as reference
            historyContainer.insertBefore(initialSections, loadingIndicator);
            
            // Add event listeners for search and filter after content is loaded
            const searchInput = historyContainer.querySelector('.history-search-input');
            const filterBtn = historyContainer.querySelector('.history-filter-btn');
            
            if (searchInput) {
              // Search input event listener with debouncing
              let searchTimeout;
              searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                  performSearch();
                }, 300); // 300ms delay for better performance
              });
            }
            
            if (filterBtn) {
              filterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Open/close menupopup anchored to the filter button
                if (filterPopup.state === 'open') {
                  filterPopup.hidePopup();
                } else {
                  filterPopup.openPopup(filterBtn, "after_start");
                }
              });
            }
            
            // Trigger first scroll check after a short delay
            setTimeout(() => {
              handleScroll();
            }, 500);
          })
          .catch((error) => {
            console.error("[ZenHaven] Error initializing history:", error);
            const errorMessage = parseElement(
              '<div style="text-align: center; padding: 20px;">Error loading history</div>'
            );
            historyContainer.appendChild(errorMessage);
          });
      } catch (error) {
        console.error("[ZenHaven] Error setting up history view:", error);
        const errorMessage = parseElement(
          '<div style="text-align: center; padding: 20px;">Error loading history</div>'
        );
        historyContainer.appendChild(errorMessage);
      }
    }, 100);

    function updateTooltip(slider, tooltip, value, date) {
      // Position the tooltip above the thumb
      const sliderRect = slider.getBoundingClientRect();
      const containerRect = sliderContainer.getBoundingClientRect();
      const percent = (value / maxDays);
      const thumbX = percent * sliderRect.width;
      tooltip.textContent = formatDateDMY(date);
      tooltip.style.left = `${thumbX}px`;
    }

    function showTooltip(tooltip) {
      tooltip.classList.add('active');
    }
    function hideTooltip(tooltip) {
      tooltip.classList.remove('active');
    }

    sliderMin.addEventListener('input', () => showTooltip(tooltipMin));
    sliderMax.addEventListener('input', () => showTooltip(tooltipMax));
    sliderMin.addEventListener('mousedown', () => showTooltip(tooltipMin));
    sliderMax.addEventListener('mousedown', () => showTooltip(tooltipMax));
    sliderMin.addEventListener('touchstart', () => showTooltip(tooltipMin));
    sliderMax.addEventListener('touchstart', () => showTooltip(tooltipMax));

    sliderMin.addEventListener('blur', () => hideTooltip(tooltipMin));
    sliderMax.addEventListener('blur', () => hideTooltip(tooltipMax));
    window.addEventListener('mouseup', () => { hideTooltip(tooltipMin); hideTooltip(tooltipMax); });
    window.addEventListener('touchend', () => { hideTooltip(tooltipMin); hideTooltip(tooltipMax); });

    sliderMin.addEventListener('mouseenter', () => showTooltip(tooltipMin));
    sliderMax.addEventListener('mouseenter', () => showTooltip(tooltipMax));
    sliderMin.addEventListener('mouseleave', () => hideTooltip(tooltipMin));
    sliderMax.addEventListener('mouseleave', () => hideTooltip(tooltipMax));

    return historyContainer;
  },
};
