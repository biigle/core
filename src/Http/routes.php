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
    $router->get('annotations/{id}/patch', [
        'uses' => 'AteController@showPatch',
    ]);

    $router->post('transects/{id}/ate', [
        'uses' => 'AteController@save',
    ]);

    $router->get('transects/{tid}/annotations/filter/label/{lid}', [
        'uses' => 'TransectsAnnotationsController@filter',
    ]);
});
