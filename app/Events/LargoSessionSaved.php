<?php

namespace Biigle\Events;

use Biigle\Broadcasting\UserChannel;
use Biigle\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LargoSessionSaved implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public $queue;

    /**
     * Create a new event instance.
     *
     * @param string $id The ID of the Largo session.
     * @param User $user The user who saved the Largo session.
     * @param bool $hasUnchanged Whether some annotations of the Largo session were not changed.
     */
    public function __construct(
        public string $id,
        public User $user,
        public bool $hasUnchanged = false
    ) {
        $this->queue = config('largo.apply_session_queue');
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
            'id' => $this->id,
            // The IDs of the unchanged annotations are not included because the
            // payload size is limited. They have to be fetched from the API.
            'has_unchanged' => $this->hasUnchanged,
        ];
    }
}
