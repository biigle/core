<?php

namespace Biigle\Policies;

use Biigle\SystemMessage;
use Biigle\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class SystemMessagePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can create systemMessages.
     *
     * @param  User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->can('sudo');
    }

    /**
     * Determine whether the user can update the systemMessage.
     *
     * @param  User  $user
     * @param  SystemMessage  $systemMessage
     * @return mixed
     */
    public function update(User $user, SystemMessage $systemMessage)
    {
        return $user->can('sudo');
    }

    /**
     * Determine whether the user can delete the systemMessage.
     *
     * @param  User  $user
     * @param  SystemMessage  $systemMessage
     * @return mixed
     */
    public function destroy(User $user, SystemMessage $systemMessage)
    {
        if ($systemMessage->published_at !== null) {
            return $this->deny('Published system messages cannot be deleted.');
        }

        return $user->can('sudo');
    }
}
