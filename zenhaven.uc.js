// ==UserScript==
// @name        Custom Toolbox UI (Safe Mode)
// @description Only injects UI when #navigator-toolbox has [library]
// @include     main
// ==/UserScript==

import { parseElement } from "./utils/parse.js";
import { downloadsSection } from "./sections/download.js";
import { workspacesSection } from "./sections/workspace.js";
import { historySection } from "./sections/history.js";
// import { notesSection } from "./sections/notes.js";

(function () {
  const { document } = window;
  if (window.library) {
    console.log("[Zenlibrary] Already initialized. Aborting.");
    return;
  }
  console.log("[Zenlibrary] Script loaded");

  class Zenlibrary {
    constructor() {
      this.sections = new Map();
      this.activeSectionId = null;
      this.uiInitialized = false;
      this.isOpen = false;
      this.elements = {
        toolbox: null,
        customToolbar: null,
        functionsContainer: null,
        libraryContainer: null,
        bottomButtons: null,
        mediaToolbar: null,
        navbar: null,
      };
      console.log("[Zenlibrary] Core object created");
    }

    addSection(config) {
      if (
        !config.id ||
        !config.label ||
        !config.icon ||
        typeof config.init !== "function"
      ) {
        console.error(
          "[Zenlibrary] Invalid section config: id, label, icon, and init function are required.",
          config
        );
        return;
      }
      if (this.sections.has(config.id)) {
        console.warn(
          `[Zenlibrary] Section with id "${config.id}" already exists. Overwriting.`
        );
      }

      const conditionMet =
        !config.condition ||
        (typeof config.condition === "function" && config.condition());
      if (conditionMet) {
        this.sections.set(config.id, config);
        console.log(`[Zenlibrary] Section "${config.id}" registered.`);
      } else {
        console.log(
          `[Zenlibrary] Condition not met for section "${config.id}". Skipping registration.`
        );
      }
    }

    initializeUI() {
      console.log("[Zenlibrary] Setting up UI...");
      this.elements.toolbox = document.getElementById("navigator-toolbox");
      this.elements.navbar = document.getElementById("nav-bar");

      if (!this.elements.toolbox) {
        console.log("[Zenlibrary] Toolbox not found.");
        return;
      }

      console.log("[Zenlibrary] Setting up library UI");

      // Create container for new UI elements
      const customContainer =
        parseElement(`<div id="zen-library-sidebar" style="display: none;">
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
      this.createLibraryFooter();

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
          `<div id="zen-library-container" style="height: 100%; width: 60vw; position: relative; display: none; flex-direction: column;"></div>`
        );
        this.elements.libraryContainer = sidebarContainer;
        const tabbox = document.getElementById("tabbrowser-tabbox");
        if (tabbox) {
          tabbox.parentNode.insertBefore(sidebarContainer, tabbox);
          console.log(
            "[Zenlibrary] Sidebar container added before tabbrowser-tabbox"
          );
        } else {
          sidebarSplitter.parentNode.insertBefore(
            sidebarContainer,
            sidebarSplitter.nextSibling
          );
          console.log(
            "[Zenlibrary] Tabbox not found, sidebar container added after splitter"
          );
        }
      }

      this.uiInitialized = true;
      console.log("[Zenlibrary] UI setup complete");
    }

    openlibrary() {
      if (!this.uiInitialized) {
        this.initializeUI();
      }

      if (this.isOpen) return;

      console.log("[Zenlibrary] Opening library");

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
        this.elements.customToolbar.style.setProperty(
          "display",
          "flex",
          "important"
        );
      }

      // Auto-open workspace section
      this.activateSection("workspaces");

      this.isOpen = true;
    }

    closelibrary() {
      if (!this.isOpen) return;

      console.log("[Zenlibrary] Closing library");

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
        this.elements.customToolbar.style.setProperty(
          "display",
          "none",
          "important"
        );
      }

      // Deactivate current section
      this.deactivateCurrentSection();

      this.isOpen = false;
    }

    destroyUI() {
      console.log("[Zenlibrary] Destroying UI");

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
        console.log("[Zenlibrary] Bottom buttons restored after media controls");
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
      this.elements.libraryContainer?.remove();

      // Reset state
      this.activeSectionId = null;
      this.uiInitialized = false;
      this.isOpen = false;
      Object.keys(this.elements).forEach((key) => (this.elements[key] = null));
    }

    createNavButton(section) {
      const customDiv =
        parseElement(`<div class="custom-button" id="library-${section.id}-button">
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

    createLibraryFooter() {
      // Remove existing exit button if it exists
      const existingExitButton = this.elements.customToolbar.querySelector(
        "#library-exit-button"
      );
      if (existingExitButton) {
        existingExitButton.remove();
      }
      // Remove existing settings button if it exists
      const existingSettingsButton = this.elements.customToolbar.querySelector(
        "#library-settings-button"
      );
      if (existingSettingsButton) {
        existingSettingsButton.remove();
      }

      const toolbarFooterXML = parseElement(
        `
        <hbox id="library-sidebar-footer">
          <toolbarbutton 
            class="toolbarbutton-1"
            id="library-exit-button"
            tooltiptext="Exit Library"
            image="chrome://browser/skin/zen-icons/back.svg"
          />  
          <toolbarbutton 
            class="toolbarbutton-1"
            id="library-settings-button"
            tooltiptext="Library Settings"
            image="chrome://browser/skin/zen-icons/settings.svg"
          />
        </hbox>`,
        "xul"
      );

      toolbarFooterXML
        .querySelector("#library-exit-button")
        .addEventListener("click", () => {
          window.library.closelibrary();
        });
      toolbarFooterXML
        .querySelector("#library-settings-button")
        .addEventListener("click", () => {
          alert("Library settings clicked!");
        });

      this.elements.customToolbar.appendChild(toolbarFooterXML);
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
        console.error(`[Zenlibrary] No section found for id: ${id}`);
        return;
      }

      console.log(`[Zenlibrary] Activating section: ${id}`);
      const contentElement = section.init();
      if (contentElement instanceof HTMLElement) {
        section.contentElement = contentElement;

        this.elements.libraryContainer.setAttribute(`library-${id}`, "");
        this.elements.libraryContainer.appendChild(contentElement);
        this.elements.libraryContainer.style.display = "flex";

        document.getElementById(`library-${id}-button`)?.classList.add("active");
        this.activeSectionId = id;
      } else {
        console.error(
          `[Zenlibrary] Section "${id}" init() did not return a valid DOM element.`
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

      Array.from(this.elements.libraryContainer.attributes)
        .filter((attr) => attr.name.startsWith("library-"))
        .forEach((attr) =>
          this.elements.libraryContainer.removeAttribute(attr.name)
        );

      this.elements.libraryContainer.style.display = "none";

      document
        .getElementById(`library-${this.activeSectionId}-button`)
        ?.classList.remove("active");
      this.activeSectionId = null;
    }
  }

  window.library = new Zenlibrary();

  // --- SECTION DEFINITIONS ---

  window.library.addSection(downloadsSection);
  window.library.addSection(workspacesSection);
  window.library.addSection(historySection);
  //  window.library.addSection(notesSection);

  // --- INITIALIZATION LOGIC ---

  function createlibraryToggle() {
    // Use local icon for theming
    const togglelibrary = () => {
      if (window.library.isOpen) {
        window.library.closelibrary();
      } else {
        window.library.openlibrary();
      }
    };

    console.log("[Zenlibrary] Toggle button added to sidebar bottom buttons");
    const widget = {
      id: "zen-library",
      type: "toolbarbutton",
      label: "Zen Library",
      tooltip: "Toggle Library",
      class: "toolbarbutton-1",
      callback: togglelibrary,
    };
    UC_API.Utils.createWidget(widget);
  }

  function startup() {
    console.log("[Zenlibrary] Startup sequence initiated.");
    createlibraryToggle();
  }

  if (gBrowserInit.delayedStartupFinished) {
    console.log("[Zenlibrary] Browser already started");
    startup();
  } else {
    console.log("[Zenlibrary] Waiting for browser startup");
    let observer = new MutationObserver(() => {
      if (gBrowserInit.delayedStartupFinished) {
        console.log("[Zenlibrary] Browser startup detected");
        observer.disconnect();
        startup();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
})();
