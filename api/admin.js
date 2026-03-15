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
    const segments = url.pathname.split('/');
    // Pattern: /api/admin/resource -> segment index 3
    const resource = segments[3];

    switch (resource) {
        case 'admins': return admins(req, res);
        case 'assessments': return assessments(req, res);
        case 'cancer-types': return cancerTypes(req, res);
        case 'change-password': return changePassword(req, res);
        case 'forgot-password': return forgotPassword(req, res);
        case 'login': return login(req, res);
        case 'me': return me(req, res);
        case 'pdpa': return pdpa(req, res);
        case 'question-bank': return questionBank(req, res);
        case 'recommendations': return recommendations(req, res);
        case 'reset-password': return resetPassword(req, res);
        case 'theme': return theme(req, res);
        case 'translations': return translations(req, res);
        case 'assets': return assets(req, res);
        default:
            return res.status(404).json({ success: false, error: 'Admin resource not found' });
    }
}
