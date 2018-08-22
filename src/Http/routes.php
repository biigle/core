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
            'middleware' => 'can:sudo',
            'uses' => 'AdminController@index',
        ]);
    });

$router->group([
        'middleware' => 'auth:web,api',
        'prefix' => 'api/v1/volumes',
        'namespace' => 'Api',
    ], function ($router) {
        $router->get('{id}/images/order-by/filename', [
            'uses' => 'VolumeImageController@indexOrderByFilename',
        ]);

        $router->get('{id}/images/filter/labels', [
            'uses' => 'VolumeImageController@hasLabel',
        ]);

        $router->get('{id}/images/filter/image-label-user/{id2}', [
            'uses' => 'VolumeImageController@hasImageLabelUser',
        ]);

        $router->get('{id}/images/filter/image-label/{id2}', [
            'uses' => 'VolumeImageController@hasImageLabel',
        ]);

        $router->get('{id}/images/filter/annotation-label/{id2}', [
            'uses' => 'VolumeImageAnnotationLabelController@index',
        ]);

        $router->get('{id}/images/filter/filename/{pattern}', [
            'uses' => 'VolumeImageFilenameController@index',
        ]);

        $router->get('{id}/image-labels', [
            'uses' => 'VolumeImageLabelController@index',
        ]);

        $router->get('{id}/users', [
            'uses' => 'VolumeUserController@index',
        ]);

        $router->post('{id}/images/metadata', [
            'uses' => 'VolumeImageMetadataController@store',
        ]);

        $router->group(['prefix' => 'browser'], function ($router) {
            $router->get('directories/{disk}', 'BrowserController@indexDirectories');
            $router->get('images/{disk}', 'BrowserController@indexImages');
        });

    });
