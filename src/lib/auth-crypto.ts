import crypto from "node:crypto";

/**
 * Hash password using standard crypto.scrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verify a plain text password against a stored salt:hash string
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const [salt, key] = storedHash.split(":");
      if (!salt || !key) return resolve(false);

      crypto.scrypt(password, salt, 64, (err, derivedKey) => {
        if (err) return resolve(false);
        const keyBuffer = Buffer.from(key, "hex");
        const match = crypto.timingSafeEqual(derivedKey, keyBuffer);
        resolve(match);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Sign session data with HMAC
 */
const SESSION_SECRET = process.env.SESSION_SECRET || "kialna-super-secret-key-2026";

export function signToken(payload: string): string {
  const hmac = crypto.createHmac("sha256", SESSION_SECRET);
  hmac.update(payload);
  const signature = hmac.digest("hex");
  return `${payload}.${signature}`;
}

export function verifyToken(signedToken: string): string | null {
  try {
    const parts = signedToken.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;

    const hmac = crypto.createHmac("sha256", SESSION_SECRET);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (expectedBuffer.length !== signatureBuffer.length) return null;
    if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

    return payload;
  } catch {
    return null;
  }
}
