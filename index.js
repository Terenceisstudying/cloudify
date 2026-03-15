/**
 * Root Entry Point for Vercel
 * 
 * This file satisfies Vercel's search for a Node.js entrypoint (index.js, server.js, etc.)
 * since this project has a package.json at the root.
 * 
 * Actual routing is handled by vercel.json rewrites.
 */

export default function handler(req, res) {
    // Use raw Node.js headers for redirection to avoid crashing without Express
    res.writeHead(301, { Location: '/index.html' });
    res.end();
}
