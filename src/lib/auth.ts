import { SignJWT, jwtVerify } from 'jose';

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    if (typeof window !== 'undefined') return new TextEncoder().encode('fallback-dev-key-not-for-production');
    throw new Error('SESSION_SECRET is not set in environment variables');
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: any, expiresIn: string = '12h') {
  const key = getKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const key = getKey();
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('JWT decryption failed:', error);
    throw new Error('Invalid session token.');
  }
}
