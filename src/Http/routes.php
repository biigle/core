<?php

Route::group(array(
		'namespace' => '\Dias\Modules\Projects\Http\Controllers',
		'middleware' => 'auth',
		'prefix' => 'projects'
	), function ($router)
{
	$router->get('/create', array(
		'as'   => 'create-project',
		'uses' => 'ProjectController@create'
	));

	$router->get('/{id}', array(
		'as'   => 'project',
		'uses' => 'ProjectController@index'
	));
});