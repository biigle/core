<?php

namespace Biigle\Http\Middleware;

use Closure;

/**
 * Middleware to allow session cookie authentication for the route only.
 */
class SessionOnly
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // authentication by api key is not allowed
        if ($request->getUser()) {
            return response('Unauthorized.', 401);
        }

        return $next($request);
    }
}
