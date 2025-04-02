document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        const facultyID = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        const loginButton = document.querySelector(".login-button");
        loginButton.innerText = "Logging in...";
        loginButton.disabled = true;

        try {
            const response = await fetch("http://localhost:5000/faculty-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ facultyID, password }),
            });

            const result = await response.json();

            if (response.ok) {
                alert("Login successful! Redirecting...");
                window.location.href = result.redirect; // Redirect to faculty portal
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Error logging in. Please try again.");
        } finally {
            loginButton.innerText = "Login";
            loginButton.disabled = false;
        }
    });
});
