<?php

namespace Biigle\Providers;

use Auth;
use Biigle\Announcement;
use Biigle\Support\FilesystemManager;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton('modules', fn () => new \Biigle\Services\Modules);
        // Use the singleton in any instances where the modules service should be used
        // via dependency injection.
        $this->app->alias('modules', \Biigle\Services\Modules::class);

        // The custom implementation allows "config resolvers" which are required by
        // the user-storage and user-disks modules, for example.
        Storage::swap(new FilesystemManager($this->app));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        View::composer('*', function ($view) {
            // Make some variables available in any view.
            $user = Auth::user();
            $view->with('user', $user);
            if ($user) {
                $view->with('hasNotification', $user->unreadNotifications()->exists());
            }
            $view->with('announcement', Announcement::getActive());
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
            return "<?php foreach (app('modules')->getViewMixins({$name}) as \$module => \$nestedMixins): ?><?php echo \$__env->make(\$module.'::'.{$name}, ['mixins' => \$nestedMixins], \Illuminate\Support\Arr::except(get_defined_vars(), array('__data', '__path')))->render(); ?><?php endforeach; ?>";
        });

        // Backwards compatibility after upgrade from Laravel 5.5 to 5.6.
        Paginator::useBootstrapThree();

        Validator::extend('id', function ($attribute, $value, $parameters, $validator) {
            $int = intval($value);

            return $int > 0 && $int < 2147483647;
        });
    }
}
