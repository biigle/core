<?php

namespace Biigle\Policies;

use Biigle\User;
use Biigle\SystemMessage;
use Illuminate\Auth\Access\HandlesAuthorization;

class SystemMessagePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can create systemMessages.
     *
     * @param  Biigle\User  $user
     * @return mixed
     */
    public function create(User $user)
    {
        return $user->isAdmin;
    }

    /**
     * Determine whether the user can update the systemMessage.
     *
     * @param  Biigle\User  $user
     * @param  Biigle\SystemMessage  $systemMessage
     * @return mixed
     */
    public function update(User $user, SystemMessage $systemMessage)
    {
        return $user->isAdmin;
    }

    /**
     * Determine whether the user can delete the systemMessage.
     *
     * @param  Biigle\User  $user
     * @param  Biigle\SystemMessage  $systemMessage
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
