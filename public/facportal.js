document.addEventListener("DOMContentLoaded", function () {
    const regNoInput = document.getElementById("regNoInput");
    const generateLORButton = document.getElementById("generateLOR");
    const customLORButton = document.getElementById("customLOR");
    const errorMessage = document.createElement("p"); // Error message element
    errorMessage.style.color = "red";
    errorMessage.style.marginTop = "10px";
    document.querySelector(".search-section").appendChild(errorMessage); // Append below search bar

    // Function to check document existence
    async function checkDocument(registrationNumber) {
        if (registrationNumber.trim() === "") {
            generateLORButton.disabled = true;
            customLORButton.disabled = true;
            errorMessage.textContent = ""; // Clear error message
            return;
        }

        try {
            const response = await fetch(`/check-document/${registrationNumber}`);
            const data = await response.json();

            if (data.exists) {
                generateLORButton.disabled = false;
                customLORButton.disabled = false;
                errorMessage.textContent = ""; // Clear error if valid
            } else {
                generateLORButton.disabled = true;
                customLORButton.disabled = true;
                errorMessage.textContent = "❌ Registration number not found or document already uploaded.";
            }
        } catch (error) {
            console.error("Error fetching document status:", error);
            errorMessage.textContent = "❌ Server error. Please try again.";
        }
    }

    // Listen for input changes in the registration number field
    regNoInput.addEventListener("input", () => {
        const registrationNumber = regNoInput.value.trim();
        checkDocument(registrationNumber);
    });

    // Handle PDF generation for "Generate Standard LOR Template"
    generateLORButton.addEventListener("click", async function () {
        const registrationNumber = regNoInput.value.trim();

        if (!registrationNumber) {
            alert("Please enter a registration number.");
            return;
        }

        try {
            const response = await fetch("/generate-lor", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ registrationNumber })
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok) {
                generateLORButton.disabled = true; // Disable after successful generation
                checkDocument(registrationNumber); // Refresh button status
            }
        } catch (error) {
            console.error("❌ Error generating LOR:", error);
            alert("Error generating LOR. Please try again.");
        }
    });

    // Handle PDF upload for "Give Your Own Recommendation"
    customLORButton.addEventListener("click", async function () {
        const registrationNumber = regNoInput.value.trim();

        if (!registrationNumber) {
            alert("Please enter a registration number.");
            return;
        }

        // Create a file input dynamically
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "application/pdf";

        fileInput.addEventListener("change", async function () {
            const file = fileInput.files[0];

            if (!file) {
                alert("No file selected.");
                return;
            }

            const formData = new FormData();
            formData.append("pdfFile", file);
            formData.append("registrationNumber", registrationNumber);

            try {
                const response = await fetch("/upload-pdf", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                alert(result.message);

                if (response.ok) {
                    customLORButton.disabled = true; // Disable after successful upload
                    checkDocument(registrationNumber); // Refresh button status
                }
            } catch (error) {
                console.error("❌ Error uploading PDF:", error);
                alert("Error uploading PDF. Please try again.");
            }
        });

        // Trigger the file input
        fileInput.click();
    });
});
