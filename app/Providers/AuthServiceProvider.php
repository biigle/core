<?php

namespace Biigle\Providers;

use Biigle\Services\Auth\ApiGuard;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        \Biigle\LabelTree::class => \Biigle\Policies\LabelTreePolicy::class,
        \Biigle\Project::class => \Biigle\Policies\ProjectPolicy::class,
        \Biigle\Annotation::class => \Biigle\Policies\AnnotationPolicy::class,
        \Biigle\Label::class => \Biigle\Policies\LabelPolicy::class,
        \Biigle\AnnotationLabel::class => \Biigle\Policies\AnnotationLabelPolicy::class,
        \Biigle\Image::class => \Biigle\Policies\ImagePolicy::class,
        \Biigle\Volume::class => \Biigle\Policies\VolumePolicy::class,
        \Biigle\ImageLabel::class => \Biigle\Policies\ImageLabelPolicy::class,
        \Biigle\SystemMessage::class => \Biigle\Policies\SystemMessagePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // ability of a global admin
        Gate::define('admin', function ($user) {
            return $user->isAdmin;
        });

        Auth::extend('api', function ($app, $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new ApiGuard(Auth::createUserProvider($config['provider']), $app['request']);
        });
    }
}
