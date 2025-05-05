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
- SMTP Credentials (gmail address app and password, you must generate your own and add them to the USER and PASSWORD feilds - see env.example file)

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
│   ├── app.ts             # # Application entry point
└── .env                   # Environment variables (not in git)
```

## Running the Application

Start the server/application:
npm start

## Testing
To test the notification service and db connection:
npx ts-node scripts/testNotification.ts 



