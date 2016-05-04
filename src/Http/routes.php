<?php

$router->group([
        'middleware' => 'auth',
    ], function ($router) {

    $router->get('transects/create', [
        'as'   => 'create-transect',
        'uses' => 'TransectController@create',
    ]);

    $router->get('transects/edit/{id}', [
        'as'   => 'transect-edit',
        'uses' => 'TransectController@edit',
    ]);

    $router->get('transects/{id}', [
        'as'   => 'transect',
        'uses' => 'TransectController@index',
    ]);

    $router->get('images/{id}', [
        'as'   => 'image',
        'uses' => 'ImageController@index',
    ]);

    $router->get('admin/transects', [
        'as' => 'admin-transects',
        'middleware' => 'admin',
        'uses' => 'AdminController@index',
    ]);
});
