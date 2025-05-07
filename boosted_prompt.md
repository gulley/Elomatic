# Elomatic

Create a single-page HTML/JavaScript app for ranking items using Elo-style comparisons with the following specifications:

## Data Management
- Use local storage for data persistence
- Each item consists of:
  - Title (required)
  - URL (optional)
  - Elo score (initialized at 1500)
  - Comparison count (to track how often an item has been compared)
- Include import/export functionality to CSV with columns: item, URL, score

## Main Page Features
- Display all items in a list, ordered by Elo score (high to low)
- Make URLs clickable/functional
- Include a visual indicator showing comparison frequency for each item
- Add UI elements for:
  - Adding individual new items
  - Deleting individual items
  - Resetting all scores to 1500 without deleting items
  - Importing/exporting data
  - Buttons for "Edit List" and "Rank Items" modes

## Edit List View
- Convert all items to a text format in a single editable area for bulk editing
- Include Save and Cancel buttons
- Display a warning if the user tries to cancel with unsaved changes
- Support bulk addition and deletion of items

## Ranking Page
- Randomly select and display two distinct items for comparison
- Include a prominent and intuitive way to select either item
- After selection, show an animation:
  - Selected item moves upward with its new (higher) score displayed
  - Unselected item moves downward with its new (lower) score displayed
- Update Elo scores based on standard Elo rating formula
- After the animation completes, display a new pair of items
- Include a button to return to the main page

## Design Considerations
- Create a clean, intuitive interface
- Optimize for small lists and simple comparisons
- Ensure all state transitions are smooth and intuitive
- Include clear instructions on each page

## Technical Implementation
- Implement as a single HTML file with embedded JavaScript and CSS
- Use vanilla JavaScript (no external libraries/frameworks required)
- Implement proper error handling for all user interactions
