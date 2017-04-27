<?php

$router->group([
        'middleware' => 'auth',
    ], function ($router) {
        $router->get('volumes/create', [
            'as'   => 'create-volume',
            'uses' => 'VolumeController@create',
        ]);

        $router->get('volumes/edit/{id}', [
            'as'   => 'volume-edit',
            'uses' => 'VolumeController@edit',
        ]);

        $router->get('volumes/{id}', [
            'as'   => 'volume',
            'uses' => 'VolumeController@index',
        ]);

        $router->get('images/{id}', [
            'as'   => 'image',
            'uses' => 'ImageController@index',
        ]);

        $router->get('admin/volumes', [
            'as' => 'admin-volumes',
            'middleware' => 'can:admin',
            'uses' => 'AdminController@index',
        ]);
    });

$router->group([
        'middleware' => 'auth.api',
        'prefix' => 'api/v1',
        'namespace' => 'Api',
    ], function ($router) {
        $router->get('volumes/{id}/images/order-by/filename', [
            'uses' => 'VolumeImageController@indexOrderByFilename',
        ]);

        $router->get('volumes/{id}/images/filter/labels', [
            'uses' => 'VolumeImageController@hasLabel',
        ]);

        $router->get('volumes/{id}/images/filter/image-label-user/{id2}', [
            'uses' => 'VolumeImageController@hasImageLabelUser',
        ]);

        $router->get('volumes/{id}/images/filter/image-label/{id2}', [
            'uses' => 'VolumeImageController@hasImageLabel',
        ]);

        $router->get('volumes/{id}/images/filter/annotation-label/{id2}', [
            'uses' => 'VolumeImageAnnotationLabelController@index',
        ]);

        $router->get('volumes/{id}/images/filter/filename/{pattern}', [
            'uses' => 'VolumeImageFilenameController@index',
        ]);

        $router->get('volumes/{id}/image-labels', [
            'uses' => 'VolumeImageLabelController@index',
        ]);

        $router->get('volumes/{id}/users', [
            'uses' => 'VolumeUserController@index',
        ]);

        $router->post('volumes/{id}/images/metadata', [
            'uses' => 'VolumeImageMetadataController@store',
        ]);
    });
