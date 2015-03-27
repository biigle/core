<?php

Route::group(array(
		'namespace' => '\Dias\Modules\Transects\Http\Controllers',
		'middleware' => 'auth',
		'prefix' => 'transects'
	), function ($router)
{
	$router->get('/create', array(
		'as'   => 'create-transect',
		'uses' => 'TransectController@create'
	));
	
	$router->get('/{id}', array(
		'as'   => 'transect',
		'uses' => 'TransectController@index'
	));
});

Route::group(array(
		'namespace' => '\Dias\Modules\Transects\Http\Controllers',
		'middleware' => 'auth',
		'prefix' => 'images'
	), function ($router)
{
	
	$router->get('/{id}', array(
		'as'   => 'image',
		'uses' => 'ImageController@index'
	));
});