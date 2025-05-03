import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

interface JWTParams {
  clientId: string;
  userId: string;
}

const createJWT = ({ clientId, userId }: JWTParams): string => {
  try {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientId,
      sub: userId,
      aud: 'account-d.docusign.com',
      iat: now,
      exp: now + 3600,
      scope: 'signature impersonation',
    };

    console.log("JWT Payload:", payload);

    const jwtAssertion = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
    });

    console.log("Generated JWT:", jwtAssertion);
    return jwtAssertion;
  } catch (error: any) {
    console.error("Error creating JWT:", error.message);
    throw new Error('Error creating JWT');
  }
};

const getAccessToken = async ({ clientId, userId }: JWTParams): Promise<string> => {
  try {
    const jwtAssertion = createJWT({ clientId, userId });

    const params = new URLSearchParams();
    params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    params.append('assertion', jwtAssertion);

    const response = await axios.post(process.env.TOKEN_URL!, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    console.log("Access Token Response:", response.data);
    return response.data.access_token;
  } catch (error: any) {
    console.error("Error fetching access token:", error.response ? error.response.data : error.message);
    throw new Error('Error fetching access token');
  }
};

export { getAccessToken };
