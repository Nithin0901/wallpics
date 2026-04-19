/**
 * lib/db.js
 * Singleton Mongoose connection. Reads MONGODB_URI inside the function
 * (not at module-load time) so that env reloads take effect.
 */
import mongoose from 'mongoose';

// Cache connection across hot-module reloads in development.
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Read URI fresh every call so .env.local reloads are respected
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Add it to your .env.local file.'
    );
  }

  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection promise if none exists
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, { bufferCommands: false })
      .then((m) => {
        console.log('✅ MongoDB connected');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Clear the promise so the next request triggers a fresh attempt
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

export default connectDB;
