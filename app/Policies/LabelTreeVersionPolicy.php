<?php

namespace Biigle\Policies;

use Biigle\User;
use Biigle\LabelTreeVersion;
use Illuminate\Auth\Access\HandlesAuthorization;

class LabelTreeVersionPolicy extends CachedPolicy
{
    use HandlesAuthorization;

    /**
     * Intercept all checks.
     *
     * @param User $user
     * @param string $ability
     * @return bool|null
     */
    public function before($user, $ability)
    {
        if ($user->can('sudo')) {
            return true;
        }
    }

    /**
     * Determine if the given label tree version can be accessed by the user.
     *
     * @param  User  $user
     * @param  LabelTreeVersion  $version
     * @return bool
     */
    public function access(User $user, LabelTreeVersion $version)
    {
        return $user->can('access', $version->labelTree);
    }

    /**
     * Determine if the given label tree version can be updated by the user.
     *
     * @param  User  $user
     * @param  LabelTreeVersion  $version
     * @return bool
     */
    public function update(User $user, LabelTreeVersion $version)
    {
        return $user->can('update', $version->labelTree);
    }

    /**
     * Determine if the given label tree version can be deleted by the user.
     *
     * @param  User  $user
     * @param  LabelTreeVersion  $version
     * @return bool
     */
    public function destroy(User $user, LabelTreeVersion $version)
    {
        return $user->can('destroy', $version->labelTree);
    }
}
