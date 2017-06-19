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

    $router->get('reports', [
        'uses' => 'ReportsController@index',
        'as' => 'reports',
    ]);
});

/**
 * @deprecated Will be deleted after a grace period that still allows downloading of old
 * reports.
 *
 * This route should be public (is protected by random uids).
 */
$router->get('api/v1/reports/{uid}/{filename}', [
    'as' => 'download_report',
    'uses' => 'Api\AvailableReportController@show',
]);
