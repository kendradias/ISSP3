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
- **dotenv**: Loads environment variables from .env files

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file with your actual credentials:
- MongoDB connection details
- DocuSign integration keys
- API endpoints
- SMTP Credentials (gmail address app and password)

### 4. MongoDB Connection

The project is configured to connect to MongoDB using the credentials provided in your `.env` file. Make sure you have:

1. Created a MongoDB Atlas cluster (or set up another MongoDB deployment)
2. Created a database user with appropriate permissions
3. Whitelisted your IP address in the MongoDB Atlas security settings
4. Added the correct connection string, username, and password to your `.env` file

## Project Structure

```
docusign-data-transfer/
├── src/
│   ├── config/
│   │   ├── database.ts    # MongoDB connection logic
│   │   └── docusign.ts    # DocuSign configuration
│   ├── app.ts             # Express application setup
│   └── server.ts          # Application entry point
└── .env                   # Environment variables (not in git)
```

## Running the Application

Start the server/application:
npm start

## Testing
To test the notification service and db connection:
npx ts-node scripts/testNotification.ts 




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


   
    




