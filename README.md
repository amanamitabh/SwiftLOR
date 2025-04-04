## SwiftLOR<br>
A digital platform designed to streamline the requisition and approval process for Letters of Recommendation (LORs), ensuring a faster, more efficient, and hassle-free experience for students requesting recommendations and faculty managing approvals.


## 🚀 Features

✅ Student Portal

🔹 Seamless LOR Requests: Students can log in and effortlessly submit a request for a Letter of Recommendation (LOR).<br>
🔹 Automated Faculty Notification: Once a request is submitted, the assigned faculty is instantly notified via email.<br>
🔹 Quick & Easy Downloads: After approval, students can download their LOR as a professionally formatted PDF.<br>

✅ Faculty Portal

🔹 Effortless Request Management: Faculty members can log in to view and manage pending LOR requests.<br>
🔹 Flexible LOR Creation: Choose between writing a personalized LOR or generating one automatically.<br>
🔹 Real-Time Updates: Once submitted, the approved LOR is securely stored in the system for student access.<br>


## 🛠️ Tech Stack

|  Component	  |  Technology Used          |
|---------------|---------------------------|
|   Frontend    | HTML, CSS, JavaScript     |
|  Backend	    | Node.js,Express.js        |
|  Database	    | PostgreSQL                |
| PDF Generation| pdfkit                    |


## 🚀 Prerequisites

Before running the project, make sure you have the following installed:

✅ Node.js (Download and install)  
✅ npm (Comes with Node.js)

To check if Node.js and npm are installed, run the following commands in the terminal:  
  
`node -v ` 
`npm -v ` 

If they return version numbers, you're good to go!  


## 📂 Project Setup & Running the Environment:  

### 1️⃣ Clone the Repository

Get started by cloning the repository and navigating into the project directory:

`git clone https://github.com/your-username/SwiftLOR.git `<br>
`cd SwiftLOR`  

 ### 2️⃣ Install Dependencies
 
Inside the project folder, install the required Node.js packages: 
`npm install` 

 ### 3️⃣ Configure Environment Variables

 Create a .env file in the project root and add the required environment variables:
```
DATABASE_URL=your_database_connection_string
EMAIL_USER=your_email_id
EMAIL_PASS=your_email_app_password
```

The App Password can be generated on your account only after two-factor authentication (2FA) is enabled.

 ### 3️⃣ Start the Server 
 
Run the following command to start the Node.js server:  
`npm start`  

or for development mode (auto-restarts on changes):  
`npm run dev`  

Once running, open your browser and go to:  
http://localhost:5000/<br>


## 📜 Important Commands

| Command          | Description                                  |
|-----------------|----------------------------------------------|
| `npm install`   | Install all dependencies                   |
| `npm start`     | Start the server                           |
| `npm run dev`   | Start the server in development mode (auto-restarts) |
| `node server.js` | Run the server manually                   |


Whether you're a faculty member crafting recommendations or a student requesting an LOR, SwiftLOR streamlines the workflow, making the entire process faster and more organized.

Get started today and experience the future of effortless LOR management! 🚀

## 📞 Contact
For queries and suggestions, reach out to us at swiftlormailer@gmail.com.

💙 Made with love for students & faculty! 
