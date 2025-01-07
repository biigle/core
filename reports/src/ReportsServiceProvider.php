<?php

namespace Biigle\Modules\Reports;

use Biigle\Http\Requests\UpdateUserSettings;
use Biigle\Modules\Reports\Http\Controllers\Mixins\Views\SearchControllerMixin;
use Biigle\Services\Modules;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Routing\Router;

class ReportsServiceProvider extends ServiceProvider
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
        $this->loadViewsFrom(__DIR__.'/resources/views', 'reports');

        $this->publishes([
            __DIR__.'/public/assets' => public_path('vendor/reports'),
        ], 'public');

        $modules->register('reports', [
            'viewMixins' => [
                'annotationsSettingsTab',
                'annotationsScripts',
                'manualTutorial',
                'volumesSidebar',
                'annotationsManualSidebarSettings',
                'searchTab',
                'searchTabContent',
                'projectsShowTabs',
            ],
            'controllerMixins' => [
                'search' => SearchControllerMixin::class.'@index',
            ],
            'apidoc' => [__DIR__.'/Http/Controllers/Api/'],
        ]);

        if (config('reports.notifications.allow_user_settings')) {
            $modules->registerViewMixin('reports', 'settings.notifications');
            UpdateUserSettings::addRule('report_notifications', 'filled|in:email,web');
        }
    }
}
