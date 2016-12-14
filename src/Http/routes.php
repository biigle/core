<?php


$router->get('annotate/{id}', [
    'middleware' => 'auth',
    'as'   => 'annotate',
    'uses' => 'AnnotationController@index',
]);

$router->get('annotations/{id}', [
    'middleware' => 'auth',
    'as'   => 'show-annotation',
    'uses' => 'AnnotationController@show',
]);

$router->group([
    'middleware' => 'auth.api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {

    $router->get('transects/{id}/images/filter/annotations', [
        'uses' => 'TransectImageController@hasAnnotation'
    ]);

    $router->get('transects/{id}/images/filter/annotation-user/{id2}', [
        'uses' => 'TransectImageController@hasAnnotationUser'
    ]);

    $router->get('transects/{id}/annotation-labels/find/{pattern}', [
        'uses' => 'TransectLabelController@find'
    ]);
});
