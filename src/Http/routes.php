<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {

    $router->post('projects/{id}/reports/annotations/basic', [
        'uses' => 'Annotations\BasicReportController@store',
    ]);

    $router->post('projects/{id}/reports/annotations/extended', [
        'uses' => 'Annotations\ExtendedReportController@store',
    ]);

    $router->post('projects/{id}/reports/annotations/full', [
        'uses' => 'Annotations\FullReportController@store',
    ]);

    $router->post('projects/{id}/reports/annotations/csv', [
        'uses' => 'Annotations\CsvReportController@store',
    ]);

    $router->post('projects/{id}/reports/image-labels/standard', [
        'uses' => 'ImageLabels\StandardReportController@store',
    ]);

    $router->get('transects/{id}/export-area', [
        'uses' => 'TransectExportAreaController@show',
    ]);

    $router->post('transects/{id}/export-area', [
        'uses' => 'TransectExportAreaController@store',
    ]);

    $router->delete('transects/{id}/export-area', [
        'uses' => 'TransectExportAreaController@destroy',
    ]);
});

// this route should be public (is protected by random uids)
$router->get('api/v1/reports/{uid}/{filename}', [
    'as' => 'download_report',
    'uses' => 'Api\AvailableReportController@show',
]);

