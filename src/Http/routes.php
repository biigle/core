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
        'middleware' => 'can:admin',
        'uses' => 'AdminController@index',
    ]);
});

$router->group([
        'middleware' => 'auth.api',
        'prefix' => 'api/v1',
        'namespace' => 'Api',
    ], function ($router) {

    $router->get('transects/{id}/images/order-by/filename', [
        'uses' => 'TransectImageController@indexOrderByFilename',
    ]);

    $router->get('transects/{id}/images/filter/labels', [
        'uses' => 'TransectImageController@hasLabel'
    ]);

    $router->get('transects/{id}/images/filter/image-label-user/{id2}', [
        'uses' => 'TransectImageController@hasImageLabelUser'
    ]);

    $router->get('transects/{id}/images/filter/image-label/{id2}', [
        'uses' => 'TransectImageController@hasImageLabel'
    ]);

    $router->get('transects/{id}/images/filter/annotation-label/{id2}', [
        'uses' => 'TransectImageAnnotationLabelController@index'
    ]);

    $router->get('transects/{id}/image-labels/find/{pattern}', [
        'uses' => 'TransectImageLabelController@findLabel'
    ]);

    $router->get('transects/{id}/users', [
        'uses' => 'TransectUserController@index'
    ]);
});
