import admins from '../api-handlers/admin/admins.js';
import assessments from '../api-handlers/admin/assessments.js';
import cancerTypes from '../api-handlers/admin/cancer-types.js';
import changePassword from '../api-handlers/admin/change-password.js';
import forgotPassword from '../api-handlers/admin/forgot-password.js';
import login from '../api-handlers/admin/login.js';
import me from '../api-handlers/admin/me.js';
import pdpa from '../api-handlers/admin/pdpa.js';
import questionBank from '../api-handlers/admin/question-bank.js';
import recommendations from '../api-handlers/admin/recommendations.js';
import resetPassword from '../api-handlers/admin/reset-password.js';
import theme from '../api-handlers/admin/theme.js';
import translations from '../api-handlers/admin/translations.js';
import assets from '../api-handlers/admin/assets.js';

/**
 * /api/admin
 * Consolidated entrypoint for all admin routes.
 * Routes are dispatched to individual handlers in /api-handlers/admin/.
 */
export default async function handler(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (path.includes('/admins')) return admins(req, res);
    if (path.includes('/assessments')) return assessments(req, res);
    if (path.includes('/cancer-types')) return cancerTypes(req, res);
    if (path.includes('/change-password')) return changePassword(req, res);
    if (path.includes('/forgot-password')) return forgotPassword(req, res);
    if (path.includes('/login')) return login(req, res);
    if (path.includes('/me')) return me(req, res);
    if (path.includes('/pdpa')) return pdpa(req, res);
    if (path.includes('/question-bank')) return questionBank(req, res);
    if (path.includes('/recommendations')) return recommendations(req, res);
    if (path.includes('/reset-password')) return resetPassword(req, res);
    if (path.includes('/theme')) return theme(req, res);
    if (path.includes('/translations')) return translations(req, res);
    if (path.includes('/assets')) return assets(req, res);

    return res.status(404).json({ success: false, error: `Admin resource not found: ${path}` });
}
