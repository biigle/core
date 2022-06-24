const mix = require('laravel-mix');
require('@mzur/laravel-mix-artisan-publish');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

mix.disableSuccessNotifications();
mix.options({processCssUrls: false});

mix.setPublicPath('src/public');

mix.js('src/resources/assets/js/main.js', 'assets/scripts').vue()
    .sass('src/resources/assets/sass/main.scss', 'assets/styles')
    .publish({
        provider: 'Biigle\\Modules\\Sync\\SyncServiceProvider',
        tag: 'public',
    });

if (mix.inProduction()) {
    mix.version();
}
