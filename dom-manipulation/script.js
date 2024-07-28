

let storedQuotes = window.localStorage.getItem('quotes');

const quotes = storedQuotes ? JSON.parse(storedQuotes) : [
    { text: 'The secret to life is to love who you are.', category: 'Life' },
    { text: 'Look for opportunities in every change in your life.', category: 'Opportunity' },
    { text: 'Persist while others are quitting.', category: 'Persistence' },
    { text: 'and so on.', category: 'Misc' }
];


// console.log(quotes.length);


function showRandomQuote(){

    const index = Math.floor(Math.random() * quotes.length);

    const quoteDisplay = document.getElementById("quoteDisplay");

    quoteDisplay.innerHTML = '';

    const quote = quotes[index];

    const display = document.createElement("p");
    
    const randomQuotes = document.createTextNode(`"${quote.text}" - ${quote.category}`);
    
    display.appendChild(randomQuotes);

    quoteDisplay.appendChild(display);

    window.sessionStorage.setItem('lastQuote', JSON.stringify(quote));
}

function displayLastQuote() {
    const lastQuote = JSON.parse(window.sessionStorage.getItem('lastQuote'));

    if (lastQuote) {
        const quoteDisplay = document.getElementById("quoteDisplay");
        quoteDisplay.innerHTML = '';

        const display = document.createElement("p");
        const quoteText = document.createTextNode(`"${lastQuote.text}" - ${lastQuote.category}`);
        display.appendChild(quoteText);
        quoteDisplay.appendChild(display);
    }
}

async function addQuote() {
    const newQuoteText = document.getElementById("newQuoteText").value;
    const newQuoteCategory = document.getElementById("newQuoteCategory").value;
    if (newQuoteText && newQuoteCategory) {
        const newQuote = { text: newQuoteText, category: newQuoteCategory };
        quotes.push(newQuote);
        window.localStorage.setItem('quotes', JSON.stringify(quotes));
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        populateDropdown(); // Update dropdown after adding a new quote

        try {
            await postQuoteToServer(newQuote);
            displayNotification('Quote added successfully and posted to server.');
        } catch (error) {
            displayNotification('Error posting quote to server.');
            console.error('Error posting quote:', error);
        }
    }
}

async function postQuoteToServer(quote) {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(quote)
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
}



function createAddQuoteForm() {

    const formDiv = document.getElementById("addQuoteForm");

    const textInput = document.createElement("input");

    textInput.setAttribute("type", "text");
    textInput.setAttribute("id", "newQuoteText");
    textInput.setAttribute("placeholder", "Quote text");

    const categoryInput = document.createElement("input");
    categoryInput.setAttribute("type", "text");
    categoryInput.setAttribute("id", "newQuoteCategory");
    categoryInput.setAttribute("placeholder", "Quote category");

    const addButton = document.createElement("button");
    addButton.setAttribute("id", "addQuoteButton");
    addButton.textContent = "Add Quote";

    formDiv.appendChild(textInput);
    formDiv.appendChild(categoryInput);
    formDiv.appendChild(addButton);

    addButton.addEventListener("click", addQuote);
}

function importFile() {
    const importFileContainer = document.getElementById("importFileContainer");
    importFileContainer.innerHTML = "";

    const importFileInput = document.createElement("input");
    importFileInput.setAttribute("type", "file");
    importFileInput.setAttribute("id", "importFile");
    importFileInput.setAttribute("accept", ".json");

    importFileInput.addEventListener("change", importFromJsonFile);

    importFileContainer.appendChild(importFileInput);
}

function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        const importedQuotes = JSON.parse(event.target.result);
        quotes.push(...importedQuotes);
        window.localStorage.setItem('quotes', JSON.stringify(quotes));
        alert('Quotes imported successfully!');
    };
    fileReader.readAsText(event.target.files[0]);
}

function exportQuotes() {
    const quotesBlob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(quotesBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Clean up after download
}


function populateCategories() {
    const categoryFilter = document.getElementById("categoryFilter");
    const categories = [...new Set(quotes.map(quote => quote.category))];
    categoryFilter.innerHTML = '<option value="">All</option>'; // Reset filter options
    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    restoreCategoryFilter(); // Restore the last selected category filter
}

function filterQuotes() {
    const categoryFilter = document.getElementById("categoryFilter").value;
    const quoteDisplay = document.getElementById("quoteDisplay");
    quoteDisplay.innerHTML = '';
    const filteredQuotes = categoryFilter ? quotes.filter(quote => quote.category === categoryFilter) : quotes;
    filteredQuotes.forEach(quote => {
        const display = document.createElement("p");
        const quoteText = document.createTextNode(`"${quote.text}" - ${quote.category}`);
        display.appendChild(quoteText);
        quoteDisplay.appendChild(display);

    });

    saveCategoryFilter(categoryFilter); // Save the selected category filter
}

function saveCategoryFilter(category) {
    window.localStorage.setItem('selectedCategory', category);
}

function restoreCategoryFilter() {
    const savedCategory = window.localStorage.getItem('selectedCategory');
    if (savedCategory) {
        const categoryFilter = document.getElementById("categoryFilter");
        categoryFilter.value = savedCategory;
        filterQuotes(); // Filter quotes based on the saved category
    }
}

async function fetchQuotesFromServer() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        const data = await response.json();
        const fetchedQuotes = data.map(item => ({ text: item.title, category: 'Fetched' }));
        syncQuotes(fetchedQuotes);
    } catch (error) {
        console.error('Error fetching quotes:', error);
    }
}



function syncQuotes(fetchedQuotes) {
    const localQuotes = JSON.parse(window.localStorage.getItem('quotes')) || [];
    const mergedQuotes = mergeQuotes(localQuotes, fetchedQuotes);
    window.localStorage.setItem('quotes', JSON.stringify(mergedQuotes));
    quotes.length = 0;
    quotes.push(...mergedQuotes);
    populateCategories(); // Update dropdown after merging new quotes
}

function mergeQuotes(localQuotes, fetchedQuotes) {
    const allQuotes = [...localQuotes, ...fetchedQuotes];
    const uniqueQuotes = Array.from(new Set(allQuotes.map(q => q.text)))
        .map(text => allQuotes.find(q => q.text === text));
    return uniqueQuotes;
}


function handleConflicts(conflicts) {
    const conflictResolutionDiv = document.getElementById('conflictResolution');
    conflictResolutionDiv.innerHTML = '<h3>Resolve Conflicts</h3>';
    conflicts.forEach(conflict => {
        const conflictDiv = document.createElement('div');
        conflictDiv.innerHTML = '<h4>Conflict:</h4>';
        conflict.forEach(quote => {
            const quoteText = document.createTextNode(`"${quote.text}" - ${quote.category}`);
            const quoteDiv = document.createElement('div');
            quoteDiv.appendChild(quoteText);
            const keepButton = document.createElement('button');
            keepButton.textContent = 'Keep';
            keepButton.addEventListener('click', () => {
                resolveConflict(quote);
                conflictResolutionDiv.removeChild(conflictDiv);
            });
            quoteDiv.appendChild(keepButton);
            conflictDiv.appendChild(quoteDiv);
        });
        conflictResolutionDiv.appendChild(conflictDiv);
    });
}

function resolveConflict(quote) {
    const localQuotes = JSON.parse(window.localStorage.getItem('quotes')) || [];
    const updatedQuotes = localQuotes.filter(q => q.text !== quote.text);
    updatedQuotes.push(quote);
    window.localStorage.setItem('quotes', JSON.stringify(updatedQuotes));
    quotes.length = 0;
    quotes.push(...updatedQuotes);
    populateDropdown(); // Update dropdown after resolving conflict
    displayNotification('Quotes synced with server!.');
}

function displayNotification(message) {
    const notificationDiv = document.getElementById('notification');
    notificationDiv.innerHTML = `<p>${message}</p>`;
    setTimeout(() => {
        notificationDiv.innerHTML = '';
    }, 3000);
}

const newQuote = document.getElementById('newQuote');

document.getElementById('exportQuotes').addEventListener("click", exportQuotes);

document.getElementById('categoryFilter').addEventListener("change", filterQuotes);

newQuote.addEventListener("click", showRandomQuote);

createAddQuoteForm();

displayLastQuote();

importFile();

populateCategories();

fetchQuotesFromServer() ;

// Periodic data fetching every 30 seconds
setInterval(fetchQuotesFromServer, 1000000);