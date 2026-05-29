import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(rootDir, 'index.html'),
                freePlugins: resolve(rootDir, 'free-plugin-transition-options.html')
            }
        }
    }
});
