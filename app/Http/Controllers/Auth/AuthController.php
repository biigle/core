<?php namespace Dias\Http\Controllers\Auth;

use Dias\Http\Controllers\Controller;
use Dias\User;
use Dias\Events\UserLoggedInEvent;

use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\Registrar;
use Illuminate\Foundation\Auth\AuthenticatesAndRegistersUsers;

class AuthController extends Controller {

	/*
	|--------------------------------------------------------------------------
	| Registration & Login Controller
	|--------------------------------------------------------------------------
	|
	| This controller handles the registration of new users, as well as the
	| authentication of existing users. By default, this controller uses
	| a simple trait to add these behaviors. Why don't you explore it?
	|
	*/

	// disable default trait and implement own authentication
	use AuthenticatesAndRegistersUsers;

	/**
	 * Create a new authentication controller instance.
	 *
	 * @param  Guard  $auth
	 * @param  Registrar  $registrar
	 * @return void
	 */
	public function __construct(Guard $auth, Registrar $registrar)
	{
		$this->auth = $auth;
		$this->registrar = $registrar;

		$this->middleware('guest', ['except' => 'getLogout']);

		// The post register / login redirect path.
		$this->redirectTo = route('home');
	}

	/**
	 * Handle a login request to the application.
	 * Overwrites the trait to show a custom error response.
	 *
	 * @param  Request  $request
	 * @return \Illuminate\Http\Response
	 */
	public function postLogin(Request $request)
	{
		$this->validate($request, User::$authRules);

		$credentials = $request->only('email', 'password');

		if ($this->auth->attempt($credentials, $request->has('remember')))
		{
			event(new UserLoggedInEvent($this->auth->user()));
			return redirect()->intended($this->redirectPath());
		}

		return redirect('/auth/login')
					->withInput($request->only('email', 'remember'))
					->withErrors([
						'email' => trans('auth.failed'),
					]);
	}

	/**
	 * Log the user out of the application.
	 * Overwrites the trait to redirect to the `home` route.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function getLogout()
	{
		$this->auth->logout();

		return redirect()->route('home');
	}

}
