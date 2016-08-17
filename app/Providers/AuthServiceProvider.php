<?php

namespace Dias\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        \Dias\LabelTree::class => \Dias\Policies\LabelTreePolicy::class,
        \Dias\Project::class => \Dias\Policies\ProjectPolicy::class,
        \Dias\Annotation::class => \Dias\Policies\AnnotationPolicy::class,
        \Dias\Label::class => \Dias\Policies\LabelPolicy::class,
        \Dias\AnnotationLabel::class => \Dias\Policies\AnnotationLabelPolicy::class,
        \Dias\Image::class => \Dias\Policies\ImagePolicy::class,
        \Dias\Transect::class => \Dias\Policies\TransectPolicy::class,
        \Dias\ImageLabel::class => \Dias\Policies\ImageLabelPolicy::class,
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
        $gate->define('admin', function ($user) {
            return $user->isAdmin;
        });
    }
}
