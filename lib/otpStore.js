/**
 * lib/otpStore.js
 * In-memory OTP store with 10-minute TTL.
 * Works in Next.js dev (single Node process).
 * For production, replace with a Redis-backed store.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Module-level Map — persists across requests in the same process
const store = new Map();

/**
 * Save (or overwrite) an OTP for a given email.
 * @param {string} email
 * @param {string} otp  6-digit string
 */
export function saveOtp(email, otp) {
  store.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
}

/**
 * Verify an OTP for a given email.
 * Returns true if valid, false if wrong code or expired.
 * Deletes the entry on successful verification (one-time use).
 * @param {string} email
 * @param {string} otp
 * @returns {boolean}
 */
export function verifyOtp(email, otp) {
  const entry = store.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    return false;
  }
  if (entry.otp !== otp) return false;
  store.delete(email.toLowerCase()); // one-time use
  return true;
}
