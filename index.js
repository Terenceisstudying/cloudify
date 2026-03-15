/**
 * Minimal root entrypoint to satisfy Vercel's build detection.
 * This project uses serverless functions in the /api directory.
 * 
 * NOTE: We import 'express' here to satisfy Vercel's legacy detection which
 * expects to find an express import if it's in package.json.
 * The static frontend is served by vercel.json rewrites.
 */
import express from 'express';
const app = express();
export default app;
