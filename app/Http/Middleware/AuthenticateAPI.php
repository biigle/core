<?php namespace Dias\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Routing\Middleware;
use Dias\User;

class AuthenticateAPI implements Middleware {

	/**
	 * The Guard implementation.
	 *
	 * @var Guard
	 */
	protected $auth;

	/**
	 * Determines if the request contains an API key in its header.
	 * 
	 * @param \Illuminate\Http\Request  $request
	 * @return boolean
	 */
	public static function isApiKeyRequest($request)
	{
		$key = $request->header('authorization');
		// key format is 'token abcXYZ'
		return starts_with($key, 'token ');
	}

	/**
	 * Create a new filter instance.
	 *
	 * @param  Guard  $auth
	 * @return void
	 */
	public function __construct(Guard $auth)
	{
		$this->auth = $auth;
	}

	/**
	 * Authenticates a user by their API key.
	 *
	 * @param \Illuminate\Http\Request  $request
	 * @return boolean
	 */
	private function authByKey($request)
	{
		if (!self::isApiKeyRequest($request))
		{
			return false;
		}

		$key = str_replace('token ', '', $request->header('authorization'));
		$user = User::whereApiKey($key)->first();

		if (!$user)
		{
			return false;
		}
		
		// like a manual auth->once()
		$this->auth->setUser($user);
		return true;
	}

	/**
	 * Handle an incoming request.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @param  Closure  $next
	 * @return mixed
	 */
	public function handle($request, Closure $next)
	{
		// request is valid if the user authenticates either with their session
		// cookie (on AJAX requests) or with their API key
		if (($request->ajax() && $this->auth->check()) || $this->authByKey($request))
		{
			return $next($request);
		}

		return response('Unauthorized.', 401);
	}



}
