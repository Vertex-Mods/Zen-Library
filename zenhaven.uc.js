// ==UserScript==
// @name        Custom Toolbox UI (Safe Mode)
// @description Only injects UI when #navigator-toolbox has [haven]
// @include     main
// ==/UserScript==

import { parseElement } from "./utils/parse.js";
import { downloadsSection } from "./sections/download.js";
import { workspacesSection } from "./sections/workspace.js";
import { historySection } from "./sections/history.js";
import { notesSection } from "./sections/notes.js";

(function () {
  const { document } = window;
  if (window.haven) {
    console.log("[ZenHaven] Already initialized. Aborting.");
    return;
  }
  console.log("[ZenHaven] Script loaded");

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
          config
        );
        return;
      }
      if (this.sections.has(config.id)) {
        console.warn(
          `[ZenHaven] Section with id "${config.id}" already exists. Overwriting.`
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
          `[ZenHaven] Condition not met for section "${config.id}". Skipping registration.`
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
          "[ZenHaven] Toolbox not found or haven attribute is missing."
        );
        return;
      }

      console.log("[ZenHaven] Haven attribute found, proceeding with UI setup");

      // Hide all children except the toolbox itself
      Array.from(this.elements.toolbox.children).forEach((child) => {
        child.style.display = "none";
      });

      // Create container for new UI elements
      const customContainer = parseElement(`<div id="custom-toolbar">
            <div id="toolbar-header">
              <span class="toolbarbutton-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M8 15C11.866 15 15 11.866 15 8C15 4.13401 11.866 1 8 1C4.13401 1 1 4.13401 1 8C1 11.866 4.13401 15 8 15ZM8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" fill="currentColor"/>
                </svg>
              </span>
              <span class="header-text">Haven</span>
            </div>
            <div id="functions-container"></div>
          </div>`);
      this.elements.customToolbar = customContainer;
      this.elements.functionsContainer = customContainer.querySelector(
        "#functions-container"
      );
      this.elements.toolbox.appendChild(customContainer);

      // Create buttons from registered sections
      this.sections.forEach((section) => this.createNavButton(section));

      // Handle bottom buttons
      this.elements.bottomButtons = document.getElementById(
        "zen-sidebar-bottom-buttons"
      );
      this.elements.mediaToolbar = document.getElementById(
        "zen-media-controls-toolbar"
      );
      const workspacesButton = this.elements.bottomButtons?.querySelector(
        "#zen-workspaces-button"
      );
      if (this.elements.bottomButtons && workspacesButton) {
        customContainer.appendChild(this.elements.bottomButtons);
        workspacesButton.style.display = "none";
      }

      // Create sidebar container
      const sidebarSplitter = document.getElementById("zen-sidebar-splitter");
      if (sidebarSplitter) {
        const sidebarContainer = parseElement(
          `<div id="zen-haven-container" style="height: 100%; width: 60vw; position: relative; display: none; flex-direction: column;"></div>`
        );
        this.elements.havenContainer = sidebarContainer;
        const tabbox = document.getElementById("tabbrowser-tabbox");
        if (tabbox) {
          tabbox.parentNode.insertBefore(sidebarContainer, tabbox);
          console.log(
            "[ZenHaven] Sidebar container added before tabbrowser-tabbox"
          );
        } else {
          sidebarSplitter.parentNode.insertBefore(
            sidebarContainer,
            sidebarSplitter.nextSibling
          );
          console.log(
            "[ZenHaven] Tabbox not found, sidebar container added after splitter"
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
          this.elements.mediaToolbar.nextSibling
        );
        const workspacesButton = this.elements.bottomButtons.querySelector(
          "#zen-workspaces-button"
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
      const customDiv =
        parseElement(`<div class="custom-button" id="haven-${section.id}-button">
            <span class="icon">${section.icon}</span>
            <span class="label">${section.label}</span>
          </div>`);

      customDiv.addEventListener("click", () =>
        this.activateSection(section.id)
      );
      customDiv.addEventListener("mousedown", () =>
        customDiv.classList.add("clicked")
      );
      customDiv.addEventListener("mouseup", () =>
        customDiv.classList.remove("clicked")
      );
      customDiv.addEventListener("mouseleave", () =>
        customDiv.classList.remove("clicked")
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
          `[ZenHaven] Section "${id}" init() did not return a valid DOM element.`
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
          this.elements.havenContainer.removeAttribute(attr.name)
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
    const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      iconSVG
    )}`;
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
