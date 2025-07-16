import { parseElement } from "../utils/parse.js";

export const notesSection = {
  id: "notes",
  label: "Notes",
  icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V5.41421C14 5.149 13.8946 4.89464 13.7071 4.70711L11.2929 2.29289C11.1054 2.10536 10.851 2 10.5858 2H3ZM3 3H10V5.5C10 5.77614 10.2239 6 10.5 6H13V13H3V3ZM11 3.70711L12.2929 5H11V3.70711ZM5 7H11V8H5V7ZM11 9H5V10H11V9ZM5 11H11V12H5V11Z" fill="currentColor"/>
      </svg>`,
  init: function() {
    const notesViewContainer = parseElement(`<div id="haven-notes-view">
            <div id="haven-notes-header">
              <input type="text" id="haven-notes-search" placeholder="Search notes...">
              <button id="haven-notes-add-button" title="Create new note">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V20M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div id="haven-notes-grid"></div>
          </div>`);

    const notesGrid = notesViewContainer.querySelector("#haven-notes-grid");
    const addButton = notesViewContainer.querySelector(
      "#haven-notes-add-button",
    );

    const createNoteCard = () => {
      return parseElement(`<div class="haven-note-card">
                <svg class="note-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2H14.1716C14.702 2 15.2107 2.21071 15.5858 2.58579L19.4142 6.41421C19.7893 6.78929 20 7.29799 20 7.82843V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4ZM6 4H14V8C14 8.55228 14.4477 9 15 9H19V20H6V4ZM16 4.41421L18.5858 7H16V4.41421Z" fill="currentColor"/></svg>
                <h1>Untitled</h1><p>Click to add page content</p>
              </div>`);
    };

    addButton.addEventListener("click", () =>
      notesGrid.appendChild(createNoteCard()),
    );

    notesGrid.appendChild(createNoteCard());
    return notesViewContainer;
  },
};
