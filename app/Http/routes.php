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

Route::group(array( 'namespace' => 'Auth' ), function ($router)
{
	$router->controllers(array(
		'auth' => 'AuthController',
		'password' => 'PasswordController',
	));
});

Route::group(array ( 'namespace' => 'Views', 'prefix' => 'documentation' ), function ($router)
{
	// route name must be different from the 'doc' directory name of the static 
	// files in the public directory
	$router->get('/', array(
		'as' => 'documentation',
		'uses' => 'DocController@index'
	));

	$router->get('/{article}', 'DocController@article');
});

// PROTECTED ROUTES -----------------------------------------------------------

Route::group(array( 'namespace' => 'Views', 'middleware' => 'auth' ), function ($router)
{
	$router->get('/', array(
		'as'   => 'home',
		'uses' => 'DashboardController@index'
	));

	$router->get('settings', array(
		'as' => 'settings',
		'uses' => 'SettingsController@index'
	));
});

Route::group(array(
	'prefix' => 'api/v1',
	'namespace' => 'Api',
	'middleware' => 'auth.api'
	), function($router)
{
	$router->resource('annotations', 'AnnotationController', array(
		'only' => array('show', 'update', 'destroy')
	));

	$router->resource('annotations.attributes', 'AnnotationAttributeController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));

	$router->resource('annotations.labels', 'AnnotationLabelController', array(
		'only' => array('index', 'store')
	));

	$router->resource('annotation-labels', 'AnnotationLabelController', array(
		'only' => array('update', 'destroy')
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

	$router->resource('images.attributes', 'ImageAttributeController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));

	$router->resource('labels', 'LabelController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));

	$router->resource('labels.attributes', 'LabelAttributeController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));

	$router->resource('media-types', 'MediaTypeController', array(
		'only' => array('index', 'show')
	));

	$router->get('projects/my', 'ProjectController@index');
	$router->resource('projects', 'ProjectController', array(
		'only' => array('show', 'update', 'store', 'destroy')
	));

	$router->resource('projects.attributes', 'ProjectAttributeController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));

	$router->post(
		'projects/{pid}/transects/{tid}',
		'ProjectTransectController@attach'
	);
	$router->resource('projects.transects', 'ProjectTransectController', array(
		'only' => array('index', 'store', 'destroy')
	));

	$router->post(
		'projects/{pid}/users/{uid}',
		'ProjectUserController@attach'
	);
	$router->resource('projects.users', 'ProjectUserController', array(
		'only' => array('index', 'update', 'destroy')
	));

	$router->resource('roles', 'RoleController', array(
		'only' => array('index', 'show')
	));

	$router->resource('shapes', 'ShapeController', array(
		'only' => array('index', 'show')
	));

	$router->resource('transects', 'TransectController', array(
		'only' => array('show', 'update')
	));

	$router->resource('transects.attributes', 'TransectAttributeController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));

	$router->resource('transects.images', 'TransectImageController', array(
		'only' => array('index')
	));

	$router->get('users/find/{pattern}', 'UserController@find');

	$router->get('users/my', 'UserController@showOwn');
	$router->put('users/my', 'UserController@updateOwn');
	$router->delete('users/my', 'UserController@destroyOwn');
	$router->resource('users', 'UserController', array(
		'only' => array('index', 'show', 'update', 'store', 'destroy')
	));

	$router->resource('users.attributes', 'UserAttributeController', array(
		'only' => array('index', 'show', 'store', 'update', 'destroy')
	));
});