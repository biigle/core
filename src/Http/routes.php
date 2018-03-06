<?php


$router->get('annotate/{id}', [
    'middleware' => 'auth',
    'as'   => 'annotate',
    'uses' => 'AnnotationController@show',
]);

$router->get('annotations/{id}', [
    'middleware' => 'auth',
    'as'   => 'show-annotation',
    'uses' => 'AnnotationController@showAnnotation',
]);

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

        $router->get('images/{id}/area', [
            'uses' => 'ImageAreaController@show',
        ]);
    });
