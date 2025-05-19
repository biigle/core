import externalize from "vite-plugin-externalize-dependencies";
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [
        // This is required to exclude vue in the dev server bundle. Instead, it should
        // use the statically copied external bundle below. See rollupOptions for
        // explanation.
        externalize({externals: ['vue']}),
        viteStaticCopy({
            targets: [
                {
                    src: [
                        'node_modules/vue/dist/vue.esm-browser.js',
                        'node_modules/vue/dist/vue.esm-browser.prod.js',
                    ],
                    dest: '',
                },
            ],
        }),
        laravel([
            'resources/assets/sass/main.scss',
            'resources/assets/js/main.js',
        ]),
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
    resolve: {
        alias: {
            '@': '/resources/assets/js',
            '@images': '/resources/assets/images',
        },
    },
    server: {
        watch: {
            ignored: [
                '**/storage/**',
                '**/vendor/**',
            ],
        },
    },
    build: {
        rollupOptions: {
            // In production, Vue is loaded as an importmap in app.blade.php.
            // This is done so BIIGLE modules can reuse the same Vue version and
            // instance. Otherwise, there will be issues e.g. with template compiling.
            external: ['vue'],
        },
    },
    optimizeDeps: {
        exclude: ["onnxruntime-web"],
    },
});
