<?php

Route::group(['namespace' => '\Dias\Modules\Projects\Http\Controllers', 'middleware' => 'auth', 'prefix' => 'projects'], function ($router) {
    $router->get('/create', [
        'as'   => 'create-project',
        'uses' => 'ProjectController@create',
    ]);

    $router->get('/{id}', [
        'as'   => 'project',
        'uses' => 'ProjectController@index',
    ]);
});

Route::group(['namespace' => '\Dias\Modules\Projects\Http\Controllers', 'middleware' => 'auth'], function ($router) {
    $router->get('admin/projects', [
        'as' => 'admin-projects',
        'middleware' => 'admin',
        'uses' => 'ProjectController@admin',
    ]);
});
