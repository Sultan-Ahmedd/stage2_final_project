document.getElementById('searchButton').addEventListener('click', function() {
    const query = document.getElementById('searchQuery').value;

    axios.get(`http://localhost:3000/search?query=${encodeURIComponent(query)}`)
        .then(response => {
            const resultsContainer = document.getElementById('searchResults');
            resultsContainer.innerHTML = '';  // Clear previous results

            if (response.data.success && response.data.results.length > 0) {
                response.data.results.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.classList.add('gameID-' + item.id);

                    itemElement.innerHTML = `
                        <h1>${item.itemName}</h1>
                        <img src="${item.ImagePath}" alt="${item.itemName} : GAME ID: ${item.id}" />
                        <p>Price: $${item.Price}</p>
                        <button onclick="viewPage(${item.id}, '${item.category}')">View</button>
                        <button onclick="addItemToCart(${item.id}, '${item.category}')">Add to cart</button>
                    `;

                    resultsContainer.appendChild(itemElement);
                });
            } else {
                resultsContainer.innerHTML = '<p>No results found.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching search results:', error);
        });
});