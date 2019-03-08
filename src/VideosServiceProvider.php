<?php

namespace Biigle\Modules\Videos;

use Event;
use Biigle\Services\Modules;
use Illuminate\Routing\Router;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Factory as EloquentFactory;

class VideosServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'videos');
        $this->loadMigrationsFrom(__DIR__.'/database/migrations');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/videos'),
        ], 'public');

        $router->group([
            'namespace' => 'Biigle\Modules\Videos\Http\Controllers',
            'middleware' => 'web',
        ], function ($router) {
            require __DIR__.'/Http/routes.php';
        });

        $modules->register('videos', [
            'viewMixins' => [
                'projectsShowLeft',
                'manualTutorial',
                'manualReferences',
                'searchTab',
                'searchTabContent',
            ],
            'apidoc' => [__DIR__.'/Http/Controllers/Api/'],
            'controllerMixins' => [
                'search' => Http\Controllers\Mixins\SearchControllerMixin::class.'@index',
            ],
        ]);

        Gate::policy(Video::class, Policies\VideoPolicy::class);
        Gate::policy(VideoAnnotation::class, Policies\VideoAnnotationPolicy::class);
        Gate::policy(VideoAnnotationLabel::class, Policies\VideoAnnotationLabelPolicy::class);
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    public function register()
    {
        $this->mergeConfigFrom(__DIR__.'/config/videos.php', 'videos');

        $this->app->singleton('command.videos.publish', function ($app) {
            return new \Biigle\Modules\Videos\Console\Commands\Publish;
        });
        $this->commands('command.videos.publish');

        if (config('app.env') === 'testing') {
            $this->registerEloquentFactoriesFrom(__DIR__.'/database/factories');
        }
    }

    /**
     * Get the services provided by the provider.
     *
     * @return array
     */
    public function provides()
    {
        return [
            'command.videos.publish',
        ];
    }

    /**
     * Register factories.
     *
     * @param  string  $path
     * @return void
     */
    protected function registerEloquentFactoriesFrom($path)
    {
        $this->app->make(EloquentFactory::class)->load($path);
    }
}
