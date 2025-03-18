import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        laravel({
            publicDirectory: 'src',
            buildDirectory: 'public',
            input: [
                'src/resources/assets/sass/main.scss',
                'src/resources/assets/js/main.js',
            ],
            hotFile: 'hot',
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
