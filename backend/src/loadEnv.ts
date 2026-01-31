import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load .env before any other app code so process.env is set when auth.service etc. load
const fromCwd = path.resolve(process.cwd(), '.env');
const fromFile = path.resolve(__dirname, '..', '.env');
const envPath = fs.existsSync(fromCwd) ? fromCwd : fromFile;
dotenv.config({ path: envPath });
