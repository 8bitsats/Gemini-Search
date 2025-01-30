import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

export function setupEnvironment() {
  // In production, don't require .env file if env vars are set
  if (process.env.NODE_ENV === 'production') {
    const missingVars = [];
    
    if (!process.env.GOOGLE_API_KEY) missingVars.push('GOOGLE_API_KEY');
    if (!process.env.BIRDEYE_API_KEY) missingVars.push('BIRDEYE_API_KEY');
    if (!process.env.HELIUS_API_KEY) missingVars.push('HELIUS_API_KEY');
    
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }
  } else {
    // In development, load from .env file
    const result = dotenv.config({ path: envPath });
    if (result.error) {
      throw new Error(
        `Failed to load .env file from ${envPath}: ${result.error.message}`
      );
    }
  }

  return {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3003,
  };
}
