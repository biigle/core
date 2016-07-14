<?php

$router->get('manual/tutorials/projects/{name}', [
    'as'   => 'manual-tutorials-projects',
    'uses' => 'ProjectsController@tutorial',
]);

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
