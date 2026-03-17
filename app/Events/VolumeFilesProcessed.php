<?php

namespace Biigle\Events;

use Biigle\Broadcasting\UserChannel;
use Biigle\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VolumeFilesProcessed implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The user requesting to save a new volume
     *
     * @var User
     */
    public $user;

    /**
     * Ids of processed files
     *
     * @var array
     */
    public $fileIds;

    /**
     * Create a new event instance.
     *
     * @param array $fileIds
     * @param User $user
     *
     */
    public function __construct(array $fileIds, User $user)
    {
        $this->user = $user;
        $this->fileIds = $fileIds;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new UserChannel($this->user);
    }

    /**
     * Get the data to broadcast.
     *
     * @return array
     */
    public function broadcastWith()
    {
        return [
            'fileIds' => $this->fileIds
        ];
    }
}
