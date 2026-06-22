import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error('SESSION_SECRET is not set in environment variables');
}
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any, expiresIn: string = '12h') {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This can happen if the token is expired or malformed
    console.error('JWT decryption failed:', error);
    throw new Error('Invalid session token.');
  }
}
