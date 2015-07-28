<?php

namespace Dias\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;
use Dias\User;

class AuthenticateAPI
{
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
     * @return bool
     */
    public static function isApiKeyRequest($request)
    {
        $key = $request->header('x-auth-token');

        return (boolean) $key;
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
     * @return bool
     */
    private function authByKey($request)
    {
        if (!self::isApiKeyRequest($request)) {
            return false;
        }

        $key = $request->header('x-auth-token');
        $user = User::whereApiKey($key)->first();

        if (!$user) {
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
        // cookie or with their API key
        if ($this->isApiKeyRequest($request) && $this->authByKey($request)) {
            return $next($request);
        } elseif ($this->auth->check()) {
            return $next($request);
        }

        return response('Unauthorized.', 401);
    }
}
