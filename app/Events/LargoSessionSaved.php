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
     * The user that created the server.
     *
     * @var User
     */
    public $user;

    /**
     * The ID of the Largo session
     *
     * @var string
     */
    public $id;

    /**
     * Whether dismissed labels of other users were not removed from annotations that
     * did not get a new label (because force was not enabled).
     *
     * @var bool
     */
    public $keptDismissedLabels;

    /**
     * Whether dismissed labels of other users were not removed from annotations that
     * got a new label (because force was not enabled).
     *
     * @var bool
     */
    public $keptReplacedLabels;

    /**
     * The name of the queue the job should be sent to.
     *
     * @var string|null
     */
    public $queue;

    /**
     * Create a new event instance.
     *
     * @param string $id
     * @param User $user
     * @param bool $keptDismissedLabels
     * @param bool $keptReplacedLabels
     * @return void
     */
    public function __construct($id, User $user, $keptDismissedLabels = false, $keptReplacedLabels = false)
    {
        $this->queue = config('largo.apply_session_queue');
        $this->id = $id;
        $this->user = $user;
        $this->keptDismissedLabels = $keptDismissedLabels;
        $this->keptReplacedLabels = $keptReplacedLabels;
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
            'kept_dismissed_labels' => $this->keptDismissedLabels,
            'kept_replaced_labels' => $this->keptReplacedLabels,
        ];
    }
}
