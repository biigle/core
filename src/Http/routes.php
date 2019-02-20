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
            'uses' => 'VolumeSorters\ImageFilenameController@index',
        ]);

        $router->get('{id}/images/filter/labels', [
            'uses' => 'VolumeFilters\AnyImageLabelController@index',
        ]);

        $router->get('{id}/images/filter/image-label-user/{id2}', [
            'uses' => 'VolumeFilters\ImageLabelUserController@index',
        ]);

        $router->get('{id}/images/filter/image-label/{id2}', [
            'uses' => 'VolumeFilters\ImageLabelController@index',
        ]);

        $router->get('{id}/images/filter/annotation-label/{id2}', [
            'uses' => 'VolumeFilters\ImageAnnotationLabelController@index',
        ]);

        $router->get('{id}/images/filter/filename/{pattern}', [
            'uses' => 'VolumeFilters\ImageFilenameController@index',
        ]);

        $router->get('{id}/image-labels', [
            'uses' => 'VolumeUsedImageLabelsController@index',
        ]);

        $router->get('{id}/filenames', [
            'uses' => 'VolumeImageFilenamesController@index',
        ]);

        $router->get('{id}/users', [
            'uses' => 'VolumeUserController@index',
        ]);

        $router->get('{id}/images/labels', [
            'uses' => 'VolumeImageLabelsController@index',
        ]);

        $router->post('{id}/images/metadata', [
            'uses' => 'VolumeImageMetadataController@store',
        ]);

        $router->group(['prefix' => 'browser'], function ($router) {
            $router->get('directories/{disk}', 'BrowserController@indexDirectories');
            $router->get('images/{disk}', 'BrowserController@indexImages');
        });
    });
