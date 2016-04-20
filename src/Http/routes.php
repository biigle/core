<?php

$router->group(['middleware' => 'auth'], function ($router) {
    $router->get('projects/create', [
        'as'   => 'create-project',
        'uses' => 'ProjectController@create',
    ]);

    $router->get('projects/{id}', [
        'as'   => 'project',
        'uses' => 'ProjectController@index',
    ]);

    $router->get('admin/projects', [
        'as' => 'admin-projects',
        'middleware' => 'admin',
        'uses' => 'ProjectController@admin',
    ]);
});
