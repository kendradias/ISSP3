import axios from 'axios';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const privateKeyPath = process.env.PRIVATE_KEY_PATH!;
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// Define types for the JWT generation
interface JWTParams {
  clientId: string;
  userId: string;
}

// Generate JWT token
const createJWT = ({ clientId, userId }: JWTParams): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientId,
    sub: userId,
    aud: 'account-d.docusign.com',
    iat: now,
    exp: now + 3600, // 1 hour
    scope: 'signature impersonation',
  };

  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};

// Fetch Access Token using JWT
const getAccessToken = async ({ clientId, userId }: JWTParams): Promise<string> => {
  const jwtAssertion = createJWT({ clientId, userId });

  const params = new URLSearchParams();
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer'); // note: fixed 'grant-type' to 'grant_type'
  params.append('assertion', jwtAssertion);

  const response = await axios.post(process.env.TOKEN_URL!, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data.access_token;
};

export { getAccessToken };
