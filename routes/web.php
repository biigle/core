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
$router->post('heartbeat', 'Views\HeartbeatController@store');

$router->get('/', [
    'as'   => 'home',
    'uses' => 'Views\\DashboardController@index',
]);

$router->get('imprint', [
    'as'   => 'imprint',
    'uses' => 'Views\\ImprintController@show',
]);

$router->get('privacy', [
    'as'   => 'privacy',
    'uses' => 'Views\\PrivacyController@show',
]);

$router->get('terms', [
    'as'   => 'terms',
    'uses' => 'Views\\TermsController@show',
]);

$router->group(['namespace' => 'Views', 'prefix' => 'manual'], function ($router) {
    // route name must be different from the 'doc' directory name of the static
    // files in the public directory
    $router->get('/', [
        'as' => 'manual',
        'uses' => 'ManualController@index',
    ]);

    // Redirects for backwards compatibility of deleted or renamed manual articles.
    $router->permanentRedirect('/tutorials/volumes/image-labels', '/manual/tutorials/volumes/file-labels');
    $router->permanentRedirect('/tutorials/volumes/image-metadata', '/manual/tutorials/volumes/file-metadata');
    $router->permanentRedirect('/tutorials/volumes/remote-volumes', '/manual/tutorials/volumes/remote-locations');

    $router->get('/tutorials/{module}/{article?}', [
        'as' => 'manual-tutorials',
        'uses' => 'ManualController@tutorialsArticle',
    ]);

    $router->get('/documentation/{module}/{article?}', [
        'as' => 'manual-documentation',
        'uses' => 'ManualController@documentationArticle',
    ]);
});

// PROTECTED ROUTES -----------------------------------------------------------

$router->group(['namespace' => 'Views', 'middleware' => 'auth'], function ($router) {
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
        $router->get('authentication', [
            'as' => 'settings-authentication',
            'uses' => 'SettingsController@authentication',
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

    $router->group(['namespace' => 'Admin', 'prefix' => 'admin', 'middleware' => 'can:sudo'], function ($router) {

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

        $router->get('announcements', [
            'as' => 'admin-announcements',
            'uses' => 'AnnouncementsController@index',
        ]);

        $router->get('announcements/new', [
            'as' => 'admin-announcements-new',
            'uses' => 'AnnouncementsController@create',
        ]);

        $router->get('logs', [
            'as' => 'admin-logs-index',
            'uses' => 'LogsController@index',
        ]);

        $router->get('logs/{file}', [
            'as' => 'admin-logs-show',
            'uses' => 'LogsController@show',
        ]);

        $router->get('label-trees', [
            'as' => 'admin-global-label-trees',
            'uses' => 'LabelTreesController@index',
        ]);

        $router->get('federated-search', [
            'as' => 'admin-federated-search',
            'uses' => 'FederatedSearchController@index',
        ]);
    });

    // This is special because reviewer users should be able to access it, too. They need
    // access to check possible duplicate users.
    $router->get('admin/users/{id}', [
        'as' => 'admin-users-show',
        'uses' => 'Admin\UsersController@show',
        'middleware' => 'can:review',
    ]);

    $router->group(['namespace' => 'LabelTrees', 'prefix' => 'label-trees'], function ($router) {
        $router->get('/', [
            'as'   => 'label-trees-index',
            'uses' => 'LabelTreesController@index',
        ]);

        $router->get('create', [
            'as'   => 'label-trees-create',
            'uses' => 'LabelTreesController@create',
        ]);

        $router->get('{id}', [
            'as'   => 'label-trees',
            'uses' => 'LabelTreesController@show',
        ]);

        $router->get('{id}/projects', [
            'as'   => 'label-tree-projects',
            'uses' => 'LabelTreeProjectsController@show',
        ]);

        $router->get('{id}/members', [
            'as'   => 'label-tree-members',
            'uses' => 'LabelTreeMembersController@show',
        ]);

        $router->get('{id}/merge', [
            'as'   => 'label-trees-merge-index',
            'uses' => 'LabelTreeMergeController@index',
        ]);

        $router->get('{id}/merge/{id2}', [
            'as'   => 'label-trees-merge',
            'uses' => 'LabelTreeMergeController@show',
        ]);

        $router->get('{id}/versions/{id2}', [
            'as'   => 'label-tree-versions',
            'uses' => 'LabelTreeVersionsController@show',
        ]);

        $router->get('{id}/versions/create', [
            'as'   => 'create-label-tree-versions',
            'uses' => 'LabelTreeVersionsController@create',
        ]);
    });

    $router->group(['namespace' => 'Projects', 'prefix' => 'projects'], function ($router) {
        $router->get('create', [
            'as'   => 'projects-create',
            'uses' => 'ProjectsController@create',
        ]);

        $router->get('/', [
            'as'   => 'projects-index',
            'uses' => 'ProjectsController@index',
        ]);

        $router->get('{id}', [
            'as'   => 'project',
            'uses' => 'ProjectsController@show',
        ]);

        $router->get('{id}/label-trees', [
            'as'   => 'project-label-trees',
            'uses' => 'ProjectLabelTreeController@show',
        ]);

        $router->get('{id}/members', [
            'as'   => 'project-members',
            'uses' => 'ProjectUserController@show',
        ]);

        $router->get('{id}/charts', [
            'as'   => 'project-charts',
            'uses' => 'ProjectStatisticsController@show',
        ]);
    });

    $router->group(['namespace' => 'Volumes', 'prefix' => 'pending-volumes'], function ($router) {
        $router->get('{id}', [
            'as'   => 'pending-volume',
            'uses' => 'PendingVolumeController@show',
        ]);

        $router->get('{id}/annotation-labels', [
            'as'   => 'pending-volume-annotation-labels',
            'uses' => 'PendingVolumeController@showAnnotationLabels',
        ]);
    });

    $router->group(['namespace' => 'Volumes', 'prefix' => 'volumes'], function ($router) {
        $router->get('create', [
            'as'   => 'create-volume',
            'uses' => 'VolumeController@create',
        ]);

        $router->get('edit/{id}', [
            'as'   => 'volume-edit',
            'uses' => 'VolumeController@edit',
        ]);

        $router->get('{id}', [
            'as'   => 'volume',
            'uses' => 'VolumeController@index',
        ]);

        $router->get('clone/{id}',[
            'as' => 'clone-volume',
            'uses' => 'VolumeCloneController@clone'
        ]);
    });

    $router->get('images/{id}', [
        'as'   => 'image',
        'uses' => 'Volumes\ImageController@index',
    ]);

    $router->group(['namespace' => 'Annotations'], function ($router) {
        $router->get('images/{id}/annotations', [
            'as'   => 'annotate',
            'uses' => 'AnnotationToolController@show',
        ]);

        $router->get('image-annotations/{id}', [
            'as'   => 'show-image-annotation',
            'uses' => 'ImageAnnotationController@show',
        ]);


        // Legacy support.
        $router->redirect('annotate/{id}', '/images/{id}/annotations');
        $router->redirect('annotations/{id}', '/image-annotations/{id}');
    });

    $router->group(['namespace' => 'Videos'], function ($router) {
        $router->get('videos/{id}/annotations', [
            'as' => 'video',
            'uses' => 'VideoController@show',
        ]);

        $router->get('video-annotations/{id}', [
            'as'   => 'show-video-annotation',
            'uses' => 'VideoAnnotationController@show',
        ]);

        // Legacy support.
        $router->redirect('videos/{id}', '/videos/{id}/annotations');
    });

});

$router->get('project-invitations/{uuid}', [
    'as'   => 'project-invitation',
    'uses' => 'Views\Projects\ProjectInvitationController@show',
]);
