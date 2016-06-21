<?php

$router->group([
    'namespace' => 'Views',
    'middleware' => 'auth'
], function ($router) {
    $router->get('transects/{id}/ate', [
        'as'   => 'ate',
        'uses' => 'AteController@index',
    ]);
});

$router->group([
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    'middleware' => 'auth.api',
], function ($router) {
    $router->get('transects/{id}/ate/preprocess', [
        'uses' => 'AteController@preprocess',
    ]);

    $router->get('annotations/{id}/patch', [
        'uses' => 'AteController@showPatch',
    ]);
});
