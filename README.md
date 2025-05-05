# DocuSign Data Transfer - Setup Guide

This project automates data transfer from DocuSign web forms to a MongoDB database, then forwards the data to an external API.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- MongoDB Atlas account (or other MongoDB deployment)
- Gmail email address (for SMTP/nodemailer)
- DocuSign Developer account

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/kendradias/ISSP3.git
cd docusign-data-transfer
```

### 2. Install Dependencies

```bash
npm install mongoose express dotenv
npm install --save-dev @types/node @types/express @types/mongoose @types/nodemailer
```

Core dependencies:
- **mongoose**: MongoDB object modeling tool
- **express**: Web framework for Node.js
- **dotenv**: Loads environment variables from `.env` files

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual credentials:
- MongoDB connection details
- DocuSign integration keys
- API endpoints
- SMTP Credentials (Gmail address and app password; you must generate your own and add them to the `SMTP_USER` and `SMTP_PASS` fields - see `.env.example` file)

### 4. MongoDB Connection

The project is configured to connect to MongoDB using the credentials provided in your `.env` file. Make sure you have:

1. Created a MongoDB Atlas cluster (or set up another MongoDB deployment)
2. Created a database user with appropriate permissions
3. Whitelisted your IP address in the MongoDB Atlas security settings
4. Added the correct connection string, username, and password to your `.env` file

---

## Testing the Notification Service

The notification service is responsible for sending error notifications to the tech support email address configured in your `.env` file. Follow these steps to test the setup:

### 1. Verify SMTP Configuration

Ensure the following environment variables are correctly set in your `.env` file:

```plaintext
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
TECH_SUPPORT_EMAIL=techsupport@example.com
```

- Replace `your-email@gmail.com` with your Gmail address.
- Replace `your-app-password` with the app password generated for your Gmail account.
- Replace `customersupport@example` with the company support email address 
- Replace `techsupport@example.com` with the email address where error notifications should be sent.

### 2. Test the Notification Service
visit /test-error and/or /test-envelope-error routes in your browser to test error notifications

ex. `http://localhost:3000/test-envelope-error` || `http://localhost:3000/test-error`

This script will simulate an error and send a test email to the tech support email address. Check the inbox of the `TECH_SUPPORT_EMAIL` to verify that the email was received.

### 3. Expected Output

- **Console Output**:
  You should see a message in the console indicating that the email was sent successfully:
  ```plaintext
  Error notification sent to tech support: techsupport@example.com
  ```

- **Email Content**:
  The email should contain details about the simulated error, including:
  - Error message
  - Stack trace
  - Timestamp
  - Environment (e.g., development, production)

---

## Project Structure

```
docusign-data-transfer/
├── src/
│   ├── config/
│   │   ├── database.ts    # MongoDB connection logic
│   │   └── docusign.ts    # DocuSign configuration
│   ├── app.ts             # Application entry point
│   ├── services/
│   │   └── notificationService.ts # Notification service logic
│   ├── utils/
│   │   └── errorHandler.ts # Global error handling middleware
├── scripts/
│   └── testNotification.ts # Script to test the notification service
└── .env                   # Environment variables (not in git)
```

---

## Running the Application

Start the server/application:

```bash
npm start
```

---

## Testing


