<?php

namespace Biigle\Policies;

use Biigle\FederatedSearchInstance;
use Biigle\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class FederatedSearchInstancePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can create instances.
     *
     * @param  User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('sudo');
    }

    /**
     * Determine whether the user can update the instance.
     *
     * @param  User  $user
     * @param  FederatedSearchInstance  $instance
     * @return mixed
     */
    public function update(User $user, FederatedSearchInstance $instance)
    {
        return $user->can('sudo');
    }

    /**
     * Determine whether the user can delete the instance.
     *
     * @param  User  $user
     * @param  FederatedSearchInstance  $instance
     * @return mixed
     */
    public function destroy(User $user, FederatedSearchInstance $instance)
    {
        return $user->can('sudo');
    }
}
