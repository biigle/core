<?php

namespace Biigle\Http\Requests;

class DestroyOwnUser extends DestroyUser
{
    /**
     * Get the user instance to update;
     *
     * @return user
     */
    protected function getDestroyUser()
    {
        return $this->user();
    }
}
