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
});

// this route should be public public (is protected by random uids)
$router->get('api/v1/reports/{uid}/{filename}', [
    'uses' => 'Api\ReportsController@show',
]);
