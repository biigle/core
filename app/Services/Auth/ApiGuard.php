<?php

namespace Biigle\Services\Auth;

use Biigle\ApiToken;
use Hash;
use Illuminate\Auth\TokenGuard;

class ApiGuard extends TokenGuard
{
    /**
     * Get the currently authenticated user.
     *
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    public function user()
    {
        // If we've already retrieved the user for the current request we can just
        // return it back immediately. We do not want to fetch the user data on
        // every call to this method because that would be tremendously slow.
        if (!is_null($this->user)) {
            return $this->user;
        }

        $user = null;

        $token = $this->getTokenForRequest();
        $email = $this->request->getUser();

        // Check the encoding bcause a user can put anything into the string and cause
        // a server/database error with weird strings.
        if (!empty($token) && !empty($email) && mb_detect_encoding($email) !== false) {
            $user = $this->provider->retrieveByCredentials(
                ['email' => strtolower($email)]
            );
        }

        if (!empty($user)) {
            $candidates = ApiToken::where('owner_id', $user->getAuthIdentifier())
                ->select('id', 'hash')
                ->get();
            foreach ($candidates as $candidate) {
                if (Hash::check($token, $candidate->hash)) {
                    $candidate->touch();

                    return $this->user = $user;
                }
            }
        }
    }

    /**
     * Get the token for the current request.
     *
     * @return string
     */
    public function getTokenForRequest()
    {
        return $this->request->getPassword();
    }
}
