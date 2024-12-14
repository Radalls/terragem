import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
    base: (mode === 'production')
        ? '/terragem/'
        : '/',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        coverage: {
            provider: 'v8',
        },
    },
}));
