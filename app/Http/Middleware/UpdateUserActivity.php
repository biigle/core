<?php

namespace Dias\Http\Middleware;

use Closure;
use Carbon\Carbon;

class UpdateUserActivity
{

    /**
     * Handle an outgoing response.
     *
     * @param  Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        return $next($request);
    }

    /**
     * Perform any final actions for the request lifecycle.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Symfony\Component\HttpFoundation\Response  $response
     * @return void
     */
    public function terminate($request, $response)
    {
        if ($user = auth()->user()) {
            $user->login_at = new Carbon;
            $user->save();
        }
    }
}
