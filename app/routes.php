<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the Closure to execute when that URI is requested.
|
*/

/*
| There is no actual home page, so we redirect to the login page.
*/
Route::any('/', array('as' => 'home', function()
{
	return Redirect::action('HomeController@showLogin');
}));

Route::get('login', array(
	'as'   => 'login',
	'uses' => 'HomeController@showLogin'
));

Route::post('login', array(
	'before' => 'csrf',
	'uses'   => 'HomeController@doLogin'
));

Route::get('dashboard', array(
	'before' => 'auth',
	'as'     => 'dashboard',
	'uses'   => 'DashboardController@showDashboard'
));

Route::post('logout', array(
	'before' => 'auth',
	'uses'   => 'HomeController@doLogout'
));

Route::group(array('prefix' => 'api/v1', 'before' => 'auth'), function()
{
	Route::resource(
		'projects',
		'ProjectController',
		array('only' => array('index', 'show'))
	);
});
