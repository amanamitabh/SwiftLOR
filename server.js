require("dotenv").config(); // Load environment variables

const express = require("express");
const { Pool } = require("pg"); // PostgreSQL Client
const bcrypt = require("bcrypt"); // For password hashing
const cors = require("cors"); // Handle CORS issues
const path = require("path");

const app = express();
const PORT = 5000;
const PUBLIC_DIR = path.join(__dirname, "public");

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


// ✅ **Start the Server**
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
