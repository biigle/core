<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {

    $router->post('projects/{id}/reports/basic', [
        'uses' => 'BasicAnnotationReportController@store',
    ]);

    $router->post('projects/{id}/reports/extended', [
        'uses' => 'ExtendedAnnotationReportController@store',
    ]);

    $router->post('projects/{id}/reports/full', [
        'uses' => 'FullAnnotationReportController@store',
    ]);

    $router->post('projects/{id}/reports/image-labels', [
        'uses' => 'ImageLabelReportController@store',
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
    'uses' => 'Api\StoredReportController@show',
]);

