// Toggle Password Visibility
function togglePassword() {
    let passwordField = document.getElementById("password");
    passwordField.type = passwordField.type === "password" ? "text" : "password";
}

// Login Validation
document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let loginButton = document.querySelector(".login-button");

    loginButton.innerText = "Logging in...";
    loginButton.disabled = true;

    try {
        let response = await fetch("http://localhost:5000/student/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        let data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = data.redirect; // Redirect to student dashboard
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong. Please try again.");
    } finally {
        loginButton.innerText = "Login";
        loginButton.disabled = false;
    }
});
