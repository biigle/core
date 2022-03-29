<?php

namespace Biigle\Providers;

use Biigle\Role;
use Biigle\User;
use Biigle\Services\Auth\ApiGuard;
use Biigle\Services\Auth\FederatedSearchGuard;
use Illuminate\Auth\TokenGuard;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        \Biigle\Image::class => \Biigle\Policies\VolumeFilePolicy::class,
        \Biigle\ImageAnnotation::class => \Biigle\Policies\AnnotationPolicy::class,
        \Biigle\ImageAnnotationLabel::class => \Biigle\Policies\AnnotationLabelPolicy::class,
        \Biigle\ImageLabel::class => \Biigle\Policies\VolumeFileLabelPolicy::class,
        \Biigle\Video::class => \Biigle\Policies\VolumeFilePolicy::class,
        \Biigle\VideoAnnotation::class => \Biigle\Policies\AnnotationPolicy::class,
        \Biigle\VideoAnnotationLabel::class => \Biigle\Policies\AnnotationLabelPolicy::class,
        \Biigle\VideoLabel::class => \Biigle\Policies\VolumeFileLabelPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // Ability of a global admin.
        Gate::define('sudo', function (User $user) {
            return $user->isInSuperUserMode;
        });

        // Ability to access the volume file browser.
        Gate::define('access-browser', function (User $user) {
            return $user->role_id === Role::editorId() || $user->role_id == Role::adminId();
        });

        // Ability to create or update a volume with a certain storage disk.
        Gate::define('use-disk', function (User $user, $disk) {
            if ($user->role_id === Role::adminId()) {
                return in_array($disk, config('volumes.admin_storage_disks'));
            } elseif ($user->role_id === Role::editorId()) {
                return in_array($disk, config('volumes.editor_storage_disks'));
            }

            return false;
        });

        Auth::extend('api', function ($app, $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new ApiGuard(Auth::createUserProvider($config['provider']), $app['request']);
        });

        Auth::extend('fs', function ($app, $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new TokenGuard(Auth::createUserProvider($config['provider']), $app['request'], 'token', 'local_token', true);
        });
    }
}
