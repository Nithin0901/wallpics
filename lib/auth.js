/**
 * lib/auth.js
 * JWT sign/verify helpers using 'jose' (works on both Node.js and Edge runtimes).
 */
import { SignJWT, jwtVerify } from 'jose';

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

/**
 * Signs a JWT token with 7-day expiry.
 * @param {Object} payload - Data to encode (id, email, role, username)
 * @returns {Promise<string>} Signed JWT string
 */
export async function signToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

/**
 * Verifies a JWT and returns the decoded payload.
 * @param {string} token
 * @returns {Promise<Object>} Decoded payload
 */
export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, getSecret());
  return payload;
}

/**
 * Extracts and verifies a Bearer token from a Next.js Request object.
 * Returns null if missing or invalid.
 * @param {Request} request
 * @returns {Promise<Object|null>} Decoded payload or null
 */
export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Role hierarchy check — returns true if userRole meets the required minimum.
 * @param {string} userRole
 * @param {string[]} allowedRoles
 */
export function hasRole(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}
