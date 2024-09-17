function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Error display
    const errorDisplay = document.getElementById("loginpage-error");

    // Clear error message
    errorDisplay.innerHTML = "";

    // Validate inputs
    if (!username || !password) {
        errorDisplay.innerHTML = "Username and password are required.";
        return;
    }

    axios.get('http://localhost:3000/login', {
        params: {
            username: username,
            password: password
        }
    })
    .then(response => {
        if (response.data.success) {
            sessionStorage.setItem('userID', response.data.userID);
            // Redirect or perform further actions here
            window.location.href = '/WebShop/mainpage.html'; // Redirect to the main page
        } else {
            errorDisplay.innerHTML = "Invalid credentials.";
        }
    })
    .catch(error => {
        console.error("There was an error logging in!", error);
        errorDisplay.innerHTML = "There was an error logging in.";
    });
}
function userRegistrationPage() {
    window.location.href = '/WebShop/registration.html';
}