<?php

namespace Biigle\Policies;

use Biigle\ApiToken;
use Biigle\Role;
use Biigle\User;
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
        return $user->role_id->value === Role::EDITOR->value || $user->role_id->value === Role::ADMIN->value;
    }

    /**
     * Determine if the given token can be deleted by the user.
     *
     * @param  User  $user
     * @param  ApiToken  $token
     * @return bool
     */
    public function destroy(User $user, ApiToken $token)
    {
        return $user->id === $token->owner_id;
    }
}
