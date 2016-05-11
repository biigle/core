<?php


$router->get('annotate/{id}', [
    'middleware' => 'auth',
    'as'   => 'annotate',
    'uses' => 'AnnotationController@index',
]);

$router->group([
    'middleware' => 'auth.api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {

    $router->get('transects/{id}/images/filter/annotations', [
        'uses' => 'TransectImageController@hasAnnotation'
    ]);

    $router->get('transects/{tid}/images/filter/user/{uid}', [
        'uses' => 'TransectImageController@hasUser'
    ]);

    $router->get('transects/{tid}/images/filter/label/{lid}', [
        'uses' => 'TransectImageController@hasLabel'
    ]);

    $router->get('transects/{id}/users/find/{pattern}', [
        'uses' => 'TransectUserController@find'
    ]);

    $router->get('transects/{id}/labels/find/{pattern}', [
        'uses' => 'TransectLabelController@find'
    ]);
});
