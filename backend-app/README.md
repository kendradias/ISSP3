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
cd ISSP3
```

### 2. Install Dependencies

```bash
npm install mongoose express dotenv axios jsonwebtoken node-cron cors
npm install --save-dev @types/node @types/express @types/mongoose @types/nodemailer
```

Core dependencies:
- **mongoose**: MongoDB object modeling tool
- **express**: Web framework for Node.js
- **dotenv**: Loads environment variables from `.env` files

### 3. Configure Environment Variables and Private/Public keys

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual credentials:
- MongoDB connection details
- DocuSign integration keys
- API endpoints
- SMTP Credentials (Gmail address and app password; you must generate your own and add them to the `SMTP_USER` and `SMTP_PASS` fields - see `.env.example` file)

Copy the example Keys folder

```bash
cp -r Keys.example Keys
```

Add the public and private keys to the respective file.

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

In addition to the above, the script file testErrors.js can be run to demonstrate error handling within
the app. The following test cases are performed:
1. envelopeId, status, completedDateTime fields are not present
2. envelopeId, status, completedDateTime fields are empty
3. envelopeId, status, completedDateTime fields are not strings

Note that the above tests will only run successfully if the following code is present in notificationService, but should not be present in production.
```
   tls: {
         rejectUnauthorized: false, // Allow self-signed certificates
   },
```

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



# DocuSign Integarion
 ## Create APP
    -added new app under Apps & Keys 
    -saved `Integration key (Client ID)`
            `added Redirect URL (http://localhost:3000/callback)`
            `added RSA Key Pair (saved private locally locally in .env)`
            `API Account ID`
            `User ID`

## Set Up DocuSign Connect (Webhook)
    - In DocuSign Admin Dashboard --> Integration ---> Connnect - Added Configuration
         - URL- setup webhook endpoint "/webhook/docusign-webhook"
         - Checked Event Type -- Envelope Signed/Completed
         - Format: JSON
         - Inculde Documents
   - Used `Ngrok` to expose local server for webhook event testing  ("ngrok http 3000")

## ADD Environmental Variables (.env)
   PORT=3000
   MONGO_URI=mongoDb_connection_string
   PRIVATE_KEY_PATH = private_key_path

   INTEGRATION_KEY=your_client_id
   TOKEN_URL = 'https://account-d.docusign.com/oauth/token'
   DOCUSIGN_API_BASE = 'https://demo.docusign.net/restapi'
   DOCUSIGN_USER_ID=your_user_id
   REDIRECT_URI = 'http://localhost:3000/callback'
   ACCOUNT_ID=your_account_id



## Grant Consent for JWT Authentication (One-time Only)
 - visit the following link once in browser, it performs one-time authorization step required by docuSign to use JWT authentication flow, 
    `https://account-d.docusign.com/oauth/auth?
        response_type=code&
        scope=impersonation%20signature&
        client_id=INTEGRATION_KEY&
        redirect_uri=REDIRECT_URL`


## API endpoints used
   - DocuSign Webhook (Connect Event)
      POST `/webhook/docusign-webhook`

   - Get Completed Envelope from Date(Cron Job)
       GET `https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes?from_date={ISO_8601}&status=completed`
`

   - GET Envelope Form Data
        GET `https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}/form_data`

   - GET Download combined Document (PDF)
        GET `https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}/documents/combined`


   
    
# Testing API

To test the DocuSign API integration, we've created a test file in the test folder named api.test.js. This file tests various DocuSign API endpoints needed for our integration.

# Install Testing Dependencies

```bash
npm install --save-dev jest
npm install dotenv axios jsonwebtoken
```

# Update package.json

 "scripts": {
    "test": "jest",
    "test:api": "jest tests/api.test.js",
    "start": "node --loader ts-node/esm app.ts"
  },
  "jest": {
    "testEnvironment": "node",
    "testTimeout": 30000
  },

# Run the API Test

```bash
npm run test:api

```

