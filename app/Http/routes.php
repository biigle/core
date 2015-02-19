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

Route::get('/', array(
	'as'   => 'home',
	'uses' => 'HomeController@index'
));

Route::controllers(array(
	'auth' => 'Auth\AuthController',
	'password' => 'Auth\PasswordController',
));

Route::group(array('prefix' => 'api/v1', 'namespace' => 'Api', 'middleware' => 'auth.api'), function($router)
{
	$router->resource('annotations', 'AnnotationController', array(
		'only' => array('show', 'destroy')
	));

	// annotation points are always created in context of their annotation
	$router->resource('annotations.points', 'AnnotationPointController', array(
		'only' => array('store')
	));
	// but removed on their own
	$router->resource('annotation-points', 'AnnotationPointController', array(
		'only' => array('destroy')
	));

	$router->resource('annotations.labels', 'AnnotationLabelController', array(
		'only' => array('store', 'update', 'destroy')
	));

	$router->resource('attributes', 'AttributeController', array(
		'only' => array('index', 'show', 'store', 'destroy')
	));

	$router->get('images/{id}/thumb', 'ImageController@showThumb');
	$router->get('images/{id}/file', 'ImageController@showFile');
	$router->resource('images', 'ImageController', array(
		'only' => array('show')
	));

	$router->resource('images.annotations', 'ImageAnnotationController', array(
		'only' => array('index', 'store')
	));

	$router->get('projects/my', 'ProjectController@index');
	$router->resource('projects', 'ProjectController', array(
		'only' => array('show', 'update', 'store', 'destroy')
	));

	$router->resource('projects.users', 'ProjectUserController', array(
		'only' => array('index', 'update', 'store', 'destroy')
	));

	$router->resource('roles', 'RoleController', array(
		'only' => array('index', 'show')
	));

	$router->resource('shapes', 'ShapeController', array(
		'only' => array('index', 'show')
	));

	$router->resource('media-types', 'MediaTypeController', array(
		'only' => array('index', 'show')
	));
});