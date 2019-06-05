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
        \Biigle\Annotation::class => \Biigle\Policies\AnnotationPolicy::class,
        \Biigle\AnnotationLabel::class => \Biigle\Policies\AnnotationLabelPolicy::class,
        \Biigle\ApiToken::class => \Biigle\Policies\ApiTokenPolicy::class,
        \Biigle\Image::class => \Biigle\Policies\ImagePolicy::class,
        \Biigle\ImageLabel::class => \Biigle\Policies\ImageLabelPolicy::class,
        \Biigle\Label::class => \Biigle\Policies\LabelPolicy::class,
        \Biigle\LabelTree::class => \Biigle\Policies\LabelTreePolicy::class,
        \Biigle\LabelTreeVersion::class => \Biigle\Policies\LabelTreeVersionPolicy::class,
        \Biigle\Project::class => \Biigle\Policies\ProjectPolicy::class,
        \Biigle\SystemMessage::class => \Biigle\Policies\SystemMessagePolicy::class,
        \Biigle\User::class => \Biigle\Policies\UserPolicy::class,
        \Biigle\Volume::class => \Biigle\Policies\VolumePolicy::class,
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
        Gate::define('sudo', function ($user) {
            return $user->isInSuperUserMode;
        });

        Auth::extend('api', function ($app, $name, array $config) {
            // Return an instance of Illuminate\Contracts\Auth\Guard...

            return new ApiGuard(Auth::createUserProvider($config['provider']), $app['request']);
        });
    }
}
