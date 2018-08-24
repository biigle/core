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

$router->group(
    ['middleware' => 'auth:web,api', 'namespace' => 'Api', 'prefix' => 'api/v1'],
    function ($router) {
        $router->get('projects/{id}/attachable-volumes', 'AttachableVolumesController@index');

        $router->get('volumes/{id}/sample/{number?}', 'VolumeSampleController@index')
            ->where(['number' => '[0-9]+']);
    }
);
