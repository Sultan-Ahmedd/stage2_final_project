function register() {
    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Error display
    const errorDisplayRegistration = document.getElementById("registration-error");

    // Clear error message
    const usernameInp = document.getElementById("username");
    const emailInp = document.getElementById("email");
    const passwordInp = document.getElementById("password");

    // Clear error message on keydown for each input field
    usernameInp.onkeydown = emailInp.onkeydown = passwordInp.onkeydown = function(event) {
        errorDisplayRegistration.innerHTML = "";
    };

    // Validation
    if (username.length < 4) {
        errorDisplayRegistration.innerHTML = "Username must be at least 4 characters long.";
        return;
    } 
    else if (!email.includes("@")) { 
        errorDisplayRegistration.innerHTML = "Invalid email address.";
        return;
    }
    else if (password.length < 6) {
        errorDisplayRegistration.innerHTML = "Password must be at least 6 characters long.";
        return;
    }
    else if (password.length > 33) {
        errorDisplayRegistration.innerHTML = "Password must be less than 34 characters long.";
        return;
    }
    else if (username.includes(" ")) {
        errorDisplayRegistration.innerHTML = "Username cannot contain spaces.";
        return;
    }
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errorDisplayRegistration.innerHTML = "Username can only contain letters, numbers, and underscores.";
        return;
    } 
    else if (username === "" || password === "" || email === "") {
        errorDisplayRegistration.innerHTML = "Please fill in all fields.";
        return;
    }

    // Proceed with registration if validation passes
    axios.get('http://localhost:3000/register', {
        params: {
            username: username,
            email: email,
            password: password
        }
    })
    .then(response => {
        console.log(response.data);
        window.location.href = '../index.html';
    })
    .catch(error => {
        if (error.response && error.response.data) {
            errorDisplayRegistration.innerHTML = error.response.data;
        } else {
            errorDisplayRegistration.innerHTML = "Registration failed. Please try again.";
        }
        console.error(error.response ? error.response.data : error.message);
    });
}
