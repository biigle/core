<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {

    $router->group([
        'namespace' => 'Transects',
        'prefix' => 'transects',
    ], function ($router) {

        $router->post('{id}/reports/annotations/basic', [
            'uses' => 'Annotations\BasicReportController@store',
        ]);

        $router->post('{id}/reports/annotations/extended', [
            'uses' => 'Annotations\ExtendedReportController@store',
        ]);

        $router->post('{id}/reports/annotations/full', [
            'uses' => 'Annotations\FullReportController@store',
        ]);

        $router->post('{id}/reports/annotations/csv', [
            'uses' => 'Annotations\CsvReportController@store',
        ]);

        $router->post('{id}/reports/image-labels/basic', [
            'uses' => 'ImageLabels\BasicReportController@store',
        ]);

        $router->post('{id}/reports/image-labels/csv', [
            'uses' => 'ImageLabels\CsvReportController@store',
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

});

$router->group([
    'namespace' => 'Views',
    'middleware' => 'auth',
], function ($router) {
    $router->get('transects/{id}/reports', [
        'uses' => 'Transects\ReportsController@show',
        'as' => 'transect-reports',
    ]);
});

// this route should be public (is protected by random uids)
$router->get('api/v1/reports/{uid}/{filename}', [
    'as' => 'download_report',
    'uses' => 'Api\AvailableReportController@show',
]);

$router->get('manual/tutorials/export/{name}', [
    'as'   => 'manual-tutorials-export',
    'uses' => 'Views\TutorialController@show',
]);
