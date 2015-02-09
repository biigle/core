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
		$key = $request->header('authorization');

		// key format is 'token abcXYZ'
		if (!starts_with($key, 'token'))
		{
			return false;
		}

		$key = str_replace('token ', '', $key);
		$user = User::where('api_key', $key)->first();

		if (!$user)
		{
			return false;
		}
		
		$this->auth->setUser($user);
		return true;
	}

	/**
	 * Handle an incoming request.
	 *
	 * @param  \Illuminate\Http\Request  $request
	 * @param  \Closure  $next
	 * @return mixed
	 */
	public function handle($request, Closure $next)
	{
		// request is valid if the user authenticates either with their session
		// cookie or with their API key
		if ($this->auth->check() || $this->authByKey($request))
		{
			return $next($request);
		}

		return response('Unauthorized.', 401);
	}



}
