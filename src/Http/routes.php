<?php

Route::group([
        'namespace' => '\Dias\Modules\Transects\Http\Controllers',
        'middleware' => 'auth',
        'prefix' => 'transects',
    ], function ($router) {
    $router->get('/create', [
        'as'   => 'create-transect',
        'uses' => 'TransectController@create',
    ]);

    $router->get('/{id}', [
        'as'   => 'transect',
        'uses' => 'TransectController@index',
    ]);
});

Route::group([
        'namespace' => '\Dias\Modules\Transects\Http\Controllers',
        'middleware' => 'auth',
        'prefix' => 'images',
    ], function ($router) {

    $router->get('/{id}', [
        'as'   => 'image',
        'uses' => 'ImageController@index',
    ]);
});

Route::group([
        'namespace' => '\Dias\Modules\Transects\Http\Controllers',
        'middleware' => 'auth'
    ], function ($router) {

    $router->get('admin/transects', [
        'as' => 'admin-transects',
        'middleware' => 'admin',
        'uses' => 'AdminController@index',
    ]);
});
