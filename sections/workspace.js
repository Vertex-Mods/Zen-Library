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

function isAncestor(child, ancestor) {
  let node = child;
  while (node) {
    if (node === ancestor) return true;
    node = node.parentNode;
  }
  return false;
}

// Track original parents for zen-workspace elements
const zenWorkspaceOriginalParents = new Map();

function restoreZenWorkspace(uuid) {
  const info = zenWorkspaceOriginalParents.get(uuid);
  const zenWorkspaceEl = document.getElementById(uuid);
  if (info && zenWorkspaceEl) {
    if (info.nextSibling && info.parent.contains(info.nextSibling)) {
      info.parent.insertBefore(zenWorkspaceEl, info.nextSibling);
    } else {
      info.parent.appendChild(zenWorkspaceEl);
    }
    zenWorkspaceOriginalParents.delete(uuid);
    console.log(`[ZenHaven] Restored zen-workspace element for uuid: ${uuid} to its original parent.`);
  }
}

export const workspacesSection = {
  id: "workspaces",
  label: "Workspaces",
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2H13V14H3V2ZM2 2C2 1.44772 2.44772 1 3 1H13C13.5523 1 14 1.44772 14 2V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 0.96814 14.5523 0.96814 14V2ZM4 4H12V5H4V4ZM4 7H12V8H4V7ZM12 10H4V11H12V10Z" fill="currentColor"/>
      </svg>`,
  init: function() {
    // Ensure every real Firefox tab has a unique id for drag-and-drop matching
    if (typeof gBrowser !== 'undefined' && gBrowser.tabs) {
      Array.from(gBrowser.tabs).forEach(tab => {
        if (!tab.hasAttribute('id')) {
          tab.setAttribute('id', 'zen-real-tab-' + Math.random().toString(36).slice(2));
        }
      });
    }
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
        allWorkspaces.forEach((workspace, idx) => {
          const { uuid, theme, name, icon } = workspace;
          // Build a proxy UI for each workspace
          const workspaceDiv = parseElement(
            `<div class="haven-workspace">
                  <div class="haven-workspace-header">
                    <span class="workspace-icon">${icon}</span>
                    <span class="workspace-name">${name}</span>
                  </div>
                </div>`,
          );
          workspaceDiv.dataset.uuid = uuid;

          // Drag handle
          const dragHandle = parseElement(
            `<span class="workspace-drag-handle" draggable="true" style="cursor: grab;"></span>`
          );
          dragHandle.addEventListener("dragstart", (e) => {
            const workspaceElement = e.target.closest(".haven-workspace");
            workspaceElement.classList.add("dragging");
            e.dataTransfer.effectAllowed = "move";
          });
          dragHandle.addEventListener("dragend", (e) => {
            const workspaceElement = e.target.closest(".haven-workspace");
            workspaceElement.classList.remove("dragging");
          });

          // Theme background
          if (theme?.type === "gradient" && theme.gradientColors?.length) {
            workspaceDiv.style.background = getGradientCSS(theme);
          } else {
            workspaceDiv.style.background = "var(--zen-colors-border)";
          }

          // Proxy menu and actions
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

          // Proxy rename
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
          menuPopup.querySelector(".rename").addEventListener("click", enableRename);

          // Proxy switch workspace
          menuPopup.querySelector(".switch").addEventListener("click", async () => {
            await gZenWorkspaces.changeWorkspaceWithID(uuid);
            window.haven.destroyUI();
          });

          // Proxy delete workspace
          menuPopup.querySelector(".delete-workspace").addEventListener("click", async () => {
            if (confirm(`Are you sure you want to delete workspace "${name}"?`)) {
              await gZenWorkspaces.removeWorkspace(uuid);
              workspaceDiv.remove();
            }
          });

          // Proxy change theme
          menuPopup.querySelector(".change-theme").addEventListener("click", async (event) => {
            try {
              await gZenWorkspaces.changeWorkspaceWithID(uuid);
              let anchor = workspaceDiv.querySelector('.haven-workspace-header');
              if (!anchor) anchor = popupOpenButton;
              if (typeof PanelMultiView !== "undefined" && gZenThemePicker?.panel) {
                PanelMultiView.openPopup(gZenThemePicker.panel, anchor, {
                  position: "bottomcenter topright",
                });
              } else {
                throw new Error("PanelMultiView or gZenThemePicker.panel is not available");
              }
            } catch (e) {
              console.error("Error opening theme picker:", e);
            }
          });

          // Proxy tab list (visual only)
          const contentDiv = parseElement(`<div class="haven-workspace-content"></div>`);
          const pinnedTabsContainer = parseElement(`<div class="haven-workspace-pinned-tabs"></div>`);
          const regularTabsContainer = parseElement(`<div class="haven-workspace-regular-tabs"></div>`);
          allTabs
            .filter(
              (tabEl) =>
                tabEl &&
                tabEl.getAttribute("zen-workspace-id") === uuid &&
                !tabEl.hasAttribute("zen-essential"),
            )
            .forEach((tabEl) => {
              // Proxy: show tab info with icon, title, and copy-link
              const tabUrl = tabEl.linkedBrowser?.currentURI?.spec || tabEl.getAttribute('data-url') || tabEl.getAttribute('label') || '';
              const tabTitle = tabEl.getAttribute('label') || tabEl.getAttribute('title') || 'Tab';
              let faviconUrl = tabEl.getAttribute('image') || tabEl.getAttribute('icon') || '';
              if (!faviconUrl && tabUrl.startsWith('http')) {
                faviconUrl = `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(tabUrl)}`;
              }
              const tabProxy = parseElement(`
                <div class="haven-tab" draggable="true">
                  <span class="tab-icon">${faviconUrl ? `<img src="${faviconUrl}" style="width:16px;height:16px;vertical-align:middle;">` : ''}</span>
                  <span class="tab-title">${tabTitle}</span>
                  <button class="copy-link" title="Copy tab URL" aria-label="Copy tab URL">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5 2.5a3 3 0 0 1 4.24 4.24l-5.5 5.5a3 3 0 0 1-4.24-4.24l1.5-1.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                      <rect x="2.5" y="9.5" width="6" height="4" rx="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    </svg>
                  </button>
                </div>
              `);
              // Tab click: switch to this tab
              tabProxy.addEventListener('click', (e) => {
                if (e.target.classList.contains('copy-link')) return;
                if (typeof gBrowser !== 'undefined' && gBrowser.selectedTab !== tabEl) {
                  gBrowser.selectedTab = tabEl;
                }
              });
              tabProxy.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (tabEl && typeof tabEl.dispatchEvent === 'function') {
                  const evt = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    screenX: e.screenX,
                    screenY: e.screenY,
                    button: 2
                  });
                  tabEl.dispatchEvent(evt);
                }
              });
              tabProxy.querySelector('.copy-link').addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`[ZenHaven] Copying URL for tab: ${tabTitle} (${tabUrl})`);
                if (tabUrl) {
                  // Try modern clipboard API first
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(tabUrl).then(() => {
                      if (typeof gZenUIManager !== 'undefined' && gZenUIManager.showToast) {
                        gZenUIManager.showToast('zen-copy-current-url-confirmation');
                      }
                    }).catch(() => {
                      // Fallback if clipboard API fails
                      console.error(`[ZenHaven] Clipboard API failed, falling back to execCommand for tab: ${tabTitle} (${tabUrl})`);
                    });
                  } else {
                    console.error(`[ZenHaven] Clipboard API failed, falling back to execCommand for tab: ${tabTitle} (${tabUrl})`);
                  }
                }
              });
              // --- Drag-and-drop logic for tabs ---
              tabProxy.tabEl = tabEl; // Attach real tab reference
              tabProxy.dataset.tabId = tabEl.getAttribute('id') || '';
              tabProxy.dataset.pinned = tabEl.hasAttribute('pinned') ? 'true' : 'false';
              tabProxy.dataset.workspaceUuid = uuid;
              // Track original parent and index for restoration
              let originalTabParent = null;
              let originalTabIndex = null;
              tabProxy.addEventListener('dragstart', (e) => {
                tabProxy.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', tabProxy.dataset.tabId);
                tabProxy.parentNode.classList.add('drag-source');
                contentDiv.classList.add('tab-drag-context');
                // Save original parent and index
                originalTabParent = tabProxy.parentNode;
                originalTabIndex = Array.from(tabProxy.parentNode.children).indexOf(tabProxy);
              });
              tabProxy.addEventListener('dragend', (e) => {
                tabProxy.classList.remove('dragging');
                document.querySelectorAll('.haven-workspace-pinned-tabs, .haven-workspace-regular-tabs').forEach(c => c.classList.remove('drag-over', 'drag-source'));
                contentDiv.classList.remove('tab-drag-context');
                // If not in a valid container, restore to original position
                const validContainers = [pinnedTabsContainer, regularTabsContainer];
                if (!validContainers.includes(tabProxy.parentNode)) {
                  if (originalTabParent && originalTabIndex !== null) {
                    const children = Array.from(originalTabParent.children);
                    if (children.length > originalTabIndex) {
                      originalTabParent.insertBefore(tabProxy, children[originalTabIndex]);
                    } else {
                      originalTabParent.appendChild(tabProxy);
                    }
                  }
                }
                originalTabParent = null;
                originalTabIndex = null;
              });
              // Prevent default drop on document/body to avoid accidental drops outside
              if (!window.__zenTabDropPrevented) {
                window.addEventListener('dragover', e => e.preventDefault());
                window.addEventListener('drop', e => e.preventDefault());
                window.__zenTabDropPrevented = true;
              }
              // Only allow drop on containers within this workspace
              [pinnedTabsContainer, regularTabsContainer].forEach(container => {
                container.addEventListener('dragover', (e) => {
                  // Only allow drop if this workspace is the drag context
                  if (!contentDiv.classList.contains('tab-drag-context')) return;
                  e.preventDefault();
                  container.classList.add('drag-over');
                });
                container.addEventListener('dragleave', (e) => {
                  container.classList.remove('drag-over');
                });
                container.addEventListener('drop', async (e) => {
                  // Only allow drop if this workspace is the drag context
                  if (!contentDiv.classList.contains('tab-drag-context')) return;
                  e.preventDefault();
                  container.classList.remove('drag-over');
                  const dragging = container.querySelector('.dragging') || document.querySelector('.haven-tab.dragging');
                  if (!dragging) return;
                  // Only allow drop if the tab belongs to this workspace
                  if (dragging.dataset.workspaceUuid !== uuid) return;
                  // Always use vertical position to determine drop location
                  const after = getTabAfterElement(container, e.clientY);
                  if (after == null) {
                    container.appendChild(dragging);
                  } else {
                    container.insertBefore(dragging, after);
                  }
                  // Update pin state if moved between containers
                  const isPinnedTarget = container === pinnedTabsContainer;
                  const tabEl = dragging.tabEl;
                  if (tabEl) {
                    if (isPinnedTarget) {
                      tabEl.setAttribute('pinned', 'true');
                    } else {
                      tabEl.removeAttribute('pinned');
                    }
                  }
                  // Update order in gZenWorkspaces
                  if (typeof gZenWorkspaces?.reorderTab === 'function') {
                    const newIndex = Array.from(container.children).indexOf(dragging);
                    await gZenWorkspaces.reorderTab(tabEl, newIndex, isPinnedTarget);
                  }
                });
              });
              // Helper for reordering within container
              function getTabAfterElement(container, y) {
                const draggableTabs = [...container.querySelectorAll('.haven-tab:not(.dragging)')];
                return draggableTabs.reduce((closest, child) => {
                  const box = child.getBoundingClientRect();
                  const offset = y - box.top - box.height / 2;
                  if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                  } else {
                    return closest;
                  }
                }, { offset: Number.NEGATIVE_INFINITY }).element;
              }
              // --- End drag-and-drop logic ---
              // --- Custom drag-and-drop logic for vertical tabs ---
              function getAllTabProxies() {
                return [
                  ...pinnedTabsContainer.querySelectorAll('.haven-tab'),
                  ...regularTabsContainer.querySelectorAll('.haven-tab'),
                ];
              }

              let isDragging = false;
              let dragTab = null;
              let dragStartY = 0;
              let dragStartX = 0;
              let dragOffsetY = 0;
              let dragOffsetX = 0;
              let dragMouseOffset = 0;
              let placeholder = null;
              let lastContainer = null;
              let dragHoldTimeout = null;

              // --- Drag-and-drop logic for tabProxy ---
              tabProxy.addEventListener('mousedown', async (e) => {
                if (e.button !== 0) return; // Only left click
                if (e.target.closest('.copy-link')) return; // Don't start drag on copy-link button
                const isPinned = tabEl && tabEl.hasAttribute('pinned');
                const workspaceEl = gZenWorkspaces.workspaceElement(uuid);
                if (workspaceEl && !workspaceEl.hasAttribute('active')) {
                  // Switch to the workspace, then re-trigger drag
                  await gZenWorkspaces.changeWorkspaceWithID(uuid);
                  if (window.haven && typeof window.haven.initializeUI === 'function' && !window.haven.uiInitialized) {
                    window.haven.initializeUI();
                  }
                  setTimeout(() => {
                    tabProxy.dispatchEvent(new MouseEvent('mousedown', {
                      bubbles: true,
                      cancelable: true,
                      clientX: e.clientX,
                      clientY: e.clientY,
                      button: 0
                    }));
                  }, 100);
                  return;
                }
                if (isPinned) {
                  const workspaceEl = gZenWorkspaces.workspaceElement(uuid);
                  if (!workspaceEl || !workspaceEl.hasAttribute('active')) {
                    if (window.gZenUIManager && gZenUIManager.showToast) {
                      gZenUIManager.showToast('Pinned tab order can only be changed in the active workspace.');
                    } else {
                      alert('Pinned tab order can only be changed in the active workspace.');
                    }
                    return;
                  }
                }
                if (tabEl && !tabEl.hasAttribute('id')) {
                  tabEl.setAttribute('id', 'zen-real-tab-' + Math.random().toString(36).slice(2));
                }
                e.preventDefault();
                let dragStarted = false;
                dragHoldTimeout = setTimeout(() => {
                  dragStarted = true;
                  isDragging = true;
                  dragTab = tabProxy;
                  const tabRect = tabProxy.getBoundingClientRect();
                  dragStartY = tabRect.top;
                  dragStartX = tabRect.left;
                  dragMouseOffset = e.clientY - tabRect.top;
                  dragOffsetY = 0;
                  dragOffsetX = e.clientX - tabRect.left;
                  lastContainer = tabProxy.parentNode;
                  dragTab._dragSection = isPinned ? 'pinned' : 'regular';
                  // --- Insert placeholder BEFORE moving tab out of DOM ---
                  placeholder = document.createElement('div');
                  placeholder.className = 'haven-tab drag-placeholder';
                  placeholder.style.height = `${tabProxy.offsetHeight}px`;
                  placeholder.style.width = `${tabProxy.offsetWidth}px`;
                  tabProxy.parentNode.insertBefore(placeholder, tabProxy);
                  // --- Now move tab out of flow: fixed position at its original screen position ---
                  tabProxy.style.position = 'fixed';
                  tabProxy.style.top = `${tabRect.top}px`;
                  tabProxy.style.left = `${tabRect.left}px`;
                  tabProxy.style.width = `${tabRect.width}px`;
                  tabProxy.style.height = `${tabRect.height}px`;
                  tabProxy.style.zIndex = 1000;
                  tabProxy.style.pointerEvents = 'none';
                  tabProxy.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1), scale 0.18s cubic-bezier(.4,1.3,.5,1)';
                  tabProxy.style.transform = 'scale(0.92)';
                  tabProxy.setAttribute('drag-tab', '');
                  tabProxy.classList.add('dragging-tab');
                  document.body.appendChild(tabProxy);
                  document.body.style.userSelect = 'none';
                  getAllTabProxies().forEach(tab => {
                    if (tab !== dragTab) {
                      tab.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1)';
                    }
                  });
                  window.addEventListener('mousemove', onDragMove);
                  window.addEventListener('mouseup', onDragEnd);
                }, 500);
                // If mouse is released before 0.5s, cancel drag
                function cancelHold(e2) {
                  clearTimeout(dragHoldTimeout);
                  window.removeEventListener('mouseup', cancelHold);
                  window.removeEventListener('mouseleave', cancelHold);
                }
                window.addEventListener('mouseup', cancelHold);
                window.addEventListener('mouseleave', cancelHold);
              });

              // Helper: Sync the custom UI with the real Firefox tab order
              function syncCustomUIWithRealTabs() {
                // For the active workspace only
                const workspaceEl = gZenWorkspaces.workspaceElement(uuid);
                if (!workspaceEl) return;
                // Pinned
                const pinnedContainer = workspaceEl.pinnedTabsContainer;
                const realPinnedTabs = Array.from(gBrowser.tabs).filter(t => t.pinned && t.getAttribute('zen-workspace-id') === uuid);
                realPinnedTabs.forEach(tab => {
                  const proxy = Array.from(pinnedContainer.querySelectorAll('.haven-tab')).find(t => t.tabEl && t.tabEl.getAttribute('id') === tab.getAttribute('id'));
                  if (proxy) pinnedContainer.appendChild(proxy);
                });
                // Regular
                const regularContainer = workspaceEl.tabsContainer;
                const realRegularTabs = Array.from(gBrowser.tabs).filter(t => !t.pinned && t.getAttribute('zen-workspace-id') === uuid);
                realRegularTabs.forEach(tab => {
                  const proxy = Array.from(regularContainer.querySelectorAll('.haven-tab')).find(t => t.tabEl && t.tabEl.getAttribute('id') === tab.getAttribute('id'));
                  if (proxy) regularContainer.appendChild(proxy);
                });
              }

              function onDragMove(e) {
                if (!isDragging || !dragTab) return;
                // Move the tab visually with the mouse
                const newY = e.clientY - dragMouseOffset;
                const newX = dragStartX; // lock X axis
                dragTab.style.top = `${newY}px`;
                dragTab.style.left = `${newX}px`;
                // --- Restrict drag to section ---
                const section = dragTab._dragSection;
                const sectionContainer = section === 'pinned' ? pinnedTabsContainer : regularTabsContainer;
                // Only consider tabs in the same section
                // Move placeholder to correct position within section
                if (section === 'pinned') {
                  const pinnedTabs = Array.from(pinnedTabsContainer.querySelectorAll('.haven-tab'));
                  let insertBefore = null;
                  for (let i = 0; i < pinnedTabs.length; i++) {
                    const tab = pinnedTabs[i];
                    if (tab === dragTab) continue;
                    const rect = tab.getBoundingClientRect();
                    // Use a small deadzone to avoid jitter
                    if (e.clientY < rect.top + rect.height / 2 - 2) {
                      insertBefore = tab;
                      break;
                    }
                  }
                  // Prevent inserting after the last pinned tab (which would unpin)
                  if (!insertBefore) {
                    // Always insert before the last pinned tab (not after)
                    if (placeholder !== pinnedTabs[pinnedTabs.length - 1]) {
                      pinnedTabsContainer.insertBefore(placeholder, pinnedTabs[pinnedTabs.length - 1]);
                    }
                  } else {
                    if (placeholder !== insertBefore) {
                      pinnedTabsContainer.insertBefore(placeholder, insertBefore);
                    }
                  }
                } else {
                  // Regular tabs logic (unchanged)
                  let insertBefore = null;
                  for (const tab of regularTabsContainer.querySelectorAll('.haven-tab')) {
                    if (tab === dragTab) continue;
                    const rect = tab.getBoundingClientRect();
                    if (e.clientY < rect.top + rect.height / 2 - 2) {
                      insertBefore = tab;
                      break;
                    }
                  }
                  if (insertBefore) {
                    if (placeholder !== insertBefore) {
                      regularTabsContainer.insertBefore(placeholder, insertBefore);
                    }
                  } else {
                    if (placeholder !== regularTabsContainer.lastChild) {
                      regularTabsContainer.appendChild(placeholder);
                    }
                  }
                }
                // Animate other tabs to move out of the way
                getAllTabProxies().forEach(tab => {
                  if (tab === dragTab) return;
                  tab.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1)';
                  tab.style.transform = '';
                  if (tab.parentNode === sectionContainer) {
                    const tabRect = tab.getBoundingClientRect();
                    const placeholderRect = placeholder.getBoundingClientRect();
                    if (tabRect.top < placeholderRect.top && tabRect.bottom > newY) {
                      tab.style.transform = `translateY(-${placeholderRect.height}px)`;
                    } else if (tabRect.top > placeholderRect.top) {
                      tab.style.transform = `translateY(${placeholderRect.height}px)`;
                    }
                  }
                });
              }

              function onDragEnd(e) {
                if (dragHoldTimeout) {
                  clearTimeout(dragHoldTimeout);
                  dragHoldTimeout = null;
                }
                if (!isDragging || !dragTab) return;
                // Insert tab at placeholder
                placeholder.parentNode.insertBefore(dragTab, placeholder);
                // Restore tab's styles
                dragTab.style.position = '';
                dragTab.style.top = '';
                dragTab.style.left = '';
                dragTab.style.width = '';
                dragTab.style.height = '';
                dragTab.style.zIndex = '';
                dragTab.style.pointerEvents = '';
                dragTab.style.transition = '';
                dragTab.classList.remove('dragging-tab');
                dragTab.removeAttribute('drag-tab');
                dragTab.style.transform = '';
                // Update pin state if moved between containers (should never happen now)
                const isPinnedTarget = placeholder.parentNode === pinnedTabsContainer;
                const tabEl = dragTab.tabEl;
                // --- Ensure tabEl has a unique id ---
                if (tabEl && !tabEl.getAttribute('id')) {
                  tabEl.setAttribute('id', 'zen-tab-' + Math.random().toString(36).slice(2));
                }
                if (tabEl) {
                  if (isPinnedTarget) {
                    tabEl.setAttribute('pinned', 'true');
                  } else {
                    tabEl.removeAttribute('pinned');
                  }
                }
                // --- Update the underlying tab order in the workspace ---
                // Always use the real tab's id for matching
                function getTabIdList(container) {
                  return Array.from(container.querySelectorAll('.haven-tab')).map(t => t.tabEl && t.tabEl.getAttribute('id')).filter(Boolean);
                }
                // Only update the order within the section
                let order, section;
                if (isPinnedTarget) {
                  order = getTabIdList(pinnedTabsContainer);
                  section = 'pinned';
                } else {
                  order = getTabIdList(regularTabsContainer);
                  section = 'regular';
                }
                // Debug log for tab order
                console.log('[ZenHaven] New', section, 'tab order:', order);
                // --- Update the real Firefox tab order using gBrowser.moveTabTo ---
                // Note: Pinned tab order is global, not per workspace!
                function reorderFirefoxPinnedTabs(order) {
                  // Get all real pinned tabs (global, not per workspace)
                  const allTabs = Array.from(gBrowser.tabs);
                  let pinnedTabs = allTabs.filter(t => t.pinned);
                  console.log('[ZenHaven] Real pinned tabs before reorder:', pinnedTabs.map(t => t.getAttribute('id')));
                  // For each tab in the new order, move it to the correct index among pinned tabs
                  for (let i = 0; i < order.length; i++) {
                    // Always match by the real tab's id
                    const tab = allTabs.find(t => t.getAttribute('id') === order[i]);
                    if (tab && !tab.pinned) {
                      console.log(`[ZenHaven] Pinning tab ${tab.getAttribute('id')}`);
                      gBrowser.pinTab(tab);
                    }
                    // Always move to index i among pinned tabs
                    if (tab && pinnedTabs[i] !== tab) {
                      console.log(`[ZenHaven] Moving tab ${tab.getAttribute('id')} to pinned index ${i}`);
                      gBrowser.moveTabTo(tab, i);
                      // After move, update pinnedTabs to reflect the new order
                      pinnedTabs = Array.from(gBrowser.tabs).filter(t => t.pinned);
                      console.log('[ZenHaven] Real pinned tabs after move:', pinnedTabs.map(t => t.getAttribute('id')));
                    }
                  }
                  // Final pinned tab order
                  pinnedTabs = Array.from(gBrowser.tabs).filter(t => t.pinned);
                  console.log('[ZenHaven] Final real pinned tab order:', pinnedTabs.map(t => t.getAttribute('id')));
                }
                function reorderFirefoxRegularTabs(order) {
                  const allTabs = Array.from(gBrowser.tabs);
                  const pinnedCount = gBrowser.tabs.filter(t => t.pinned).length;
                  for (let i = 0; i < order.length; i++) {
                    // Always match by the real tab's id
                    const tab = allTabs.find(t => t.getAttribute('id') === order[i]);
                    if (tab && tab.pinned) gBrowser.unpinTab(tab);
                    if (tab) gBrowser.moveTabTo(tab, pinnedCount + i);
                  }
                }
                if (section === 'pinned') {
                  // Update the workspace's pinned tab order in the data model
                  if (typeof gZenWorkspaces?.updateWorkspacePinnedOrder === 'function') {
                    gZenWorkspaces.updateWorkspacePinnedOrder(uuid, order);
                  }
                  // If this workspace is active, also update the real tab strip
                  const workspaceEl = gZenWorkspaces.workspaceElement(uuid);
                  if (workspaceEl && workspaceEl.hasAttribute('active')) {
                    reorderFirefoxPinnedTabs(order);
                  }
                } else {
                  reorderFirefoxRegularTabs(order);
                }
                // --- End Firefox tab order update ---
                if (typeof gZenWorkspaces?.reorderTabsInWorkspace === 'function') {
                  if (isPinnedTarget) {
                    gZenWorkspaces.reorderTabsInWorkspace(uuid, order, getTabIdList(regularTabsContainer));
                  } else {
                    gZenWorkspaces.reorderTabsInWorkspace(uuid, getTabIdList(pinnedTabsContainer), order);
                  }
                } else if (typeof gZenWorkspaces?.reorderTab === 'function') {
                  const newIndex = Array.from(placeholder.parentNode.children).indexOf(dragTab);
                  gZenWorkspaces.reorderTab(tabEl, newIndex, isPinnedTarget);
                }
                document.body.style.userSelect = '';
                if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
                // After drop, reset all transforms and transitions immediately
                getAllTabProxies().forEach(tab => {
                  tab.style.transition = '';
                  tab.style.transform = '';
                });
                // --- Always sync the custom UI with the real tab order after a move ---
                setTimeout(syncCustomUIWithRealTabs, 0);
                isDragging = false;
                dragTab = null;
                placeholder = null;
                window.removeEventListener('mousemove', onDragMove);
                window.removeEventListener('mouseup', onDragEnd);
              }
              // --- End custom drag-and-drop logic ---
              if (tabEl.hasAttribute("pinned")) {
                pinnedTabsContainer.appendChild(tabProxy);
              } else {
                regularTabsContainer.appendChild(tabProxy);
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
          innerContainer.appendChild(workspaceDiv);
        });
        innerContainer.appendChild(addWorkspaceButton);
      })
      .catch((error) => {
        console.error("[ZenHaven] Error building workspaces section:", error);
      });
    return container;
  },
};

// Hook into UI destroy/cleanup (example, adapt to your actual destroy logic)
if (window.haven && typeof window.haven.destroyUI === 'function') {
  const originalDestroyUI = window.haven.destroyUI;
  window.haven.destroyUI = function(...args) {
    // Find the workspaces container and call cleanup
    const container = document.getElementById('haven-workspace-outer-container')?.parentNode;
    if (container && typeof container._restoreZenWorkspaces === 'function') {
      container._restoreZenWorkspaces();
    }
    return originalDestroyUI.apply(this, args);
  };
}
 