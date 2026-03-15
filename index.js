/**
 * This file satisfies Vercel's legacy detection for Node.js projects.
 * The actual routing for the root is handled by vercel.json rewrites.
 */
export default (req, res) => {
    // This handler satisfies the "entrypoint" requirement.
    // vercel.json rewrites should prioritize /public/index.html.
    res.status(200).send("SCS Risk Assessment API entrypoint active");
};
