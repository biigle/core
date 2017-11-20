<?php

namespace Biigle\Http\Middleware;

use Closure;
use Carbon\Carbon;

class UpdateUserActivity
{
    /**
     * The URIs that should be excluded from updating the user activity.
     *
     * @var array
     */
    protected $except = [
        'heartbeat',
    ];

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
        $user = auth()->user();
        if ($user && !$this->inExceptArray($request)) {
            $user->login_at = new Carbon;
            $user->save();
        }
    }

    /**
     * Determine if the request has a URI that should not update the user activity.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function inExceptArray($request)
    {
        foreach ($this->except as $except) {
            if ($except !== '/') {
                $except = trim($except, '/');
            }

            if ($request->is($except)) {
                return true;
            }
        }

        return false;
    }
}
