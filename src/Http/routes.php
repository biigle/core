<?php

$router->group([
    'middleware' => 'auth',
    'namespace' => 'Views',
    ], function ($router) {
        $router->get('videos/{id}', 'VideoController@show')->name('video');
    });

$router->group([
    'middleware' => 'auth:web,api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {
        $router->resource('projects.videos', 'ProjectVideoController', [
            'only' => ['store'],
            'parameters' => ['projects' => 'id'],
        ]);

        $router->get('videos/{id}/file', 'VideoFileController@show');
    });
