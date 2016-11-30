<?php

$router->group(['middleware' => 'auth'], function ($router) {
    $router->get('projects/create', [
        'as'   => 'projects-create',
        'uses' => 'ProjectsController@create',
    ]);

    $router->get('projects/{id}', [
        'as'   => 'project',
        'uses' => 'ProjectsController@show',
    ]);

    $router->get('projects', [
        'as'   => 'projects-index',
        'uses' => 'ProjectsController@index',
    ]);
});

$router->group(['middleware' => 'auth.api', 'namespace' => 'Api', 'prefix' => 'api/v1'],
    function ($router) {
        $router->get('projects/{id}/attachable-transects', 'AttachableTransectsController@index');

        $router->get('transects/{id}/sample/{number?}', 'TransectSampleController@index')
            ->where(['number' => '[0-9]+']);
});
