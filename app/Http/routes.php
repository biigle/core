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

Route::group(array('prefix' => 'api/v1', 'namespace' => 'Api'), function()
{
	// Route::get('annotations/my', 'AnnotationController@index');
	// Route::resource('annotations', 'AnnotationController', array(
	// 	'only' => array('store', 'show', 'update', 'destroy')
	// ));

	Route::get('projects/my', 'ProjectController@index');
	Route::resource('projects', 'ProjectController', array(
		'only' => array('show', 'update', 'store', 'destroy')
	));

	Route::resource('projects.users', 'ProjectUserController', array(
		'only' => array('index', 'update', 'store', 'destroy')
	));

	Route::resource('roles', 'RoleController', array(
		'only' => array('index', 'show')
	));

	Route::resource('shapes', 'ShapeController', array(
		'only' => array('index', 'show')
	));
});