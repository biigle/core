<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
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

    $router->group([
        'namespace' => 'Projects',
        'prefix' => 'projects',
    ], function ($router) {
        $router->post('{id}/reports', [
            'uses' => 'ProjectReportController@store',
        ]);
    });

    $router->get('reports/{id}', [
        'uses' => 'ReportsController@show',
        'as' => 'show-reports',
    ]);

    $router->post('users/my/settings/export', [
        'uses' => 'SettingsController@store',
    ]);
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
});
