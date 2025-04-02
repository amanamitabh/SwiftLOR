document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("signupForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent default form submission

        const username = document.getElementById("username").value; // ✅ Get username
        const registrationNumber = document.getElementById("regNo").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const formData = { username, registrationNumber, email, password }; // ✅ Fixed issue

        try {
            const response = await fetch("http://localhost:5000/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok) {
                window.location.href = "/loginstud.html"; // Redirect after successful signup
            }
        } catch (error) {
            console.error("Signup error:", error);
            alert("Error signing up. Please try again.");
        }
    });
});
