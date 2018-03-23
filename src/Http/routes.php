<?php

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => ['auth:web,api', 'can:admin'],
], function ($router) {
    $router->get('export/users', 'Export\UserExportController@show');
});
