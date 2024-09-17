
// Function to navigate to view items page with parameters
function viewPage(itemID, itemType) {
    console.log("itemID:", itemID);
    console.log("itemType:", itemType); // This should print the itemType

    if (!itemID || !itemType) {
        console.error("Item ID or itemType is not provided.");
        return;
    }

    const url = `/Webshop/viewitems.html?itemID=${encodeURIComponent(itemID)}&itemType=${encodeURIComponent(itemType)}`;
    console.log("Generated URL:", url); // Log the URL to verify

    window.location.href = url;
}

function addItemToCart(itemId, tableName) {
    const userId = sessionStorage.getItem("userID"); // Ensure case sensitivity is correct

    if (!userId) {
        console.error("userID not found in sessionStorage.");
        alert("An error has occurred, please login again!");
        return;
    }

    if (!itemId || !tableName) {
        console.error("ItemID or TableName is missing.");
        alert("An error has occurred, please check the item and try again!");
        return;
    }

    // Validate tableName to ensure it's either 'gamescart' or 'servicescart'
    if (tableName !== 'gamescart' && tableName !== 'servicescart') {
        console.error("Invalid tableName:", tableName);
        alert("Invalid table name. Please try again.");
        return;
    }
    // Construct the parameters for the GET request
    const params = new URLSearchParams({
        userId: userId,
        itemId: itemId,
        tableName: tableName,
    }).toString();

    axios.get(`http://localhost:3000/api/add-to-cart?${params}`)
        .then(response => {
            if (response.data.success) {
                alert("Item added to cart successfully!");
            } else {
                alert("Failed to add item to cart: " + response.data.message);
            }
        })
        .catch(error => {
            console.error("There was an error adding the item to the cart!", error);
            alert("The item already exists in your cart, you can't add multiples of the same item!");
        });
}

function displayCartItems() {
    const userId = sessionStorage.getItem("userID");
    const cartParent = document.getElementById('cart-parent');

    // Clear any existing content in the cart
    cartParent.innerHTML = '';

    if (!userId) {
        console.error("User ID not found.");
        cartParent.innerHTML = '<p>User ID not found.</p>';
        return;
    }

    // Fetch cart items from the backend
    axios.get('http://localhost:3000/get-cart-items', { params: { userID: userId } })
        .then(response => {
            console.log("Backend response:", response.data);

            if (response.data.success) {
                const items = response.data.items;

                if (items.length === 0) {
                    cartParent.innerHTML = '<p id="empty-message">Your cart is empty.</p>';
                    return;
                }

                // Create HTML elements for each cart item
                items.forEach(item => {
                    const price = parseInt(item.itemPrice) || 0; // Convert to a number or fallback to 0
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('cart-item');
                    itemDiv.id = item.itemID; // Add itemID as the ID of the div

                    itemDiv.innerHTML = `
                        <img src="${item.itemImage}" alt="${item.itemName}" />
                        <div id="item-details">
                        <h2>${item.itemName}</h2>
                        <p>Price: $${price}</p>
                        <button onclick="viewPage('${item.itemID}', '${item.itemType}')">View</button>
                        <button onclick="removeFromCart('${item.itemID}')">Remove from cart</button>
                        </div>
                    `;
                    cartParent.appendChild(itemDiv);
                });
                            // Create a single "Buy All" button below all items
            const buyAllButton = document.createElement('button');
            buyAllButton.textContent = 'Buy All';
            buyAllButton.id = 'buy-all-button'
            buyAllButton.onclick = () => sendToBuyAllPage(); // Pass an array of itemIDs to the function
            cartParent.appendChild(buyAllButton);
            } else {
                console.error("Failed to retrieve cart items:", response.data.message);
                cartParent.innerHTML = '<p>Failed to load cart items.</p>';
            }
        })
        .catch(error => {
            console.error("Error fetching cart items:", error);
            cartParent.innerHTML = '<p>Error loading cart items.</p>';
        });
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', displayCartItems);

function removeFromCart(itemID) {
    console.log("Removing item with ID:", itemID);
    const userID = sessionStorage.getItem("userID"); // Get the userID from session storage

    // Axios connection
    axios.get('http://localhost:3000/remove-from-cart', { params: { userID, itemID } })
        .then(response => {
            if (response.data.success) {
                alert("Removed item successfully!");
                // Update the UI
                const cartItem = document.getElementById(itemID);
                if (cartItem) {
                    cartItem.remove();
                }
            } else {
                alert("Failed to remove item.");
            }
        })
        .catch(error => {
            console.error("Error removing item:", error);
            alert("Error removing item. Please try again.");
        });
}
function sendToBuyAllPage() {
    window.location.href = '/WebShop/buyall.html';
}