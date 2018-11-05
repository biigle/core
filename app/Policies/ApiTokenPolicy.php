<?php

namespace Biigle\Policies;

use Biigle\Role;
use Biigle\User;
use Biigle\ApiToken;
use Illuminate\Auth\Access\HandlesAuthorization;

class ApiTokenPolicy
{
    use HandlesAuthorization;

    /**
     * Determine if the given user can create API tokens.
     *
     * @param  User  $user
     * @return bool
     */
    public function create(User $user)
    {
        return $user->role_id === Role::editorId() || $user->role_id === Role::adminId();
    }

    /**
     * Determine if the given token can be deleted by the user.
     *
     * @param  User  $user
     * @param  ApiToken  $project
     * @return bool
     */
    public function destroy(User $user, ApiToken $token)
    {
        return $user->id === $token->owner_id;
    }
}
