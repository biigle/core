<?php

namespace Dias\Http\Middleware;

use Hash;
use Closure;
use Dias\User;
use Illuminate\Support\Facades\Auth;

class AuthenticateAPI
{
    /**
     * Determines if the request contains an API key in its header.
     *
     * @param \Illuminate\Http\Request  $request
     * @return bool
     */
    public static function isApiKeyRequest($request)
    {
        return (boolean) $request->getUser();
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

        $email = $request->getUser();
        $proposedToken = $request->getPassword();

        $user = User::where('email', $email)->with('apiTokens')->first();

        if (!$user) {
            return false;
        }

        $tokens = $user->apiTokens;

        foreach ($tokens as $token) {
            if (Hash::check($proposedToken, $token->hash)) {
                // set the updated_at attribute
                $token->touch();
                // like a manual auth->once()
                Auth::setUser($user);

                return true;
            }
        }

        return false;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next, $guard = null)
    {
        // request is valid if the user authenticates either with their session
        // cookie or with their API key
        if ($this->authByKey($request) || Auth::guard($guard)->check()) {
            return $next($request);
        }

        return response('Unauthorized.', 401);
    }
}
