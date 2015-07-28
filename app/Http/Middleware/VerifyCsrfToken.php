<?php

namespace Dias\Http\Middleware;

use Closure;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as BaseVerifier;
use Illuminate\Session\TokenMismatchException;

class VerifyCsrfToken extends BaseVerifier
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
        // don't verify the CRSF token if this is an "external" request with API
        // key in the header!
        if (AuthenticateAPI::isApiKeyRequest($request)) {
            return $next($request);
        }

        try {
            return parent::handle($request, $next);
        } catch (TokenMismatchException $e) {
            // if there is a token mismatch response with 403
            return response('Forbidden.', 403);
        }
    }
}
