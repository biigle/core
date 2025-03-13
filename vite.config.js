import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    server: {
        port: 5174,
        strictPort: true,
    },
    plugins: [
        laravel({
            buildDirectory: 'vendor/largo',
            input: [
                'src/resources/assets/sass/main.scss',
                'src/resources/assets/js/main.js',
            ],
            hotFile: 'vendor/largo/hot',
        }),
        vue({
            template: {
                transformAssetUrls: {
                    base: null,
                    includeAbsolute: false,
                },
                compilerOptions: {
                    whitespace: 'preserve',
                },
            },
        }),
    ],
});
