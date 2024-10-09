const uploadBtn = document.getElementById('uploadBtn');
const stockTableBody = document.getElementById('stockTable').getElementsByTagName('tbody')[0];
let stockData = [];

// Function to calculate remark based on expected and actual stock
const calculateRemark = (systemQty, actualQty) => {
    if (actualQty === '') return { remark: '', color: '' };

    const actual = parseFloat(actualQty);
    const system = parseFloat(systemQty);
    const percentage = (actual / system) * 100;

    if (actual > system) {
        return { remark: 'Excess', color: 'blue' };
    } else if (percentage < 50) {
        return { remark: 'Adverse', color: 'red' };
    } else if (percentage >= 50 && percentage < 100) {
        return { remark: 'Favorable', color: 'yellow' };
    } else if (percentage === 100) {
        return { remark: 'Balanced', color: 'green' };
    }

    return { remark: '', color: '' }; // Fallback case
};

// Function to display products in the table
function displayProducts(products) {
    stockTableBody.innerHTML = '';  // Clear the table before adding new data

    products.forEach(product => {
        const { name, quantity, cost, category } = product;
        const row = stockTableBody.insertRow();

        row.innerHTML = `
            <td class="p-4">${name}</td>
            <td class="p-4">${quantity}</td>
            <td class="p-4">
                <input type="number" class="actualQty border border-gray-300 rounded-md p-2 w-full" value="${quantity}" />
            </td>
            <td class="p-4">${cost}</td>
            <td class="p-4">${category}</td>
            <td class="p-4 variance"></td>
            <td class="p-4 remark"></td>
        `;

        // Add event listener to update variance and remark when actual quantity changes
        const actualQtyInput = row.querySelector('.actualQty');
        actualQtyInput.addEventListener('input', function () {
            const actualQty = parseFloat(this.value);
            const systemQty = parseFloat(quantity);
            const variance = actualQty - systemQty;
            const { remark } = calculateRemark(systemQty, actualQty);

            row.querySelector('.variance').textContent = variance;
            row.querySelector('.remark').textContent = remark;

            // Update row color based on remark
            row.className = getRemarkClass(remark);
        });
    });
}

// Get Tailwind CSS class based on remark
function getRemarkClass(remark) {
    if (remark === 'Adverse') return 'bg-red-100';
    if (remark === 'Favorable') return 'bg-yellow-100';
    if (remark === 'Balanced') return 'bg-green-100';
    if (remark === 'Excess') return 'bg-blue-100';
    return '';
}

// Function to handle manual product entry
document.getElementById('manualEntryForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('productName').value;
    const quantity = document.getElementById('systemQuantity').value;
    const cost = document.getElementById('productCost').value;
    const category = document.getElementById('productCategory').value;

    const newProduct = { name, quantity, cost, category };
    stockData.push(newProduct);
    displayProducts(stockData);

    // Clear form
    this.reset();
});

// Function to handle file upload and parse Excel data
uploadBtn.addEventListener('click', function () {
    const fileInput = document.getElementById('uploadFile');
    if (!fileInput.files.length) return alert("Please select an Excel file.");

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        // Assume first row is the header
        const products = rows.slice(1).map(row => ({
            name: row[0],  // First column: Product Name
            quantity: row[1],  // Second column: System Quantity
            cost: row[2],  // Third column: Cost
            category: row[3]  // Fourth column: Category
        }));

        // Display products in the table
        stockData = products;
        displayProducts(products);
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
});

// Export reconciled data to Excel
document.getElementById('exportBtn').addEventListener('click', function () {
    const exportedData = stockData.map((product, index) => {
        const actualQtyInput = document.querySelector(`#stockTable tbody tr:nth-child(${index + 1}) .actualQty`);
        const actualQty = parseFloat(actualQtyInput ? actualQtyInput.value : 0); // Get actual quantity from input
        const variance = actualQty - parseFloat(product.quantity); // Calculate variance
        const { remark } = calculateRemark(product.quantity, actualQty); // Get remark based on system and actual quantity

        return {
            ...product,
            actualQty: actualQty,
            variance: variance,
            remark: remark
        };
    });

    const ws = XLSX.utils.json_to_sheet(exportedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reconciled Data");
    XLSX.writeFile(wb, 'reconciled_data.xlsx');
});

// Download template functionality
document.getElementById('downloadTemplateBtn').addEventListener('click', function () {
    const templateData = [
        ["Product Name", "System Quantity", "Cost", "Category"],
        ["Example Product", 10, 5.99, "Example Category"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, 'stock_template.xlsx');
});
