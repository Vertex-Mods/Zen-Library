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
    const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="3.048 2.032 500 500" fill="black" width="500px" height="500px"><path d="M 117.019 229.189 L 358.157 229.189 C 370.419 229.189 380.359 239.378 380.359 251.948 L 380.359 359.696 C 380.359 361.892 380.056 364.016 379.49 366.025 L 379.49 376.137 C 379.49 422.439 342.874 459.973 297.705 459.973 L 175.73 459.973 C 130.562 459.973 93.946 422.439 93.946 376.137 L 93.946 318.55 C 93.946 314.379 94.243 310.281 94.817 306.275 L 94.817 251.948 C 94.817 239.378 104.756 229.189 117.019 229.189 Z M 163.119 286.634 L 163.119 298.372 C 163.119 308.337 170.999 316.415 180.72 316.415 L 293.541 316.415 C 303.261 316.415 311.142 308.337 311.142 298.372 L 311.142 286.634 C 311.142 276.67 303.261 268.592 293.541 268.592 L 180.72 268.592 C 170.999 268.592 163.119 276.67 163.119 286.634 Z"/><path d="M -269.92 -189.491 Q -252.676 -214.41 -233.996 -189.491 L -204.641 -150.333 Q -185.961 -125.414 -221.885 -125.414 L -278.336 -125.414 Q -314.26 -125.414 -297.017 -150.333 Z" transform="matrix(-1, 0, 0, -1, 0, 0)"/><path d="M -192.578 148.485 Q -154.729 125.322 -114.7 148.485 L -53.312 184.008 Q -13.283 207.171 -91.161 207.171 L -210.592 207.171 Q -288.47 207.171 -250.621 184.008 Z" transform="matrix(-1, 0, 0, 1, 0, -0.000008)"/><path d="M -193.628 147.815 C -168.84 132.499 -142.9 132.494 -116.065 147.806 L -53.102 183.819 C -46.393 187.659 -42.055 191.078 -40.213 194.014 C -39.269 195.518 -38.936 197.044 -39.287 198.349 C -39.636 199.647 -40.695 200.872 -42.299 201.867 C -48.553 205.742 -64.621 207.669 -90.335 207.671 L -211.418 207.671 C -237.131 207.669 -253.446 205.744 -260.209 201.876 C -261.935 200.888 -263.133 199.69 -263.651 198.406 C -264.175 197.107 -264.045 195.573 -263.299 194.058 C -261.844 191.109 -257.946 187.673 -251.748 183.828 Z M -251.222 184.678 C -257.352 188.473 -261.031 191.721 -262.402 194.501 C -263.068 195.851 -263.163 196.943 -262.724 198.032 C -262.279 199.134 -261.325 200.085 -259.712 201.007 C -253.12 204.779 -237.073 206.673 -211.418 206.671 L -90.335 206.671 C -64.681 206.673 -48.901 204.781 -42.826 201.016 C -41.348 200.101 -40.545 199.177 -40.252 198.089 C -39.961 197.006 -40.206 195.906 -41.06 194.545 C -42.813 191.752 -46.951 188.486 -53.598 184.687 L -116.561 148.674 C -143.148 133.428 -168.577 133.424 -193.102 148.665 Z" transform="matrix(-1, 0, 0, 1, 0, -0.000008000000889296643)"/><path d="M 356.927 112.69 C 371.223 91.321 386.116 91.321 401.604 112.69 L 438.111 163.062 C 453.599 184.431 446.45 195.116 416.666 195.116 L 346.46 195.116 C 316.675 195.116 308.931 184.431 323.228 163.062 L 356.927 112.69 Z" style="transform-box: fill-box; transform-origin: 50% 50%;" transform="matrix(0, 1, -1, 0, 0.000004, -0.000051)"/><ellipse cx="278.361" cy="56.089" rx="35.604" ry="32.308"/><path d="M 123.465 146.514 L 140.608 128.052"/><path d="M 148.52 97.722 L 134.014 138.602"/><path d="M 137.763 85.801 Q 140.895 51.242 178.448 85.801 L 237.459 140.109 Q 275.012 174.668 234.327 174.668 L 170.392 174.668 Q 129.707 174.668 132.84 140.109 Z" transform="matrix(0.991726, 0.128375, -0.128375, 0.991726, -3.073037, -6.853564)"/></svg>`;
    const image = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      iconSVG
    )}`;
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
      image,
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
