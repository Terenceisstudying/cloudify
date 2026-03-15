import { applyCors } from '../../lib/cors.js';
import { verifyToken } from '../../lib/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assetsDir = path.join(__dirname, '../../public/assets');

const ALLOWED_ASSET_FOLDERS = ['backgrounds', 'mascots', 'music', 'cancer-cards', '_upload'];

async function listAssetPaths(folder) {
    const dir = path.join(assetsDir, folder);
    if (!fs.existsSync(dir)) return [];
    try {
        const files = fs.readdirSync(dir);
        return files
            .filter(f => !f.startsWith('.') && fs.statSync(path.join(dir, f)).isFile())
            .map(f => `assets/${folder}/${f}`);
    } catch (e) {
        return [];
    }
}

/**
 * /api/admin/assets
 * Multi-method handler for asset management.
 */
export default async function handler(req, res) {
    applyCors(req, res);
    if (req.method === 'OPTIONS') return;

    const user = verifyToken(req);
    if (!user) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Valid authentication token required' });
    }

    try {
        const { folder, path: assetPath } = req.query;

        // GET — list assets
        if (req.method === 'GET') {
            const targetFolder = (folder || '').toString().trim();
            if (targetFolder) {
                if (!ALLOWED_ASSET_FOLDERS.includes(targetFolder)) {
                    return res.status(400).json({ success: false, error: 'Invalid folder' });
                }
                const paths = await listAssetPaths(targetFolder);
                return res.status(200).json({ paths });
            }
            const [bg, mascot, music, cancerCards] = await Promise.all([
                listAssetPaths('backgrounds'),
                listAssetPaths('mascots'),
                listAssetPaths('music'),
                listAssetPaths('cancer-cards')
            ]);
            return res.status(200).json({ 
                paths: [...bg, ...mascot, ...music, ...cancerCards], 
                backgrounds: bg, 
                mascots: mascot, 
                music, 
                cancerCards 
            });
        }

        // DELETE — remove asset
        if (req.method === 'DELETE') {
            const relativePath = (req.body.path || assetPath || '').toString().trim();
            if (!relativePath || !relativePath.startsWith('assets/')) {
                return res.status(400).json({ success: false, error: 'Invalid asset path' });
            }
            const normalized = path.normalize(relativePath).replace(/\\/g, '/');
            if (normalized.indexOf('..') !== -1 || !normalized.startsWith('assets/')) {
                return res.status(400).json({ success: false, error: 'Invalid asset path' });
            }
            const relativeToAssets = normalized.slice('assets/'.length);
            const fullPath = path.join(assetsDir, relativeToAssets);
            
            if (!fullPath.startsWith(assetsDir)) {
                return res.status(400).json({ success: false, error: 'Asset path outside assets directory' });
            }
            if (!fs.existsSync(fullPath)) {
                return res.status(404).json({ success: false, error: 'Asset not found' });
            }
            fs.unlinkSync(fullPath);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('[Admin Assets] Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}
