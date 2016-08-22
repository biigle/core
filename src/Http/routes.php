<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {

    $router->post('projects/{id}/reports/basic', [
        'uses' => 'ReportsController@basic',
    ]);

    $router->post('projects/{id}/reports/extended', [
        'uses' => 'ReportsController@extended',
    ]);

    $router->post('projects/{id}/reports/full', [
        'uses' => 'ReportsController@full',
    ]);

    $router->post('projects/{id}/reports/image-labels', [
        'uses' => 'ReportsController@storeImageLabelReport',
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
    'uses' => 'Api\ReportsController@show',
]);

