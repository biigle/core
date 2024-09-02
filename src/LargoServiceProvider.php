<?php

namespace Biigle\Modules\Largo;

use Biigle\Events\AnnotationLabelAttached;
use Biigle\Events\ImagesDeleted;
use Biigle\Events\VideosDeleted;
use Biigle\ImageAnnotation;
use Biigle\Modules\Largo\Listeners\AttachLabelListener;
use Biigle\Modules\Largo\Listeners\ImagesCleanupListener;
use Biigle\Modules\Largo\Listeners\VideosCleanupListener;
use Biigle\Modules\Largo\Listeners\VolumeClonedListener;
use Biigle\Modules\Largo\Observers\ImageAnnotationObserver;
use Biigle\Modules\Largo\Observers\VideoAnnotationObserver;
use Biigle\Services\Modules;
use Biigle\VideoAnnotation;
use Event;
use Illuminate\Routing\Router;
use Illuminate\Support\ServiceProvider;

class LargoServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application events.
     *
     * @param  \Biigle\Services\Modules  $modules
     * @param  \Illuminate\Routing\Router  $router
     *
     * @return void
     */
    public function boot(Modules $modules, Router $router)
    {
        $this->loadViewsFrom(__DIR__.'/resources/views', 'largo');
        $this->loadMigrationsFrom(__DIR__.'/Database/migrations');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/largo'),
        ], 'public');

        $this->publishes([
            __DIR__.'/config/largo.php' => config_path('largo.php'),
        ], 'config');

        $router->group([
            'namespace' => 'Biigle\Modules\Largo\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        ImageAnnotation::observe(new ImageAnnotationObserver);
        VideoAnnotation::observe(new VideoAnnotationObserver);
        Event::listen(ImagesDeleted::class, ImagesCleanupListener::class);
        Event::listen(VideosDeleted::class, VideosCleanupListener::class);
        Event::listen(AnnotationLabelAttached::class, AttachLabelListener::class);
        Event::listen('volume.cloned', VolumeClonedListener::class);

        $modules->register('largo', [
            'viewMixins' => [
                'volumesSidebar',
                'annotationsScripts',
                'annotationsStyles',
                'annotationsSettingsTab',
                'annotationsLabelsTab',
                'annotationsManualSidebarSettings',
                'annotationsManualSidebarLabelTrees',
                'labelTreesShowTabs',
                'manualTutorial',
                'labelTreesManual',
                'projectsShowTabs',
            ],
            'apidoc' => [__DIR__.'/Http/Controllers/Api/'],
        ]);
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/config/largo.php', 'largo');

        $this->app->singleton('command.largo.publish', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\Publish;
        });
        $this->commands('command.largo.publish');

        $this->app->singleton('command.largo.config', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\Config;
        });
        $this->commands('command.largo.config');

        $this->app->singleton('command.largo.generate-missing', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\GenerateMissing;
        });
        $this->commands('command.largo.generate-missing');

        $this->app->singleton('command.largo.migrate-patch-storage', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\MigratePatchStorage;
        });
        $this->commands('command.largo.migrate-patch-storage');

        $this->app->singleton('command.largo.initialize-feature-vectors', function ($app) {
            return new \Biigle\Modules\Largo\Console\Commands\InitializeFeatureVectors;
        });
        $this->commands('command.largo.initialize-feature-vectors');
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.largo.publish',
            'command.largo.config',
            'command.largo.generate-missing',
            'command.largo.migrate-patch-storage',
            'command.largo.initialize-feature-vectors',
        ];
    }
}
