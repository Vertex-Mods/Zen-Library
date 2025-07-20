// ==UserScript==
// @name        Custom Toolbox UI (Safe Mode)
// @description Only injects UI when #navigator-toolbox has [haven]
// @include     main
// ==/UserScript==

import { parseElement } from "./utils/parse.js";
import { downloadsSection } from "./sections/download.js";
import { workspacesSection } from "./sections/workspace.js";
import { historySection } from "./sections/history.js";
// import { notesSection } from "./sections/notes.js";

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
      this.isOpen = false;
      this.elements = {
        toolbox: null,
        customToolbar: null,
        functionsContainer: null,
        havenContainer: null,
        bottomButtons: null,
        mediaToolbar: null,
        navbar: null,
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
      this.elements.navbar = document.getElementById("nav-bar");
      
      if (!this.elements.toolbox) {
        console.log("[ZenHaven] Toolbox not found.");
        return;
      }

      console.log("[ZenHaven] Setting up Haven UI");

      // Create container for new UI elements
      const customContainer = parseElement(`<div id="zen-library-sidebar" style="display: none;">
            <div id="toolbar-header">
              <span class="header-text">Library</span>
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

      // Create exit button (always visible)
      this.createExitButton();

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

    openHaven() {
      if (!this.uiInitialized) {
        this.initializeUI();
      }
      
      if (this.isOpen) return;
      
      console.log("[ZenHaven] Opening Haven");
      
      // Add library attribute to body
      document.body.setAttribute("library", "true");
      
      // Hide all children except the toolbox itself and our custom toolbar
      if (this.elements.toolbox) {
        Array.from(this.elements.toolbox.children).forEach((child) => {
          if (child.id !== "zen-library-sidebar") {
            child.style.display = "none";
          }
        });
      }
      
      // Show custom toolbar
      if (this.elements.customToolbar) {
        this.elements.customToolbar.style.setProperty("display", "flex", "important");
      }
      
      // Auto-open workspace section
      this.activateSection("workspaces");
      
      this.isOpen = true;
    }

    closeHaven() {
      if (!this.isOpen) return;
      
      console.log("[ZenHaven] Closing Haven");
      
      // Remove library attribute from body
      document.body.removeAttribute("library");
      
      // Show all original toolbox children
      if (this.elements.toolbox) {
        Array.from(this.elements.toolbox.children).forEach((child) => {
          if (child.id !== "zen-library-sidebar") {
            child.style.display = "";
          }
        });
      }
      
      // Hide custom toolbar
      if (this.elements.customToolbar) {
        this.elements.customToolbar.style.setProperty("display", "none", "important");
      }
      
      // Deactivate current section
      this.deactivateCurrentSection();
      
      this.isOpen = false;
    }

    destroyUI() {
      console.log("[ZenHaven] Destroying UI");

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
          if (child.id !== "zen-library-sidebar") {
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
      this.isOpen = false;
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

    createExitButton() {
      // Remove existing exit button if it exists
      const existingExitButton = this.elements.customToolbar.querySelector("#haven-exit-button");
      if (existingExitButton) {
        existingExitButton.remove();
      }

      const exitButton = parseElement(`<div id="haven-exit-button">
        <span style="display: flex; align-items: center; gap: 6px;">← Exit</span>
      </div>`);

      exitButton.addEventListener("click", () => {
        window.haven.closeHaven();
      });

      this.elements.customToolbar.appendChild(exitButton);
    }

    activateSection(id) {
      if (!this.uiInitialized) return;

      // If clicking the same button, do nothing (already active)
      if (this.activeSectionId === id) {
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
  //  window.haven.addSection(notesSection);

  // --- INITIALIZATION LOGIC ---

  function createHavenToggle() {
    // Use local icon for theming
    const toggleHaven = () => {
      if (window.haven.isOpen) {
        window.haven.closeHaven();
      } else {
        window.haven.openHaven();
      }
    };

    console.log("[ZenHaven] Toggle button added to sidebar bottom buttons");
    const widget = {
      id: "zen-haven",
      type: "toolbarbutton",
      label: "Zen Library",
      tooltip: "Toggle Library",
      class: "toolbarbutton-1",
      callback: toggleHaven,
    };
    UC_API.Utils.createWidget(widget);
  }



  function startup() {
    console.log("[ZenHaven] Startup sequence initiated.");
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
