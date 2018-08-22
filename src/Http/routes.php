<?php

$router->group([
    'middleware' => 'auth',
    'namespace' => 'Views',
    ], function ($router) {
        $router->get('annotate/{id}', [
            'as'   => 'annotate',
            'uses' => 'AnnotationToolController@show',
        ]);

        $router->get('annotations/{id}', [
            'as'   => 'show-annotation',
            'uses' => 'AnnotationController@show',
        ]);
    });


$router->group([
    'middleware' => 'auth:web,api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {
        $router->get('volumes/{id}/images/filter/annotations', [
            'uses' => 'VolumeImageController@hasAnnotation',
        ]);

        $router->get('volumes/{id}/images/filter/annotation-user/{id2}', [
            'uses' => 'VolumeImageController@hasAnnotationUser',
        ]);

        $router->get('volumes/{id}/annotation-labels', [
            'uses' => 'VolumeLabelController@index',
        ]);

        $router->get('volumes/{id}/images/area', [
            'uses' => 'VolumeImageAreaController@index',
        ]);
    });
