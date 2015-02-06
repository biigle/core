<?php namespace Dias\Http\Controllers\Auth;

use Dias\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\Registrar;
//use Illuminate\Foundation\Auth\AuthenticatesAndRegistersUsers;

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
	// use AuthenticatesAndRegistersUsers;

	/**
	 * The Guard implementation.
	 *
	 * @var Guard
	 */
	protected $auth;

	/**
	 * The registrar implementation.
	 *
	 * @var Registrar
	 */
	protected $registrar;

	/**
	 * Create a new authentication controller instance.
	 *
	 * @param  \Illuminate\Contracts\Auth\Guard  $auth
	 * @param  \Illuminate\Contracts\Auth\Registrar  $registrar
	 * @return void
	 */
	public function __construct(Guard $auth, Registrar $registrar)
	{
		$this->auth = $auth;
		$this->registrar = $registrar;

		$this->middleware('guest', ['except' => 'getLogout']);

		// The post register / login redirect path.
		$this->redirectPath = route('home');
	}

	/**
	 * Show the application registration form.
	 *
	 * @return \Illuminate\Http\Response
	 */
	// public function getRegister()
	// {
	// 	return view('auth.register');
	// }

	/**
	 * Handle a registration request for the application.
	 *
	 * @param  \Illuminate\Foundation\Http\FormRequest  $request
	 * @return \Illuminate\Http\Response
	 */
	// public function postRegister(Request $request)
	// {
	// 	$validator = $this->registrar->validator($request->all());

	// 	if ($validator->fails())
	// 	{
	// 		$this->throwValidationException(
	// 			$request, $validator
	// 		);
	// 	}

	// 	$this->auth->login($this->registrar->create($request->all()));

	// 	return redirect($this->redirectPath);
	// }

	/**
	 * Show the application login form.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function getLogin()
	{
		return view('auth.login');
	}

	/**
	 * Handle a login request to the application.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @return \Illuminate\Http\Response
	 */
	public function postLogin(Request $request)
	{
		$this->validate($request, [
			'email'    => 'required|email',
			'password' => 'required|min:8',
		]);

		$credentials = $request->only('email', 'password');

		if ($this->auth->attempt($credentials, $request->has('remember')))
		{
			return redirect()->intended($this->redirectPath);
		}

		return redirect('/auth/login')
					->withInput($request->only('email'))
					->withErrors([
						'email' => trans('auth.failed'),
					]);
	}

	/**
	 * Log the user out of the application.
	 *
	 * @return \Illuminate\Http\Response
	 */
	public function getLogout()
	{
		$this->auth->logout();

		return redirect()->route('home');
	}

}
