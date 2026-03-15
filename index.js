/**
 * Root entrypoint for Vercel deployment.
 * This file satisfies Vercel's build requirement for a main entry point.
 * The actual application logic is distributed across serverless functions in the /api directory.
 */

export default function handler(req, res) {
    res.status(200).json({
        name: "SCS Risk Assessment Tool API",
        version: "1.0.0",
        status: "Running",
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        endpoints: {
            admin: "/api/admin",
            questions: "/api/questions",
            assessments: "/api/assessments",
            health: "/api/health",
            ml: "/api/ml"
        }
    });
}
