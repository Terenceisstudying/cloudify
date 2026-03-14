/**
 * JWT Authentication Middleware for Serverless Functions
 * 
 * Validates JWT tokens for protected admin routes.
 */

import jwt from 'jsonwebtoken';

/**
 * Verify JWT token and attach user to request
 * @param {object} req - Request object
 * @returns {object|null} Decoded token or null if invalid
 */
export function verifyToken(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);  // Remove 'Bearer ' prefix
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        console.warn('Invalid JWT token:', error.message);
        return null;
    }
}

/**
 * Middleware wrapper that requires valid authentication
 * @param {function} handler - The serverless function handler
 * @returns {function} Wrapped handler with auth check
 */
export function requireAuth(handler) {
    return async function authHandler(req, res) {
        const user = verifyToken(req);
        
        if (!user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Valid authentication token required'
            });
        }
        
        // Attach user to request
        req.user = user;
        
        return handler(req, res);
    };
}

/**
 * Middleware wrapper that requires admin role
 * @param {function} handler - The serverless function handler
 * @returns {function} Wrapped handler with admin check
 */
export function requireAdmin(handler) {
    return async function adminHandler(req, res) {
        const user = verifyToken(req);
        
        if (!user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Valid authentication token required'
            });
        }
        
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: 'Admin access required'
            });
        }
        
        // Attach user to request
        req.user = user;
        
        return handler(req, res);
    };
}

/**
 * Middleware wrapper that requires super_admin role
 * @param {function} handler - The serverless function handler
 * @returns {function} Wrapped handler with super_admin check
 */
export function requireSuperAdmin(handler) {
    return async function superAdminHandler(req, res) {
        const user = verifyToken(req);
        
        if (!user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Valid authentication token required'
            });
        }
        
        if (user.role !== 'super_admin') {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: 'Super admin access required'
            });
        }
        
        // Attach user to request
        req.user = user;
        
        return handler(req, res);
    };
}

export default {
    verifyToken,
    requireAuth,
    requireAdmin,
    requireSuperAdmin
};
