import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

// Local dev has no Pages Functions/D1. Read-only proxy of the two public GET APIs so the
// local page shows the real CMS data. Admin, upload and contact APIs are NOT proxied.
const cmsReadTarget = process.env.CMS_READ_TARGET || 'https://otakumusicstudio.com';
const cmsReadProxy = { target: cmsReadTarget, changeOrigin: true, secure: true };

export default defineConfig({
    root: rootDir,
    server: {
        proxy: {
            '/api/portfolio': cmsReadProxy,
            '/api/teachers': cmsReadProxy
        }
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(rootDir, 'index.html'),
                freePlugins: resolve(rootDir, 'free-plugin-transition-options.html')
            }
        }
    }
});
