let data = []; // This holds the initial Excel data
let filteredData = []; // This holds the filtered data after user operations

// Function to load and display the Excel sheet initially
async function loadExcelSheet(fileUrl) {
    try {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheetName = workbook.SheetNames[0]; // Load the first sheet
        const sheet = workbook.Sheets[sheetName];

        data = XLSX.utils.sheet_to_json(sheet, { defval: null });
        filteredData = [...data];

        // Initially display the full sheet
        displaySheet(filteredData);
    } catch (error) {
        console.error("Error loading Excel sheet:", error);
    }
}

// Function to display the Excel sheet as an HTML table
function displaySheet(sheetData) {
    const sheetContentDiv = document.getElementById('sheet-content');
    sheetContentDiv.innerHTML = ''; // Clear existing content

    if (sheetData.length === 0) {
        sheetContentDiv.innerHTML = '<p>No data available</p>';
        return;
    }

    const table = document.createElement('table');

    // Create table headers
    const headerRow = document.createElement('tr');
    Object.keys(sheetData[0]).forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Create table rows
    sheetData.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell === null ? 'NULL' : cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    sheetContentDiv.appendChild(table);
}

// Function to apply the selected operations and update the table
function applyOperation() {
    const primaryColumn = document.getElementById('primary-column').value.trim();
    const operationColumnsInput = document.getElementById('operation-columns').value.trim();
    const operationType = document.getElementById('operation-type').value;
    const operation = document.getElementById('operation').value;

    if (!primaryColumn || !operationColumnsInput) {
        alert('Please enter the primary column and columns to operate on.');
        return;
    }

    // Convert the entered column names (e.g., A, B, C) to column headers
    const operationColumns = operationColumnsInput.split(',').map(col => col.trim());

    filteredData = data.filter(row => {
        // Check if the primary column is null or not
        const isPrimaryNull = row[primaryColumn] === null;

        // Apply the AND/OR logic
        const columnChecks = operationColumns.map(col => {
            if (operation === 'null') {
                return row[col] === null;
            } else {
                return row[col] !== null;
            }
        });

        // Determine if we should display the row based on the selected operation type
        if (operationType === 'and') {
            return !isPrimaryNull && columnChecks.every(check => check);
        } else {
            return !isPrimaryNull && columnChecks.some(check => check);
        }
    });

    // Only display the primary column and the selected operation columns
    filteredData = filteredData.map(row => {
        const filteredRow = {};
        filteredRow[primaryColumn] = row[primaryColumn]; // Always show the primary column
        operationColumns.forEach(col => {
            filteredRow[col] = row[col];
        });
        return filteredRow;
    });

    // Update the displayed table
    displaySheet(filteredData);
}

// Function to open the download modal
function openDownloadModal() {
    document.getElementById('download-modal').style.display = 'flex';
}

// Function to close the download modal
function closeDownloadModal() {
    document.getElementById('download-modal').style.display = 'none';
}

// Function to download filtered data as an Excel file or CSV
function downloadExcel() {
    const filename = document.getElementById('filename').value.trim() || 'download';
    const format = document.getElementById('file-format').value;

    let worksheet = XLSX.utils.json_to_sheet(filteredData);
    let workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Filtered Data');

    if (format === 'xlsx') {
        XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else if (format === 'csv') {
        XLSX.writeFile(workbook, `${filename}.csv`);
    }

    closeDownloadModal(); // Close the modal after download
}

// Event listeners for button clicks
document.getElementById('apply-operation').addEventListener('click', applyOperation);
document.getElementById('download-button').addEventListener('click', openDownloadModal);
document.getElementById('confirm-download').addEventListener('click', downloadExcel);
document.getElementById('close-modal').addEventListener('click', closeDownloadModal);

// Load the Excel sheet when the page is loaded (replace with your file URL)
window.addEventListener('load', () => {
    const fileUrl = getQueryParam('fileUrl'); // Assuming you get file URL from query params
    loadExcelSheet(fileUrl);
});

// Helper function to get query parameters from URL
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}
