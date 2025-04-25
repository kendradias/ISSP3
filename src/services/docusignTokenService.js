const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const privateKey = fs.readFileSync(privateKeyPath);

const createJWT = ({ clientId, userId }) => {
    try {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
          iss: clientId,
          sub: userId,
          aud: 'account-d.docusign.com',
          iat: now,
          exp: now + 3600,  // Expires in 1 hour
          scope: 'signature impersonation'
        };
        const jwtAssertion = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
        return jwtAssertion;
      } catch (error) {
        console.error("Error creating JWT:", error.message);
        throw new Error('Error creating JWT');
      }
};

const getAccessToken = async ({ clientId, userId }) => {
    try {
        const jwtAssertion = createJWT({ clientId, userId });
    
        const params = new URLSearchParams();
        params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer'); 
        params.append('assertion', jwtAssertion);
    
        const response = await axios.post(process.env.TOKEN_URL, params, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
       
        // Return the access token
        return response.data.access_token;
      } catch (error) {
        console.error("Error fetching access token:", error.response ? error.response.data : error.message);
        throw new Error('Error fetching access token');
      }
};

module.exports = { getAccessToken };
