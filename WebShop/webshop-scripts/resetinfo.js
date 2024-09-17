document.getElementById("current-email-pass").onkeydown =
document.getElementById("current-password-pass").onkeydown =
document.getElementById("new-password-pass").onkeydown = function(event) {
    document.getElementById("password-error").innerHTML = "";
};

function showResetPasswordPage() {
    document.getElementById("reset-password").style.display = "block";
    document.getElementById("reset-username").style.display = "none";
}

function showResetUsernamePage() {
    document.getElementById("reset-username").style.display = "block";
    document.getElementById("reset-password").style.display = "none";
}

function resetPassword() {
    const emailInputElement = document.getElementById("current-email-pass");
    const currentPasswordInputElement = document.getElementById("current-password-pass");
    const newPasswordInputElement = document.getElementById("new-password-pass");

    const emailInput = emailInputElement.value;
    const currentPasswordInput = currentPasswordInputElement.value;
    const newPasswordInput = newPasswordInputElement.value;

    // Error
    const passwordErrorDisplay = document.getElementById("password-error");

    // Input Validation
    if (!emailInput || !currentPasswordInput || !newPasswordInput) {
        passwordErrorDisplay.innerHTML = "Please fill all three fields!";
        return;
    }
    if (newPasswordInput.length < 6) {
        passwordErrorDisplay.innerHTML = "Password must be at least 6 characters long.";
        return;
    }
    if (newPasswordInput.length > 33) {
        passwordErrorDisplay.innerHTML = "Password must be less than 34 characters long.";
        return;
    }

    axios.get('http://localhost:3000/change-password', {
        params: {
            email: emailInput,
            currentPassword: currentPasswordInput,
            newPassword: newPasswordInput
        }
    })
    .then(response => {
        alert("Password changed successfully!");
        window.location.href = '../index.html';
    })
    .catch(error => {
        passwordErrorDisplay.innerHTML = "Password change has failed!";
        console.error(error.response ? error.response.data : error.message);
    });
}

function resetUsernameUser() {
    const emailInputElement = document.getElementById("current-email-user");
    const currentPasswordInputElement = document.getElementById("current-password-user");
    const newUsernameInputElement = document.getElementById("new-username-user");

    const emailInput = emailInputElement.value;
    const currentPasswordInput = currentPasswordInputElement.value;
    const newUsernameInput = newUsernameInputElement.value;

    const usernameErrorDisplay = document.getElementById("username-error");

    // Check if any of the fields are empty
    if (!emailInput || !currentPasswordInput || !newUsernameInput) {
        usernameErrorDisplay.innerHTML = "Please fill all three fields!";
        return;
    }

    // Validate the new username
    if (newUsernameInput.length < 4) {
        usernameErrorDisplay.innerHTML = "Username must be at least 4 characters long.";
        return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsernameInput)) {
        usernameErrorDisplay.innerHTML = "Username can only contain letters, numbers, and underscores.";
        return;
    }
    if (newUsernameInput.includes(" ")) {
        usernameErrorDisplay.innerHTML = "Username cannot contain spaces.";
        return;
    }

    // Proceed with the API call if validation passes
    axios.get('http://localhost:3000/change-username', {
        params: {
            email: emailInput,
            currentPassword: currentPasswordInput,
            newUsername: newUsernameInput
        }
    })
    .then(response => {
         alert("Username changed successfully!");
        window.location.href = '../index.html';
    })
    .catch(error => {
        if (error.response && error.response.status === 400) {
            usernameErrorDisplay.innerHTML = "Username already exists. Please choose a different one.";
        } else {
            usernameErrorDisplay.innerHTML = "Username change has failed, please retry!";
        }
        console.error(error.response ? error.response.data : error.message);
    });
}
