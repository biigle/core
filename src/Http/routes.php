<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth:web,api',
], function ($router) {
    $router->group([
        'namespace' => 'Volumes',
        'prefix' => 'volumes',
    ], function ($router) {
        $router->post('{id}/reports', [
            'uses' => 'VolumeReportController@store',
        ]);

        $router->get('{id}/export-area', [
            'uses' => 'ExportAreaController@show',
        ]);

        $router->post('{id}/export-area', [
            'uses' => 'ExportAreaController@store',
        ]);

        $router->delete('{id}/export-area', [
            'uses' => 'ExportAreaController@destroy',
        ]);
    });

    $router->post('projects/{id}/reports', [
        'uses' => 'Projects\ProjectReportController@store',
    ]);

    $router->get('reports/{id}', [
        'uses' => 'ReportsController@show',
        'as' => 'show-reports',
    ]);

    $router->post('users/my/settings/reports', [
        'uses' => 'SettingsController@store',
    ]);

    if (class_exists(Biigle\Modules\Videos\VideosServiceProvider::class)) {
        $router->post('videos/{id}/reports', [
            'uses' => 'Videos\VideoReportController@store',
        ]);
    }
});

$router->group([
    'namespace' => 'Views',
    'middleware' => 'auth',
], function ($router) {
    $router->get('volumes/{id}/reports', [
        'uses' => 'VolumeReportsController@show',
        'as' => 'volume-reports',
    ]);

    $router->get('projects/{id}/reports', [
        'uses' => 'ProjectReportsController@show',
        'as' => 'project-reports',
    ]);

    $router->get('reports', [
        'uses' => 'ReportsController@index',
        'as' => 'reports',
    ]);

    if (class_exists(Biigle\Modules\Videos\VideosServiceProvider::class)) {
        $router->get('videos/{id}/reports', [
            'uses' => 'VideoReportsController@show',
            'as' => 'video-reports',
        ]);
    }
});
