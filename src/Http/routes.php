<?php


$router->get('annotate/{id}', [
    'middleware' => 'auth',
    'as'   => 'annotate',
    'uses' => 'AnnotationController@index',
]);

$router->get('api/v1/transects/{id}/images/having-annotations', [
    'middleware' => 'auth.api',
    'as' => 'transects-images-having-annotations',
    'uses' => 'Api\TransectImageController@index'
]);
