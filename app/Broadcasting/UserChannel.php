<?php

namespace Biigle\Broadcasting;

use Biigle\User;
use Illuminate\Broadcasting\PrivateChannel;

class UserChannel extends PrivateChannel
{
    /**
     * The user of this channel.
     *
     * @var User
     */
    public $user;

    /**
     * Create a new channel instance.
     *
     * @param User $user
     * @return void
     */
    public function __construct(User $user)
    {
        $this->user = $user;

        parent::__construct("user-{$user->id}");
    }

    /**
     * Authenticate the user's access to the channel.
     *
     * @param  User  $user
     * @param  int  $id
     * @return bool
     */
    public function join(User $user, $id)
    {
        return $user->id === (int) $id;
    }
}
