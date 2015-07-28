<?php

namespace Dias\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;

/**
 * Middleware to reouire the global admin role for using the route.
 */
class RequireAdmin
{
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
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // only admins are allowed to use this route
        if (!$this->auth->user()->isAdmin) {
            return response('Unauthorized.', 401);
        }

        return $next($request);
    }
}
