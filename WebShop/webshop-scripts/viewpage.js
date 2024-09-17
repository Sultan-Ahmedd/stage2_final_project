// Global variable to store item data
let currentItem = null;

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

// Function to get query parameters from the URL
function getQueryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const itemID = searchParams.get('itemID');
    const itemType = searchParams.get('itemType');
    return { itemID, itemType };
}

// Function to display item details
function ShowCartItemDetails(itemID, itemType) {
    if (!itemID || !itemType) {
        console.error("Item ID or itemType is not defined.");
        return;
    }

    axios.get('http://localhost:3000/view-item-details', { 
        params: { itemID: itemID, itemType: itemType }
    })
    .then(response => {
        console.log("API Response:", response.data);

        if (response.data.success) {
            console.log("System working");

            // Store item data in the global variable
            const item = response.data.item;
            currentItem = item;

            let itemDetailsHTML = `
                <div id="iteminfo-display">
                    ${item.ImagePath ? `<img id="view-image" src="${item.ImagePath}" alt="Image of ${item.GamesName || item.ServicesName}" />` : ''}
                    <h2>${item.GamesName || item.ServicesName || 'No title available'}</h2>
                    <p>${item.description || 'No description available.'}</p>
                    <p>Price: ${item.Price || 'N/A'}</p>
                    <button onclick="buyPageDisplay()">Order</button>
                    <button onclick="window.location.href='/WebShop/mainpage.html'">⬅ Back</button>
                </div>
            `;

            const itemParent = document.getElementById('item-parent');
            itemParent.innerHTML = itemDetailsHTML;
        } else {
            console.error("Failed to retrieve item details:", response.data.message);
            document.getElementById('item-parent').innerHTML = '<p>Failed to load item details.</p>';
        }
    })
    .catch(error => {
        console.error("Error fetching item details:", error);
        document.getElementById('item-parent').innerHTML = '<p>Error loading item details.</p>';
    });
}

// Buy page display function
function buyPageDisplay() {
    if (!currentItem) {
        console.error("Item data is not available.");
        return;
    }

    const viewPageDisplay = document.getElementById("iteminfo-display");
    if (viewPageDisplay) {
        viewPageDisplay.style.display = "none";
    }

    const buyPageDisplay = document.getElementById("buyitem-page");
    if (buyPageDisplay) {
        buyPageDisplay.style.display = "block";
    }

    let buyDetailsHTML = `
    <div id="buyitem-display">
        ${currentItem.ImagePath ? `<img id="game-image" src="${currentItem.ImagePath}" alt="Image of ${currentItem.GamesName || currentItem.ServicesName}" />` : ''}
        <h2>${currentItem.GamesName || currentItem.ServicesName || 'No title available'}</h2>
        <p>Total Price: ${currentItem.Price || 'N/A'}</p>
        <input id="firstname" type="text" placeholder="First Name"></input>
        <input id="lastname" type="text" placeholder="Last Name"></input>
        <input id="email" type="email" placeholder="Email"></input>
        <p id="error-message"></p>
        <button id="confirm-order">Confirm Order</button>
        <button onclick="window.location.href='/WebShop/mainpage.html'">Home</button>
    </div>
    `;
    if (buyPageDisplay) {
        buyPageDisplay.innerHTML = buyDetailsHTML;
    }

    // Move the input retrieval and validation logic inside the button click event
    document.getElementById("confirm-order").onclick = function() {
        const firstnameInput = document.getElementById("firstname").value.trim();
        const lastnameInput = document.getElementById("lastname").value.trim();
        const emailInput = document.getElementById("email").value.trim();
        const errorMessage = document.getElementById("error-message");

        if (!firstnameInput || !lastnameInput || !emailInput) {
            errorMessage.innerHTML = "Please do not leave any input empty!";
            return;
        }

        if (!isNaN(firstnameInput)) {
            errorMessage.innerHTML = "First name should not be a number.";
            return;
        }

        if (!isNaN(lastnameInput)) {
            errorMessage.innerHTML = "Last name should not be a number.";
            return;
        }
        if (/\d/.test(firstnameInput) || /\d/.test(lastnameInput)) {
            errorMessage.innerHTML = "First name or Last name should not contain numbers.";
        }

        if (!emailInput.includes('@')) {
            errorMessage.innerHTML = "Please enter a valid email address.";
            return;
        }

        errorMessage.innerHTML = ""; // Clear any existing error messages

        console.log('currentItem:', currentItem);
        // Connecting to the email sending endpoint which sends the email with all the info
        axios.get('http://localhost:3000/send-order-email', {
            params: {
                'itemId': currentItem.itemId,
                'itemType': currentItem.itemType,
                'gameName': currentItem.GamesName,
                'servicesName': currentItem.ServicesName,
                'itemPrice': currentItem.Price,
                'itemDescription': currentItem.description,
                'firstname': firstnameInput,
                'lastname': lastnameInput,
                'email': emailInput
            }
        })
        
        .then(response => {
            console.log(response);
            // If the email is sent successfully, display a success message
            errorMessage.innerHTML = "Order confirmed! Email sent successfully.";
        })
        .catch(error => {
            errorMessage.innerHTML = "An error has occured! Please retry again";
            console.log(error.response);
        })

    };
}

// Event listener for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // Extract itemID and itemType from the URL and show item details
    const { itemID, itemType } = getQueryParams();
    ShowCartItemDetails(itemID, itemType);
});
