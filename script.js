// Item class definition
class Item {
    constructor(title, score = 1500, comparisons = 0) {
        this.title = title;
        this.score = score;
        this.comparisons = comparisons;
    }
}

// EloRating class for managing Elo calculations
class EloRating {
    constructor(kFactor = 32) {
        this.kFactor = kFactor;
    }

    // Calculate expected score
    getExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    }

    // Calculate new ratings
    calculateNewRatings(winnerRating, loserRating) {
        const expectedWinner = this.getExpectedScore(winnerRating, loserRating);
        const expectedLoser = this.getExpectedScore(loserRating, winnerRating);

        const newWinnerRating = Math.round(winnerRating + this.kFactor * (1 - expectedWinner));
        const newLoserRating = Math.round(loserRating + this.kFactor * (0 - expectedLoser));

        return {
            winner: newWinnerRating,
            loser: newLoserRating
        };
    }
}

// App class for main application logic
class ElomaticApp {
    constructor() {
        this.items = [];
        this.eloRating = new EloRating();
        this.currentComparison = null;
        this.originalEditText = '';
        this.sortMethod = 'score'; // Default sort method
        
        // DOM elements
        this.pages = {
            main: document.getElementById('mainPage'),
            edit: document.getElementById('editPage'),
            rank: document.getElementById('rankPage')
        };
        
        this.elements = {
            itemList: document.getElementById('itemList'),
            bulkEditTextarea: document.getElementById('bulkEditTextarea'),
            comparisonItemA: document.getElementById('comparisonItemA'),
            comparisonItemB: document.getElementById('comparisonItemB'),
            notification: document.getElementById('notification'),
            newItemTitle: document.getElementById('newItemTitle'),
            importCsvInput: document.getElementById('importCsvInput'),
            confirmResetModal: document.getElementById('confirmResetModal'),
            unsavedChangesModal: document.getElementById('unsavedChangesModal'),
            sortByScore: document.getElementById('sortByScore'),
            sortByAlpha: document.getElementById('sortByAlpha'),
            sortByCompares: document.getElementById('sortByCompares')
        };

        // Initialize
        this.loadFromLocalStorage();
        this.renderItemList();
        this.setupEventListeners();
    }

    // Setup all event listeners
    setupEventListeners() {
        // Button clicks
        document.getElementById('rankButton').addEventListener('click', () => this.showRankPage());
        document.getElementById('editButton').addEventListener('click', () => this.showEditPage());
        document.getElementById('backToMainButton').addEventListener('click', () => this.showMainPage());
        document.getElementById('saveEditButton').addEventListener('click', () => this.saveEditChanges());
        document.getElementById('cancelEditButton').addEventListener('click', () => this.checkUnsavedChanges());
        document.getElementById('addItemButton').addEventListener('click', () => this.addNewItem());
        document.getElementById('resetScoresButton').addEventListener('click', () => this.showResetConfirmation());
        document.getElementById('exportCsvButton').addEventListener('click', () => this.exportToCsv());
        document.getElementById('importCsvButton').addEventListener('click', () => this.elements.importCsvInput.click());
        
        // Sort buttons
        this.elements.sortByScore.addEventListener('click', () => this.setSortMethod('score'));
        this.elements.sortByAlpha.addEventListener('click', () => this.setSortMethod('alpha'));
        this.elements.sortByCompares.addEventListener('click', () => this.setSortMethod('compares'));
        
        // Modal buttons
        document.getElementById('confirmResetButton').addEventListener('click', () => this.resetAllScores());
        document.getElementById('cancelResetButton').addEventListener('click', () => this.hideModal(this.elements.confirmResetModal));
        document.getElementById('discardChangesButton').addEventListener('click', () => {
            this.hideModal(this.elements.unsavedChangesModal);
            this.showMainPage();
        });
        document.getElementById('keepEditingButton').addEventListener('click', () => {
            this.hideModal(this.elements.unsavedChangesModal);
        });

        // File input change
        this.elements.importCsvInput.addEventListener('change', (e) => this.handleCsvImport(e));

        // Comparison items
        this.elements.comparisonItemA.addEventListener('click', () => this.handleComparison(true));
        this.elements.comparisonItemB.addEventListener('click', () => this.handleComparison(false));
    }

    // Load data from localStorage
    loadFromLocalStorage() {
        const storedItems = localStorage.getItem('elomaticItems');
        if (storedItems) {
            this.items = JSON.parse(storedItems);
        }
    }

    // Save data to localStorage
    saveToLocalStorage() {
        localStorage.setItem('elomaticItems', JSON.stringify(this.items));
    }

    // Set the sort method and update UI
    setSortMethod(method) {
        if (method === this.sortMethod) return;
        
        this.sortMethod = method;
        
        // Update active button state
        this.elements.sortByScore.classList.toggle('active', method === 'score');
        this.elements.sortByAlpha.classList.toggle('active', method === 'alpha');
        this.elements.sortByCompares.classList.toggle('active', method === 'compares');
        
        // Re-render the list with the new sort method
        this.renderItemList();
    }
    
    // Render the item list on the main page
    renderItemList() {
        // Sort items based on the current sort method
        let sortedItems;
        
        if (this.sortMethod === 'alpha') {
            // Sort alphabetically by title
            sortedItems = [...this.items].sort((a, b) => a.title.localeCompare(b.title));
        } else if (this.sortMethod === 'compares') {
            // Sort by number of comparisons (high to low)
            sortedItems = [...this.items].sort((a, b) => b.comparisons - a.comparisons);
        } else {
            // Default: sort by score (high to low)
            sortedItems = [...this.items].sort((a, b) => b.score - a.score);
        }
        
        this.elements.itemList.innerHTML = '';
        
        if (sortedItems.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'No items yet. Add some items to get started!';
            emptyItem.style.textAlign = 'center';
            emptyItem.style.padding = '20px';
            this.elements.itemList.appendChild(emptyItem);
            return;
        }

        sortedItems.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'item';
            
            // Create the title element
            const titleElement = document.createElement('div');
            titleElement.className = 'item-content';
            
            const titleText = document.createElement('div');
            titleText.className = 'item-title';
            titleText.textContent = item.title;
            
            titleElement.appendChild(titleText);
            
            // Create the score element
            const scoreElement = document.createElement('div');
            scoreElement.className = 'item-score';
            scoreElement.textContent = item.score;
            
            // Add comparison indicator
            const indicatorElement = document.createElement('span');
            indicatorElement.className = 'comparison-indicator';
            indicatorElement.title = `Compared ${item.comparisons} times`;
            
            // Color based on comparison frequency
            if (item.comparisons === 0) {
                indicatorElement.style.backgroundColor = '#777777'; // Gray for never compared
            } else if (item.comparisons < 5) {
                indicatorElement.style.backgroundColor = '#e74c3c'; // Red for few comparisons
            } else if (item.comparisons < 10) {
                indicatorElement.style.backgroundColor = '#f39c12'; // Orange for some comparisons
            } else {
                indicatorElement.style.backgroundColor = '#2ecc71'; // Green for many comparisons
            }
            
            scoreElement.appendChild(indicatorElement);
            
            // Create delete button (small red x)
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn-delete';
            deleteButton.textContent = 'x';
            deleteButton.title = 'Delete item';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteItem(index);
            });
            
            // Add all elements to the list item
            listItem.appendChild(titleElement);
            listItem.appendChild(scoreElement);
            listItem.appendChild(deleteButton);
            
            this.elements.itemList.appendChild(listItem);
        });
    }

    // No longer needed but kept for compatibility
    ensureUrl(url) {
        return url || '';
    }

    // Add a new item from the input fields
    addNewItem() {
        const title = this.elements.newItemTitle.value.trim();
        
        if (!title) {
            this.showNotification('Item is required!', 'danger');
            return;
        }
        
        const newItem = new Item(title);
        this.items.push(newItem);
        this.saveToLocalStorage();
        this.renderItemList();
        
        // Clear input fields
        this.elements.newItemTitle.value = '';
        
        this.showNotification('Item added successfully!');
    }

    // Delete an item with animation
    deleteItem(index) {
        // Get the item and its title before removing it
        const item = this.items[index];
        const itemTitle = item.title;
        
        // Get the DOM element directly from the itemList children
        const itemElement = this.elements.itemList.children[index];
        
        if (itemElement) {
            // Add the deleting class to trigger the animation
            itemElement.classList.add('deleting');
            
            // Wait for the animation to complete before removing the item
            setTimeout(() => {
                // Now remove the item from the data model
                // We need to find the item again as indices might have changed
                const currentIndex = this.items.findIndex(i => i === item);
                if (currentIndex !== -1) {
                    this.items.splice(currentIndex, 1);
                    this.saveToLocalStorage();
                }
                
                // Remove the element from the DOM directly
                if (itemElement.parentNode) {
                    itemElement.parentNode.removeChild(itemElement);
                }
                // Notification removed
            }, 300);
        } else {
            // If DOM element not found, just update the data model
            this.items.splice(index, 1);
            this.saveToLocalStorage();
            this.renderItemList();
            // Notification removed
        }
    }

    // Reset all scores to 1500
    resetAllScores() {
        this.items.forEach(item => {
            item.score = 1500;
            item.comparisons = 0;
        });
        this.saveToLocalStorage();
        this.renderItemList();
        this.hideModal(this.elements.confirmResetModal);
        this.showNotification('All scores have been reset to 1500');
    }

    // Show the reset confirmation modal
    showResetConfirmation() {
        this.showModal(this.elements.confirmResetModal);
    }

    // Check for unsaved changes before leaving edit page
    checkUnsavedChanges() {
        const currentText = this.elements.bulkEditTextarea.value;
        if (currentText !== this.originalEditText) {
            this.showModal(this.elements.unsavedChangesModal);
        } else {
            this.showMainPage();
        }
    }

    // Save edited items
    saveEditChanges() {
        const text = this.elements.bulkEditTextarea.value.trim();
        const lines = text.split('\n');
        
        // Clear the items array but keep the old one for reference
        const oldItems = [...this.items];
        this.items = [];
        
        lines.forEach(line => {
            if (!line.trim()) return;
            
            // Each line is a complete item
            const title = line.trim();
            
            if (!title) return;
            
            // Try to find the item in the old array to preserve score and comparisons
            const oldItem = oldItems.find(item => item.title === title);
            
            if (oldItem) {
                this.items.push(oldItem);
            } else {
                this.items.push(new Item(title));
            }
        });
        
        this.saveToLocalStorage();
        this.showMainPage();
        this.showNotification('Changes saved successfully!');
    }

    // Show the edit page
    showEditPage() {
        // Prepare the text for bulk editing
        let editText = '';
        this.items.forEach(item => {
            editText += `${item.title}\n`;
        });
        
        this.elements.bulkEditTextarea.value = editText;
        this.originalEditText = editText;
        
        this.switchPage('edit');
    }

    // Show the rank page and select two items for comparison
    showRankPage() {
        if (this.items.length < 2) {
            this.showNotification('You need at least 2 items to start ranking!', 'warning');
            return;
        }
        
        this.selectItemsForComparison();
        this.switchPage('rank');
    }

    // Show the main page
    showMainPage() {
        this.switchPage('main');
        this.renderItemList();
    }

    // Switch between pages
    switchPage(page) {
        Object.keys(this.pages).forEach(key => {
            this.pages[key].classList.remove('active');
        });
        this.pages[page].classList.add('active');
    }

    // Select two different items for comparison
    selectItemsForComparison() {
        if (this.items.length < 2) return;
        
        // Divide items into two groups: more compared and less compared
        // First, calculate the median number of comparisons
        const sortedByComparisons = [...this.items].sort((a, b) => a.comparisons - b.comparisons);
        const median = sortedByComparisons[Math.floor(sortedByComparisons.length / 2)].comparisons;
        
        // Split items into two groups
        const moreCompared = this.items.filter((item, index) => item.comparisons >= median);
        const lessCompared = this.items.filter((item, index) => item.comparisons < median);
        
        // Handle edge cases where all items might be in one group
        if (moreCompared.length === 0 || lessCompared.length === 0) {
            // Fall back to completely random selection
            let indexA = Math.floor(Math.random() * this.items.length);
            let indexB = Math.floor(Math.random() * this.items.length);
            
            // Make sure they're different
            while (indexB === indexA) {
                indexB = Math.floor(Math.random() * this.items.length);
            }
            
            const itemA = this.items[indexA];
            const itemB = this.items[indexB];
            
            // Store the current comparison
            this.currentComparison = {
                indexA,
                indexB
            };
            
            // Update the DOM
            this.updateComparisonDisplay(itemA, itemB);
            return;
        }
        
        // Select one item from each group
        const moreComparedItem = moreCompared[Math.floor(Math.random() * moreCompared.length)];
        const lessComparedItem = lessCompared[Math.floor(Math.random() * lessCompared.length)];
        
        // Find their indices in the original items array
        const indexA = this.items.findIndex(item => item === moreComparedItem);
        const indexB = this.items.findIndex(item => item === lessComparedItem);
        
        const itemA = this.items[indexA];
        const itemB = this.items[indexB];
        
        // Store the current comparison
        this.currentComparison = {
            indexA,
            indexB
        };
        
        // Update the DOM
        this.updateComparisonDisplay(itemA, itemB);
    }

    // Update the comparison display
    updateComparisonDisplay(itemA, itemB) {
        // Item A
        this.elements.comparisonItemA.querySelector('.comparison-item-title').textContent = itemA.title;
        this.elements.comparisonItemA.querySelector('.comparison-item-score').textContent = itemA.score;
        
        // Item B
        this.elements.comparisonItemB.querySelector('.comparison-item-title').textContent = itemB.title;
        this.elements.comparisonItemB.querySelector('.comparison-item-score').textContent = itemB.score;
    }

    // Handle comparison selection
    handleComparison(isItemASelected) {
        if (!this.currentComparison) return;
        
        // Disable clicking during animation
        this.elements.comparisonItemA.style.pointerEvents = 'none';
        this.elements.comparisonItemB.style.pointerEvents = 'none';
        
        const { indexA, indexB } = this.currentComparison;
        const itemA = this.items[indexA];
        const itemB = this.items[indexB];
        
        // Determine winner and loser
        const winner = isItemASelected ? itemA : itemB;
        const loser = isItemASelected ? itemB : itemA;
        const winnerIndex = isItemASelected ? indexA : indexB;
        const loserIndex = isItemASelected ? indexB : indexA;
        
        // Calculate new ratings
        const oldWinnerScore = winner.score;
        const oldLoserScore = loser.score;
        
        const newRatings = this.eloRating.calculateNewRatings(winner.score, loser.score);
        
        // Update scores
        winner.score = newRatings.winner;
        loser.score = newRatings.loser;
        
        // Update comparison counts
        winner.comparisons++;
        loser.comparisons++;
        
        // Save to localStorage
        this.saveToLocalStorage();
        
        // Play sound effect if available
        this.playSound(isItemASelected ? 'win' : 'lose');
        
        // Show score change animation
        this.animateScoreChange(
            isItemASelected ? this.elements.comparisonItemA : this.elements.comparisonItemB,
            oldWinnerScore,
            newRatings.winner,
            true
        );
        
        this.animateScoreChange(
            isItemASelected ? this.elements.comparisonItemB : this.elements.comparisonItemA,
            oldLoserScore,
            newRatings.loser,
            false
        );
        
        // After animation, select new items
        setTimeout(() => {
            // Re-enable clicking
            this.elements.comparisonItemA.style.pointerEvents = 'auto';
            this.elements.comparisonItemB.style.pointerEvents = 'auto';
            this.selectItemsForComparison();
        }, 2000);
    }

    // Animate score change
    animateScoreChange(element, oldScore, newScore, isWinner) {
        // Add winner/loser class for animation
        element.classList.add(isWinner ? 'winner' : 'loser');
        
        // Create score change element
        const scoreChangeElement = document.createElement('div');
        scoreChangeElement.className = `score-change ${isWinner ? 'up' : 'down'}`;
        
        const scoreDiff = newScore - oldScore;
        scoreChangeElement.textContent = isWinner ? `+${scoreDiff}` : scoreDiff;
        
        // Position the element
        const rect = element.getBoundingClientRect();
        scoreChangeElement.style.left = `${rect.left + rect.width / 2}px`;
        scoreChangeElement.style.top = `${rect.top + rect.height / 2}px`;
        
        document.body.appendChild(scoreChangeElement);
        
        // Update the score with a counting effect
        this.animateCounter(element.querySelector('.comparison-item-score'), oldScore, newScore);
        
        // Add confetti for winner
        if (isWinner) {
            this.createConfetti(element);
        }
        
        // Remove elements after animation
        setTimeout(() => {
            if (document.body.contains(scoreChangeElement)) {
                document.body.removeChild(scoreChangeElement);
            }
            // Remove winner/loser class
            element.classList.remove(isWinner ? 'winner' : 'loser');
        }, 1500);
    }

    // Create confetti for winner celebration effect
    createConfetti(element) {
        const colors = ['#2ecc71', '#3498db', '#f1c40f', '#e74c3c', '#9b59b6'];
        const confettiCount = 50;
        const shapes = ['circle', 'square', 'triangle'];
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Random properties
            const color = colors[Math.floor(Math.random() * colors.length)];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const size = Math.random() * 10 + 5;
            
            confetti.style.backgroundColor = color;
            confetti.style.width = `${size}px`;
            confetti.style.height = `${size}px`;
            
            if (shape === 'circle') {
                confetti.style.borderRadius = '50%';
            } else if (shape === 'triangle') {
                confetti.style.width = '0';
                confetti.style.height = '0';
                confetti.style.backgroundColor = 'transparent';
                confetti.style.borderLeft = `${size/2}px solid transparent`;
                confetti.style.borderRight = `${size/2}px solid transparent`;
                confetti.style.borderBottom = `${size}px solid ${color}`;
            }
            
            // Random position within the element
            const rect = element.getBoundingClientRect();
            const x = Math.random() * rect.width;
            confetti.style.left = `${x}px`;
            confetti.style.top = '0';
            
            // Random animation duration and delay
            const duration = Math.random() * 1 + 1; // 1-2s
            const delay = Math.random() * 0.5;
            confetti.style.animationDuration = `${duration}s`;
            confetti.style.animationDelay = `${delay}s`;
            
            // Add to element
            element.appendChild(confetti);
            
            // Remove after animation
            setTimeout(() => {
                if (element.contains(confetti)) {
                    element.removeChild(confetti);
                }
            }, (duration + delay) * 1000);
        }
    }
    
    // Animate counter effect for score changes
    animateCounter(element, oldValue, newValue) {
        const duration = 1000; // ms
        const frameDuration = 1000 / 60; // 60fps
        const totalFrames = Math.round(duration / frameDuration);
        const valueChange = newValue - oldValue;
        
        let frame = 0;
        const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const currentValue = Math.round(oldValue + valueChange * progress);
            
            element.textContent = currentValue;
            
            if (frame === totalFrames) {
                clearInterval(counter);
                element.textContent = newValue;
            }
        }, frameDuration);
    }
    
    // Play sound effects
    playSound(type) {
        // This is a placeholder for sound effects
        // You could implement actual sounds by creating audio elements
        // For example:
        // const sound = new Audio('sounds/' + type + '.mp3');
        // sound.play();
        
        // For now, we'll just log to console
        console.log(`Sound effect: ${type}`);
    }
    
    // Show notification
    showNotification(message, type = 'success') {
        this.elements.notification.textContent = message;
        this.elements.notification.className = 'notification show';
        
        if (type === 'danger') {
            this.elements.notification.style.borderLeftColor = 'var(--danger)';
        } else if (type === 'warning') {
            this.elements.notification.style.borderLeftColor = 'var(--warning)';
        } else {
            this.elements.notification.style.borderLeftColor = 'var(--success)';
        }
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    }

    // Show modal
    showModal(modal) {
        modal.classList.add('active');
    }

    // Hide modal
    hideModal(modal) {
        modal.classList.remove('active');
    }

    // Export data to TXT
    exportToCsv() {
        if (this.items.length === 0) {
            this.showNotification('No items to export', 'warning');
            return;
        }
        
        let textContent = '';
        
        this.items.forEach(item => {
            textContent += `${item.title}\n`;
        });
        
        // Create a Blob and download link
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'elomatic_data.txt');
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Data exported successfully!');
    }

    // Handle TXT import
    handleCsvImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n');
            
            // Keep old items for reference
            const oldItems = [...this.items];
            this.items = [];
            
            let importCount = 0;
            
            // Process each line as an item
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Each line is a complete item
                const title = line;
                
                // Check if this item already exists
                const existingItemIndex = oldItems.findIndex(item => 
                    item.title === title);
                
                if (existingItemIndex !== -1) {
                    // Keep existing item with its score
                    this.items.push(oldItems[existingItemIndex]);
                } else {
                    // Create new item with default score
                    this.items.push(new Item(title));
                }
                
                importCount++;
            }
            
            if (importCount === 0) {
                this.showNotification('No valid items found in the file', 'warning');
                this.items = oldItems; // Restore old items
            } else {
                this.saveToLocalStorage();
                this.renderItemList();
                this.showNotification(`Imported ${importCount} items successfully!`);
            }
            
            // Reset the file input
            event.target.value = '';
        };
        
        reader.readAsText(file);
    }

    // Parse CSV line handling quoted values
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last value
        result.push(current);
        
        return result;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new ElomaticApp();
});
