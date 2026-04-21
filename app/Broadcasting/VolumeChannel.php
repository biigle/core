<?php

namespace Biigle\Broadcasting;

use Biigle\User;
use Biigle\Volume;
use Illuminate\Broadcasting\PrivateChannel;

class VolumeChannel extends PrivateChannel
{
    /**
     * The volume of this channel.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Create a new channel instance.
     *
     * @param Volume $volume
     * @return void
     */
    public function __construct(Volume $volume)
    {
        $this->volume = $volume;

        parent::__construct("volume-{$volume->id}");
    }

    /**
     * Authenticate the user's access to the channel.
     *
     * @param  User  $user
     * @param  int  $id Volume ID
     * @return bool
     */
    public function join(User $user, $id)
    {
        $volume = Volume::find($id);

        return $volume && $user->can('access', $volume);
    }
}
