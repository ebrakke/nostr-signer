import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/pkg/sdk.ts',
            name: 'NostrSigner',
            fileName: () => 'nostr-signer.js',
            formats: ['umd']
        },
        outDir: 'dist/sdk',
        sourcemap: true,
        rollupOptions: {
            output: {
                compact: true
            }
        }
    }
}); 