<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of the routes that are handled
| by your application. Just tell Laravel the URIs it should respond
| to using a Closure or controller method. Build something great!
|
*/

Auth::routes();

// PUBLIC ROUTES --------------------------------------------------------------

$router->group(['namespace' => 'Views', 'prefix' => 'manual'], function ($router) {
    // route name must be different from the 'doc' directory name of the static
    // files in the public directory
    $router->get('/', [
        'as' => 'manual',
        'uses' => 'ManualController@index',
    ]);

    $router->get('/tutorials/{module}/{article?}', [
        'as' => 'manual-tutorials',
        'uses' => 'ManualController@tutorialsArticle',
    ]);

    $router->get('/documentation', [
        'as' => 'manual-documentation',
        'uses' => 'ManualController@indexDocumentation',
    ]);

    $router->get('/documentation/{module}/{article?}', 'ManualController@documentationArticle');
});

// PROTECTED ROUTES -----------------------------------------------------------

$router->group(['namespace' => 'Views', 'middleware' => 'auth'], function ($router) {
    $router->get('/', [
        'as'   => 'home',
        'uses' => 'DashboardController@index',
    ]);

    $router->group(['namespace' => 'Notifications', 'prefix' => 'notifications'], function ($router) {
        $router->get('/', [
            'as' => 'notifications',
            'uses' => 'NotificationsController@index',
        ]);
    });

    $router->group(['prefix' => 'settings'], function ($router) {
        $router->get('/', [
            'as' => 'settings',
            'uses' => 'SettingsController@index',
        ]);
        $router->get('profile', [
            'as' => 'settings-profile',
            'uses' => 'SettingsController@profile',
        ]);
        $router->get('account', [
            'as' => 'settings-account',
            'uses' => 'SettingsController@account',
        ]);
        $router->get('tokens', [
            'as' => 'settings-tokens',
            'uses' => 'SettingsController@tokens',
        ]);
    });

    $router->group(['namespace' => 'Admin', 'prefix' => 'admin', 'middleware' => 'can:admin'], function ($router) {

        $router->get('/', [
            'as' => 'admin',
            'uses' => 'IndexController@get',
        ]);

        $router->get('users', [
            'as' => 'admin-users',
            'uses' => 'UsersController@get',
        ]);

        $router->get('users/new', [
            'as' => 'admin-users-new',
            'uses' => 'UsersController@newUser',
        ]);

        $router->get('users/edit/{id}', [
            'as' => 'admin-users-edit',
            'uses' => 'UsersController@edit',
        ]);

        $router->get('users/delete/{id}', [
            'as' => 'admin-users-delete',
            'uses' => 'UsersController@delete',
        ]);
    });

});

$router->group(['prefix' => 'api/v1', 'namespace' => 'Api', 'middleware' => 'auth.api'], function ($router) {
    $router->resource('annotations', 'AnnotationController', [
        'only' => ['show', 'update', 'destroy'],
    ]);

    $router->resource('annotations.labels', 'AnnotationLabelController', [
        'only' => ['index', 'store'],
    ]);

    $router->resource('annotation-labels', 'AnnotationLabelController', [
        'only' => ['update', 'destroy'],
    ]);

    $router->resource('annotation-sessions', 'AnnotationSessionController', [
        'only' => ['update', 'destroy'],
    ]);

    $router->get('images/{id}/thumb', 'ImageController@showThumb');
    $router->get('images/{id}/file', 'ImageController@showFile');
    $router->resource('images', 'ImageController', [
        'only' => ['show', 'destroy'],
    ]);

    $router->resource('images.annotations', 'ImageAnnotationController', [
        'only' => ['index', 'store'],
    ]);

    $router->resource('images.labels', 'ImageLabelController', [
        'only' => ['index', 'store'],
    ]);

    $router->resource('image-labels', 'ImageLabelController', [
        'only' => ['destroy'],
    ]);

    $router->resource('labels', 'LabelController', [
        'only' => ['destroy'],
    ]);

    $router->get('label-sources/{id}/find', 'LabelSourceController@find');

    $router->resource('label-trees', 'LabelTreeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
    ]);

    $router->resource('label-trees.authorized-projects', 'LabelTreeAuthorizedProjectController', [
        'only' => ['store', 'destroy'],
    ]);

    $router->resource('label-trees.labels', 'LabelTreeLabelController', [
        'only' => ['store'],
    ]);

    $router->resource('label-trees.users', 'LabelTreeUserController', [
        'only' => ['store', 'update', 'destroy'],
    ]);

    $router->resource('media-types', 'MediaTypeController', [
        'only' => ['index', 'show'],
    ]);

    $router->resource('notifications', 'NotificationController', [
        'only' => ['update', 'destroy'],
    ]);

    $router->get('projects/my', 'ProjectController@index');
    $router->resource('projects', 'ProjectController', [
        'only' => ['show', 'update', 'store', 'destroy'],
    ]);

    $router->get(
        'projects/{pid}/label-trees/available',
        'ProjectLabelTreeController@available'
    );
    $router->resource('projects.label-trees', 'ProjectLabelTreeController', [
        'only' => ['index', 'store', 'destroy'],
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

    $router->resource('transects.annotation-sessions', 'TransectAnnotationSessionController', [
        'only' => ['index', 'store'],
    ]);

    $router->resource('transects.images', 'TransectImageController', [
        'only' => ['index', 'store'],
    ]);

    $router->get('users/find/{pattern}', 'UserController@find');

    $router->get('users/my', 'UserController@showOwn');
    $router->put('users/my', 'UserController@updateOwn');
    $router->delete('users/my', 'UserController@destroyOwn');

    $router->resource('api-tokens', 'ApiTokenController', [
        'only' => ['index', 'store', 'destroy']
    ]);

    $router->resource('users', 'UserController', [
        'only' => ['index', 'show', 'update', 'store', 'destroy'],
    ]);

    $router->resource('visibilities', 'VisibilityController', [
        'only' => ['index', 'show'],
    ]);
});
