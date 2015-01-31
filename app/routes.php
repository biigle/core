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

Route::get('/', function() {
	return Redirect::action('HomeController@showLogin');
});

Route::get('login', array(
	'uses' => 'HomeController@showLogin'
));

Route::post('login', array(
	'before' => 'csrf',
	'uses'   => 'HomeController@doLogin'
));

Route::get('dashboard', array(
	'before' => 'auth',
	'uses'   => 'DashboardController@showDashboard'
));

Route::post('logout', array(
	'before' => 'auth',
	'uses'   => 'HomeController@doLogout'
));
