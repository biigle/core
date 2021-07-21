<?php

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Deprecated: use image-annotations instead
$router->resource('annotations', 'ImageAnnotationController', [
    'only' => ['show', 'update', 'destroy'],
    'parameters' => ['annotations' => 'id'],
]);

// Deprecated: use image-annotations instead
$router->resource('annotations', 'ImageAnnotationBulkController', [
    'only' => ['store'],
    'parameters' => ['annotations' => 'id'],
]);

// Deprecated: use image-annotations instead
$router->resource('annotations.labels', 'ImageAnnotationLabelController', [
    'only' => ['index', 'store'],
    'parameters' => ['annotations' => 'id'],
]);

// Deprecated: use image-annotation-labels instead
$router->resource('annotation-labels', 'ImageAnnotationLabelController', [
    'only' => ['update', 'destroy'],
    'parameters' => ['annotation-labels' => 'id'],
]);

$router->resource('annotation-sessions', 'AnnotationSessionController', [
    'only' => ['update', 'destroy'],
    'parameters' => ['annotation-sessions' => 'id'],
]);

$router->resource('api-tokens', 'ApiTokenController', [
    'only' => ['index', 'store', 'destroy'],
    'parameters' => ['api-tokens' => 'id'],
]);

$router->resource('federated-search-instances', 'FederatedSearchInstanceController', [
    'only' => ['store', 'update', 'destroy'],
    'parameters' => ['federated-search-instances' => 'id'],
]);

$router->resource('image-annotations', 'ImageAnnotationController', [
    'only' => ['show', 'update', 'destroy'],
    'parameters' => ['image-annotations' => 'id'],
]);

$router->resource('image-annotations', 'ImageAnnotationBulkController', [
    'only' => ['store'],
    'parameters' => ['image-annotations' => 'id'],
]);

$router->resource('image-annotations.labels', 'ImageAnnotationLabelController', [
    'only' => ['index', 'store'],
    'parameters' => ['image-annotations' => 'id'],
]);

$router->resource('image-annotation-labels', 'ImageAnnotationLabelController', [
    'only' => ['update', 'destroy'],
    'parameters' => ['image-annotation-labels' => 'id'],
]);

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

$router->resource('label-trees.merge-labels', 'LabelTreeMergeController', [
    'only' => ['store'],
    'parameters' => ['label-trees' => 'id'],
]);

$router->resource('label-trees.users', 'LabelTreeUserController', [
    'only' => ['store', 'update', 'destroy'],
    'parameters' => ['label-trees' => 'id', 'users' => 'id2'],
]);

$router->resource('label-trees.versions', 'LabelTreeVersionController', [
    'only' => ['store'],
    'parameters' => ['label-trees' => 'id'],
]);

$router->resource('label-tree-versions', 'LabelTreeVersionController', [
    'only' => ['update', 'destroy'],
    'parameters' => ['label-tree-versions' => 'id'],
]);

$router->resource('media-types', 'MediaTypeController', [
    'only' => ['index', 'show'],
    'parameters' => ['media-types' => 'id'],
]);

$router->resource('notifications', 'NotificationController', [
    'only' => ['update', 'destroy'],
]);

$router->resource('projects', 'ProjectController', [
    'only' => ['index', 'show', 'update', 'store', 'destroy'],
    'parameters' => ['projects' => 'id'],
]);

$router->get('projects/{id}/attachable-volumes', 'ProjectsAttachableVolumesController@index');

$router->get(
    'projects/{id}/label-trees/available',
    'ProjectLabelTreeController@available'
);
$router->resource('projects.label-trees', 'ProjectLabelTreeController', [
    'only' => ['index', 'store', 'destroy'],
    'parameters' => ['projects' => 'id', 'label-trees' => 'id2'],
]);

$router->get(
    'projects/pinned',
    'UserPinnedProjectController@index'
);

$router->post(
    'projects/{id}/pin',
    'UserPinnedProjectController@store'
);

$router->delete(
    'projects/{id}/pin',
    'UserPinnedProjectController@destroy'
);

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

$router->get('videos/{id}/file', 'VideoFileController@show');

$router->resource('videos', 'VideoController', [
    'only' => ['show', 'destroy'],
    'parameters' => ['videos' => 'id'],
]);

$router->resource('videos.annotations', 'VideoAnnotationController', [
    'only' => ['index', 'store'],
    'parameters' => ['videos' => 'id'],
]);

$router->resource('video-annotations', 'VideoAnnotationController', [
    'only' => ['show', 'update', 'destroy'],
    'parameters' => ['video-annotations' => 'id'],
]);

$router->resource('video-annotations.labels', 'VideoAnnotationLabelController', [
    'only' => ['store'],
    'parameters' => ['video-annotations' => 'id'],
]);

$router->resource('video-annotations.link', 'LinkVideoAnnotationController', [
    'only' => ['store'],
    'parameters' => ['video-annotations' => 'id'],
]);

$router->resource('video-annotations.split', 'SplitVideoAnnotationController', [
    'only' => ['store'],
    'parameters' => ['video-annotations' => 'id'],
]);

$router->resource('video-annotation-labels', 'VideoAnnotationLabelController', [
    'only' => ['destroy'],
    'parameters' => ['video-annotation-labels' => 'id'],
]);

$router->resource('videos.labels', 'VideoLabelController', [
    'only' => ['index', 'store'],
    'parameters' => ['videos' => 'id'],
]);

$router->resource('video-labels', 'VideoLabelController', [
    'only' => ['destroy'],
    'parameters' => ['video-labels' => 'id'],
]);

$router->resource('visibilities', 'VisibilityController', [
    'only' => ['index', 'show'],
    'parameters' => ['visibilities' => 'id'],
]);

$router->resource('volumes', 'VolumeController', [
    'only' => ['index', 'show', 'update'],
    'parameters' => ['volumes' => 'id'],
]);

$router->resource('volumes.annotation-sessions', 'VolumeAnnotationSessionController', [
    'only' => ['index', 'store'],
    'parameters' => ['volumes' => 'id'],
]);

$router->resource('volumes.files', 'VolumeFileController', [
    'only' => ['index', 'store'],
    'parameters' => ['volumes' => 'id'],
]);

$router->group([
    'prefix' => 'volumes',
    'namespace' => 'Volumes',
], function ($router) {
    $router->get('{id}/files/filter/labels', [
        'uses' => 'Filters\AnyFileLabelController@index',
    ]);

    $router->get('{id}/files/filter/labels/users/{id2}', [
        'uses' => 'Filters\FileLabelUserController@index',
    ]);

    $router->get('{id}/files/filter/labels/{id2}', [
        'uses' => 'Filters\FileLabelController@index',
    ]);

    $router->get('{id}/files/filter/annotation-label/{id2}', [
        'uses' => 'Filters\AnnotationLabelController@index',
    ]);

    $router->get('{id}/files/filter/filename/{pattern}', [
        'uses' => 'Filters\FilenameController@index',
    ]);

    $router->get('{id}/file-labels', [
        'uses' => 'UsedFileLabelsController@index',
    ]);

    $router->get('{id}/filenames', [
        'uses' => 'FilenamesController@index',
    ]);

    $router->get('{id}/similarity-indices', [
        'uses' => 'SimilarityIndicesController@index',
    ]);

    $router->get('{id}/users', [
        'uses' => 'UserController@index',
    ]);

    $router->get('{id}/files/labels', [
        'uses' => 'FileLabelsController@index',
    ]);

    $router->post('{id}/images/metadata', [
        'uses' => 'ImageMetadataController@store',
    ]);

    $router->group(['prefix' => 'browser'], function ($router) {
        $router->get('directories/{disk}', 'BrowserController@indexDirectories');
        $router->get('images/{disk}', 'BrowserController@indexImages');
        $router->get('videos/{disk}', 'BrowserController@indexVideos');
    });
});

$router->group([
    'prefix' => 'volumes',
    'namespace' => 'Annotations',
], function ($router) {
    $router->get('{id}/files/filter/annotations', [
        'uses' => 'Filters\AnnotationController@index',
    ]);

    $router->get('{id}/files/filter/annotation-user/{id2}', [
        'uses' => 'Filters\AnnotationUserController@index',
    ]);

    $router->get('{id}/annotation-labels', [
        'uses' => 'VolumeAnnotationLabelController@index',
    ]);

    $router->get('{id}/images/area', [
        'uses' => 'VolumeImageAreaController@index',
    ]);
});

$router->get('users/find/{pattern}', 'UserController@find');

$router->get('users/my', 'UserController@showOwn');
$router->put('users/my', 'UserController@updateOwn');
$router->delete('users/my', 'UserController@destroyOwn');

$router->put('users/my/settings', 'UserSettingsController@update');

$router->resource('users', 'UserController', [
    'only' => ['index', 'show', 'update', 'store', 'destroy'],
    'parameters' => ['users' => 'id'],
]);

$router->get('accept-user-registration/{id}', [
    'as' => 'accept-registration',
    'uses' => 'UserRegistrationController@accept',
]);

$router->get('reject-user-registration/{id}', [
    'as' => 'reject-registration',
    'uses' => 'UserRegistrationController@reject',
]);
