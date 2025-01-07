<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['api', 'auth:web,api'],
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

    $router->resource('reports', 'ReportsController', [
        'only' => ['show', 'destroy'],
        'parameters' => ['reports' => 'id'],
        'names' => [
            'show' => 'show-reports',
            'destroy' => 'destroy-reports',
        ],
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
