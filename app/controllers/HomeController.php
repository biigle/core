<?php

use Illuminate\Support\MessageBag;

class HomeController extends BaseController {

	/*
	|--------------------------------------------------------------------------
	| Default Home Controller
	|--------------------------------------------------------------------------
	|
	| You may wish to use controllers instead of, or in addition to, Closure
	| based routes. That's great! Here is an example controller method to
	| get you started. To route to this controller, just add the route:
	|
	|	Route::get('/', 'HomeController@showWelcome');
	|
	*/

	public function showLogin()
	{
		if (Auth::check())
		{
			return Redirect::route('dashboard');
		}
		return View::make('home.login')
			->with('title', 'Login');
	}

	public function doLogin()
	{
		// validate the info, create rules for the inputs
		$rules = array(
			'email'    => 'required|email',
			'password' => 'required|min:8'
		);

		// run the validation rules on the inputs from the form
		$validator = Validator::make(Input::all(), $rules);

		// if the validator fails, redirect back to the form
		if ($validator->fails())
		{
			return Redirect::route('login')
				// send back all errors to the login form
				->withErrors($validator)
				// send back the input (not the password) so that we can repopulate the form
				->withInput(Input::except('password'));
		}
		else
		{
			// create our user data for the authentication
			$userdata = array(
				'email'    => Input::get('email'),
				'password' => Input::get('password')
			);

			// attempt to do the login
			if (Auth::attempt($userdata))
			{
				return Redirect::intended('dashboard');
			}
			else
			{
				$errors = new MessageBag(array(
					'auth' => array(Lang::get('auth.failed'))
				));
				// validation not successful, send back to form 
				return Redirect::route('login')
					->withErrors($errors)
					->withInput(Input::except('password'));
			}
		}
	}

	public function doLogout()
	{
		Auth::logout();
		return Redirect::home();
	}
}
