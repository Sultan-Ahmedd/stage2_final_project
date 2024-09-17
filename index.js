// Import the necessary modules
import http from 'http';
import { URL } from 'url';
import mysql from 'mysql2';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import fs from 'fs';

// Generate PDF function
function generatePDF(orderDetails, callback) {
    const doc = new PDFDocument();
    const filePath = './order-details.pdf';

    // Create a writable stream to save the PDF file
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add order details to the PDF
    doc.fontSize(25).text(`Order Details`, { align: 'center' });
    doc.fontSize(16).text(`Name: ${orderDetails.firstName} ${orderDetails.lastName}`);
    doc.text(`Item ID: ${orderDetails.itemId || 'Not provided'}`);
    doc.text(`Item Name: ${orderDetails.gameName || orderDetails.servicesName || 'Not provided'}`);
    doc.text(`Description: ${orderDetails.itemDescription || 'Not provided'}`);
    doc.text(`Total Price: USD$${orderDetails.itemPrice || 'Not provided'}`);

    doc.end();

    // Wait for the PDF to be fully written before calling the callback
    writeStream.on('finish', function() {
        callback(filePath);
    });
}
function generatePDFAll(orderDetails, callback) {
    console.log("Generating PDF for multiple items:", orderDetails);
    const doc = new PDFDocument();
    const filePath = './order-all-details.pdf';

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(25).text(`Order Details`, { align: 'center' });
    doc.fontSize(16).text(`Name: ${orderDetails.firstName} ${orderDetails.lastName}`);
    
    if (Array.isArray(orderDetails.items)) {
        orderDetails.items.forEach(item => {
            doc.text(`${item.itemName}: $${parseFloat(item.itemPrice).toFixed(2)}`);
        });
    } else {
        console.error("orderDetails.items is not an array:", orderDetails.items);
        doc.text("Error: Item details not available");
    }

    doc.text(`Total Price: USD$${orderDetails.totalPrice.toFixed(2)}`);

    doc.end();

    writeStream.on('finish', function() {
        console.log("PDF generated successfully:", filePath);
        callback(filePath);
    });

    writeStream.on('error', function(error) {
        console.error("Error generating PDF:", error);
        callback(null, error);
    });
}

// Function to send an email using SendGrid with an attachment
async function sendEmail(to, subject, content, attachmentPath) {
    console.log("Sending email with attachment:", { to, subject, attachmentPath });
    const sendGridAPIKey = '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';
    
    try {
        const attachmentContent = fs.readFileSync(attachmentPath).toString('base64');
        console.log("Attachment read successfully");
        
        const data = {
            personalizations: [{
                to: [{ email: to }],
                subject: subject
            }],
            from: { email: 'thevaultgamesystem@gmail.com' },
            content: [{
                type: 'text/html',
                value: content
            }],
            attachments: [
                {
                    content: attachmentContent,
                    filename: 'order-details.pdf',
                    type: 'application/pdf',
                    disposition: 'attachment'
                }
            ]
        };

        const response = await axios.post('https://api.sendgrid.com/v3/mail/send', data, {
            headers: {
                'Authorization': `Bearer ${sendGridAPIKey}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Email sent successfully:", response.data);
        return response.data;
    } catch (error) {
        console.error('Error sending email:', error.response ? error.response.data : error.message);
        throw new Error('Failed to send email');
    }
}
// All the line above is is read and now have to do the below ones

// Create a connection to the database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'webshopdb'
});

// Connect to the database
db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL Database');
});

// Create an HTTP server
const server = http.createServer((request, response) => {
    // Set CORS headers to allow cross-origin requests
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');    

    // Handle OPTIONS request for CORS preflight
    if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
    }

    // Parse the URL from the incoming request
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    // Route - GET /register
    if (request.method === 'GET' && pathname === '/register') {
        const username = url.searchParams.get('username');
        const email = url.searchParams.get('email');
        const password = url.searchParams.get('password');
    
        if (!username || !email || !password) {
            response.statusCode = 400;
            response.end('Username, email, and password are required.');
            return;
        }
    
        // Check if the username already exists
        const checkUserSql = 'SELECT * FROM UserInfo WHERE UserName = ?';
        db.query(checkUserSql, [username], (err, userResults) => {
            if (err) {
                console.error(err);
                response.statusCode = 500;
                response.end('Error processing request');
                return;
            }
            if (userResults.length > 0) {
                response.statusCode = 400;
                response.end('Username already exists, please use another username!');
                return;
            }
    
            // Check if the email already exists
            const checkEmailSql = 'SELECT * FROM UserInfo WHERE Email = ?';
            db.query(checkEmailSql, [email], (err, emailResults) => {
                if (err) {
                    console.error(err);
                    response.statusCode = 500;
                    response.end('Error processing request');
                    return;
                }
                if (emailResults.length > 0) {
                    response.statusCode = 400;
                    response.end('Email already exists, please use another!');
                    return;
                }
    
                // Insert the new user
                const insertUserSql = 'INSERT INTO UserInfo (UserName, Email, Password) VALUES (?, ?, ?)';
                db.query(insertUserSql, [username, email, password], (err) => {
                    if (err) {
                        console.error(err);
                        response.statusCode = 500;
                        response.end('Error processing request');
                        return;
                    }
    
                    // Send a success response
                    response.statusCode = 200;
                    response.end('User registered successfully');
                });
            });
        });
    }    

    // Route - GET /login
    else if (request.method === 'GET' && pathname === '/login') {
        const username = url.searchParams.get('username');
        const password = url.searchParams.get('password');

        if (!username || !password) {
            response.statusCode = 400;
            response.end('Username and password are required.');
            return;
        }

        const sql = 'SELECT * FROM UserInfo WHERE UserName = ? AND Password = ?';
        db.query(sql, [username, password], (err, results) => {
            if (err) {
                response.statusCode = 500;
                response.end('Error logging in');
                return;
            }
            if (results.length > 0) {
                const userID = results[0].UserID; // Assuming UserID is in the UserInfo table
                response.statusCode = 200;
                response.end(JSON.stringify({ success: true, userID }));
            } else {
                response.statusCode = 401;
                response.end('Invalid credentials');
            }
        });
    }

    // Route - GET /change-password
    else if (request.method === 'GET' && pathname === '/change-password') {
        const email = url.searchParams.get('email');
        const currentPassword = url.searchParams.get('currentPassword');
        const newPassword = url.searchParams.get('newPassword');

        if (!email || !currentPassword || !newPassword) {
            response.statusCode = 400;
            response.end('Email, current password, and new password are required.');
            return;
        }

        const sql = 'SELECT * FROM UserInfo WHERE Email = ? AND Password = ?';
        db.query(sql, [email, currentPassword], (err, results) => {
            if (err) {
                response.statusCode = 500;
                response.end('Error changing password');
                return;
            }

            if (results.length > 0) {
                const updateSQL = 'UPDATE UserInfo SET Password = ? WHERE Email = ?';
                db.query(updateSQL, [newPassword, email], (err) => {
                    if (err) {
                        response.statusCode = 500;
                        response.end('Error changing password');
                        return;
                    }
                    response.statusCode = 200;
                    response.end('Password changed successfully');
                });
            } else {
                response.statusCode = 401;
                response.end('Old password is incorrect or user not found');
            }
        });
    }

    // Route - GET /change-username
    else if (request.method === 'GET' && pathname === '/change-username') {
        const email = url.searchParams.get('email');
        const currentPassword = url.searchParams.get('currentPassword');
        const newUsername = url.searchParams.get('newUsername');

        if (!email || !currentPassword || !newUsername) {
            response.statusCode = 400;
            response.end('Email, current password, and new username are required.');
            return;
        }

        // Check if the new username already exists
        const checkSameUserSql = 'SELECT * FROM UserInfo WHERE UserName = ?';
        db.query(checkSameUserSql, [newUsername], (err, userResults) => {
            if (err) {
                console.error(err);
                response.statusCode = 500;
                response.end('Error processing request');
                return;
            }
            if (userResults.length > 0) {
                response.statusCode = 400;
                response.end('Username already exists, please use another username!');
                return;
            }
        });

        const sql = 'SELECT * FROM UserInfo WHERE Email = ? AND Password = ?';
        db.query(sql, [email, currentPassword], (err, results) => {
            if (err) {
                response.statusCode = 500;
                response.end('Error changing username');
                return;
            }
            if (results.length > 0) {
                const updateSQL = 'UPDATE UserInfo SET UserName = ? WHERE Email = ?';
                db.query(updateSQL, [newUsername, email], (err) => {
                    if (err) {
                        response.statusCode = 500;
                        response.end('Error changing username');
                        return;
                    }
                    response.statusCode = 200;
                    response.end('Username changed successfully');
                });
            } else {
                response.statusCode = 401;
                response.end('Incorrect email or password');
            }
        });
    }

    // Route - GET /api/add-to-cart
    else if (request.method === 'GET' && pathname === '/api/add-to-cart') {
        const userId = parseInt(url.searchParams.get('userId'));
        const itemId = parseInt(url.searchParams.get('itemId'));
        const tableName = url.searchParams.get('tableName');
    
        if (!userId || !itemId || !tableName) {
            response.statusCode = 400;
            response.end(JSON.stringify({ success: false, message: 'Missing parameters. Please provide userId, itemId, and tableName.' }));
            return;
        }
    
        if (tableName !== 'gamescart' && tableName !== 'servicescart') {
            response.statusCode = 400;
            response.end(JSON.stringify({ success: false, message: "Invalid table name. Use 'gamescart' or 'servicescart'." }));
            return;
        }
    
        // Check if the item exists in the specified table
        const queryCheckItemExists = `SELECT * FROM ${tableName} WHERE itemID = ?`;
        db.query(queryCheckItemExists, [itemId], (error, results) => {
            if (error) {
                console.error("Error checking item existence:", error.message);
                response.statusCode = 500;
                response.end(JSON.stringify({ success: false, message: 'Internal Server Error during item existence check.', error: error.message }));
                return;
            }
    
            if (results.length === 0) {
                response.statusCode = 400;
                response.end(JSON.stringify({ success: false, message: 'Item does not exist in the specified table.' }));
                return;
            }
    
            // Check if the item is already in the cart for the same table
            const queryCheckItemInCart = `SELECT * FROM usershoppingcarts WHERE userId = ? AND itemId = ? AND ItemType = ?`;
    
            db.query(queryCheckItemInCart, [userId, itemId, tableName], (error, results) => {
                if (error) {
                    console.error("Error checking item in cart:", error.message);
                    response.statusCode = 500;
                    response.end(JSON.stringify({ success: false, message: 'Internal Server Error during cart check.', error: error.message }));
                    return;
                }
    
                if (results.length > 0) {
                    // If the item already exists in the cart for the same table, deny the addition
                    response.statusCode = 400;
                    response.end(JSON.stringify({ success: false, message: `Item already exists in the ${tableName}. Cannot add it again.` }));
                } else {
                    // Item does not exist in the cart for the same table, insert it
                    const insertItem = `INSERT INTO usershoppingcarts (userId, itemId, ItemType) VALUES (?, ?, ?)`;
    
                    db.query(insertItem, [userId, itemId, tableName], (error) => {
                        if (error) {
                            console.error("Error inserting item into cart:", error.message);
                            response.statusCode = 500;
                            response.end(JSON.stringify({ success: false, message: 'Internal Server Error during item insertion.', error: error.message }));
                            return;
                        }
                        response.statusCode = 200;
                        response.end(JSON.stringify({ success: true, message: 'Item added to cart successfully.' }));
                    });
                }
            });
        });
    }
    
    // Route - GET /get-cart-items
    else if (request.method === 'GET' && pathname === '/get-cart-items') {
        // Extract userID from query parameters
        const userId = new URL(request.url, `http://${request.headers.host}`).searchParams.get('userID');

        // Define the SQL query
        const queryGetCartItems = `
        SELECT 
            usc.itemID, 
            usc.itemType,

            -- Select the item name based on the item type
            CASE 
                WHEN usc.itemType = 'gamescart' THEN gc.GamesName
                WHEN usc.itemType = 'servicescart' THEN sc.ServicesName
            END AS itemName,

            -- Select the item price based on the item type
            CASE 
                WHEN usc.itemType = 'gamescart' THEN gc.Price
                WHEN usc.itemType = 'servicescart' THEN sc.Price
            END AS itemPrice,

            -- Select the item image path based on the item type
            CASE 
                WHEN usc.itemType = 'gamescart' THEN gc.ImagePath
                WHEN usc.itemType = 'servicescart' THEN sc.ImagePath
            END AS itemImage

        FROM 
            usershoppingcarts usc

        -- Join with gamescart if itemType is 'gamescart'
        LEFT JOIN 
            gamescart gc 
            ON usc.itemType = 'gamescart' 
            AND usc.itemID = gc.itemId

        -- Join with servicescart if itemType is 'servicescart'
        LEFT JOIN 
            servicescart sc 
            ON usc.itemType = 'servicescart' 
            AND usc.itemID = sc.itemId

        -- Filter for the specific user
        WHERE 
            usc.userID = ?;
                `;

        // Execute the query
        db.query(queryGetCartItems, [userId], (error, results) => {
            if (error) {
                console.error("Error retrieving cart items:", error.message);

                response.statusCode = 500;
                response.end(JSON.stringify({ 
                    success: false, 
                    message: 'Internal Server Error during cart retrieval.',
                    error: error.message 
                }));
                return;
            } else {
                response.statusCode = 200;
                response.end(JSON.stringify({ 
                    success: true, 
                    message: 'Cart items retrieved successfully.', 
                    items: results 
                }));
            }
        });
    }

    // Route - GET /remove-from-cart
    else if (request.method === 'GET' && pathname === '/remove-from-cart') {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const userId = url.searchParams.get('userID'); // Get userID from the URL query string
        const itemId = url.searchParams.get('itemID'); // Get itemID from the URL query string

        if (!userId || !itemId) {
            response.statusCode = 400; // Bad Request
            response.end(JSON.stringify({
                success: false,
                message: 'Missing userID or itemID.',
            }));
            return;
        }

        // Define the SQL query
        const queryRemoveItem = `
        DELETE FROM usershoppingcarts
        WHERE userID = ? AND itemID = ?
        `;
        
        // Execute the query
        db.query(queryRemoveItem, [userId, itemId], (error, results) => {
            if (error) {
                console.error("Error removing item from cart:", error.message);
                response.statusCode = 500; // Internal server error
                response.end(JSON.stringify({
                    success: false,
                    message: 'Error removing item from cart.',
                }));
            } else {
                response.statusCode = 200;
                response.end(JSON.stringify({
                    success: true,
                    message: 'Item removed from cart successfully.',
                }));
            }
        });
    }

    // Route - GET /view-item-details
    else if (request.method === 'GET' && pathname === '/view-item-details') {
        const url = new URL(request.url, `http://${request.headers.host}`);
        const itemId = url.searchParams.get('itemID'); // Get itemID from the URL query
        const itemType = url.searchParams.get('itemType'); // Get itemType from the URL query

        // Add these console.log statements to debug the received parameters
        console.log('Received itemID:', itemId);
        console.log('Received itemType:', itemType);

        // Determine the table to query based on itemType
        let queryGetItemDetails = '';
        if (itemType === 'gamescart') {
            queryGetItemDetails = 'SELECT * FROM gamescart WHERE itemID = ?';
        } else if (itemType === 'servicescart') {
            queryGetItemDetails = 'SELECT * FROM servicescart WHERE itemID = ?';
        } else {
            response.statusCode = 400; // Bad Request
            return response.end(JSON.stringify({
                success: false,
                message: 'Invalid itemType provided.',
            }));
        }

        // Execute the query to get item details
        db.query(queryGetItemDetails, [itemId], (error, results) => {
            if (error) {
                console.error("Error getting item details:", error.message);
                response.statusCode = 500; // Internal server error
                return response.end(JSON.stringify({
                    success: false,
                    message: 'Error getting item details.',
                }));
            } else if (results.length === 0) {
                response.statusCode = 404; // Not Found
                return response.end(JSON.stringify({
                    success: false,
                    message: 'Item not found.',
                }));
            } else {
                response.statusCode = 200;
                return response.end(JSON.stringify({
                    success: true,
                    item: results[0],
                }));
            }
        });
    }

    // Route - GET /send-order-email
    else if (request.method === 'GET' && pathname === '/send-order-email') {
        const firstName = url.searchParams.get('firstname');
        const lastName = url.searchParams.get('lastname');
        const emailParam = url.searchParams.get('email');

        const itemId = url.searchParams.get('itemId');
        const itemType = url.searchParams.get('itemType');
        const gameName = url.searchParams.get('gameName');
        const servicesName = url.searchParams.get('servicesName');
        const itemPrice = url.searchParams.get('itemPrice');
        const itemDescription = url.searchParams.get('itemDescription');

        if (!firstName || !lastName || !emailParam) {
            response.statusCode = 400;
            response.end('First name, last name, and email are required.');
            return;
        }

        console.log('Received parameters:', {
            firstName,
            lastName,
            emailParam,
            servicesName,
            itemId,
            itemType,
            gameName,
            itemPrice,
            itemDescription
        });

        const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            color: #fff;
            margin: 0;
            padding: 0;
            display: flex;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        .container {
            width: 90%;
            max-width: 600px;
            padding: 20px;
            border: 2px solid #ff007f;
            border-radius: 10px;
            background-image: url('https://images.wallpapersden.com/image/download/synthwave-and-retrowave_a2tpbmyUmZqaraWkpJRmbmdlrWZlbWU.jpg');
            background-size: cover;
        }
        .header {
            font-size: 28px;
            font-weight: bold;
            color: #ff007f;
            margin-bottom: 20px;
        }
        .content {
            font-size: 18px;
            margin-bottom: 20px;
            color: #e1e1e1;
        }
        .footer {
            font-size: 14px;
            color: #e1e1e1;
            margin-top: 20px;
        }
        .highlight {
            background-color: white;
            border-left: 5px solid #ff007f;
            padding: 15px;
            margin-bottom: 20px;
            text-align: left;
        }
        .highlight p {
            margin: 0;
        }
        .gamevault-title {
            font-size: 24px;
            font-weight: bold;
            color: #ff007f;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <p class="header">Hello ${firstName} ${lastName}!</p>
        <p class="content">Your order has been confirmed. Following is the order information:</p>
        <div class="highlight">
            <p><strong>Item ID:</strong> ${itemId ? itemId : 'Not provided'}</p>
            <p><strong>Item Name:</strong> ${gameName ? gameName : (servicesName ? servicesName : 'Not provided')}</p>
            <p><strong>Description:</strong> ${itemDescription ? itemDescription : 'Not provided'}</p>
            <p><strong>Total price:</strong> USD$${itemPrice ? itemPrice : 'Not provided'}</p>
        </div>
        <p class="footer">Thank you for shopping with us!</p>
        <p class="gamevault-title">GameVault</p>
    </div>
</body>
</html>
`;

        // Generate the PDF and send the email
        generatePDF({
            firstName,
            lastName,
            itemId,
            gameName,
            servicesName,
            itemPrice,
            itemDescription
        }, async (pdfPath) => {
            try {
                await sendEmail(emailParam, "Order Information", emailContent, pdfPath);
                response.statusCode = 200;
                response.end('Order confirmation email with PDF sent successfully.');
            } catch (error) {
                console.error('Error in sending email:', error.message);
                response.statusCode = 500;
                response.end('Failed to send order confirmation email.');
            }
        });
    }

    // Route - GET /search
    else if (request.method === 'GET' && pathname === '/search') {
        const query = url.searchParams.get('query');

        if (!query) {
            response.statusCode = 400;
            response.end(JSON.stringify({ success: false, message: 'Search query is required.' }));
            return;
        }

        // Define the SQL query to search both tables
        const searchQuery = `
        SELECT 'gamescart' AS itemType, GamesName AS itemName, Description, Price, ImagePath
        FROM gamescart
        WHERE GamesName LIKE ?
        UNION
        SELECT 'servicescart' AS itemType, ServicesName AS itemName, Description, Price, ImagePath
        FROM servicescart
        WHERE ServicesName LIKE ?
    `;
    
    // Execute the search query
    const searchTerm = `%${query}%`;
    db.query(searchQuery, [searchTerm, searchTerm], (error, results) => {
        if (error) {
            console.error("Error executing search query:", error.message);
            response.statusCode = 500;
            response.end(JSON.stringify({ success: false, message: 'Internal Server Error during search.', error: error.message }));
            return;
        }
    
        response.statusCode = 200;
        response.end(JSON.stringify({ success: true, results }));
    });    
    }
    else if (request.method === 'GET' && pathname === '/buy-all-items') {
        const userId = url.searchParams.get('userID');
        const firstName = url.searchParams.get('firstName');
        const lastName = url.searchParams.get('lastName');
        const email = url.searchParams.get('email');
    
        console.log("Received parameters:", { userId, firstName, lastName, email });
    
        if (!userId || !firstName || !lastName || !email) {
            console.log("Missing parameters:", { userId, firstName, lastName, email });
            response.statusCode = 400;
            response.end(JSON.stringify({ 
                success: false, 
                message: 'User ID, first name, last name, and email are required.',
                receivedParams: { userId, firstName, lastName, email }
            }));
            return;
        }
    
        const getUserCartItemsQuery = `
            SELECT usc.itemID, usc.itemType, 
                   CASE 
                       WHEN usc.itemType = 'gamescart' THEN gc.GamesName
                       WHEN usc.itemType = 'servicescart' THEN sc.ServicesName
                   END AS itemName,
                   CASE 
                       WHEN usc.itemType = 'gamescart' THEN gc.Price
                       WHEN usc.itemType = 'servicescart' THEN sc.Price
                   END AS itemPrice
            FROM usershoppingcarts usc
            LEFT JOIN gamescart gc ON usc.itemType = 'gamescart' AND usc.itemID = gc.itemId
            LEFT JOIN servicescart sc ON usc.itemType = 'servicescart' AND usc.itemID = sc.itemId
            WHERE usc.userID = ?
        `;
    
        db.query(getUserCartItemsQuery, [userId], (error, cartItems) => {
            if (error) {
                console.error("Error getting user's cart items:", error.message);
                response.statusCode = 500;
                response.end(JSON.stringify({ success: false, message: 'Internal Server Error during cart retrieval.', error: error.message }));
                return;
            }
    
            if (!Array.isArray(cartItems) || cartItems.length === 0) {
                console.log("No items in cart or invalid cart data:", cartItems);
                response.statusCode = 400;
                response.end(JSON.stringify({ success: false, message: 'No items in cart or invalid cart data.' }));
                return;
            }
    
            let totalPrice = 0;
            let itemsHtml = '';
            cartItems.forEach(item => {
                const itemPrice = parseFloat(item.itemPrice) || 0;
                totalPrice += itemPrice;
                itemsHtml += `<p>${item.itemName} - $${itemPrice.toFixed(2)}</p>`;
            });
    
            const emailContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                color: #fff;
                margin: 0;
                padding: 0;
                display: flex;
                align-items: center;
                height: 100vh;
                text-align: center;
            }
            .container {
                width: 90%;
                max-width: 600px;
                padding: 20px;
                border: 2px solid #ff007f;
                border-radius: 10px;
                background-image: url('https://images.wallpapersden.com/image/download/synthwave-and-retrowave_a2tpbmyUmZqaraWkpJRmbmdlrWZlbWU.jpg');
                background-size: cover;
            }
            .header {
                font-size: 28px;
                font-weight: bold;
                color: #ff007f;
                margin-bottom: 20px;
            }
            .content {
                font-size: 18px;
                margin-bottom: 20px;
                color: #e1e1e1;
            }
            .footer {
                font-size: 14px;
                color: #e1e1e1;
                margin-top: 20px;
            }
            .highlight {
                background-color: white;
                border-left: 5px solid #ff007f;
                padding: 15px;
                margin-bottom: 20px;
                text-align: left;
            }
            .highlight p {
                margin: 0;
            }
            .gamevault-title {
                font-size: 24px;
                font-weight: bold;
                color: #ff007f;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <p class="header">Hello ${firstName} ${lastName}!</p>
            <p class="content">Your order has been confirmed. Here are the details:</p>
            <div class="highlight">
                ${itemsHtml}
                <p><strong>Total price:</strong> USD$${totalPrice.toFixed(2)}</p>
            </div>
            <p class="footer">Thank you for shopping with us!</p>
            <p class="gamevault-title">GameVault</p>
        </div>
    </body>
    </html>
            `;
    
            const buyAllItemsQuery = `
                INSERT INTO orders (userID, itemID, itemType, DateOfPurchase)
                SELECT ?, itemID, itemType, CURRENT_TIMESTAMP
                FROM usershoppingcarts
                WHERE userID = ?
            `;
    
            db.query(buyAllItemsQuery, [userId, userId], (error, results) => {
                if (error) {
                    console.error("Error buying all items:", error.message);
                    response.statusCode = 500;
                    response.end(JSON.stringify({ success: false, message: 'Internal Server Error during order processing.', error: error.message }));
                    return;
                }
    
                // Generate PDF and send email
                generatePDFAll({
                    firstName,
                    lastName,
                    items: cartItems,
                    totalPrice
                }, async (pdfPath, error) => {
                    if (error) {
                        console.error('Error generating PDF:', error);
                        response.statusCode = 500;
                        response.end(JSON.stringify({ success: false, message: 'Failed to generate order PDF.', error: error.message }));
                        return;
                    }
                    
                    if (!pdfPath) {
                        console.error('PDF path is null');
                        response.statusCode = 500;
                        response.end(JSON.stringify({ success: false, message: 'Failed to generate order PDF.' }));
                        return;
                    }
                
                    try {
                        await sendEmail(email, "Order Confirmation - Multiple Items", emailContent, pdfPath);
                        
                        // Delete items from the cart
                        db.query(`DELETE FROM usershoppingcarts WHERE userID = ?`, [userId], (error, results) => {
                            if (error) {
                                console.error("Error deleting cart items:", error.message);
                            } else {
                                console.log("Cart items deleted successfully.");
                            }
                        });
                
                        response.statusCode = 200;
                        response.end(JSON.stringify({ success: true, message: 'All items bought and email sent successfully.' }));
                    } catch (error) {
                        console.error('Error in sending email:', error.message);
                        response.statusCode = 500;
                        response.end(JSON.stringify({ success: false, message: 'Failed to send order confirmation email.', error: error.message }));
                    }
                });
            });
        });
    }

    else {
        response.statusCode = 404;
        response.end('Not Found');
    }
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
