<?php

namespace Dias\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;
use Dias\Http\Controllers\Controller;

class Authenticate
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
     * @param  Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // only users are allowed to visit this route. guests are redirected
        // to login
        if ($this->auth->guest()) {
            if (Controller::isAutomatedRequest($request)) {
                return response('Unauthorized.', 401);
            } else {
                return redirect()->guest('/auth/login');
            }
        }

        return $next($request);
    }
}
