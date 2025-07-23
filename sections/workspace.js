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

// Helper for appending XUL or HTML elements
const appendXUL = (parentElement, xulString, insertBefore = null, XUL = false) => {
  let element;
  if (XUL) {
    element = window.MozXULElement.parseXULToFragment(xulString);
    element = element.firstElementChild || element;
  } else {
    element = new DOMParser().parseFromString(xulString, "text/html");
    if (element.body.children.length) {
      element = element.body.firstChild;
    } else {
      element = element.head.firstChild;
    }
  }
  element = parentElement.ownerDocument.importNode(element, true);
  if (insertBefore) {
    parentElement.insertBefore(element, insertBefore);
  } else {
    parentElement.appendChild(element);
  }
  return element;
};

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

    // Workspace drag and drop variables
    let isDraggingWorkspace = false;
    let dragWorkspace = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragMouseOffset = 0;
    let workspacePlaceholder = null;
    let dragHoldTimeout = null;
    let lastDragX = 0; // Track last drag position to reduce jitter
    let dragThreshold = 1; // Reduced threshold for more responsive movement

    function getWorkspaceAfterElement(container, x) {
      const draggableWorkspaces = [
        ...container.querySelectorAll(".haven-workspace:not(.dragging-workspace)"),
      ];

      return draggableWorkspaces.reduce(
        (closest, workspace) => {
          const box = workspace.getBoundingClientRect();
          const offset = x - box.left - box.width / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: workspace };
          } else {
            return closest;
          }
        },
        { offset: Number.NEGATIVE_INFINITY },
      ).element;
    }

    function getAllWorkspaces() {
      return Array.from(innerContainer.querySelectorAll('.haven-workspace'));
    }

    function onWorkspaceDragMove(e) {
      if (!isDraggingWorkspace || !dragWorkspace) return;
      
      // Check if movement is significant enough to update
      const currentX = e.clientX;
      if (Math.abs(currentX - lastDragX) < dragThreshold) {
        return;
      }
      lastDragX = currentX;
      
      // Move the workspace visually with the mouse (horizontal only)
      const newX = e.clientX - dragMouseOffset;
      const newY = dragStartY; // lock Y axis
      dragWorkspace.style.left = `${newX}px`;
      dragWorkspace.style.top = `${newY}px`;
      
      // Get the add button to prevent dragging past it
      const addButton = innerContainer.querySelector('.haven-workspace-add-button');
      const addButtonRect = addButton ? addButton.getBoundingClientRect() : null;
      
      // Check if we're trying to drag past the add button
      if (addButtonRect && e.clientX > addButtonRect.left) {
        // Don't allow dragging past the add button
        return;
      }
      
      // Get all non-dragging workspaces
      const otherWorkspaces = getAllWorkspaces().filter(ws => ws !== dragWorkspace);
      
      // Find the workspace that the dragged workspace is touching
      let targetWorkspace = null;
      let insertBefore = null;
      
      for (const workspace of otherWorkspaces) {
        const workspaceRect = workspace.getBoundingClientRect();
        const draggedRect = dragWorkspace.getBoundingClientRect();
        
        // Check if the dragged workspace is touching this workspace
        // Use a smaller overlap threshold for more responsive behavior
        const overlapThreshold = 5; // pixels of overlap required
        const isTouching = !(draggedRect.right < workspaceRect.left + overlapThreshold || 
                           draggedRect.left > workspaceRect.right - overlapThreshold);
        
        if (isTouching) {
          // Determine if we should insert before or after this workspace
          const draggedCenter = draggedRect.left + draggedRect.width / 2;
          const workspaceCenter = workspaceRect.left + workspaceRect.width / 2;
          
          if (draggedCenter < workspaceCenter) {
            // Insert before this workspace
            insertBefore = workspace;
            break;
        } else {
            // Insert after this workspace, but continue checking for better position
            insertBefore = workspace.nextElementSibling;
            targetWorkspace = workspace;
          }
        }
      }
      
      // If no specific workspace is being touched, determine position based on mouse position
      if (!insertBefore) {
        const afterElement = getWorkspaceAfterElement(innerContainer, e.clientX);
        insertBefore = afterElement;
      }
      
      // Move placeholder to correct position
      if (insertBefore == null) {
        // Check if we should append before the add button
        if (addButton && workspacePlaceholder !== addButton) {
          innerContainer.insertBefore(workspacePlaceholder, addButton);
        } else if (workspacePlaceholder !== innerContainer.lastChild) {
          innerContainer.appendChild(workspacePlaceholder);
        }
      } else {
        if (workspacePlaceholder !== insertBefore) {
          innerContainer.insertBefore(workspacePlaceholder, insertBefore);
        }
      }
      
      // Immediately animate other workspaces to move out of the way
      getAllWorkspaces().forEach(workspace => {
        if (workspace === dragWorkspace) return;
        
        // Add transition for smooth movement
        if (!workspace.style.transition) {
          workspace.style.transition = 'transform 0.15s cubic-bezier(.4,1.3,.5,1)';
        }
        
        const workspaceRect = workspace.getBoundingClientRect();
        const placeholderRect = workspacePlaceholder.getBoundingClientRect();
        
        // Calculate the distance to move based on actual overlap
        const workspaceCenter = workspaceRect.left + workspaceRect.width / 2;
        const placeholderCenter = placeholderRect.left + placeholderRect.width / 2;
        
        // Move workspaces immediately when they need to shift
        // Fixed logic: workspace should move in the opposite direction of the drag
        if (workspaceRect.left < placeholderRect.left) {
          // Workspace is to the left of placeholder, move it slightly left to make room
          const moveDistance = Math.min(20, Math.abs(workspaceRect.right - placeholderRect.left));
          workspace.style.transform = `translateX(-${moveDistance}px)`;
        } else if (workspaceRect.left > placeholderRect.left) {
          // Workspace is to the right of placeholder, move it slightly right to make room
          const moveDistance = Math.min(20, Math.abs(workspaceRect.left - placeholderRect.right));
          workspace.style.transform = `translateX(${moveDistance}px)`;
        } else {
          // Reset transform if no movement needed
          workspace.style.transform = '';
        }
      });
    }

    function onWorkspaceDragEnd(e) {
      if (dragHoldTimeout) {
        clearTimeout(dragHoldTimeout);
        dragHoldTimeout = null;
      }
      
      if (!isDraggingWorkspace || !dragWorkspace) return;
      
      // Insert workspace at placeholder position
      workspacePlaceholder.parentNode.insertBefore(dragWorkspace, workspacePlaceholder);
      
      // Restore workspace styles
      dragWorkspace.style.position = '';
      dragWorkspace.style.top = '';
      dragWorkspace.style.left = '';
      dragWorkspace.style.width = '';
      dragWorkspace.style.height = '';
      dragWorkspace.style.zIndex = '';
      dragWorkspace.style.pointerEvents = '';
      dragWorkspace.style.transition = '';
      dragWorkspace.classList.remove('dragging-workspace');
      dragWorkspace.removeAttribute('drag-workspace');
      dragWorkspace.style.transform = '';
      
      // Restore drag handle cursor
      const dragHandle = dragWorkspace.querySelector('.workspace-drag-handle');
      if (dragHandle) {
        dragHandle.style.cursor = 'grab';
      }
      
      // Update workspace order
      const workspaceElements = getAllWorkspaces();
      const newIndex = workspaceElements.findIndex(el => el === dragWorkspace);
      const draggedUuid = dragWorkspace.dataset.uuid;

      if (newIndex !== -1 && draggedUuid) {
        gZenWorkspaces.reorderWorkspace(draggedUuid, newIndex);
      }
      
      // Clean up
      document.body.style.userSelect = '';
      if (workspacePlaceholder && workspacePlaceholder.parentNode) {
        workspacePlaceholder.parentNode.removeChild(workspacePlaceholder);
      }
      
      // Reset all transforms and transitions
      getAllWorkspaces().forEach(workspace => {
        workspace.style.transition = '';
        workspace.style.transform = '';
      });
      
      // Reset drag state
      isDraggingWorkspace = false;
      dragWorkspace = null;
      workspacePlaceholder = null;
      lastDragX = 0; // Reset position tracking
      window.removeEventListener('mousemove', onWorkspaceDragMove);
      window.removeEventListener('mouseup', onWorkspaceDragEnd);
    }

    // Remove the old dragover and drop event listeners
    // innerContainer.addEventListener("dragover", (e) => { ... });
    // innerContainer.addEventListener("drop", async (e) => { ... });

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

          // Restore: Clickable icon to change workspace icon (emoji picker)
          const iconEl = workspaceDiv.querySelector(".workspace-icon");
          if (iconEl && typeof gZenEmojiPicker?.open === "function") {
            iconEl.style.cursor = "pointer";
            iconEl.title = "Change workspace icon";
            iconEl.addEventListener("click", () => {
              gZenEmojiPicker
                .open(iconEl)
                .then(async (newIcon) => {
                  console.log("Selected emoji:", newIcon);
                  iconEl.innerText = newIcon;
                  const currentWorkspace =
                    gZenWorkspaces.getWorkspaceFromId(uuid);
                  if (currentWorkspace && newIcon && newIcon !== icon) {
                    currentWorkspace.icon = newIcon;
                    await gZenWorkspaces.saveWorkspace(currentWorkspace);
                  }
                })
                .catch((e) => console.error(e));
            });
          }

          // Enhanced drag handle with hold-to-drag
          const dragHandle = parseElement(
            `<span class="workspace-drag-handle" style="cursor: grab;"></span>`
          );
          
          // New reactive drag system
          dragHandle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left click
            
            e.preventDefault();
            
            // Add visual feedback immediately
            dragHandle.style.cursor = 'grabbing';
            workspaceDiv.style.transform = 'scale(0.98)';
            workspaceDiv.style.transition = 'transform 0.1s ease';
            
            let dragStarted = false;
            dragHoldTimeout = setTimeout(() => {
              dragStarted = true;
              isDraggingWorkspace = true;
              dragWorkspace = workspaceDiv;
              const workspaceRect = workspaceDiv.getBoundingClientRect();
              dragStartX = workspaceRect.left;
              dragStartY = workspaceRect.top;
              dragMouseOffset = e.clientX - workspaceRect.left;
              lastDragX = e.clientX; // Initialize position tracking
              
              // Create placeholder
              workspacePlaceholder = document.createElement('div');
              workspacePlaceholder.className = 'haven-workspace workspace-placeholder';
              workspacePlaceholder.style.height = `${workspaceDiv.offsetHeight}px`;
              workspacePlaceholder.style.width = `${workspaceDiv.offsetWidth}px`;
              workspacePlaceholder.style.opacity = '0.3';
              workspacePlaceholder.style.border = '2px dashed var(--zen-primary-color)';
              workspacePlaceholder.style.borderRadius = '8px';
              workspaceDiv.parentNode.insertBefore(workspacePlaceholder, workspaceDiv);
              
              // Move workspace out of flow
              workspaceDiv.style.position = 'fixed';
              workspaceDiv.style.top = `${workspaceRect.top}px`;
              workspaceDiv.style.left = `${workspaceRect.left}px`;
              workspaceDiv.style.width = `${workspaceRect.width}px`;
              workspaceDiv.style.height = `${workspaceRect.height}px`;
              workspaceDiv.style.zIndex = 1000;
              workspaceDiv.style.pointerEvents = 'none';
              workspaceDiv.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1), scale 0.18s cubic-bezier(.4,1.3,.5,1)';
              workspaceDiv.style.transform = 'scale(0.95)';
              // Preserve original styling
              workspaceDiv.style.padding = workspaceDiv.style.padding || '10px';
              workspaceDiv.style.borderRadius = workspaceDiv.style.borderRadius || '8px';
              workspaceDiv.style.backgroundColor = workspaceDiv.style.backgroundColor || 'var(--zen-primary-color)';
              workspaceDiv.style.boxShadow = workspaceDiv.style.boxShadow || '0 4px 10px rgba(0, 0, 0, 0.35)';
              workspaceDiv.setAttribute('drag-workspace', '');
              workspaceDiv.classList.add('dragging-workspace');
              document.body.appendChild(workspaceDiv);
              document.body.style.userSelect = 'none';
              
              // Add transitions to other workspaces
              getAllWorkspaces().forEach(ws => {
                if (ws !== dragWorkspace) {
                  ws.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1)';
                }
              });
              
              window.addEventListener('mousemove', onWorkspaceDragMove);
              window.addEventListener('mouseup', onWorkspaceDragEnd);
            }, 300); // Shorter hold time for workspaces (300ms vs 500ms for tabs)
            
            // Cancel drag if mouse is released before timeout
            function cancelHold(e2) {
              clearTimeout(dragHoldTimeout);
              // Restore visual state
              dragHandle.style.cursor = 'grab';
              workspaceDiv.style.transform = '';
              workspaceDiv.style.transition = '';
              window.removeEventListener('mouseup', cancelHold);
              window.removeEventListener('mouseleave', cancelHold);
            }
            window.addEventListener('mouseup', cancelHold);
            window.addEventListener('mouseleave', cancelHold);
          });

          // Theme background
          if (theme?.type === "gradient" && theme.gradientColors?.length) {
            workspaceDiv.style.background = getGradientCSS(theme);
          } else {
            workspaceDiv.style.background = "var(--zen-colors-border)";
          }

          // Add hover functionality to switch workspaces
          let hoverTimeout = null;
          workspaceDiv.addEventListener('mouseenter', () => {
            // Don't switch workspaces if any workspace is being dragged
            if (isDraggingWorkspace) {
              return;
            }
            
            // Clear any existing timeout
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
            }
            
            // Set a small delay to prevent accidental switches
            hoverTimeout = setTimeout(async () => {
              const workspaceEl = gZenWorkspaces.workspaceElement(uuid);
              if (workspaceEl && !workspaceEl.hasAttribute('active')) {
                // Switch to the workspace in the background
                await gZenWorkspaces.changeWorkspaceWithID(uuid);
                if (window.haven && typeof window.haven.initializeUI === 'function' && !window.haven.uiInitialized) {
                  window.haven.initializeUI();
                }
              }
            }, 200); // 200ms delay before switching
          });

          workspaceDiv.addEventListener('mouseleave', () => {
            // Clear the timeout if mouse leaves before switching
            if (hoverTimeout) {
              clearTimeout(hoverTimeout);
              hoverTimeout = null;
            }
          });

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
                <menuitem class="change-icon" label="Change Icon" tooltiptext="Change workspace icon" />
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

          // Add context menu action for changing icon
          menuPopup.querySelector(".change-icon").addEventListener("click", async () => {
            if (typeof gZenEmojiPicker?.open === "function") {
              const iconEl = workspaceDiv.querySelector(".workspace-icon");
              gZenEmojiPicker
                .open(iconEl)
                .then(async (newIcon) => {
                  if (!newIcon) return;
                  iconEl.innerText = newIcon;
                  const currentWorkspace = gZenWorkspaces.getWorkspaceFromId(uuid);
                  if (currentWorkspace && newIcon && newIcon !== icon) {
                    currentWorkspace.icon = newIcon;
                    await gZenWorkspaces.saveWorkspace(currentWorkspace);
                  }
                })
                .catch((e) => console.error(e));
            }
          });

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
              // HTML part (tabProxy)
              const tabProxy = parseElement(`
                <div class="haven-tab" draggable="true">
                  <span class="tab-icon">
                    ${faviconUrl ? `<img src="${faviconUrl}" style="width:16px;height:16px;vertical-align:middle;">` : ''}
                  </span>
                  <span class="tab-title">${tabTitle}</span>
                </div>
              `);

              // XUL part (copy-link button)
              appendXUL(
                tabProxy,
                `<toolbarbutton xmlns="http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul"
                  class="toolbarbutton-1 copy-link"
                  tooltiptext="Copy tab URL"
                  image="chrome://userscripts/content/zen-library/icons/copy-url.svg"
                  aria-label="Copy tab URL"/>`,
                null,
                true
              );
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
                
                // Check if workspace is active for pinned tabs
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
                  tabProxy.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1)';
                  tabProxy.style.transform = 'scale(0.92)';
                  tabProxy.setAttribute('drag-tab', '');
                  tabProxy.classList.add('dragging-tab');
                  document.body.appendChild(tabProxy);
                  document.body.style.userSelect = 'none';
                  getAllWorkspaces().forEach(ws => { 
                      ws.querySelectorAll('.haven-tab').forEach(tab => {
                        if (tab !== dragTab) {
                          tab.style.transition = 'transform 0.18s cubic-bezier(.4,1.3,.5,1)';
                        }
                      });
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
                const pinnedContainer = workspaceEl.querySelector(".haven-workspace-pinned-tabs");
                const realPinnedTabs = Array.from(gBrowser.tabs).filter(t => t.pinned && t.getAttribute('zen-workspace-id') === uuid);
                realPinnedTabs.forEach(tab => {
                  const proxy = Array.from(pinnedContainer.querySelectorAll('.haven-tab')).find(t => t.tabEl && t.tabEl.getAttribute('id') === tab.getAttribute('id'));
                  if (proxy) pinnedContainer.appendChild(proxy);
                });
                // Regular
                const regularContainer = workspaceEl.querySelector(".haven-workspace-regular-tabs");
                const realRegularTabs = Array.from(gBrowser.tabs).filter(t => !t.pinned && t.getAttribute('zen-workspace-id') === uuid);
                realRegularTabs.forEach(tab => {
                  const proxy = Array.from(regularContainer.querySelectorAll('.haven-tab')).find(t => t.tabEl && t.tabEl.getAttribute('id') === tab.getAttribute('id'));
                  if (proxy) regularContainer.appendChild(proxy);
                });
              }

              function onDragMove(e) {
                if (!isDragging || !dragTab) return;

                const sourceWorkspaceEl = innerContainer.querySelector(`.haven-workspace[data-uuid="${dragTab.dataset.workspaceUuid}"]`);
                const allWorkspacesList = getAllWorkspaces();
                const sourceIndex = allWorkspacesList.findIndex(ws => ws === sourceWorkspaceEl);
                const leftNeighbor = sourceIndex > 0 ? allWorkspacesList[sourceIndex - 1] : null;
                const rightNeighbor = sourceIndex < allWorkspacesList.length - 1 ? allWorkspacesList[sourceIndex + 1] : null;

                let newX = dragStartX; // Snap to original X position by default
                const newY = e.clientY - dragMouseOffset; // Y axis always follows mouse

                // Check for crossing the 50% threshold to a neighbor workspace
                if (rightNeighbor) {
                    const sourceRect = sourceWorkspaceEl.getBoundingClientRect();
                    const rightRect = rightNeighbor.getBoundingClientRect();
                    const midpoint = sourceRect.right + (rightRect.left - sourceRect.right) / 2;
                    if (e.clientX > midpoint) {
                        newX = e.clientX - dragOffsetX; // Unsnap and follow mouse X
                    }
                }

                if (leftNeighbor) {
                    const sourceRect = sourceWorkspaceEl.getBoundingClientRect();
                    const leftRect = leftNeighbor.getBoundingClientRect();
                    const midpoint = leftRect.right + (sourceRect.left - leftRect.right) / 2;
                    if (e.clientX < midpoint) {
                        newX = e.clientX - dragOffsetX; // Unsnap and follow mouse X
                    }
                }
                
                // Move the tab visually
                dragTab.style.top = `${newY}px`;
                dragTab.style.left = `${newX}px`;

                const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
                const hoveredWorkspaceEl = elementUnderCursor ? elementUnderCursor.closest('.haven-workspace') : null;

                // Clean up previous target highlight
                const previousTarget = innerContainer.querySelector('.tab-drop-target');
                if (previousTarget && previousTarget !== hoveredWorkspaceEl) {
                  previousTarget.classList.remove('tab-drop-target');
                }

                if (hoveredWorkspaceEl && hoveredWorkspaceEl.dataset.uuid !== dragTab.dataset.workspaceUuid) {
                  // We are over a different workspace. Highlight it and hide the placeholder.
                  hoveredWorkspaceEl.classList.add('tab-drop-target');
                  placeholder.style.display = 'none';
                  lastContainer = null; // We are no longer in a specific container

                  // Hide individual tab movements in the original workspace
                  sourceWorkspaceEl.querySelectorAll('.haven-tab').forEach(tab => {
                    if (tab !== dragTab) {
                      tab.style.transform = '';
                    }
                  });
                } else {
                  // We are over the original workspace (or empty space). Show placeholder and do reordering.
                  if (hoveredWorkspaceEl) {
                    hoveredWorkspaceEl.classList.remove('tab-drop-target');
                  }
                  placeholder.style.display = '';

                  // --- NEW INTRA-WORKSPACE LOGIC (Robust) ---
                  const currentSourceWorkspaceEl = innerContainer.querySelector(`.haven-workspace[data-uuid="${dragTab.dataset.workspaceUuid}"]`);
                  if (!currentSourceWorkspaceEl) return;

                  const sourceContentDiv = currentSourceWorkspaceEl.querySelector('.haven-workspace-content');
                  if (!sourceContentDiv) return;

                  const sourcePinnedContainer = currentSourceWorkspaceEl.querySelector('.haven-workspace-pinned-tabs');
                  const sourceRegularContainer = currentSourceWorkspaceEl.querySelector('.haven-workspace-regular-tabs');

                  let currentTargetContainer = null;
                  const contentRect = sourceContentDiv.getBoundingClientRect();

                  // Determine which container (pinned/regular) the cursor is over, only if inside content area
                  if (e.clientX >= contentRect.left && e.clientX <= contentRect.right && e.clientY >= contentRect.top && e.clientY <= contentRect.bottom) {
                      let pinnedRect = sourcePinnedContainer ? sourcePinnedContainer.getBoundingClientRect() : null;
                      let regularRect = sourceRegularContainer ? sourceRegularContainer.getBoundingClientRect() : null;

                      // Prioritize the container the cursor is physically inside
                      if (pinnedRect && e.clientY >= pinnedRect.top && e.clientY <= pinnedRect.bottom) {
                          currentTargetContainer = sourcePinnedContainer;
                      } else if (regularRect && e.clientY >= regularRect.top && e.clientY <= regularRect.bottom) {
                          currentTargetContainer = sourceRegularContainer;
                      } else {
                          // Fallback for empty space between containers
                          if (sourcePinnedContainer && sourceRegularContainer) {
                              // If cursor is above the start of regular container, it's pinned territory
                              if (e.clientY < regularRect.top) {
                                  currentTargetContainer = sourcePinnedContainer;
                              } else {
                                  currentTargetContainer = sourceRegularContainer;
                              }
                          } else if (sourcePinnedContainer) {
                              currentTargetContainer = sourcePinnedContainer;
                          } else if (sourceRegularContainer) {
                              currentTargetContainer = sourceRegularContainer;
                          }
                      }
                  }

                  // If we found a valid container, position the placeholder there
                  if (currentTargetContainer) {
                      if (lastContainer !== currentTargetContainer) {
                          lastContainer = currentTargetContainer;
                      }
                      const afterElement = getTabAfterElement(currentTargetContainer, e.clientY);
                      if (afterElement) {
                          currentTargetContainer.insertBefore(placeholder, afterElement);
                      } else {
                          currentTargetContainer.appendChild(placeholder);
                      }
                  }

                  // Animate other tabs in the placeholder's container to make space
                  getAllWorkspaces().forEach(ws => { 
                      ws.querySelectorAll('.haven-tab').forEach(tab => {
                        if (tab === dragTab) return;

                        // Reset transform if tab is not in the same container as the placeholder
                        if (!placeholder.parentNode || tab.parentNode !== placeholder.parentNode) {
                          tab.style.transform = '';
                          return;
                        }

                        const tabRect = tab.getBoundingClientRect();
                        const placeholderRect = placeholder.getBoundingClientRect();
                        const isTouching = !(placeholderRect.bottom < tabRect.top + 5 || placeholderRect.top > tabRect.bottom - 5);
                        
                        if (isTouching) {
                          if (!tab.style.transition) {
                            tab.style.transition = 'transform 0.15s cubic-bezier(.4,1.3,.5,1)';
                          }
                          if (tabRect.top < placeholderRect.top) { // tab is above placeholder
                            const moveDistance = Math.min(15, Math.abs(tabRect.bottom - placeholderRect.top));
                            tab.style.transform = `translateY(-${moveDistance}px)`;
                          } else if (tabRect.top > placeholderRect.top) { // tab is below placeholder
                            const moveDistance = Math.min(15, Math.abs(tabRect.top - placeholderRect.bottom));
                            tab.style.transform = `translateY(${moveDistance}px)`;
                          }
                        } else {
                          tab.style.transform = '';
                        }
                      });
                  });
                }
              }

              function onDragEnd(e) {
                if (dragHoldTimeout) {
                  clearTimeout(dragHoldTimeout);
                  dragHoldTimeout = null;
                }
                if (!isDragging || !dragTab) return;

                const currentDropTarget = innerContainer.querySelector('.tab-drop-target');
                const dropOnNewWorkspace = currentDropTarget && currentDropTarget.dataset.uuid !== dragTab.dataset.workspaceUuid;

                if (dropOnNewWorkspace) {
                    // --- Dropped on a new workspace ---
                    const tabToMove = tabEl;
                    const targetUuid = currentDropTarget.dataset.uuid;
                    currentDropTarget.classList.remove('tab-drop-target');

                    const elementUnderCursor = document.elementFromPoint(e.clientX, e.clientY);
                    const targetPinnedContainer = currentDropTarget.querySelector('.haven-workspace-pinned-tabs');
                    const targetRegularContainer = currentDropTarget.querySelector('.haven-workspace-regular-tabs');

                    let shouldBePinned = false;
                    const isOverPinned = !!(elementUnderCursor && elementUnderCursor.closest('.haven-workspace-pinned-tabs'));
                    const isOverRegular = !!(elementUnderCursor && elementUnderCursor.closest('.haven-workspace-regular-tabs'));

                    if (isOverPinned) {
                        shouldBePinned = true;
                    } else if (isOverRegular) {
                        shouldBePinned = false;
                    } else {
                        // Fallback for when not dropping directly on a container (e.g., workspace header)
                        if (targetPinnedContainer && !targetRegularContainer) {
                            shouldBePinned = true; // Only pinned exists, so must be pinned.
                        } else if (targetPinnedContainer && targetRegularContainer) {
                            const regularRect = targetRegularContainer.getBoundingClientRect();
                            // If cursor is above the start of the regular container, it's pinned.
                            shouldBePinned = (e.clientY < regularRect.top);
                        } else {
                            // Only regular exists or neither exist, so not pinned.
                            shouldBePinned = false;
                        }
                    }

                    if (tabToMove && typeof gZenWorkspaces?.moveTabToWorkspace === 'function') {
                        try{
                          tabEl.setProperty('pinned', shouldBePinned)
                          tabEl.pinned = shouldBePinned
                        }catch(e){ console.error(e) }
                        gZenWorkspaces.moveTabToWorkspace(tabEl, targetUuid);

                        // Restore tab's styles before moving the DOM proxy
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

                        // Find or create the correct container and append the tab proxy
                        const contentDiv = currentDropTarget.querySelector('.haven-workspace-content');
                        let newContainer;
                        if (shouldBePinned) {
                            newContainer = currentDropTarget.querySelector('.haven-workspace-pinned-tabs');
                            if (!newContainer) {
                                newContainer = parseElement(`<div class="haven-workspace-pinned-tabs"></div>`);
                                contentDiv.insertBefore(newContainer, contentDiv.firstChild);
                            }
                        } else {
                            newContainer = currentDropTarget.querySelector('.haven-workspace-regular-tabs');
                            if (!newContainer) {
                                newContainer = parseElement(`<div class="haven-workspace-regular-tabs"></div>`);
                                contentDiv.appendChild(newContainer);
                            }
                        }
                        newContainer.appendChild(dragTab);
                        dragTab.dataset.workspaceUuid = targetUuid; // Update the proxy's workspace ID

                    } else {
                        // Failsafe: if move function fails, just remove the proxy
                        dragTab.remove();
                    }

                    // Common cleanup for cross-workspace drop
                    document.body.style.userSelect = '';
                    if (placeholder && placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
                    getAllWorkspaces().forEach(ws => ws.querySelectorAll('.haven-tab').forEach(tab => {
                        tab.style.transition = '';
                        tab.style.transform = '';
                    }));

                } else {
                    // --- Dropped within the same workspace (original logic) ---
                    if(currentDropTarget) currentDropTarget.classList.remove('tab-drop-target');

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
                }
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
