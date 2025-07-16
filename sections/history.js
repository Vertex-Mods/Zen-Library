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
          <div class="haven-history-loading-initial" style="text-align: center; padding: 20px;">
            <div class="loading-spinner"></div>
            <div>Loading history...</div>
          </div>
        </div>`,
    );

    // Add loading indicator at the bottom for infinite scrolling
    const loadingIndicator = parseElement(
      `<div class="haven-history-loading" style="display: none; text-align: center; padding: 20px;">
          <div class="loading-spinner"></div>
          <div>Loading more history...</div>
        </div>`,
    );

    // Add CSS for styling
    const style = document.createElement("style");
    style.textContent = `
        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top-color: #3498db;
          animation: spin 1s ease-in-out infinite;
          margin: 0 auto 10px auto;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .haven-history {
          overflow-y: auto;
          max-height: 100%;
          padding: 10px;
          scroll-behavior: smooth;
        }
        
        .haven-history-end-message {
          text-align: center;
          padding: 10px;
          color: #666;
          margin-top: 10px;
        }
      `;
    document.head.appendChild(style);

    // Variables for lazy loading
    const DAYS_PER_BATCH = 7;
    const SESSION_TIMEOUT_MINUTES = 30;
    let isLoading = false;
    let noMoreHistory = false;
    let currentStartDate = new Date();
    let scrollThrottleTimer = null;

    // Helper function to create collapsible sections
    function createCollapsible(title, expanded = false, className = "") {
      const wrapper = parseElement(`<div class="${className}">
          <div class="collapsible-header">
            <span class="section-toggle">${expanded ? "▼" : "▶"}</span>
            <span class="section-title">${title}</span>
          </div>
          <div class="collapsible-content" style="display: ${expanded ? "block" : "none"
        };"></div>
        </div>`);

      const header = wrapper.querySelector(".collapsible-header");
      const content = wrapper.querySelector(".collapsible-content");

      header.addEventListener("click", () => {
        const isOpen = content.style.display === "block";
        content.style.display = isOpen ? "none" : "block";
        header.querySelector(".section-toggle").textContent = isOpen
          ? "▶"
          : "▼";
      });

      return { wrapper, content };
    }

    // Helper function to create history item
    function createHistoryItem(node) {
      const item = parseElement(`<div class="haven-history-item">
          <img class="history-icon" src="https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(
        node.uri,
      )}">
          <div class="history-item-content">
            <div class="history-title">${node.title || node.uri}</div>
            <div class="history-time">${new Date(
        node.time / 1000,
      ).toLocaleTimeString()}</div>
          </div>
        </div>`);

      item.addEventListener("click", () => {
        gBrowser.selectedTab = gBrowser.addTab(node.uri, {
          triggeringPrincipal:
            Services.scriptSecurityManager.getSystemPrincipal(),
        });
      });

      return item;
    }

    // Function to load history data for a specific date range
    function loadHistoryBatch(startDate, endDate) {
      return new Promise((resolve, reject) => {
        try {
          const { PlacesUtils } = ChromeUtils.importESModule(
            "resource://gre/modules/PlacesUtils.sys.mjs",
          );

          const query = PlacesUtils.history.getNewQuery();
          query.beginTime = startDate.getTime() * 1000;
          query.endTime = endDate.getTime() * 1000;

          const options = PlacesUtils.history.getNewQueryOptions();
          options.sortingMode = options.SORT_BY_DATE_DESCENDING;
          options.resultType = options.RESULTS_AS_VISIT;

          const result = PlacesUtils.history.executeQuery(query, options);
          const root = result.root;
          root.containerOpen = true;

          // Process history data
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

            if (!visitsByDate.has(dayKey)) {
              visitsByDate.set(dayKey, []);
            }

            visitsByDate.get(dayKey).push({ node, time: visitTime });
          }

          root.containerOpen = false;
          resolve(visitsByDate);
        } catch (error) {
          console.error("[ZenHaven] Error loading history batch:", error);
          reject(error);
        }
      });
    }

    // Function to process visits and create sessions
    function processVisitsForDay(visits) {
      const sessions = [];
      let currentSession = [];
      let lastTime = null;

      visits.forEach(({ node, time }) => {
        if (
          lastTime &&
          (lastTime - time) / (1000 * 60) > SESSION_TIMEOUT_MINUTES
        ) {
          if (currentSession.length > 0) {
            sessions.push(currentSession);
          }
          currentSession = [];
        }

        currentSession.push({ node, time });
        lastTime = time;
      });

      if (currentSession.length > 0) {
        sessions.push(currentSession);
      }

      return sessions;
    }

    // Function to render day sections with sessions
    function renderDaySections(visitsByDate) {
      const fragment = document.createDocumentFragment();

      visitsByDate.forEach((visits, dayKey) => {
        const daySection = createCollapsible(
          "📅 " + dayKey,
          false,
          "day-section",
        );
        fragment.appendChild(daySection.wrapper);

        const sessions = processVisitsForDay(visits);

        sessions.forEach((session, idx) => {
          const sessionStart = session[session.length - 1].time;
          const sessionEnd = session[0].time;

          const timeRange = `${sessionStart.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} – ${sessionEnd.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`;

          const sessionTitle = `🕓 Session ${idx + 1} • ${timeRange}`;
          const sessionSection = createCollapsible(
            sessionTitle,
            false,
            "session-section",
          );
          daySection.content.appendChild(sessionSection.wrapper);

          // Add lazy loading for session items
          const sessionHeader = sessionSection.wrapper.querySelector(
            ".collapsible-header",
          );
          let sessionItemsLoaded = false;

          sessionHeader.addEventListener("click", () => {
            if (!sessionItemsLoaded) {
              // Only create DOM elements when the session is expanded
              session.forEach(({ node }) => {
                sessionSection.content.appendChild(createHistoryItem(node));
              });
              sessionItemsLoaded = true;
            }
          });
        });
      });

      return fragment;
    }

    // Function to load more history
    function loadMoreHistory() {
      if (isLoading || noMoreHistory) return;

      isLoading = true;
      loadingIndicator.style.display = "block";

      // Calculate date range for next batch
      const endDate = new Date(currentStartDate);
      currentStartDate = new Date(currentStartDate);
      currentStartDate.setDate(currentStartDate.getDate() - DAYS_PER_BATCH);

      // Load history batch
      loadHistoryBatch(currentStartDate, endDate)
        .then((visitsByDate) => {
          // If no more history found
          if (visitsByDate.size === 0) {
            noMoreHistory = true;
            loadingIndicator.style.display = "none";

            const endMessage = parseElement(
              `<div class="haven-history-end-message">No more history available</div>`,
            );
            historyContainer.appendChild(endMessage);
            return;
          }

          // Render the new history sections
          const newSections = renderDaySections(visitsByDate);

          // Insert before the loading indicator
          historyContainer.insertBefore(newSections, loadingIndicator);

          isLoading = false;
        })
        .catch((error) => {
          console.error("[ZenHaven] Error loading more history:", error);
          isLoading = false;

          // Show error message but allow retry
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
        // Add loading indicator to the container
        historyContainer.innerHTML = "";
        historyContainer.appendChild(loadingIndicator);

        // Set up scroll event listener
        historyContainer.addEventListener("scroll", handleScroll);

        // Initial load
        const endDate = new Date();
        currentStartDate = new Date();
        currentStartDate.setDate(currentStartDate.getDate() - DAYS_PER_BATCH);

        loadHistoryBatch(currentStartDate, endDate)
          .then((visitsByDate) => {
            // If no history found
            if (visitsByDate.size === 0) {
              historyContainer.innerHTML =
                '<div style="text-align: center; padding: 20px;">No browsing history found</div>';
              return;
            }

            // Render the initial history sections
            const initialSections = renderDaySections(visitsByDate);
            historyContainer.insertBefore(initialSections, loadingIndicator);

            // Trigger first scroll check after a short delay
            setTimeout(() => {
              handleScroll();
            }, 500);
          })
          .catch((error) => {
            console.error("[ZenHaven] Error initializing history:", error);
            historyContainer.innerHTML =
              '<div style="text-align: center; padding: 20px;">Error loading history</div>';
          });
      } catch (error) {
        console.error("[ZenHaven] Error setting up history view:", error);
        historyContainer.innerHTML =
          '<div style="text-align: center; padding: 20px;">Error loading history</div>';
      }
    }, 100); // Short delay to allow UI to render first

    return historyContainer;
  },
};
