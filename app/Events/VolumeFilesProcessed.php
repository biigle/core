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
     * Checks if this event is the last event.
     * The last event is dispatched if all files were processed.
     *
     * @var bool
     */
    public $isLastEvent;

    /**
     * Create a new event instance.
     *
     * @param array $fileIds
     * @param User $user
     * @param bool $isLastEvent
     *
     */
    public function __construct(array $fileIds, User $user, bool $isLastEvent = false)
    {
        $this->user = $user;
        $this->fileIds = $fileIds;
        $this->isLastEvent = $isLastEvent;
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
            'fileIds' => $this->fileIds,
            'isLast' => $this->isLastEvent,
        ];
    }
}
