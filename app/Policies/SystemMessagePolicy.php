<?php

namespace Dias\Policies;

use Dias\User;
use Dias\SystemMessage;
use Illuminate\Auth\Access\HandlesAuthorization;

class SystemMessagePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can create systemMessages.
     *
     * @param  Dias\User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->isAdmin;
    }

    /**
     * Determine whether the user can update the systemMessage.
     *
     * @param  Dias\User  $user
     * @param  Dias\SystemMessage  $systemMessage
     * @return mixed
     */
    public function update(User $user, SystemMessage $systemMessage)
    {
        return $user->isAdmin;
    }

    /**
     * Determine whether the user can delete the systemMessage.
     *
     * @param  Dias\User  $user
     * @param  Dias\SystemMessage  $systemMessage
     * @return mixed
     */
    public function destroy(User $user, SystemMessage $systemMessage)
    {
        if ($systemMessage->published_at !== null) {
            $this->deny('Published system messages cannot be deleted.');
        }

        return $user->isAdmin;
    }
}
