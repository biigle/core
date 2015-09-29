<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

// PUBLIC ROUTES --------------------------------------------------------------

Route::group(['namespace' => 'Auth'], function ($router) {
    $router->controllers([
        'auth' => 'AuthController',
        'password' => 'PasswordController',
    ]);
});

Route::group(['namespace' => 'Views', 'prefix' => 'documentation'], function ($router) {
    // route name must be different from the 'doc' directory name of the static
    // files in the public directory
    $router->get('/', [
        'as' => 'documentation',
        'uses' => 'DocumentationController@index',
    ]);

    $router->get('/{article}', 'DocumentationController@article');
});

// PROTECTED ROUTES -----------------------------------------------------------

Route::group(['namespace' => 'Views', 'middleware' => 'auth'], function ($router) {
    $router->get('/', [
        'as'   => 'home',
        'uses' => 'DashboardController@index',
    ]);

    $router->get('settings', [
        'as' => 'settings',
        'uses' => 'SettingsController@index',
    ]);
    $router->get('settings/profile', [
        'as' => 'settings-profile',
        'uses' => 'SettingsController@profile',
    ]);
    $router->get('settings/account', [
        'as' => 'settings-account',
        'uses' => 'SettingsController@account',
    ]);
    $router->get('settings/tokens', [
        'as' => 'settings-tokens',
        'uses' => 'SettingsController@tokens',
    ]);

    $router->get('admin', [
        'as' => 'admin',
        'middleware' => 'admin',
        'uses' => 'AdminController@index',
    ]);

    $router->get('admin/users', [
        'as' => 'admin-users',
        'middleware' => 'admin',
        'uses' => 'AdminController@users',
    ]);

    $router->get('admin/labels', [
        'as' => 'admin-labels',
        'middleware' => 'admin',
        'uses' => 'AdminController@labels',
    ]);
});

Route::group([
    'prefix' => 'api/v1',
    'namespace' => 'Api',
    'middleware' => 'auth.api',
    ], function ($router) {
    $router->resource('annotations', 'AnnotationController', [
        'only' => ['show', 'update', 'destroy'],
    ]);

    $router->resource('annotations.attributes', 'AnnotationAttributeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('annotations.labels', 'AnnotationLabelController', [
        'only' => ['index', 'store'],
    ]);

    $router->resource('annotation-labels', 'AnnotationLabelController', [
        'only' => ['update', 'destroy'],
    ]);

    $router->resource('attributes', 'AttributeController', [
        'only' => ['index', 'show', 'store', 'destroy'],
    ]);

    $router->get('images/{id}/thumb', 'ImageController@showThumb');
    $router->get('images/{id}/file', 'ImageController@showFile');
    $router->resource('images', 'ImageController', [
        'only' => ['show'],
    ]);

    $router->resource('images.annotations', 'ImageAnnotationController', [
        'only' => ['index', 'store'],
    ]);

    $router->resource('images.attributes', 'ImageAttributeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('labels', 'LabelController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('labels.attributes', 'LabelAttributeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('media-types', 'MediaTypeController', [
        'only' => ['index', 'show'],
    ]);

    $router->get('projects/my', 'ProjectController@index');
    $router->resource('projects', 'ProjectController', [
        'only' => ['show', 'update', 'store', 'destroy'],
    ]);

    $router->resource('projects.attributes', 'ProjectAttributeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('projects.labels', 'ProjectLabelController', [
        'only' => ['index', 'show'],
    ]);

    $router->post(
        'projects/{pid}/transects/{tid}',
        'ProjectTransectController@attach'
    );
    $router->resource('projects.transects', 'ProjectTransectController', [
        'only' => ['index', 'store', 'destroy'],
    ]);

    $router->post(
        'projects/{pid}/users/{uid}',
        'ProjectUserController@attach'
    );
    $router->resource('projects.users', 'ProjectUserController', [
        'only' => ['index', 'update', 'destroy'],
    ]);

    $router->resource('roles', 'RoleController', [
        'only' => ['index', 'show'],
    ]);

    $router->resource('shapes', 'ShapeController', [
        'only' => ['index', 'show'],
    ]);

    $router->resource('transects', 'TransectController', [
        'only' => ['show', 'update'],
    ]);

    $router->resource('transects.attributes', 'TransectAttributeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('transects.images', 'TransectImageController', [
        'only' => ['index'],
    ]);

    $router->get('users/find/{pattern}', 'UserController@find');

    $router->get('users/my', 'UserController@showOwn');
    $router->put('users/my', 'UserController@updateOwn');
    $router->delete('users/my', 'UserController@destroyOwn');

    $router->post('users/my/token', 'UserController@storeOwnToken');
    $router->delete('users/my/token', 'UserController@destroyOwnToken');

    $router->resource('users', 'UserController', [
        'only' => ['index', 'show', 'update', 'store', 'destroy'],
    ]);

    $router->resource('users.attributes', 'UserAttributeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);
});
