<?php

Route::group(array(
		'namespace' => '\Dias\Modules\Annotations\Http\Controllers',
		'middleware' => 'auth',
		'prefix' => 'annotate'
	), function ($router)
{
	$router->get('/{id}', array(
		'as'   => 'annotate',
		'uses' => 'AnnotationController@index'
	));
});