<?php

$router->group([
    'middleware' => 'auth',
    'namespace' => 'Views',
    ], function ($router) {
        $router->get('videos/{id}', 'VideoController@show')->name('video');
        $router->get('videos/create', 'VideoController@store')->name('create-video');
    });

$router->group([
    'middleware' => 'auth:web,api',
    'namespace' => 'Api',
    'prefix' => 'api/v1',
    ], function ($router) {
        $router->resource('projects.videos', 'ProjectVideoController', [
            'only' => ['index', 'store'],
            'parameters' => ['projects' => 'id'],
        ]);

        $router->get('videos/{id}/file', 'VideoFileController@show');

        $router->resource('videos', 'VideoController', [
            'only' => ['update', 'destroy'],
            'parameters' => ['videos' => 'id'],
        ]);

        $router->resource('videos.annotations', 'VideoAnnotationController', [
            'only' => ['index', 'store'],
            'parameters' => ['videos' => 'id'],
        ]);

        $router->resource('video-annotations', 'VideoAnnotationController', [
            'only' => ['show', 'update', 'destroy'],
            'parameters' => ['video-annotations' => 'id'],
        ]);

        $router->resource('video-annotations.labels', 'VideoAnnotationLabelController', [
            'only' => ['store'],
            'parameters' => ['video-annotations' => 'id'],
        ]);

        $router->resource('video-annotations.link', 'LinkVideoAnnotationController', [
            'only' => ['store'],
            'parameters' => ['video-annotations' => 'id'],
        ]);

        $router->resource('video-annotations.split', 'SplitVideoAnnotationController', [
            'only' => ['store'],
            'parameters' => ['video-annotations' => 'id'],
        ]);

        $router->resource('video-annotation-labels', 'VideoAnnotationLabelController', [
            'only' => ['destroy'],
            'parameters' => ['video-annotation-labels' => 'id'],
        ]);
    });
