<?php

$router->group([
    'middleware' => 'auth',
    'namespace' => 'Views',
    ], function ($router) {
        $router->get('{uuid}', 'VideoController@show')->name('video');
    });

$router->group([
    'middleware' => 'auth:web,api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {
        $router->resource('videos', 'VideoController', ['only' => ['store']]);

        $router->get('videos/{uuid}/file', 'VideoFileController@show');
    });
