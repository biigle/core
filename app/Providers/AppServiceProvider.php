<?php

namespace Biigle\Providers;

use Auth;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        View::composer('*', function ($view) {
            // Make authenticated user available in any view.
            $view->with('user', Auth::user());
        });

        // Configure global proxy settings for readfile() and the likes.
        if (config('app.proxy')) {
            stream_context_set_default(['http' => [
                'proxy' => 'tcp://'.config('app.proxy'),
                'request_fulluri' => true,
            ]]);
        }

        Blade::directive('mixin', function ($name) {
            // Used code from:
            // Illuminate\View\Compilers\Concerns\CompilesIncludes::compileInclude
            return "<?php foreach (app('modules')->getViewMixins({$name}) as \$module => \$nestedMixins): ?><?php echo \$__env->make(\$module.'::'.{$name}, ['mixins' => \$nestedMixins], array_except(get_defined_vars(), array('__data', '__path')))->render(); ?><?php endforeach; ?>";
        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton('modules', function () {
            return new \Biigle\Services\Modules;
        });
        // Use the singleton in any instances where the modules service should be used
        // via dependency injection.
        $this->app->alias('modules', \Biigle\Services\Modules::class);

        $this->app->bind('vips-image', function () {
            return new \Jcupitt\Vips\Image(null);
        });

        $this->app->bind('tile-cache', function () {
            return new \Biigle\Services\TileCache;
        });
    }
}
