<?php

namespace Dias\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;
use Illuminate\Session\TokenMismatchException;

class VerifyCsrfToken extends BaseVerifier
{
    /**
     * Routes that should be excepted from Csrf protection
     *
     * @var array
     */
    protected $except = [
        'api/v1/copria-color-sort-result/*'
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        // don't verify the CRSF token if this is an "external" request with API
        // key in the header!
        if (AuthenticateAPI::isApiKeyRequest($request)) {
            return $next($request);
        }

        try {
            return parent::handle($request, $next);
        } catch (TokenMismatchException $e) {
            return response('Forbidden.', 403);
        }
    }
}
