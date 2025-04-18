const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

const privateKey = fs.readFileSync('../Keys/private.key');

const createJWT = ({clientId, userId}) =>{
    const now = Math.floor(Date.now()/1000);
    const payload = {
        iss: clientId,
        sub: userId,
        aud: 'account-d.docusign.com',
        iat: now,
        exp: now + 3600, //1hour
        scope: 'signature impersonation'
    };
    return jwt.sign(payload, privateKey, {algorithm: 'RS256'})
};


const getAccessToken = async({clientId, userId})=>{
    const jwtAssertion = createJWT({clientId, userId});

    const params = newSearchParams();
    params.append('grant-type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwtAssertion)

    const response = await axios.post(process.env.TOKEN_URL, params, {
        headers: {'Content-Type' : 'application/x-www-form-urlencoded'},
    });

    return response.data.access_token;
}


module.exports = { getAccessToken}