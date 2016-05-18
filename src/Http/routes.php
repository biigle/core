<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {
    $router->get('projects/{id}/reports/basic', [
        'uses' => 'ReportsController@basic',
    ]);
    $router->get('projects/{id}/reports/extended', [
        'uses' => 'ReportsController@extended',
    ]);
     $router->get('projects/{id}/reports/full', [
        'uses' => 'ReportsController@full',
    ]);
    $router->get('files/retrieve/{uid}/{filename}', [
        'uses' => 'ReportsController@retrieveReport',
    ]);
});