<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {
    $router->post('projects/{id}/reports/basic', [
        'uses' => 'ReportsController@basic',
    ]);
});
