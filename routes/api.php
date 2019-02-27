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

$router->resource('annotations', 'AnnotationController', [
    'only' => ['show', 'store', 'update', 'destroy'],
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

$router->resource('api-tokens', 'ApiTokenController', [
    'only' => ['index', 'store', 'destroy'],
    'parameters' => ['api-tokens' => 'id'],
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

$router->resource('projects', 'ProjectController', [
    'only' => ['index', 'show', 'update', 'store', 'destroy'],
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

$router->resource('volumes.images', 'VolumeImageController', [
    'only' => ['index', 'store'],
    'parameters' => ['volumes' => 'id'],
]);

$router->get('users/find/{pattern}', 'UserController@find');

$router->get('users/my', 'UserController@showOwn');
$router->put('users/my', 'UserController@updateOwn');
$router->delete('users/my', 'UserController@destroyOwn');

$router->resource('users', 'UserController', [
    'only' => ['index', 'show', 'update', 'store', 'destroy'],
    'parameters' => ['users' => 'id'],
]);
