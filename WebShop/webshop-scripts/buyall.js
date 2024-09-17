function setupBuyAll() {
    const parentDiv = document.getElementById('buyitem-display');
    if (!parentDiv) {
        console.error("Parent div not found");
        return;
    }

    const userId = sessionStorage.getItem("userID");
    if (!userId) {
        console.error("User ID not found.");
        return;
    }

    axios.get(`http://localhost:3000/get-cart-items?userID=${userId}`)
        .then(response => {
            if (response.data.success) {
                const items = response.data.items;
                let totalPrice = 0;
                let itemsHtml = '';

                items.forEach(item => {
                    const itemPrice = parseFloat(item.itemPrice) || 0;
                    totalPrice += itemPrice;
                    itemsHtml += `<p>${item.itemName} - $${itemPrice.toFixed(2)}</p>`;
                });

                const buyAllDiv = document.createElement('div');
                buyAllDiv.id = 'buy-all-div';
                buyAllDiv.innerHTML = `
                    <h2>Buy Multiple Items</h2>
                    <br>
                    ${itemsHtml}
                    <h2>Total Price: $${totalPrice.toFixed(2)}</h2>
                    <input type="text" id="buy-all-name" placeholder="Enter your name">
                    <input type="text" id="buy-all-lastname" placeholder="Enter your lastname">
                    <input type="email" id="buy-all-email" placeholder="Enter your email">
                    <p id="error-message"></p>
                `;
                parentDiv.appendChild(buyAllDiv);

                // Buy All button
                const buyAllButton = document.createElement('button');
                buyAllButton.textContent = 'Confirm Order';
                buyAllButton.id = 'buy-all-button';
                buyAllButton.onclick = buyAllItems;
                parentDiv.appendChild(buyAllButton);
            } else {
                console.error("Failed to fetch cart items:", response.data.message);
                parentDiv.innerHTML = '<p>Failed to load cart items.</p>';
            }
        })
        .catch(error => {
            console.error("Error fetching cart items:", error);
            parentDiv.innerHTML = '<p>Error loading cart items.</p>';
        });
}

function buyAllItems() {
    const userId = sessionStorage.getItem("userID");
    const name = document.getElementById('buy-all-name').value;
    const lastname = document.getElementById('buy-all-lastname').value;
    const email = document.getElementById('buy-all-email').value;
    const errorMessage = document.getElementById('error-message');

    // Check if any field is empty
    if (!name || !lastname || !email) {
        errorMessage.textContent = "Please fill in all fields.";
        return;
    }

    // Check for spaces in name and lastname
    if (name.includes(' ') || lastname.includes(' ')) {
        errorMessage.textContent = "Name and last name should not contain spaces.";
        return;
    }

    // Check for numbers in name and lastname
    if (/\d/.test(name) || /\d/.test(lastname)) {
        errorMessage.textContent = "Name and last name should not contain numbers.";
        return;
    }

    // Check for valid email (contains @)
    if (!email.includes('@')) {
        errorMessage.textContent = "Please enter a valid email address.";
        return;
    }

    // Clear any previous error message
    errorMessage.textContent = "";

    // Proceed with the purchase
    axios.get(`http://localhost:3000/buy-all-items?userID=${encodeURIComponent(userId)}&firstName=${encodeURIComponent(name)}&lastName=${encodeURIComponent(lastname)}&email=${encodeURIComponent(email)}`)
    .then(response => {
        if (response.data.success) {
            errorMessage.textContent = "All items bought successfully! Email sent.";
        } else {
            alert("Failed to buy all items: " + response.data.message);
        }
    })
    .catch(error => {
        console.error("Error buying all items:", error.response ? error.response.data : error.message);
        alert("Error buying all items. Please try again.");
    });
}

// Add this event listener at the end of the file
document.addEventListener('DOMContentLoaded', setupBuyAll);