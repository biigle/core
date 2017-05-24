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

    $router->group(['namespace' => 'SystemMessages', 'prefix' => 'system-messages'], function ($router) {
        $router->get('/', [
            'as' => 'system-messages',
            'uses' => 'SystemMessagesController@index',
        ]);

        $router->get('{id}', [
            'as' => 'system-messages-show',
            'uses' => 'SystemMessagesController@show',
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

        $router->get('users/{id}', [
            'as' => 'admin-users-show',
            'uses' => 'UsersController@show',
        ]);

        $router->get('system-messages', [
            'as' => 'admin-system-messages',
            'uses' => 'SystemMessagesController@index',
        ]);

        $router->get('system-messages/new', [
            'as' => 'admin-system-messages-new',
            'uses' => 'SystemMessagesController@create',
        ]);

        $router->get('system-messages/{id}', [
            'as' => 'admin-system-messages-edit',
            'uses' => 'SystemMessagesController@update',
        ]);

        $router->get('logs', [
            'as' => 'admin-logs-index',
            'uses' => 'LogsController@index',
        ]);

        $router->get('logs/{file}', [
            'as' => 'admin-logs-show',
            'uses' => 'LogsController@show',
        ]);
    });

});

$router->group(['prefix' => 'api/v1', 'namespace' => 'Api', 'middleware' => 'auth.api'], function ($router) {
    $router->resource('annotations', 'AnnotationController', [
        'only' => ['show', 'update', 'destroy'],
        'parameters' => ['annotations' => 'id'],
    ]);

    $router->resource('annotations.labels', 'AnnotationLabelController', [
        'only' => ['index', 'store'],
        'parameters' => ['annotations' => 'id'],
    ]);

    $router->resource('annotation-labels', 'AnnotationLabelController', [
        'only' => ['update', 'destroy'],
        'parameters' => ['annotation-labels' => 'id'],
    ]);

    $router->resource('annotation-sessions', 'AnnotationSessionController', [
        'only' => ['update', 'destroy'],
        'parameters' => ['annotation-sessions' => 'id'],
    ]);

    $router->get('images/{id}/thumb', 'ImageController@showThumb');
    $router->get('images/{id}/file', 'ImageController@showFile');
    $router->resource('images', 'ImageController', [
        'only' => ['show', 'destroy'],
        'parameters' => ['images' => 'id'],
    ]);

    $router->resource('images.annotations', 'ImageAnnotationController', [
        'only' => ['index', 'store'],
        'parameters' => ['images' => 'id'],
    ]);

    $router->resource('images.labels', 'ImageLabelController', [
        'only' => ['index', 'store'],
        'parameters' => ['images' => 'id'],
    ]);

    $router->resource('image-labels', 'ImageLabelController', [
        'only' => ['destroy'],
        'parameters' => ['image-labels' => 'id'],
    ]);

    $router->resource('labels', 'LabelController', [
        'only' => ['update', 'destroy'],
        'parameters' => ['labels' => 'id'],
    ]);

    $router->get('label-sources/{id}/find', 'LabelSourceController@find');

    $router->resource('label-trees', 'LabelTreeController', [
        'only' => ['index', 'show', 'store', 'update', 'destroy'],
        'parameters' => ['label-trees' => 'id'],
    ]);

    $router->resource('label-trees.authorized-projects', 'LabelTreeAuthorizedProjectController', [
        'only' => ['store', 'destroy'],
        'parameters' => ['label-trees' => 'id', 'authorized-projects' => 'id2'],
    ]);

    $router->resource('label-trees.labels', 'LabelTreeLabelController', [
        'only' => ['store'],
        'parameters' => ['label-trees' => 'id'],
    ]);

    $router->resource('label-trees.users', 'LabelTreeUserController', [
        'only' => ['store', 'update', 'destroy'],
        'parameters' => ['label-trees' => 'id', 'users' => 'id2'],
    ]);

    $router->resource('media-types', 'MediaTypeController', [
        'only' => ['index', 'show'],
        'parameters' => ['media-types' => 'id'],
    ]);

    $router->resource('notifications', 'NotificationController', [
        'only' => ['update', 'destroy'],
    ]);

    $router->get('projects/my', 'ProjectController@index');
    $router->resource('projects', 'ProjectController', [
        'only' => ['show', 'update', 'store', 'destroy'],
        'parameters' => ['projects' => 'id'],
    ]);

    $router->get(
        'projects/{id}/label-trees/available',
        'ProjectLabelTreeController@available'
    );
    $router->resource('projects.label-trees', 'ProjectLabelTreeController', [
        'only' => ['index', 'store', 'destroy'],
        'parameters' => ['projects' => 'id', 'label-trees' => 'id2'],
    ]);

    $router->post(
        'projects/{id}/volumes/{id2}',
        'ProjectVolumeController@attach'
    );
    $router->resource('projects.volumes', 'ProjectVolumeController', [
        'only' => ['index', 'store', 'destroy'],
        'parameters' => ['projects' => 'id', 'volumes' => 'id2'],
    ]);

    $router->post(
        'projects/{id}/users/{id2}',
        'ProjectUserController@attach'
    );
    $router->resource('projects.users', 'ProjectUserController', [
        'only' => ['index', 'update', 'destroy'],
        'parameters' => ['projects' => 'id', 'users' => 'id2'],
    ]);

    $router->resource('roles', 'RoleController', [
        'only' => ['index', 'show'],
        'parameters' => ['roles' => 'id'],
    ]);

    $router->resource('shapes', 'ShapeController', [
        'only' => ['index', 'show'],
        'parameters' => ['shapes' => 'id'],
    ]);

    $router->resource('system-messages', 'SystemMessageController', [
        'only' => ['store', 'update', 'destroy'],
        'parameters' => ['system-messages' => 'id'],
    ]);

    $router->resource('volumes', 'VolumeController', [
        'only' => ['show', 'update'],
        'parameters' => ['volumes' => 'id'],
    ]);

    $router->resource('volumes.annotation-sessions', 'VolumeAnnotationSessionController', [
        'only' => ['index', 'store'],
        'parameters' => ['volumes' => 'id'],
    ]);

    $router->resource('volumes.images', 'VolumeImageController', [
        'only' => ['index', 'store'],
        'parameters' => ['volumes' => 'id'],
    ]);

    $router->get('users/find/{pattern}', 'UserController@find');

    $router->get('users/my', 'UserController@showOwn');
    $router->put('users/my', 'UserController@updateOwn');
    $router->delete('users/my', 'UserController@destroyOwn');

    $router->resource('api-tokens', 'ApiTokenController', [
        'only' => ['index', 'store', 'destroy'],
        'parameters' => ['api-tokens' => 'id'],
    ]);

    $router->resource('users', 'UserController', [
        'only' => ['index', 'show', 'update', 'store', 'destroy'],
        'parameters' => ['users' => 'id'],
    ]);

    $router->resource('visibilities', 'VisibilityController', [
        'only' => ['index', 'show'],
        'parameters' => ['visibilities' => 'id'],
    ]);
});
