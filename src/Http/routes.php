<?php


$router->get('annotate/{id}', [
    'middleware' => 'auth',
    'as'   => 'annotate',
    'uses' => 'AnnotationController@index',
]);

$router->get('manual/tutorials/annotations/{name}', [
    'as'   => 'manual-tutorials-annotations',
    'uses' => 'AnnotationController@tutorial',
]);

$router->group([
    'middleware' => 'auth.api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {

    $router->get('transects/{id}/images/filter/annotations', [
        'uses' => 'TransectImageController@hasAnnotation'
    ]);

    $router->get('transects/{tid}/images/filter/annotation-user/{uid}', [
        'uses' => 'TransectImageController@hasAnnotationUser'
    ]);

    $router->get('transects/{tid}/images/filter/annotation-label/{lid}', [
        'uses' => 'TransectImageController@hasAnnotationLabel'
    ]);

    $router->get('transects/{id}/annotation-labels/find/{pattern}', [
        'uses' => 'TransectLabelController@find'
    ]);
});
