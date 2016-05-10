<?php


$router->get('annotate/{id}', [
    'middleware' => 'auth',
    'as'   => 'annotate',
    'uses' => 'AnnotationController@index',
]);

$router->get('api/v1/transects/{id}/images/filter/annotations', [
    'middleware' => 'auth.api',
    'uses' => 'Api\TransectImageController@index'
]);
