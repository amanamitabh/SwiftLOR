document.addEventListener("DOMContentLoaded", function () {
    function createDots() {
        const animatedBg = document.querySelector(".animated-bg");
        for (let i = 0; i < 20; i++) {
            let dot = document.createElement("div");
            dot.classList.add("dot");

            // Random starting position
            dot.style.left = Math.random() * 100 + "vw"; // Random X position
            dot.style.top = Math.random() * 100 + "vh";  // Random Y position

            // Random animation properties
            dot.style.animationDuration = (Math.random() * 5 + 5) + "s";
            dot.style.animationDelay = Math.random() * 5 + "s";

            animatedBg.appendChild(dot);
        }
    }
    createDots();

    // Input field styling on focus/blur
    const inputs = document.querySelectorAll("input");
    inputs.forEach(input => {
        input.addEventListener("focus", () => input.style.backgroundColor = "#F3E8FF");
        input.addEventListener("blur", () => input.style.backgroundColor = "#CDC2D6");
    });

    // Form submission logic
    const submitBtn = document.querySelector(".submit-btn");

    submitBtn.addEventListener("click", async function (event) {
        event.preventDefault(); // Prevent default form behavior

        const formData = {
            registrationNumber: document.querySelector("input[placeholder='EX:23BCT0172']").value,
            name: document.querySelector("input[placeholder='Enter your name']").value,
            examScore: document.querySelector("input[placeholder='Enter your exam score']").value,
            facultyName: document.querySelector("input[placeholder='Enter faculty name']").value,
            facultyID: document.querySelector("input[placeholder='Enter faculty ID']").value,
            facultyEmail: document.querySelector("input[placeholder='Enter faculty email']").value,
            date: document.querySelector("input[placeholder='dd/mm/yyyy']").value,
            universities: Array.from(document.querySelectorAll("input[placeholder='Enter university name']"))
                               .map(input => input.value)
                               .filter(value => value !== "")
        };

        // ✅ Check if required fields are empty
        if (!formData.registrationNumber || !formData.name || !formData.examScore || !formData.facultyEmail) {
            alert("⚠️ Please fill in all required fields.");
            return;
        }

        try {
            let response = await fetch("http://localhost:5000/submit-form", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            let data = await response.json();

            if (response.ok) {
                console.log("Server Response:", data);

                // ✅ Store a success flag in sessionStorage
                sessionStorage.setItem("formSubmitted", "true");

                // ✅ Redirect to studentportal.html
                window.location.href = "/studentportal.html";
            } else {
                alert("❌ Error submitting form: " + data.message);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("❌ There was an error submitting the form.");
        }
    });
});
