require("dotenv").config(); // Load environment variables

const express = require("express");
const PDFDocument = require("pdfkit");
const { Pool } = require("pg"); // PostgreSQL Client
const bcrypt = require("bcrypt"); // For password hashing
const cors = require("cors"); // Handle CORS issues
const path = require("path");
const nodemailer = require('nodemailer');
const multer = require("multer");

const app = express();
const PORT = 5000;
const PUBLIC_DIR = path.join(__dirname, "public");

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static("public"));

// OR manually define a route for the favicon
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// PostgreSQL Connection Pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false, // Required for Render-hosted PostgreSQL
    },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

// ✅ **Signup Route**
app.post("/signup", async (req, res) => {
    try {
        const { name, registrationNumber, email, password } = req.body; // `name` is the username

        if (!name || !registrationNumber || !email || !password) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // ✅ Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert into the database
        const query = `
            INSERT INTO users (username, email, password, registration_number) 
            VALUES ($1, $2, $3, $4) RETURNING id, username, email, registration_number;
        `;
        const values = [name, email, hashedPassword, registrationNumber];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: "User registered successfully!",
            user: result.rows[0],
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server error, could not register user" });
    }
});

// ✅ **Student Login Route**
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required!" });
        }

        // ✅ Fetch user from the database
        const userQuery = "SELECT * FROM users WHERE email = $1";
        const userResult = await pool.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = userResult.rows[0];

        // ✅ Compare hashed passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful!", user: { id: user.id, username: user.username, email: user.email } });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error, could not log in" });
    }
});

// ✅ **Faculty Login Route (Direct Comparison, No Hashing)**
app.post("/faculty-login", async (req, res) => {
    try {
        const { facultyID, password } = req.body;

        if (!facultyID || !password) {
            return res.status(400).json({ message: "Faculty ID and password are required!" });
        }

        // ✅ Fetch faculty credentials from database
        const result = await pool.query("SELECT password FROM faculty WHERE faculty_id = $1", [facultyID]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const storedPassword = result.rows[0].password;

        if (password !== storedPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        res.json({ success: true, redirect: "/facportal.html" });
    } catch (error) {
        console.error("Faculty login error:", error);
        res.status(500).json({ message: "Server error, could not log in" });
    }
});


// ✅ Student Login Route
app.post("/student/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required!" });
        }

        // ✅ Fetch student from the database
        const query = "SELECT * FROM users WHERE username = $1";
        const result = await pool.query(query, [username]);

        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password!" });
        }

        const user = result.rows[0];

        // ✅ Compare hashed passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password!" });
        }

        res.status(200).json({ success: true, message: "Login successful!", redirect: "/studentportal.html" });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error, could not log in" });
    }
});


app.post("/submit-form", async (req, res) => {
    const client = await pool.connect(); // Start a database transaction
    try {
        const { registrationNumber, name, examScore, facultyName, facultyID, facultyEmail, date, universities } = req.body;

        // Ensure examScore is an integer
        const parsedExamScore = parseInt(examScore);
        if (isNaN(parsedExamScore)) {
            return res.status(400).json({ message: "Invalid exam score. Must be a number." });
        }

        // Ensure date is in the correct format (Convert "dd/mm/yyyy" to "yyyy-mm-dd")
        const formattedDate = date.split("/").reverse().join("-");

        await client.query("BEGIN"); // Start transaction

        // ✅ Insert into the `submissions` table
        const submissionQuery = `
            INSERT INTO submissions (registration_number, name, exam_score, faculty_name, faculty_id, faculty_email, date, universities) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id;
        `;
        const submissionValues = [registrationNumber, name, parsedExamScore, facultyName, facultyID, facultyEmail, formattedDate, universities];
        const submissionResult = await client.query(submissionQuery, submissionValues);
        const submissionId = submissionResult.rows[0].id;

        console.log("✅ Submission stored in DB with ID:", submissionId);

        // ✅ Insert into the `documents` table with `file_data = NULL`
        const documentQuery = `
            INSERT INTO documents (registration_number, faculty_id, file_data) 
            VALUES ($1, $2, NULL);
        `;
        await client.query(documentQuery, [registrationNumber, facultyID]);

        console.log("✅ Document entry created with NULL file_data");

        await client.query("COMMIT"); // Commit transaction

        // ✅ Send Email after successful DB storage
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: facultyEmail,
            subject: "New Student Request for LOR",
            text: `Dear ${facultyName},

A student has requested an LOR.

📌 **Student Details**:
- **Name**: ${name}
- **Registration Number**: ${registrationNumber}
- **Exam Score**: ${examScore}

📌 **Universities Applied**:
${universities.join(", ") || "Not specified"}

📅 **Date of Request**: ${date}

Please review the request at your earliest convenience.

Best Regards,
SwiftLOR System
`
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent to:", facultyEmail);

        // ✅ Respond with success
        res.status(200).json({ message: "Form submitted, email sent, and document record created!", submissionId });

    } catch (error) {
        await client.query("ROLLBACK"); // Rollback in case of error
        console.error("❌ Error:", error);
        res.status(500).json({ message: "Server error: Could not process request." });
    } finally {
        client.release(); // Release the client back to the pool
    }
});


app.get("/check-document/:registrationNumber", async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        // Query the documents table
        const query = `
            SELECT 1 FROM documents 
            WHERE registration_number = $1 AND file_data IS NULL;
        `;
        const result = await pool.query(query, [registrationNumber]);

        if (result.rowCount > 0) {
            res.status(200).json({ exists: true });
        } else {
            res.status(404).json({ exists: false });
        }
    } catch (error) {
        console.error("❌ Error checking document:", error);
        res.status(500).json({ message: "Server error" });
    }
});


app.get("/download-lor/:registrationNumber", async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        // Query the database to check if the LOR exists
        const query = `SELECT file_data FROM documents WHERE registration_number = $1 AND file_data IS NOT NULL;`;
        const result = await pool.query(query, [registrationNumber]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "❌ LOR not found or not yet uploaded." });
        }

        const pdfBuffer = result.rows[0].file_data;

        // Set headers for PDF download
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="LOR_${registrationNumber}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("❌ Error fetching LOR:", error);
        res.status(500).json({ message: "Server error: Could not fetch LOR." });
    }
});


app.post("/upload-pdf", upload.single("pdfFile"), async (req, res) => {
    try {
        const { registrationNumber } = req.body;
        const fileBuffer = req.file?.buffer; // Get uploaded file as buffer

        if (!registrationNumber || !fileBuffer) {
            return res.status(400).json({ message: "Missing registration number or file." });
        }

        // Update the documents table
        const query = `
            UPDATE documents
            SET file_data = $1
            WHERE registration_number = $2
            RETURNING *;
        `;
        const values = [fileBuffer, registrationNumber];

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No matching registration number found." });
        }

        res.status(200).json({ message: "PDF uploaded successfully!" });

    } catch (error) {
        console.error("❌ Error uploading PDF:", error);
        res.status(500).json({ message: "Server error: Could not upload PDF." });
    }
});

app.get("/view-submission/:registrationNumber", async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        // Corrected SQL query
        const query = `SELECT name, exam_score, faculty_name, faculty_email, date, universities FROM submissions WHERE registration_number = $1;`;
        const result = await pool.query(query, [registrationNumber]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "❌ No submission found for this registration number." });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("❌ Error fetching submission:", error);
        res.status(500).json({ message: "Server error: Could not fetch submission." });
    }
});


app.post("/generate-lor", async (req, res) => {
    const { registrationNumber } = req.body;

    if (!registrationNumber) {
        return res.status(400).json({ message: "Missing registration number." });
    }

    try {
        // Fetch student data
        const query = `
            SELECT name, exam_score, faculty_name, faculty_id, faculty_email, date, universities 
            FROM submissions 
            WHERE registration_number = $1;
        `;
        const result = await pool.query(query, [registrationNumber]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Student submission not found." });
        }

        const student = result.rows[0];

        // Create a new PDF document
        const doc = new PDFDocument();
        let buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", async function () {
            const pdfBuffer = Buffer.concat(buffers);

            // Store PDF in the database
            const updateQuery = `
                UPDATE documents 
                SET file_data = $1 
                WHERE registration_number = $2;
            `;
            await pool.query(updateQuery, [pdfBuffer, registrationNumber]);

            res.status(200).json({ message: "LOR generated and saved successfully!" });
        });

        // Start writing content to the PDF
        doc.fontSize(16).text("Letter of Recommendation", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`To Whom It May Concern,`);
        doc.moveDown();
        doc.text(
            `I am pleased to write this letter of recommendation for ${student.name}, ` +
            `who has applied to the following universities: ${student.universities.join(", ")}. ` +
            `I have had the opportunity to observe their academic growth and intellectual curiosity firsthand.` +
            `They actively participated in discussions and contributed valuable insights, which showcased a deep understanding of the subject matter.` +
            `What truly sets ${student.name} apart is their leadership, teamwork, creativity, perseverance, extracurricular activities, projects, and research work .` +
            `Based on my interactions with the student, I can confidently recommend them.` +
            `Please feel free to contact me should you require any further information.`
        );
        doc.moveDown();
        doc.text(`Exam Score: ${student.exam_score}`);
        doc.moveDown();
        doc.text(`Best regards,`);
        doc.text(`${student.faculty_name}`);
        doc.text(`Email: ${student.faculty_email}`);
        doc.end(); // Finalize the document

    } catch (error) {
        console.error("❌ Error generating LOR:", error);
        res.status(500).json({ message: "Server error: Could not generate LOR." });
    }
});


// ✅ **Start the Server**
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
