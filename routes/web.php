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

    $router->post('heartbeat', 'HeartbeatController@show');

    $router->group(['namespace' => 'Notifications', 'prefix' => 'notifications'], function ($router) {
        $router->get('/', [
            'as' => 'notifications',
            'uses' => 'NotificationsController@index',
        ]);
    });

    $router->get('search', [
        'as' => 'search',
        'uses' => 'SearchController@index',
    ]);

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
        $router->get('notifications', [
            'as' => 'settings-notifications',
            'uses' => 'SettingsController@notifications',
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
